import prisma from '@/lib/utils/prisma';

// Types
type NotificationType = 
  | 'PAYMENT_CONFIRMATION' | 'SUBSCRIPTION_RECEIPT' | 'OTP_VERIFICATION'
  | 'EXAM_RESULT' | 'COURSE_ENROLLMENT' | 'CLASS_REMINDER'
  | 'INSTRUCTOR_PAYOUT' | 'WELCOME' | 'RENEWAL_REMINDER'
  | 'CERTIFICATE_ISSUED' | 'PASSWORD_RESET' | 'ACCOUNT_VERIFICATION'
  | 'JOB_APPLICATION' | 'EVENT_REGISTRATION' | 'RENEWAL_FAILED'
  | 'PAYOUT_PROCESSED';

interface NotificationPreferences {
  emailEnabled: boolean; smsEnabled: boolean; pushEnabled: boolean;
  types: { [key: string]: { enabled: boolean; channels: string[] } };
}

interface NotificationProvider {
  send(notification: { userId: string; email?: string; phone?: string; title: string; message: string; type?: string; metadata?: any; locale?: string }): Promise<boolean>;
}

export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private retryQueue: any[] = [];
  private maxRetries = 3;

  constructor() {
    this.providers.set('EMAIL', new EmailProvider());
    this.providers.set('SMS', new SMSProvider());
    this.providers.set('PUSH', new PushProvider());
  }

  async send(notification: {
    userId: string; type: NotificationType; title: string; message: string;
    channel?: string | string[]; metadata?: any; priority?: 'high' | 'normal' | 'low';
  }): Promise<void> {
    const channels = notification.channel 
      ? (Array.isArray(notification.channel) ? notification.channel : [notification.channel])
      : this.determineChannels(notification.type, notification.priority);

    const notificationRecord = await prisma.notification.create({
      data: { userId: notification.userId, type: notification.type, title: notification.title, message: notification.message, status: 'pending', channels, metadata: notification.metadata },
    });

    for (const channel of channels) {
      try {
        const provider = this.providers.get(channel);
        if (!provider) continue;
        const user = await prisma.user.findUnique({ where: { id: notification.userId }, select: { email: true, phone: true, notificationPreferences: true, locale: true } });
        if (!this.isChannelEnabled(user, channel, notification.type)) continue;
        const sent = await provider.send({ userId: notification.userId, email: user?.email, phone: user?.phone, title: notification.title, message: notification.message, type: notification.type, metadata: notification.metadata, locale: user?.locale || 'en' });
        await prisma.notification.update({ where: { id: notificationRecord.id }, data: { status: sent ? 'sent' : 'failed', [`${channel.toLowerCase()}SentAt`]: sent ? new Date() : undefined, [`${channel.toLowerCase()}Status`]: sent ? 'delivered' : 'failed' } });
        if (!sent) this.retryQueue.push({ ...notification, channel, retries: 0, notificationId: notificationRecord.id });
      } catch (error) {
        this.retryQueue.push({ ...notification, channel, retries: 0, notificationId: notificationRecord.id });
      }
    }
    this.processRetryQueue();
  }

  private determineChannels(type: NotificationType, priority?: string): string[] {
    switch (priority) { case 'high': return ['EMAIL', 'SMS', 'PUSH']; case 'low': return ['EMAIL']; default: return ['EMAIL', 'PUSH']; }
  }

  private isChannelEnabled(user: any, channel: string, type: NotificationType): boolean {
    if (!user) return false;
    if (channel === 'EMAIL' && user.email) return true;
    if (channel === 'SMS' && !user.phone) return false;
    if (user.notificationPreferences) {
      const prefs = user.notificationPreferences as NotificationPreferences;
      if (channel === 'EMAIL' && prefs.emailEnabled === false) return false;
      if (channel === 'SMS' && prefs.smsEnabled === false) return false;
      if (channel === 'PUSH' && prefs.pushEnabled === false) return false;
      const typeKey = type.toLowerCase() as keyof NotificationPreferences['types'];
      if (prefs.types?.[typeKey]?.enabled === false) return false;
    }
    return true;
  }

  async sendPaymentConfirmation(userId: string, data: any) {
    await this.send({ userId, type: 'PAYMENT_CONFIRMATION', title: `Payment Confirmed - MWK ${data.amount?.toLocaleString() || 0}`, message: `Payment of MWK ${data.amount?.toLocaleString() || 0} for ${data.planName} confirmed.`, priority: 'high', metadata: data });
  }

  private async processRetryQueue(): Promise<void> {
    const notifications = [...this.retryQueue]; this.retryQueue = [];
    for (const n of notifications) {
      if ((n.retries || 0) < this.maxRetries) {
        try {
          const provider = this.providers.get(n.channel);
          const user = await prisma.user.findUnique({ where: { id: n.userId }, select: { email: true, phone: true } });
          const sent = await provider!.send({ userId: n.userId, email: user?.email, phone: user?.phone, title: n.title, message: n.message, type: n.type, metadata: n.metadata });
          if (!sent) { this.retryQueue.push({ ...n, retries: (n.retries || 0) + 1 }); }
          else if (n.notificationId) { await prisma.notification.update({ where: { id: n.notificationId }, data: { status: 'sent', [`${n.channel.toLowerCase()}SentAt`]: new Date(), [`${n.channel.toLowerCase()}Status`]: 'delivered' } }); }
        } catch { this.retryQueue.push({ ...n, retries: (n.retries || 0) + 1 }); }
      } else if (n.notificationId) {
        await prisma.notification.update({ where: { id: n.notificationId }, data: { status: 'failed', [`${n.channel.toLowerCase()}Status`]: 'failed', metadata: { maxRetriesReached: true, failedAt: new Date() } } });
      }
    }
  }
}

