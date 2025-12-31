import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { REDIS_CLIENT, type RedisLike } from '../../shared/redis/redis.constants';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly MAX_ATTEMPTS = 10;
  private readonly BLOCK_DURATION_SECONDS = 5 * 60; // 5 minutes
  private readonly ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisLike) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    if (!ip) {
      // If we can't determine IP, allow (fail open)
      return true;
    }

    const blockedKey = this.getBlockedKey(ip);
    const attemptsKey = this.getAttemptsKey(ip);

    // Check if IP is currently blocked
    const isBlocked = await this.redis.get(blockedKey);
    if (isBlocked) {
      const ttl = await this.redis.ttl(blockedKey);
      const minutesLeft = Math.ceil(ttl / 60);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed login attempts. Your IP is blocked for ${minutesLeft} more minute(s).`,
          error: 'Rate Limit Exceeded',
          blockedUntil: Date.now() + ttl * 1000,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check current attempts
    const attempts = await this.redis.get(attemptsKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= this.MAX_ATTEMPTS) {
      // Block the IP
      await this.redis.set(blockedKey, '1', 'EX', this.BLOCK_DURATION_SECONDS);
      await this.redis.del(attemptsKey);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed login attempts. Your IP is blocked for ${this.BLOCK_DURATION_SECONDS / 60} minutes.`,
          error: 'Rate Limit Exceeded',
          blockedUntil: Date.now() + this.BLOCK_DURATION_SECONDS * 1000,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Allow the request to proceed
    return true;
  }

  /**
   * Increment failed login attempts for an IP
   */
  async recordFailedAttempt(ip: string): Promise<void> {
    if (!ip) return;

    const attemptsKey = this.getAttemptsKey(ip);
    const current = await this.redis.get(attemptsKey);
    const count = current ? parseInt(current, 10) : 0;
    const newCount = count + 1;

    await this.redis.set(attemptsKey, newCount.toString(), 'EX', this.ATTEMPT_WINDOW_SECONDS);

    // If this was the 10th attempt, block immediately
    if (newCount >= this.MAX_ATTEMPTS) {
      const blockedKey = this.getBlockedKey(ip);
      await this.redis.set(blockedKey, '1', 'EX', this.BLOCK_DURATION_SECONDS);
      await this.redis.del(attemptsKey);
    }
  }

  /**
   * Clear failed attempts for an IP (called on successful login)
   */
  async clearAttempts(ip: string): Promise<void> {
    if (!ip) return;

    const attemptsKey = this.getAttemptsKey(ip);
    await this.redis.del(attemptsKey);
  }

  /**
   * Get client IP from request
   */
  private getClientIp(request: Request): string | null {
    // Try various headers for IP (in order of preference)
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      null;

    return ip;
  }

  private getBlockedKey(ip: string): string {
    return `ratelimit:blocked:${ip}`;
  }

  private getAttemptsKey(ip: string): string {
    return `ratelimit:attempts:${ip}`;
  }
}
