import { prisma } from '@/lib/prisma';

export interface VoteInput {
  email: string;
  categoryId: string;
  nomineeId: string;
  ip?: string;
  userAgent?: string;
}

export interface VoteValidationResult {
  valid: boolean;
  error?: string;
  anomalyScore?: number;
  flagged?: boolean;
}

export interface VoteStats {
  totalVotes: number;
  validVotes: number;
  invalidVotes: number;
  flaggedVotes: number;
  uniqueVoters: number;
  votesByCategory: Array<{
    categoryId: string;
    categoryTitle: string;
    totalVotes: number;
  }>;
  votesByNominee: Array<{
    nomineeId: string;
    nomineeName: string;
    categoryId: string;
    votes: number;
  }>;
}

export interface CategoryResults {
  categoryId: string;
  categoryTitle: string;
  totalVotes: number;
  nominees: Array<{
    id: string;
    name: string;
    title: string;
    imageUrl: string;
    votes: number;
    percentage: number;
  }>;
}

/**
 * Validates a vote before submission
 */
export async function validateVote(input: VoteInput): Promise<VoteValidationResult> {
  const { email, categoryId, nomineeId, ip } = input;

  // Check if poll is locked
  const lockConfig = await prisma.systemConfig.findUnique({ 
    where: { key: 'pollLocked' } 
  });
  
  if (lockConfig?.value === true) {
    return {
      valid: false,
      error: 'Avstemningen er stengt.',
    };
  }

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  
  if (!category) {
    return {
      valid: false,
      error: 'Ugyldig kategori.',
    };
  }

  // Check if nominee exists and is not withdrawn
  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
  });
  
  if (!nominee) {
    return {
      valid: false,
      error: 'Ugyldig nominert.',
    };
  }

  if (nominee.withdrawn) {
    return {
      valid: false,
      error: 'Denne nominerte har trukket seg fra nominasjonen.',
    };
  }

  if (nominee.categoryId !== categoryId) {
    return {
      valid: false,
      error: 'Nominerte tilhører ikke denne kategorien.',
    };
  }

  // Check if already voted in this category
  const existingVote = await prisma.vote.findFirst({
    where: { 
      email, 
      categoryId,
      invalid: false,
    },
  });
  
  if (existingVote) {
    return {
      valid: false,
      error: 'Du har allerede stemt i denne kategorien.',
    };
  }

  return { valid: true };
}

/**
 * Calculates anomaly score and fraud detection
 */
export async function calculateAnomalyScore(input: VoteInput): Promise<{
  anomalyScore: number;
  flagged: boolean;
  alerts: Array<{ type: string; severity: string; message: string; metadata?: any }>;
}> {
  const { ip, nomineeId } = input;
  let anomalyScore = 0;
  const alerts: Array<{ type: string; severity: string; message: string; metadata?: any }> = [];

  if (!ip) {
    return { anomalyScore: 0, flagged: false, alerts };
  }

  // Fraud detection: multiple votes from same IP
  const votesFromIp = await prisma.vote.count({ 
    where: { ip, invalid: false } 
  });
  
  if (votesFromIp >= 10) {
    anomalyScore += 70;
    alerts.push({
      type: 'duplicate_ip',
      severity: 'high',
      message: `Ekstremt høyt antall stemmer fra IP ${ip}`,
      metadata: { ip, count: votesFromIp },
    });
  } else if (votesFromIp >= 5) {
    anomalyScore += 40;
    alerts.push({
      type: 'duplicate_ip',
      severity: 'medium',
      message: `Høyt antall stemmer fra IP ${ip}`,
      metadata: { ip, count: votesFromIp },
    });
  }

  // Rapid voting (bot detection)
  const recentFromIp = await prisma.vote.findFirst({
    where: { ip, invalid: false },
    orderBy: { timestamp: 'desc' },
  });
  
  if (recentFromIp) {
    const timeDiff = Date.now() - Number(recentFromIp.timestamp);
    
    if (timeDiff < 1000) {
      anomalyScore += 90;
      alerts.push({
        type: 'bot_pattern',
        severity: 'high',
        message: `Ekstremt rask stemmegivning oppdaget fra IP ${ip}`,
        metadata: { ip, timeDiff },
      });
    } else if (timeDiff < 3000) {
      anomalyScore += 50;
      alerts.push({
        type: 'bot_pattern',
        severity: 'medium',
        message: `Rask stemmegivning oppdaget fra IP ${ip}`,
        metadata: { ip, timeDiff },
      });
    }
  }

  // Spike detection for nominee
  const oneMinuteAgo = BigInt(Date.now() - 60_000);
  const recentForNominee = await prisma.vote.count({
    where: { 
      nomineeId, 
      invalid: false, 
      timestamp: { gt: oneMinuteAgo } 
    },
  });
  
  if (recentForNominee > 50) {
    anomalyScore += 30;
    alerts.push({
      type: 'spike',
      severity: 'high',
      message: `Unormal stemmebølge oppdaget for nominert ${nomineeId}`,
      metadata: { nomineeId, count: recentForNominee },
    });
  } else if (recentForNominee > 20) {
    alerts.push({
      type: 'spike',
      severity: 'medium',
      message: `Stemmebølge oppdaget for nominert ${nomineeId}`,
      metadata: { nomineeId, count: recentForNominee },
    });
  }

  const flagged = anomalyScore > 70;

  return { anomalyScore, flagged, alerts };
}