class EmailProvider implements NotificationProvider {
  async send(notification: { userId: string; email?: string; title: string; message: string; type?: string; metadata?: any }): Promise<boolean> {
    try {
      if (!notification.email) { const user = await prisma.user.findUnique({ where: { id: notification.userId }, select: { email: true, fullName: true } }); if (!user?.email) return false; notification.email = user.email; }
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0;font-size:20px">StudyHub Malawi</h1></div><div style="padding:24px"><h2 style="color:#0D1B3D;font-size:18px">${notification.title}</h2><p style="color:#333;line-height:1.6">${notification.message}</p></div><div style="background:#f2f4f7;padding:16px;text-align:center"><p style="color:#666;font-size:12px;margin:0">© ${new Date().getFullYear()} StudyHub Malawi. Learn. Practice. Succeed.</p></div></div>`;
      console.log(`[EMAIL] To: ${notification.email} | Subject: ${notification.title}`);
      return true;
    } catch (error) { console.error('Email failed:', error); return false; }
  }
}

class SMSProvider implements NotificationProvider {
  async send(notification: { userId: string; phone?: string; message: string }): Promise<boolean> {
    try {
      if (!notification.phone) { const user = await prisma.user.findUnique({ where: { id: notification.userId }, select: { phone: true } }); if (!user?.phone) return false; notification.phone = user.phone; }
      const msg = notification.message.length > 160 ? notification.message.substring(0, 157) + '...' : notification.message;
      console.log(`[SMS] To: ${notification.phone} | ${msg}`);
      return true;
    } catch { return false; }
  }
}

class PushProvider implements NotificationProvider {
  async send(notification: { userId: string; title: string; message: string; metadata?: any }): Promise<boolean> {
    try {
      if (global.io) { global.io.to(`user:${notification.userId}`).emit('notification', { title: notification.title, message: notification.message, type: notification.metadata?.type, timestamp: new Date() }); }
      return true;
    } catch { return false; }
  }
}

export const notificationService = new NotificationService();
