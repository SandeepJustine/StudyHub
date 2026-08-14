import { AIRateLimiter } from '../rate-limiter';

describe('AIRateLimiter', () => {
  let limiter: AIRateLimiter;

  beforeEach(() => {
    limiter = new AIRateLimiter(3, 1000);
  });

  it('should allow requests within limit', () => {
    expect(limiter.check('user1').allowed).toBe(true);
    expect(limiter.check('user1').allowed).toBe(true);
    expect(limiter.check('user1').allowed).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    const result = limiter.check('user1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should allow requests for different users', () => {
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');
    expect(limiter.check('user2').allowed).toBe(true);
  });
});
