import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface SystemConfig {
  pollLocked: boolean;
}

class DB {
  // ── Audit Logs ────────────────────────────────────────────────────────────

  async logAudit(type: string, severity: string, message: string, metadata?: any) {
    await prisma.auditLog.create({
      data: {
        timestamp: BigInt(Date.now()),
        type,
        severity,
        message,
        metadata: metadata ?? null,
      },
    });
  }

  async getAuditLogs() {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
    return logs.map((l) => ({ ...l, timestamp: Number(l.timestamp) }));
  }

  // ── System Config ─────────────────────────────────────────────────────────

  async getSystemConfig(): Promise<SystemConfig> {
    const record = await prisma.systemConfig.findUnique({ where: { key: 'pollLocked' } });
    return { pollLocked: record?.value === true };
  }

  async togglePollLock(locked: boolean): Promise<SystemConfig> {
    await prisma.systemConfig.upsert({
      where: { key: 'pollLocked' },
      update: { value: locked },
      create: { key: 'pollLocked', value: locked },
    });
    await this.logAudit('system', 'high', `Poll ${locked ? 'locked' : 'unlocked'} by admin`);
    return { pollLocked: locked };
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async verifyLogin(username: string, password: string) {
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) return null;
    if (bcrypt.compareSync(password, user.password)) return user;
    return null;
  }

  async getUsers() {
    return prisma.user.findMany();
  }

  async addUser(user: { username: string; email: string; password: string; role: string }) {
    return prisma.user.create({
      data: { ...user, password: bcrypt.hashSync(user.password, 10) },
    });
  }

  async updateUser(
    id: string,
    updates: { username?: string; email?: string; password?: string; role?: string }
  ) {
    if (updates.password) {
      updates = { ...updates, password: bcrypt.hashSync(updates.password, 10) };
    }
    return prisma.user.update({ where: { id }, data: updates }).catch(() => null);
  }

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } }).catch(() => null);
  }

  // ── Voters ────────────────────────────────────────────────────────────────

  async getVoters() {
    const voters = await prisma.voter.findMany({ orderBy: { invitedAt: 'desc' } });
    return voters.map((v) => ({ ...v, invitedAt: Number(v.invitedAt) }));
  }

  async addVoter(voter: { email: string; name: string }) {
    const existing = await prisma.voter.findUnique({ where: { email: voter.email } });
    if (existing) throw new Error('Voter already invited');
    const newVoter = await prisma.voter.create({
      data: { ...voter, invitedAt: BigInt(Date.now()) },
    });
    return { ...newVoter, invitedAt: Number(newVoter.invitedAt) };
  }

  async deleteVoter(id: string) {
    await prisma.voter.delete({ where: { id } }).catch(() => null);
  }
}

export const db = new DB();
