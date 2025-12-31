import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { REDIS_CLIENT, type RedisLike } from '../../shared/redis/redis.constants';
import { UserEntity } from '../../database/entities/user.entity';

export interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  success: boolean;
  timestamp: Date;
  userAgent?: string;
  location?: string;
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date | null;
  attemptsCount: number;
  isManual: boolean;
}

export interface OnlineUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lastSeen: Date;
  isOnline: boolean;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly ONLINE_THRESHOLD_MINUTES = 15;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisLike,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  /**
   * Log a login attempt
   */
  async logLoginAttempt(
    email: string,
    ip: string,
    success: boolean,
    userAgent?: string,
  ): Promise<void> {
    const attempt: LoginAttempt = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      ip,
      success,
      timestamp: new Date(),
      userAgent,
    };

    const key = `login:attempts:${new Date().toISOString().split('T')[0]}`;
    const value = JSON.stringify(attempt);

    await this.redis.set(key, value, 'EX', 7 * 24 * 60 * 60); // Keep for 7 days

    // Also add to a sorted set for easy retrieval
    const listKey = 'login:attempts:list';
    await this.redis.set(`${listKey}:${attempt.id}`, value, 'EX', 7 * 24 * 60 * 60);
  }

  /**
   * Get recent login attempts
   */
  async getLoginAttempts(limit = 100, date?: Date): Promise<LoginAttempt[]> {
    const attempts: LoginAttempt[] = [];

    // Since we can't use SCAN with the current RedisLike interface,
    // we'll store attempts in a more queryable format
    const keys: string[] = [];

    if (date) {
      const dateKey = `login:attempts:${date.toISOString().split('T')[0]}`;
      keys.push(dateKey);
    } else {
      // Get all attempt keys for the last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = `login:attempts:${d.toISOString().split('T')[0]}`;
        keys.push(dateKey);
      }
    }

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          attempts.push(JSON.parse(data));
        } catch {
          // Skip invalid JSON
        }
      }
      if (attempts.length >= limit) break;
    }

    return attempts.slice(0, limit);
  }

  /**
   * Get login statistics
   */
  async getLoginStats(days = 7) {
    const stats = {
      totalAttempts: 0,
      successfulLogins: 0,
      failedAttempts: 0,
      uniqueIPs: new Set<string>(),
      uniqueUsers: new Set<string>(),
      byDay: [] as Array<{
        date: string;
        total: number;
        successful: number;
        failed: number;
      }>,
    };

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const key = `login:attempts:${dateStr}`;

      const data = await this.redis.get(key);
      if (data) {
        try {
          const attempt: LoginAttempt = JSON.parse(data);
          stats.totalAttempts++;
          stats.uniqueIPs.add(attempt.ip);
          stats.uniqueUsers.add(attempt.email);

          if (attempt.success) {
            stats.successfulLogins++;
          } else {
            stats.failedAttempts++;
          }

          // Add to daily stats
          const dayStats = stats.byDay.find((s) => s.date === dateStr);
          if (dayStats) {
            dayStats.total++;
            if (attempt.success) dayStats.successful++;
            else dayStats.failed++;
          } else {
            stats.byDay.push({
              date: dateStr,
              total: 1,
              successful: attempt.success ? 1 : 0,
              failed: attempt.success ? 0 : 1,
            });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return {
      ...stats,
      uniqueIPs: stats.uniqueIPs.size,
      uniqueUsers: stats.uniqueUsers.size,
    };
  }

  /**
   * Get all currently blocked IPs
   */
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const blocked: BlockedIP[] = [];

    // We need to track blocked IPs separately for this feature
    // Get from Redis pattern matching (simplified approach)
    const manualBlocksKey = 'manual:blocked:ips';
    const manualData = await this.redis.get(manualBlocksKey);
    
    if (manualData) {
      try {
        const manualBlocks = JSON.parse(manualData);
        blocked.push(...manualBlocks);
      } catch {
        // Skip invalid JSON
      }
    }

    return blocked;
  }

  /**
   * Get currently online users
   */
  async getOnlineUsers(): Promise<OnlineUser[]> {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - this.ONLINE_THRESHOLD_MINUTES);

    const users = await this.users.find({
      where: {
        lastLoginAt: MoreThan(threshold),
      },
      select: ['id', 'email', 'role', 'lastLoginAt'],
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email ?? '',
      name: (user.email ?? 'Unknown'),
      role: user.role,
      lastSeen: user.lastLoginAt ?? new Date(),
      isOnline: user.lastLoginAt ? user.lastLoginAt > threshold : false,
    }));
  }

  /**
   * Manually block an IP address
   */
  async manualBlockIP(
    ip: string,
    reason = 'Manual block by administrator',
    durationMinutes = 60,
  ): Promise<{ success: boolean; message: string }> {
    const blockedKey = `ratelimit:blocked:${ip}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // Block in rate limiter
    await this.redis.set(blockedKey, '1', 'EX', durationMinutes * 60);

    // Store in manual blocks list
    const manualBlocksKey = 'manual:blocked:ips';
    const currentData = await this.redis.get(manualBlocksKey);
    const blocks: BlockedIP[] = currentData ? JSON.parse(currentData) : [];

    const block: BlockedIP = {
      ip,
      reason,
      blockedAt: new Date(),
      expiresAt: durationMinutes > 0 ? expiresAt : null,
      attemptsCount: 0,
      isManual: true,
    };

    blocks.push(block);
    await this.redis.set(manualBlocksKey, JSON.stringify(blocks), 'EX', 7 * 24 * 60 * 60);

    return {
      success: true,
      message: `IP ${ip} blocked for ${durationMinutes} minutes. Reason: ${reason}`,
    };
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<{ success: boolean; message: string }> {
    const blockedKey = `ratelimit:blocked:${ip}`;
    const attemptsKey = `ratelimit:attempts:${ip}`;

    await this.redis.del(blockedKey);
    await this.redis.del(attemptsKey);

    // Remove from manual blocks list
    const manualBlocksKey = 'manual:blocked:ips';
    const currentData = await this.redis.get(manualBlocksKey);
    if (currentData) {
      const blocks: BlockedIP[] = JSON.parse(currentData);
      const filtered = blocks.filter((b) => b.ip !== ip);
      await this.redis.set(manualBlocksKey, JSON.stringify(filtered), 'EX', 7 * 24 * 60 * 60);
    }

    return {
      success: true,
      message: `IP ${ip} has been unblocked`,
    };
  }

  /**
   * Get IPs with suspicious activity
   */
  async getSuspiciousIPs(): Promise<
    Array<{ ip: string; attempts: number; lastAttempt: Date }>
  > {
    // This would require tracking attempts per IP
    // For now, return empty array as we need to enhance Redis tracking
    return [];
  }

  /**
   * Get recent security activity log
   */
  async getActivityLog(limit = 100) {
    const attempts = await this.getLoginAttempts(limit);
    return attempts.map((attempt) => ({
      type: attempt.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      email: attempt.email,
      ip: attempt.ip,
      timestamp: attempt.timestamp,
      details: attempt.userAgent,
    }));
  }
}
