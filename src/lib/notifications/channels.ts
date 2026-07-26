/**
 * Channel configuration and rate limiting
 */

export interface ChannelConfig {
  name: string;
  enabled: boolean;
  dailyLimit: number;
  hourlyLimit: number;
  cooldown: number; // Minutes between notifications of same type
  retryDelay: number; // Minutes before retry
  maxRetries: number;
}

export const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  EMAIL: {
    name: 'Email',
    enabled: true,
    dailyLimit: 50,      // Max emails per user per day
    hourlyLimit: 10,     // Max emails per user per hour
    cooldown: 5,         // 5 minutes between same type
    retryDelay: 15,      // Retry after 15 minutes
    maxRetries: 3,
  },
  SMS: {
    name: 'SMS',
    enabled: true,
    dailyLimit: 10,      // Max SMS per user per day (cost control)
    hourlyLimit: 3,      // Max SMS per user per hour
    cooldown: 30,        // 30 minutes between same type
    retryDelay: 30,      // Retry after 30 minutes
    maxRetries: 2,
  },
  PUSH: {
    name: 'Push Notification',
    enabled: true,
    dailyLimit: 100,     // Max push per user per day
    hourlyLimit: 20,     // Max push per user per hour
    cooldown: 1,         // 1 minute between same type
    retryDelay: 5,       // Retry after 5 minutes
    maxRetries: 3,
  },
};

export class RateLimiter {
  private userCounts: Map<string, {
    hourly: Map<string, number>;
    daily: Map<string, number>;
    lastSent: Map<string, number>;
  }> = new Map();

  /**
   * Check if notification can be sent
   */
  canSend(userId: string, channel: string, type: string): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    const config = CHANNEL_CONFIGS[channel];
    if (!config?.enabled) {
      return { allowed: false, reason: 'Channel disabled' };
    }

    const userKey = `${userId}:${channel}`;
    let userData = this.userCounts.get(userKey);

    if (!userData) {
      userData = {
        hourly: new Map(),
        daily: new Map(),
        lastSent: new Map(),
      };
      this.userCounts.set(userKey, userData);
    }

    const now = Date.now();
    const hourKey = `${new Date().getHours()}`;
    const dayKey = new Date().toDateString();

    // Check hourly limit
    const hourlyCount = userData.hourly.get(hourKey) || 0;
    if (hourlyCount >= config.hourlyLimit) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return {
        allowed: false,
        reason: 'Hourly limit reached',
        retryAfter: Math.ceil((nextHour.getTime() - now) / 1000),
      };
    }

    // Check daily limit
    const dailyCount = userData.daily.get(dayKey) || 0;
    if (dailyCount >= config.dailyLimit) {
      return {
        allowed: false,
        reason: 'Daily limit reached',
        retryAfter: 86400 - (now % 86400000) / 1000,
      };
    }

    // Check cooldown
    const lastSent = userData.lastSent.get(type) || 0;
    const cooldownMs = config.cooldown * 60 * 1000;
    if (now - lastSent < cooldownMs) {
      return {
        allowed: false,
        reason: 'Cooldown period',
        retryAfter: Math.ceil((cooldownMs - (now - lastSent)) / 1000),
      };
    }

    return { allowed: true };
  }

  /**
   * Record a sent notification
   */
  recordSent(userId: string, channel: string, type: string) {
    const userKey = `${userId}:${channel}`;
    let userData = this.userCounts.get(userKey);

    if (!userData) {
      userData = {
        hourly: new Map(),
        daily: new Map(),
        lastSent: new Map(),
      };
      this.userCounts.set(userKey, userData);
    }

    const hourKey = `${new Date().getHours()}`;
    const dayKey = new Date().toDateString();

    userData.hourly.set(hourKey, (userData.hourly.get(hourKey) || 0) + 1);
    userData.daily.set(dayKey, (userData.daily.get(dayKey) || 0) + 1);
    userData.lastSent.set(type, Date.now());
  }

  /**
   * Reset counts (called at midnight)
   */
  resetDaily() {
    this.userCounts.clear();
  }

  /**
   * Get remaining quota for user
   */
  getRemainingQuota(userId: string, channel: string): {
    hourly: number;
    daily: number;
  } {
    const config = CHANNEL_CONFIGS[channel];
    const userKey = `${userId}:${channel}`;
    const userData = this.userCounts.get(userKey);

    if (!userData) {
      return {
        hourly: config.hourlyLimit,
        daily: config.dailyLimit,
      };
    }

    const hourKey = `${new Date().getHours()}`;
    const dayKey = new Date().toDateString();

    return {
      hourly: Math.max(0, config.hourlyLimit - (userData.hourly.get(hourKey) || 0)),
      daily: Math.max(0, config.dailyLimit - (userData.daily.get(dayKey) || 0)),
    };
  }
}

export const rateLimiter = new RateLimiter();