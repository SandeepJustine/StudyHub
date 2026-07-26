import prisma from '@/lib/utils/prisma';
import { AppError } from '@/lib/utils/errors';
import { EmailService } from '@/lib/email/email-service';
import { SMSService } from '@/lib/sms/sms-service';
import { PushNotificationService } from './push-service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationPreferences,
} from '@/types/notification';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel | NotificationChannel[];
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  template?: string;
  scheduleFor?: Date;
}

export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();
  private maxRetries = 3;

  // Priority-based channel selection
  private channelPriority: Record<NotificationPriority, NotificationChannel[]> = {
    low: ['EMAIL'],
    normal: ['EMAIL', 'PUSH'],
    high: ['EMAIL', 'SMS', 'PUSH'],
    urgent: ['SMS', 'PUSH', 'EMAIL'],
  };

  // Channel costs (for cost optimization)
  private channelCosts = {
    EMAIL: 0.001,  // $0.001 per email (essentially free with SendGrid free tier)
    SMS: 0.05,     // $0.05 per SMS in Malawi
    PUSH: 0.0,     // Free (infrastructure cost negligible)
  };

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
  }

  /**
   * Send a notification
   */
  async send(payload: NotificationPayload): Promise<string> {
    const { userId, type, title, message, channel, priority = 'normal', metadata, template, scheduleFor } = payload;

    // If scheduled, delay sending
    if (scheduleFor && scheduleFor > new Date()) {
      return this.scheduleNotification(payload);
    }

    // Get user and their preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        locale: true,
        notificationPreferences: true,
        emailBounced: true,
        unsubscribedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }

    // Check if user has unsubscribed
    if (user.unsubscribedAt) {
      console.log(`User ${userId} has unsubscribed from all notifications`);
      return 'unsubscribed';
    }

    // Determine channels
    const channels = this.determineChannels(user, type, channel, priority);

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channels,
        status: 'pending',
        priority,
        metadata: {
          ...metadata,
          template,
          estimatedCost: this.calculateCost(channels),
        },
      },
    });

    // Send through each channel
    const sendPromises = channels.map(ch => this.sendThroughChannel(notification.id, ch, {
      userId,
      email: user.email!,
      phone: user.phone!,
      fullName: user.fullName,
      locale: user.locale,
      title,
      message,
      type,
      metadata,
      template,
    }));

    // Wait for all channels (don't fail if one channel fails)
    await Promise.allSettled(sendPromises);

    // Update notification status
    await this.updateNotificationStatus(notification.id);

    return notification.id;
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>
  ): Promise<{ successful: number; failed: number; notificationIds: string[] }> {
    const results = {
      successful: 0,
      failed: 0,
      notificationIds: [] as string[],
    };

    // Process in batches of 50 to avoid overwhelming the system
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchPromises = batch.map(userId =>
        this.send({ ...payload, userId })
          .then(id => {
            results.successful++;
            results.notificationIds.push(id);
          })
          .catch(() => {
            results.failed++;
          })
      );

      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userId: string, paymentData: {
    amount: number;
    planName: string;
    paymentMethod: string;
    transactionReference: string;
    invoiceUrl?: string;
  }) {
    return this.send({
      userId,
      type: 'PAYMENT_CONFIRMATION',
      title: `Payment Confirmed - MWK ${paymentData.amount.toLocaleString()}`,
      message: `Your payment of MWK ${paymentData.amount.toLocaleString()} for ${paymentData.planName} has been confirmed. Reference: ${paymentData.transactionReference}`,
      priority: 'high',
      template: 'payment-confirmation',
      metadata: paymentData,
    });
  }

  /**
   * Send exam results
   */
  async sendExamResult(userId: string, examData: {
    quizTitle: string;
    score: number;
    passed: boolean;
    certificateUrl?: string;
    courseTitle: string;
  }) {
    return this.send({
      userId,
      type: 'EXAM_RESULT',
      title: `Exam Result: ${examData.quizTitle}`,
      message: examData.passed
        ? `Congratulations! You passed ${examData.quizTitle} with ${examData.score}%. Check your certificate!`
        : `You scored ${examData.score}% on ${examData.quizTitle}. Keep practicing!`,
      priority: 'high',
      template: 'exam-result',
      metadata: examData,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(userId: string, role: string) {
    const features = this.getWelcomeFeatures(role);

    return this.send({
      userId,
      type: 'WELCOME',
      title: 'Welcome to StudyHub Malawi! 🎉',
      message: 'Welcome to StudyHub! Your account is ready. Start your learning journey today.',
      priority: 'low',
      template: 'welcome',
      metadata: { role, features },
    });
  }

  /**
   * Send OTP
   */
  async sendOTP(userId: string, purpose: string, otp?: string) {
    const generatedOTP = otp || this.generateOTP();

    return this.send({
      userId,
      type: 'OTP_VERIFICATION',
      title: 'Verification Code',
      message: `Your verification code is: ${generatedOTP}. It expires in 10 minutes.`,
      channel: ['EMAIL', 'SMS'],
      priority: 'urgent',
      template: 'otp-verification',
      metadata: {
        otp: generatedOTP,
        purpose,
        expiryMinutes: 10,
      },
    });
  }

  /**
   * Send renewal reminder
   */
  async sendRenewalReminder(userId: string, subscriptionData: {
    tier: string;
    amount: number;
    endDate: Date;
    daysRemaining: number;
  }) {
    const priority = subscriptionData.daysRemaining <= 3 ? 'high' : 'normal';

    return this.send({
      userId,
      type: 'RENEWAL_REMINDER',
      title: `Subscription Renewing in ${subscriptionData.daysRemaining} Days`,
      message: `Your ${subscriptionData.tier} subscription will renew on ${subscriptionData.endDate.toLocaleDateString()}. Amount: MWK ${subscriptionData.amount.toLocaleString()}`,
      priority,
      template: 'renewal-reminder',
      metadata: subscriptionData,
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, params?: {
    type?: NotificationType;
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { type, read, page = 1, limit = 20 } = params || {};

    const where: any = { userId };

    if (type) where.type = type;
    if (read !== undefined) {
      where.readAt = read ? { not: null } : null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 'NOT_FOUND', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: NotificationPreferences) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: preferences as any,
      },
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const defaultPreferences: NotificationPreferences = {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      types: {
        PAYMENT_CONFIRMATION: { enabled: true, channels: ['EMAIL', 'SMS'] },
        EXAM_RESULT: { enabled: true, channels: ['EMAIL', 'PUSH'] },
        CLASS_REMINDER: { enabled: true, channels: ['EMAIL', 'PUSH'] },
        RENEWAL_REMINDER: { enabled: true, channels: ['EMAIL'] },
        FORUM_REPLY: { enabled: true, channels: ['PUSH'] },
        PROMOTIONAL: { enabled: false, channels: ['EMAIL'] },
      },
    };

    return (user?.notificationPreferences as NotificationPreferences) || defaultPreferences;
  }

  /**
   * Process notification retry queue
   */
  async processRetryQueue() {
    const failedNotifications = await prisma.notification.findMany({
      where: {
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: 100,
    });

    for (const notification of failedNotifications) {
      if ((notification.metadata as any)?.retries >= this.maxRetries) continue;

      // Retry sending
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, phone: true, fullName: true },
      });

      if (!user) continue;

      for (const channel of notification.channels) {
        await this.sendThroughChannel(notification.id, channel as NotificationChannel, {
          userId: notification.userId,
          email: user.email!,
          phone: user.phone!,
          fullName: user.fullName,
          title: notification.title,
          message: notification.message,
          type: notification.type as NotificationType,
          metadata: notification.metadata as any,
        });
      }

      // Update retry count
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          metadata: {
            ...(notification.metadata as any),
            retries: ((notification.metadata as any)?.retries || 0) + 1,
            lastRetry: new Date().toISOString(),
          },
        },
      });
    }

    return { processed: failedNotifications.length };
  }

  /**
   * Schedule a notification for later
   */
  private async scheduleNotification(payload: NotificationPayload): Promise<string> {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        channels: Array.isArray(payload.channel) ? payload.channel : [payload.channel || 'EMAIL'],
        status: 'scheduled',
        priority: payload.priority || 'normal',
        metadata: {
          ...payload.metadata,
          scheduledFor: payload.scheduleFor!.toISOString(),
          template: payload.template,
        },
      },
    });

    // Set timeout for scheduled send
    const delay = payload.scheduleFor!.getTime() - Date.now();
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        this.retryQueue.delete(notification.id);
        await this.executeScheduledNotification(notification.id);
      }, delay);

      this.retryQueue.set(notification.id, timeout);
    }

    return notification.id;
  }

  /**
   * Execute a scheduled notification
   */
  private async executeScheduledNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.status !== 'scheduled') return;

    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, phone: true, fullName: true, locale: true },
    });

    if (!user) return;

    for (const channel of notification.channels) {
      await this.sendThroughChannel(notificationId, channel as NotificationChannel, {
        userId: notification.userId,
        email: user.email!,
        phone: user.phone!,
        fullName: user.fullName,
        locale: user.locale,
        title: notification.title,
        message: notification.message,
        type: notification.type as NotificationType,
        metadata: notification.metadata as any,
      });
    }

    await this.updateNotificationStatus(notificationId);
  }

  /**
   * Send through a specific channel
   */
  private async sendThroughChannel(
    notificationId: string,
    channel: NotificationChannel,
    data: any
  ) {
    try {
      let success = false;

      switch (channel) {
        case 'EMAIL':
          success = await this.emailService.send({
            to: data.email,
            userId: data.userId,
            userName: data.fullName,
            subject: data.title,
            type: data.type,
            template: data.template,
            metadata: data.metadata,
            locale: data.locale,
          });
          break;

        case 'SMS':
          success = await this.smsService.send({
            to: data.phone,
            userId: data.userId,
            message: `${data.title}: ${data.message}`,
            type: data.type,
            priority: data.priority,
          });
          break;

        case 'PUSH':
          success = await this.pushService.send({
            userId: data.userId,
            title: data.title,
            body: data.message,
            data: {
              type: data.type,
              ...data.metadata,
            },
          });
          break;
      }

      // Update channel status
      await this.updateChannelStatus(notificationId, channel, success);

      return success;
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error);
      await this.updateChannelStatus(notificationId, channel, false);
      return false;
    }
  }

  /**
   * Determine which channels to use
   */
  private determineChannels(
    user: any,
    type: NotificationType,
    requestedChannels?: NotificationChannel | NotificationChannel[],
    priority?: NotificationPriority
  ): NotificationChannel[] {
    // If specific channels requested, use those (if available)
    if (requestedChannels) {
      const channels = Array.isArray(requestedChannels) ? requestedChannels : [requestedChannels];
      return channels.filter(ch => this.isChannelAvailable(user, ch));
    }

    // Check user preferences
    const preferences = (user.notificationPreferences as NotificationPreferences) || {};
    const typePrefs = preferences.types?.[type];

    if (typePrefs?.enabled === false) {
      return [];
    }

    if (typePrefs?.channels) {
      return typePrefs.channels.filter((ch: NotificationChannel) => this.isChannelAvailable(user, ch));
    }

    // Fall back to priority-based selection
    const priorityChannels = this.channelPriority[priority || 'normal'];
    return priorityChannels.filter(ch => this.isChannelAvailable(user, ch));
  }

  /**
   * Check if channel is available for user
   */
  private isChannelAvailable(user: any, channel: NotificationChannel): boolean {
    switch (channel) {
      case 'EMAIL':
        return !!user.email && !user.emailBounced;
      case 'SMS':
        return !!user.phone;
      case 'PUSH':
        return true; // Push is always available for authenticated users
      default:
        return false;
    }
  }

  /**
   * Update notification status based on channel results
   */
  private async updateNotificationStatus(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return;

    const successCount = [
      notification.emailStatus === 'sent',
      notification.smsStatus === 'sent',
      notification.pushStatus === 'sent',
    ].filter(Boolean).length;

    const status = successCount > 0 ? 'sent' : 'failed';

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status },
    });
  }

  /**
   * Update individual channel status
   */
  private async updateChannelStatus(
    notificationId: string,
    channel: NotificationChannel,
    success: boolean
  ) {
    const updateData: any = {
      [`${channel.toLowerCase()}SentAt`]: success ? new Date() : undefined,
      [`${channel.toLowerCase()}Status`]: success ? 'sent' : 'failed',
    };

    await prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    });
  }

  /**
   * Calculate estimated cost of notification
   */
  private calculateCost(channels: NotificationChannel[]): number {
    return channels.reduce((total, ch) => total + this.channelCosts[ch], 0);
  }

  /**
   * Get welcome features based on role
   */
  private getWelcomeFeatures(role: string): Array<{ icon: string; title: string; description: string }> {
    const features: Record<string, Array<{ icon: string; title: string; description: string }>> = {
      STUDENT: [
        { icon: '📚', title: 'Video Lessons', description: 'Learn from expert instructors' },
        { icon: '📝', title: 'Practice Quizzes', description: 'Test your knowledge' },
        { icon: '🎓', title: 'Mock Exams', description: 'Prepare for real exams' },
        { icon: '💬', title: 'Community', description: 'Connect with other learners' },
      ],
      INSTRUCTOR: [
        { icon: '🎥', title: 'Create Courses', description: 'Share your knowledge' },
        { icon: '💰', title: 'Earn Revenue', description: 'Get paid for your courses' },
        { icon: '📊', title: 'Track Progress', description: 'Monitor student performance' },
        { icon: '👥', title: 'Build Audience', description: 'Grow your student base' },
      ],
      SCHOOL_ADMIN: [
        { icon: '🏫', title: 'Manage School', description: 'Oversee your institution' },
        { icon: '👩‍🎓', title: 'Track Students', description: 'Monitor progress' },
        { icon: '📈', title: 'Analytics', description: 'Data-driven insights' },
        { icon: '⚙️', title: 'Customize', description: 'Brand your portal' },
      ],
    };

    return features[role] || features.STUDENT;
  }

  /**
   * Generate OTP
   */
  private generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }
}

export const notificationService = new NotificationService();