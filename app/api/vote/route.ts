import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: 'Ikke logget inn' }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, nomineeId } = body;

  if (!categoryId || !nomineeId) {
    return Response.json({ error: 'Mangler data' }, { status: 400 });
  }

  // Check poll lock
  const lockConfig = await prisma.systemConfig.findUnique({ where: { key: 'pollLocked' } });
  if (lockConfig?.value === true) {
    return Response.json({ error: 'Avstemningen er stengt.' }, { status: 403 });
  }

  // Check if already voted in this category
  const existing = await prisma.vote.findFirst({
    where: { email, categoryId, invalid: false },
  });
  if (existing) {
    return Response.json({ error: 'Du har allerede stemt i denne kategorien.' }, { status: 409 });
  }

  const ip =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? null;

  let anomalyScore = 0;
  let flagged = false;

  // Fraud detection: multiple votes from same IP
  const votesFromIp = await prisma.vote.count({ where: { ip, invalid: false } });
  if (votesFromIp >= 5) {
    anomalyScore += 50;
    await prisma.auditLog.create({
      data: {
        timestamp: BigInt(Date.now()),
        type: 'duplicate_ip',
        severity: 'medium',
        message: `High volume of votes from IP ${ip}`,
        metadata: { ip, count: votesFromIp },
      },
    });
  }

  // Rapid voting (bot detection)
  const recentFromIp = await prisma.vote.findFirst({
    where: { ip, invalid: false },
    orderBy: { timestamp: 'desc' },
  });
  if (recentFromIp && Date.now() - Number(recentFromIp.timestamp) < 2000) {
    anomalyScore += 80;
    flagged = true;
    await prisma.auditLog.create({
      data: {
        timestamp: BigInt(Date.now()),
        type: 'bot_pattern',
        severity: 'high',
        message: `Rapid voting detected from IP ${ip}`,
        metadata: { ip, timeDiff: Date.now() - Number(recentFromIp.timestamp) },
      },
    });
  }

  // Spike detection
  const oneMinuteAgo = BigInt(Date.now() - 60_000);
  const recentForNominee = await prisma.vote.count({
    where: { nomineeId, invalid: false, timestamp: { gt: oneMinuteAgo } },
  });
  if (recentForNominee > 20) {
    await prisma.auditLog.create({
      data: {
        timestamp: BigInt(Date.now()),
        type: 'spike',
        severity: 'medium',
        message: `Vote spike detected for nominee ${nomineeId}`,
        metadata: { nomineeId, count: recentForNominee },
      },
    });
  }

  if (anomalyScore > 100) flagged = true;

  try {
    await prisma.vote.create({
      data: {
        email,
        categoryId,
        nomineeId,
        timestamp: BigInt(Date.now()),
        ip,
        userAgent,
        anomalyScore,
        flagged,
      },
    });
    return Response.json({ success: true });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return Response.json({ error: 'Du har allerede stemt i denne kategorien.' }, { status: 409 });
    }
    throw e;
  }
}
