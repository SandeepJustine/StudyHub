/**
 * Simple in-memory rate limiter for public endpoints like contact forms.
 * Designed for serverless/edge environments where Redis may not be available.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class ContactRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 5, windowMs = 60 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  private getKey(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
    return `contact:${ip}`;
  }

  check(req: Request): { allowed: boolean; remaining: number; retryAfter?: number } {
    const key = this.getKey(req);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }

  reset(req: Request) {
    const key = this.getKey(req);
    this.store.delete(key);
  }
}

export const contactRateLimiter = new ContactRateLimiter(5, 60 * 60 * 1000);
