// src/lib/notifications/notification-service.ts
import { createTransport, Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import prisma from '@/lib/utils/prisma';
import { 
  PaymentConfirmationEmail,
  SubscriptionReceiptEmail,
  OTPVerificationEmail,
  ExamResultEmail,
  CourseEnrollmentEmail,
  ClassReminderEmail,
  InstructorPayoutEmail,
  WelcomeEmail,
  RenewalReminderEmail,
  CertificateIssuedEmail,
} from '@/emails';

export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private retryQueue: Notification[] = [];
  private maxRetries = 3;

  constructor() {
    this.providers.set('EMAIL', new EmailProvider()); // Primary channel (cheaper)
    this.providers.set('SMS', new SMSProvider());     // Critical/urgent only
    this.providers.set('PUSH', new PushProvider());   // In-app notifications
  }

  async send(notification: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    channel?: string | string[];
    metadata?: any;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<void> {
    // Determine optimal channels based on priority and type
    const channels = notification.channel 
      ? (Array.isArray(notification.channel) ? notification.channel : [notification.channel])
      : this.determineChannels(notification.type, notification.priority);

    const notificationRecord = await prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        status: 'pending',
        channels: channels,
        metadata: notification.metadata,
      },
    });

    for (const channel of channels) {
      try {
        const provider = this.providers.get(channel);
        if (!provider) continue;

        // Get user preferences
        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { 
            email: true, 
            phone: true,
            notificationPreferences: true,
            locale: true,
          },
        });

        // Check if user has opted in for this channel
        if (!this.isChannelEnabled(user, channel, notification.type)) {
          continue;
        }

        const sent = await provider.send({
          userId: notification.userId,
          email: user?.email,
          phone: user?.phone,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          metadata: notification.metadata,
          locale: user?.locale || 'en',
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notificationRecord.id },
          data: {
            status: sent ? 'sent' : 'failed',
            [`${channel.toLowerCase()}SentAt`]: sent ? new Date() : undefined,
            [`${channel.toLowerCase()}Status`]: sent ? 'delivered' : 'failed',
          },
        });

        if (!sent) {
          this.retryQueue.push({
            ...notification,
            channel,
            retries: 0,
            notificationId: notificationRecord.id,
          });
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        this.retryQueue.push({
          ...notification,
          channel,
          retries: 0,
          notificationId: notificationRecord.id,
        });
      }
    }

    // Process retry queue
    this.processRetryQueue();
  }

  private determineChannels(type: NotificationType, priority?: string): string[] {
    // Email is the default channel (cheapest)
    // SMS only for time-sensitive critical notifications
    // Push for real-time in-app updates
    
    switch (priority) {
      case 'high':
        // Critical notifications: Email + SMS + Push
        return ['EMAIL', 'SMS', 'PUSH'];
      case 'low':
        // Non-urgent: Email only
        return ['EMAIL'];
      default:
        // Normal priority: Email + Push
        return ['EMAIL', 'PUSH'];
    }
  }

  private isChannelEnabled(user: any, channel: string, type: NotificationType): boolean {
    if (!user) return false;

    // Email is always enabled if user has email
    if (channel === 'EMAIL' && user.email) return true;

    // SMS requires phone number
    if (channel === 'SMS' && !user.phone) return false;

    // Check user notification preferences
    if (user.notificationPreferences) {
      const prefs = user.notificationPreferences as NotificationPreferences;
      
      // Check channel-specific preferences
      if (channel === 'EMAIL' && prefs.emailEnabled === false) return false;
      if (channel === 'SMS' && prefs.smsEnabled === false) return false;
      if (channel === 'PUSH' && prefs.pushEnabled === false) return false;

      // Check type-specific preferences
      const typeKey = type.toLowerCase() as keyof NotificationPreferences['types'];
      if (prefs.types?.[typeKey]?.enabled === false) return false;
    }

    return true;
  }

  private async processRetryQueue(): Promise<void> {
    const notifications = [...this.retryQueue];
    this.retryQueue = [];

    for (const notification of notifications) {
      if ((notification.retries || 0) < this.maxRetries) {
        try {
          const provider = this.providers.get(notification.channel);
          const user = await prisma.user.findUnique({
            where: { id: notification.userId },
            select: { email: true, phone: true },
          });

          const sent = await provider.send({
            userId: notification.userId,
            email: user?.email,
            phone: user?.phone,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            metadata: notification.metadata,
          });

          if (!sent) {
            this.retryQueue.push({
              ...notification,
              retries: (notification.retries || 0) + 1,
            });
          } else if (notification.notificationId) {
            await prisma.notification.update({
              where: { id: notification.notificationId },
              data: {
                status: 'sent',
                [`${notification.channel.toLowerCase()}SentAt`]: new Date(),
                [`${notification.channel.toLowerCase()}Status`]: 'delivered',
              },
            });
          }
        } catch (error) {
          this.retryQueue.push({
            ...notification,
            retries: (notification.retries || 0) + 1,
          });
        }
      } else if (notification.notificationId) {
        // Max retries reached
        await prisma.notification.update({
          where: { id: notification.notificationId },
          data: {
            status: 'failed',
            [`${notification.channel.toLowerCase()}Status`]: 'failed',
            metadata: {
              maxRetriesReached: true,
              failedAt: new Date(),
            },
          },
        });
      }
    }
  }
}

