// src/lib/email/email-cost-optimizer.ts

export class EmailCostOptimizer {
  private dailyLimits = {
    EMAIL: 10000,  // Daily email limit
    SMS: 100,      // Daily SMS limit (much lower due to cost)
  };

  private userDailyCounts: Map<string, { email: number; sms: number }> = new Map();

  async shouldSendEmail(userId: string): Promise<boolean> {
    const today = new Date().toDateString();
    const key = `${userId}:${today}`;
    
    let counts = this.userDailyCounts.get(key);
    if (!counts) {
      counts = await this.loadDailyCounts(userId);
      this.userDailyCounts.set(key, counts);
    }

    return counts.email < this.dailyLimits.EMAIL;
  }

  shouldSendSMS(userId: string): boolean {
    const today = new Date().toDateString();
    const key = `${userId}:${today}`;
    const counts = this.userDailyCounts.get(key);
    
    if (!counts) return false;
    
    // SMS only if email hasn't been opened within 1 hour
    return counts.sms < this.dailyLimits.SMS;
  }

  private async loadDailyCounts(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [emailCount, smsCount] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: today },
          emailSentAt: { not: null },
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: today },
          smsSentAt: { not: null },
        },
      }),
    ]);

    return { email: emailCount, sms: smsCount };
  }
}