/**
 * Creates a new vote
 */
export async function createVote(input: VoteInput) {
  const { email, categoryId, nomineeId, ip, userAgent } = input;

  // Validate vote
  const validation = await validateVote(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Calculate anomaly score
  const { anomalyScore, flagged, alerts } = await calculateAnomalyScore(input);

  // Log audit alerts
  for (const alert of alerts) {
    await prisma.auditLog.create({
      data: {
        timestamp: BigInt(Date.now()),
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata || {},
      },
    });
  }

  // Create vote
  const vote = await prisma.vote.create({
    data: {
      email,
      categoryId,
      nomineeId,
      timestamp: BigInt(Date.now()),
      ip: ip || null,
      userAgent: userAgent || null,
      anomalyScore,
      flagged,
      invalid: false,
    },
    include: {
      category: true,
      nominee: true,
    },
  });

  return vote;
}

/**
 * Gets all votes for a user by email
 */
export async function getUserVotes(email: string) {
  const votes = await prisma.vote.findMany({
    where: { email },
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
      nominee: {
        select: {
          id: true,
          name: true,
          title: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  return votes.map(vote => ({
    ...vote,
    timestamp: Number(vote.timestamp),
  }));
}

/**
 * Gets all votes (admin only)
 */
export async function getAllVotes(filters?: {
  categoryId?: string;
  nomineeId?: string;
  email?: string;
  flagged?: boolean;
  invalid?: boolean;
}) {
  const votes = await prisma.vote.findMany({
    where: filters,
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
      nominee: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  return votes.map(vote => ({
    ...vote,
    timestamp: Number(vote.timestamp),
  }));
}

/**
 * Gets recent votes
 */
export async function getRecentVotes(limit: number = 50) {
  const votes = await prisma.vote.findMany({
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
      nominee: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  return votes.map(vote => ({
    ...vote,
    timestamp: Number(vote.timestamp),
  }));
}

/**
 * Invalidates a vote
 */
export async function invalidateVote(email: string, categoryId: string, reason: string) {
  const vote = await prisma.vote.findFirst({
    where: { email, categoryId },
  });

  if (!vote) {
    throw new Error('Stemme ikke funnet');
  }

  await prisma.vote.update({
    where: { id: vote.id },
    data: {
      invalid: true,
      invalidationReason: reason,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      timestamp: BigInt(Date.now()),
      type: 'manual_action',
      severity: 'medium',
      message: `Stemme ugyldiggjort for ${email} i kategori ${categoryId}`,
      metadata: { email, categoryId, reason },
    },
  });

  return true;
}

/**
 * Restores an invalidated vote
 */
export async function restoreVote(email: string, categoryId: string) {
  const vote = await prisma.vote.findFirst({
    where: { email, categoryId, invalid: true },
  });

  if (!vote) {
    throw new Error('Ugyldig stemme ikke funnet');
  }

  await prisma.vote.update({
    where: { id: vote.id },
    data: {
      invalid: false,
      invalidationReason: null,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      timestamp: BigInt(Date.now()),
      type: 'manual_action',
      severity: 'low',
      message: `Stemme gjenopprettet for ${email} i kategori ${categoryId}`,
      metadata: { email, categoryId },
    },
  });

  return true;
}

/**
 * Deletes a vote permanently
 */
export async function deleteVote(voteId: string) {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
  });

  if (!vote) {
    throw new Error('Stemme ikke funnet');
  }

  await prisma.vote.delete({
    where: { id: voteId },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      timestamp: BigInt(Date.now()),
      type: 'manual_action',
      severity: 'high',
      message: `Stemme slettet permanent: ${voteId}`,
      metadata: { voteId, email: vote.email, categoryId: vote.categoryId },
    },
  });

  return true;
}

/**
 * Gets vote statistics
 */
export async function getVoteStats(): Promise<VoteStats> {
  const [
    totalVotes,
    validVotes,
    invalidVotes,
    flaggedVotes,
    uniqueVotersResult,
    votesByCategory,
    votesByNominee,
  ] = await Promise.all([
    prisma.vote.count(),
    prisma.vote.count({ where: { invalid: false } }),
    prisma.vote.count({ where: { invalid: true } }),
    prisma.vote.count({ where: { flagged: true, invalid: false } }),
    prisma.vote.groupBy({
      by: ['email'],
      where: { invalid: false },
      _count: true,
    }),
    prisma.vote.groupBy({
      by: ['categoryId'],
      where: { invalid: false },
      _count: true,
    }),
    prisma.vote.groupBy({
      by: ['nomineeId'],
      where: { invalid: false },
      _count: true,
    }),
  ]);

  const uniqueVoters = uniqueVotersResult.length;

  // Enrich category data
  const categories = await prisma.category.findMany({
    select: { id: true, title: true },
  });
  
  const categoryMap = new Map(categories.map(c => [c.id, c.title]));
  
  const enrichedCategoryVotes = votesByCategory.map(v => ({
    categoryId: v.categoryId,
    categoryTitle: categoryMap.get(v.categoryId) || 'Unknown',
    totalVotes: v._count,
  }));

  // Enrich nominee data
  const nominees = await prisma.nominee.findMany({
    select: { id: true, name: true, categoryId: true },
  });
  
  const nomineeMap = new Map(nominees.map(n => [n.id, { name: n.name, categoryId: n.categoryId }]));
  
  const enrichedNomineeVotes = votesByNominee.map(v => {
    const nominee = nomineeMap.get(v.nomineeId);
    return {
      nomineeId: v.nomineeId,
      nomineeName: nominee?.name || 'Unknown',
      categoryId: nominee?.categoryId || '',
      votes: v._count,
    };
  }).sort((a, b) => b.votes - a.votes);

  return {
    totalVotes,
    validVotes,
    invalidVotes,
    flaggedVotes,
    uniqueVoters,
    votesByCategory: enrichedCategoryVotes,
    votesByNominee: enrichedNomineeVotes,
  };
}

/**
 * Gets results for a specific category
 */
export async function getCategoryResults(categoryId: string): Promise<CategoryResults> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      nominees: {
        where: { withdrawn: false },
      },
      votes: {
        where: { invalid: false },
      },
    },
  });

  if (!category) {
    throw new Error('Kategori ikke funnet');
  }

  const totalVotes = category.votes.length;

  // Count votes per nominee
  const voteCounts = new Map<string, number>();
  category.votes.forEach(vote => {
    voteCounts.set(vote.nomineeId, (voteCounts.get(vote.nomineeId) || 0) + 1);
  });

  const nominees = category.nominees.map(nominee => ({
    id: nominee.id,
    name: nominee.name,
    title: nominee.title,
    imageUrl: nominee.imageUrl,
    votes: voteCounts.get(nominee.id) || 0,
    percentage: totalVotes > 0 ? ((voteCounts.get(nominee.id) || 0) / totalVotes) * 100 : 0,
  })).sort((a, b) => b.votes - a.votes);

  return {
    categoryId: category.id,
    categoryTitle: category.title,
    totalVotes,
    nominees,
  };
}

/**
 * Gets leaderboard across all categories
 */
export async function getLeaderboard() {
  const categories = await prisma.category.findMany({
    include: {
      nominees: {
        where: { withdrawn: false },
        include: {
          votes: {
            where: { invalid: false },
          },
        },
      },
    },
  });

  return categories.map(category => {
    const nominees = category.nominees
      .map(nominee => ({
        id: nominee.id,
        name: nominee.name,
        title: nominee.title,
        imageUrl: nominee.imageUrl,
        categoryId: category.id,
        categoryTitle: category.title,
        votes: nominee.votes.length,
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      categoryId: category.id,
      categoryTitle: category.title,
      description: category.description,
      nominees,
      totalVotes: nominees.reduce((sum, n) => sum + n.votes, 0),
    };
  });
}

/**
 * Bulk invalidate votes based on criteria
 */
export async function bulkInvalidateVotes(criteria: {
  ip?: string;
  email?: string;
  nomineeId?: string;
  minAnomalyScore?: number;
}, reason: string) {
  const where: any = { invalid: false };

  if (criteria.ip) where.ip = criteria.ip;
  if (criteria.email) where.email = criteria.email;
  if (criteria.nomineeId) where.nomineeId = criteria.nomineeId;
  if (criteria.minAnomalyScore !== undefined) {
    where.anomalyScore = { gte: criteria.minAnomalyScore };
  }

  const result = await prisma.vote.updateMany({
    where,
    data: {
      invalid: true,
      invalidationReason: reason,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      timestamp: BigInt(Date.now()),
      type: 'manual_action',
      severity: 'high',
      message: `Bulk ugyldiggjøring: ${result.count} stemmer`,
      metadata: { criteria, reason, count: result.count },
    },
  });

  return result.count;
}

/**
 * Checks if a user has voted in a category
 */
export async function hasVoted(email: string, categoryId: string): Promise<boolean> {
  const vote = await prisma.vote.findFirst({
    where: { 
      email, 
      categoryId,
      invalid: false,
    },
  });

  return !!vote;
}

/**
 * Gets vote count for a nominee
 */
export async function getNomineeVoteCount(nomineeId: string): Promise<number> {
  return await prisma.vote.count({
    where: { 
      nomineeId,
      invalid: false,
    },
  });
}