// Email Provider (Primary Channel)
class EmailProvider implements NotificationProvider {
  private transporter: Transporter;
  private fromAddress = process.env.EMAIL_FROM || 'StudyHub Malawi <noreply@studyhub.mw>';
  private fromName = 'StudyHub Malawi';

  constructor() {
    // Configure based on environment
    if (process.env.NODE_ENV === 'production') {
      // Use SendGrid in production (or SES, Mailgun, etc.)
      this.transporter = createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY!,
        },
      });
    } else {
      // Use Mailtrap or local SMTP for development
      this.transporter = createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(notification: {
    userId: string;
    email?: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: any;
    locale?: string;
  }): Promise<boolean> {
    try {
      if (!notification.email) {
        // Fetch user email if not provided
        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { email: true, fullName: true },
        });
        if (!user?.email) return false;
        notification.email = user.email;
      }

      // Get the appropriate email template based on notification type
      const EmailComponent = this.getEmailTemplate(notification.type);
      
      // Render React email component to HTML
      const emailHtml = render(
        EmailComponent({
          userName: notification.metadata?.userName || 'Student',
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          locale: notification.locale || 'en',
        })
      );

      // Send email
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: notification.email,
        subject: notification.title,
        html: emailHtml,
        headers: {
          'X-Notification-Type': notification.type,
          'X-User-ID': notification.userId,
        },
      });

      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  private getEmailTemplate(type: NotificationType): React.ComponentType<any> {
    const templateMap: Record<string, React.ComponentType<any>> = {
      PAYMENT_CONFIRMATION: PaymentConfirmationEmail,
      SUBSCRIPTION_RECEIPT: SubscriptionReceiptEmail,
      OTP_VERIFICATION: OTPVerificationEmail,
      EXAM_RESULT: ExamResultEmail,
      COURSE_ENROLLMENT: CourseEnrollmentEmail,
      CLASS_REMINDER: ClassReminderEmail,
      INSTRUCTOR_PAYOUT: InstructorPayoutEmail,
      WELCOME: WelcomeEmail,
      RENEWAL_REMINDER: RenewalReminderEmail,
      CERTIFICATE_ISSUED: CertificateIssuedEmail,
      PASSWORD_RESET: PasswordResetEmail,
      ACCOUNT_VERIFICATION: AccountVerificationEmail,
      JOB_APPLICATION: JobApplicationEmail,
      EVENT_REGISTRATION: EventRegistrationEmail,
    };

    return templateMap[type] || GenericNotificationEmail;
  }
}

// SMS Provider (Critical notifications only)
class SMSProvider implements NotificationProvider {
  private smsGateway = process.env.SMS_GATEWAY_URL;
  private apiKey = process.env.SMS_API_KEY;
  private senderId = 'StudyHub';

  async send(notification: {
    userId: string;
    phone?: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      if (!notification.phone) {
        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { phone: true },
        });
        if (!user?.phone) return false;
        notification.phone = user.phone;
      }

      // SMS should be concise - truncate if needed
      const smsMessage = notification.message.length > 160 
        ? notification.message.substring(0, 157) + '...'
        : notification.message;

      const response = await fetch(this.smsGateway, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          to: notification.phone,
          from: this.senderId,
          message: smsMessage,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }
}

// Push Notification Provider (In-app)
class PushProvider implements NotificationProvider {
  async send(notification: {
    userId: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      // Use WebSocket or Firebase Cloud Messaging
      // This would integrate with your real-time infrastructure
      
      // Example: Emit via WebSocket
      if (global.io) {
        global.io.to(`user:${notification.userId}`).emit('notification', {
          title: notification.title,
          message: notification.message,
          type: notification.metadata?.type,
          timestamp: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }
}

// Types
type NotificationType = 
  | 'PAYMENT_CONFIRMATION'
  | 'SUBSCRIPTION_RECEIPT'
  | 'OTP_VERIFICATION'
  | 'EXAM_RESULT'
  | 'COURSE_ENROLLMENT'
  | 'CLASS_REMINDER'
  | 'INSTRUCTOR_PAYOUT'
  | 'WELCOME'
  | 'RENEWAL_REMINDER'
  | 'CERTIFICATE_ISSUED'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_VERIFICATION'
  | 'JOB_APPLICATION'
  | 'EVENT_REGISTRATION'
  | 'RENEWAL_FAILED'
  | 'PAYOUT_PROCESSED';

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  types: {
    [key: string]: {
      enabled: boolean;
      channels: string[];
    };
  };
}

interface NotificationProvider {
  send(notification: {
    userId: string;
    email?: string;
    phone?: string;
    title: string;
    message: string;
    type?: string;
    metadata?: any;
    locale?: string;
  }): Promise<boolean>;
}