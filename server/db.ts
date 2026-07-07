import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface SystemConfig {
  pollLocked: boolean;
}

export interface CountdownConfig {
  targetDate: string;
  enabled: boolean;
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

  // ── Countdown Config ──────────────────────────────────────────────────────

  async getCountdown(): Promise<CountdownConfig | null> {
    const record = await prisma.systemConfig.findUnique({ where: { key: 'countdown' } });
    if (!record) return null;
    const val = record.value as any;
    if (typeof val?.targetDate !== 'string') return null;
    return {
      targetDate: val.targetDate,
      enabled: typeof val?.enabled === 'boolean' ? val.enabled : true,
    };
  }

  async updateCountdown(config: CountdownConfig): Promise<CountdownConfig> {
    await prisma.systemConfig.upsert({
      where: { key: 'countdown' },
      update: { value: config as any },
      create: { key: 'countdown', value: config as any },
    });
    await this.logAudit('system', 'medium', `Countdown updated to ${config.targetDate} (enabled: ${config.enabled})`);
    return config;
  }

  async deleteCountdown(): Promise<void> {
    await prisma.systemConfig.deleteMany({ where: { key: 'countdown' } });
    await this.logAudit('system', 'medium', 'Countdown deleted');
  }

  // ── Hidden Categories (public visibility) ─────────────────────────────────

  async getHiddenCategories(): Promise<string[]> {
    const record = await prisma.systemConfig.findUnique({ where: { key: 'hiddenCategories' } });
    if (!record) return [];
    const val = record.value as any;
    if (!Array.isArray(val)) return [];
    return val.filter((v: any) => typeof v === 'string');
  }

  async isCategoryHidden(id: string): Promise<boolean> {
    const list = await this.getHiddenCategories();
    return list.includes(id);
  }

  async setCategoryHidden(id: string, hidden: boolean): Promise<void> {
    const current = await this.getHiddenCategories();
    let updated = current.filter(Boolean);
    if (hidden) {
      if (!updated.includes(id)) updated.push(id);
    } else {
      updated = updated.filter((x) => x !== id);
    }
    await prisma.systemConfig.upsert({
      where: { key: 'hiddenCategories' },
      update: { value: updated },
      create: { key: 'hiddenCategories', value: updated },
    });
    await this.logAudit('system', 'medium', `Category ${id} ${hidden ? 'hidden' : 'unhidden'} by admin`);
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

  // ── Password Reset ────────────────────────────────────────────────────────

  async createPasswordResetToken(email: string, token: string) {
    const expires = BigInt(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    return prisma.passwordResetToken.create({ data: { email, token, expires } });
  }

  async getPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) return { error: 'invalid_token' };
    if (record.used) return { error: 'token_used' };
    if (BigInt(Date.now()) > record.expires) return { error: 'token_expired' };
    await prisma.user.update({
      where: { email: record.email },
      data: { password: bcrypt.hashSync(newPassword, 10) },
    });
    await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
    return { success: true };
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
