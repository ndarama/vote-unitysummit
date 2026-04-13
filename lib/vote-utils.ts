/**
 * Vote-related utility functions and helpers
 */

/**
 * Formats a timestamp to a readable date string
 */
export function formatVoteTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gets severity color for anomaly score
 */
export function getAnomalyScoreColor(score: number): string {
  if (score >= 90) return 'red';
  if (score >= 70) return 'orange';
  if (score >= 40) return 'yellow';
  return 'green';
}

/**
 * Gets severity level from anomaly score
 */
export function getAnomalySeverity(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Calculates vote percentage
 */
export function calculateVotePercentage(votes: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Groups votes by time period
 */
export interface VoteTimePeriod {
  period: string;
  count: number;
}

export function groupVotesByHour(votes: Array<{ timestamp: number }>): VoteTimePeriod[] {
  const groups = new Map<string, number>();

  votes.forEach(vote => {
    const date = new Date(vote.timestamp);
    const hour = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    groups.set(hour, (groups.get(hour) || 0) + 1);
  });

  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function groupVotesByDay(votes: Array<{ timestamp: number }>): VoteTimePeriod[] {
  const groups = new Map<string, number>();

  votes.forEach(vote => {
    const date = new Date(vote.timestamp);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    groups.set(day, (groups.get(day) || 0) + 1);
  });

  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Anonymizes IP address for privacy
 */
export function anonymizeIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    // IPv4: Replace last octet
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  // IPv6 or other: Just mask part of it
  return ip.substring(0, Math.min(ip.length, 10)) + '...';
}

/**
 * Gets vote trend (increasing, decreasing, stable)
 */
export function getVoteTrend(
  currentPeriodVotes: number,
  previousPeriodVotes: number
): 'increasing' | 'decreasing' | 'stable' {
  const threshold = 0.1; // 10% threshold for stability

  if (previousPeriodVotes === 0) {
    return currentPeriodVotes > 0 ? 'increasing' : 'stable';
  }

  const change = (currentPeriodVotes - previousPeriodVotes) / previousPeriodVotes;

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

/**
 * Calculates vote velocity (votes per hour)
 */
export function calculateVoteVelocity(
  votes: Array<{ timestamp: number }>,
  periodHours: number = 1
): number {
  if (votes.length === 0) return 0;

  const now = Date.now();
  const periodMs = periodHours * 60 * 60 * 1000;
  const recentVotes = votes.filter(v => now - v.timestamp < periodMs);

  return recentVotes.length / periodHours;
}

/**
 * Detects potential vote manipulation patterns
 */
export interface ManipulationPattern {
  type: 'rapid_voting' | 'ip_cluster' | 'time_anomaly' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedVotes: number;
}

export function detectManipulationPatterns(
  votes: Array<{ 
    timestamp: number; 
    ip?: string; 
    email: string;
    anomalyScore?: number;
  }>
): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  // Check for rapid voting clusters
  const sortedVotes = [...votes].sort((a, b) => a.timestamp - b.timestamp);
  let rapidCluster = 0;

  for (let i = 1; i < sortedVotes.length; i++) {
    const timeDiff = sortedVotes[i].timestamp - sortedVotes[i - 1].timestamp;
    if (timeDiff < 2000) {
      rapidCluster++;
    }
  }

  if (rapidCluster > 5) {
    patterns.push({
      type: 'rapid_voting',
      severity: 'high',
      description: `${rapidCluster} votes submitted within 2 seconds of each other`,
      affectedVotes: rapidCluster,
    });
  }

  // Check for IP clustering
  const ipCounts = new Map<string, number>();
  votes.forEach(v => {
    if (v.ip) {
      ipCounts.set(v.ip, (ipCounts.get(v.ip) || 0) + 1);
    }
  });

  ipCounts.forEach((count, ip) => {
    if (count > 10) {
      patterns.push({
        type: 'ip_cluster',
        severity: 'high',
        description: `IP ${anonymizeIP(ip)} has ${count} votes`,
        affectedVotes: count,
      });
    } else if (count > 5) {
      patterns.push({
        type: 'ip_cluster',
        severity: 'medium',
        description: `IP ${anonymizeIP(ip)} has ${count} votes`,
        affectedVotes: count,
      });
    }
  });

  // Check for unusual time patterns (all votes at exact same minute)
  const minuteCounts = new Map<number, number>();
  votes.forEach(v => {
    const minute = Math.floor(v.timestamp / 60000);
    minuteCounts.set(minute, (minuteCounts.get(minute) || 0) + 1);
  });

  minuteCounts.forEach((count, minute) => {
    if (count > 20) {
      patterns.push({
        type: 'time_anomaly',
        severity: 'medium',
        description: `${count} votes in the same minute`,
        affectedVotes: count,
      });
    }
  });

  // Check for high anomaly scores
  const highAnomalyVotes = votes.filter(v => (v.anomalyScore || 0) >= 70);
  if (highAnomalyVotes.length > 10) {
    patterns.push({
      type: 'suspicious_pattern',
      severity: 'high',
      description: `${highAnomalyVotes.length} votes with high anomaly scores`,
      affectedVotes: highAnomalyVotes.length,
    });
  }

  return patterns;
}

/**
 * Generates vote summary statistics
 */
export interface VoteSummary {
  total: number;
  valid: number;
  invalid: number;
  flagged: number;
  validPercentage: number;
  flaggedPercentage: number;
  averageAnomalyScore: number;
}

export function generateVoteSummary(
  votes: Array<{
    invalid?: boolean;
    flagged?: boolean;
    anomalyScore?: number;
  }>
): VoteSummary {
  const total = votes.length;
  const valid = votes.filter(v => !v.invalid).length;
  const invalid = votes.filter(v => v.invalid).length;
  const flagged = votes.filter(v => v.flagged).length;

  const totalAnomalyScore = votes.reduce((sum, v) => sum + (v.anomalyScore || 0), 0);
  const averageAnomalyScore = total > 0 ? Math.round(totalAnomalyScore / total) : 0;

  return {
    total,
    valid,
    invalid,
    flagged,
    validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
    flaggedPercentage: total > 0 ? Math.round((flagged / total) * 100) : 0,
    averageAnomalyScore,
  };
}

/**
 * Formats vote count with proper Norwegian grammar
 */
export function formatVoteCount(count: number): string {
  if (count === 0) return 'Ingen stemmer';
  if (count === 1) return '1 stemme';
  return `${count} stemmer`;
}

/**
 * Gets time until vote deadline
 */
export function getTimeUntilDeadline(deadlineTimestamp: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const now = Date.now();
  const diff = deadlineTimestamp - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Exports votes to CSV format
 */
export function exportVotesToCSV(
  votes: Array<{
    id: string;
    email: string;
    categoryId: string;
    nomineeId: string;
    timestamp: number;
    ip?: string;
    anomalyScore?: number;
    flagged?: boolean;
    invalid?: boolean;
  }>
): string {
  const headers = [
    'ID',
    'Email',
    'Category ID',
    'Nominee ID',
    'Timestamp',
    'Date',
    'IP',
    'Anomaly Score',
    'Flagged',
    'Invalid',
  ];

  const rows = votes.map(vote => [
    vote.id,
    vote.email,
    vote.categoryId,
    vote.nomineeId,
    vote.timestamp.toString(),
    new Date(vote.timestamp).toISOString(),
    vote.ip || '',
    vote.anomalyScore?.toString() || '0',
    vote.flagged ? 'Yes' : 'No',
    vote.invalid ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
