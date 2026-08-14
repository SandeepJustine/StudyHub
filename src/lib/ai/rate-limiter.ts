interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class AIRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 20, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(userId: string): { allowed: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const entry = this.store.get(userId);

    if (!entry || now > entry.resetAt) {
      this.store.set(userId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

export const aiRateLimiter = new AIRateLimiter(20, 60 * 1000);
