import { createTransport, Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import { rateLimiter } from '@/lib/notifications/channels';
import {
  PaymentConfirmationEmail,
  WelcomeEmail,
  OTPVerificationEmail,
  ExamResultEmail,
  RenewalReminderEmail,
  PasswordResetEmail,
  AccountVerificationEmail,
  GenericNotificationEmail,
} from '@/emails';

interface EmailPayload {
  to: string;
  userId: string;
  userName?: string;
  subject: string;
  type?: string;
  template?: string;
  metadata?: Record<string, any>;
  locale?: string;
}

export class EmailService {
  private transporter: Transporter;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.fromName = 'StudyHub Malawi';
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@studyhub.mw';

    // Configure transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Use SendGrid in production
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
      // Use Mailtrap for development
      this.transporter = createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525'),
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });
    }
  }

  /**
   * Send email
   */
  async send(payload: EmailPayload): Promise<boolean> {
    try {
      // Check rate limits
      const limit = rateLimiter.canSend(payload.userId, 'EMAIL', payload.type || 'general');
      if (!limit.allowed) {
        console.log(`Email rate limited for user ${payload.userId}: ${limit.reason}`);
        return false;
      }

      // Get template component
      const EmailComponent = this.getEmailTemplate(payload.template || 'generic');

      // Render email HTML
      const emailHtml = render(
        EmailComponent({
          userName: payload.userName || 'Student',
          title: payload.subject,
          message: payload.metadata?.message || '',
          metadata: payload.metadata,
          locale: payload.locale || 'en',
        })
      );

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: payload.to,
        subject: payload.subject,
        html: emailHtml,
        headers: {
          'X-Notification-Type': payload.type || 'general',
          'X-User-ID': payload.userId,
          'X-Template': payload.template || 'generic',
          'List-Unsubscribe': `<mailto:unsubscribe@studyhub.mw?subject=unsubscribe>`,
        },
        // Tracking
        list: {
          unsubscribe: {
            url: `${process.env.NEXT_PUBLIC_URL}/unsubscribe?userId=${payload.userId}`,
            comment: 'Unsubscribe from StudyHub emails',
          },
        },
      });

      // Record sent
      rateLimiter.recordSent(payload.userId, 'EMAIL', payload.type || 'general');

      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Send templated email
   */
  async sendTemplated(
    payload: EmailPayload & {
      templateData?: Record<string, any>;
    }
  ): Promise<boolean> {
    return this.send({
      ...payload,
      metadata: {
        ...payload.metadata,
        ...payload.templateData,
      },
    });
  }

  /**
   * Get email template component
   */
  private getEmailTemplate(templateName: string): React.ComponentType<any> {
    const templates: Record<string, React.ComponentType<any>> = {
      'payment-confirmation': PaymentConfirmationEmail,
      'welcome': WelcomeEmail,
      'otp-verification': OTPVerificationEmail,
      'exam-result': ExamResultEmail,
      'renewal-reminder': RenewalReminderEmail,
      'password-reset': PasswordResetEmail,
      'account-verification': AccountVerificationEmail,
    };

    return templates[templateName] || GenericNotificationEmail;
  }

  /**
   * Verify email connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection failed:', error);
      return false;
    }
  }
}