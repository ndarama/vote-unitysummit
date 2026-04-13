export interface Category {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
  isActive?: boolean;
  expiresAt?: string; // ISO date string
  showResults?: boolean;
}

export interface Nominee {
  id: string;
  categoryId: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
  votes?: number;
  withdrawn?: boolean;
  withdrawalNote?: string;
}

export interface Vote {
  email: string;
  categoryId: string;
  nomineeId: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  anomalyScore?: number;
  flagged?: boolean;
  invalid?: boolean;
  invalidationReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'spike' | 'duplicate_ip' | 'bot_pattern' | 'manual_action' | 'system';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: any;
}

export interface SystemConfig {
  pollLocked: boolean;
  votingLimitMode: 'email' | 'ip';
  rateLimitWindow: number; // in milliseconds
  rateLimitMax: number;
  captchaEnabled: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'manager';
}

export interface Voter {
  id: string;
  email: string;
  name: string;
  invitedAt: number;
}
