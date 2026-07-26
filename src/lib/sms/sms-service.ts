import { rateLimiter } from '@/lib/notifications/channels';

interface SMSPayload {
  to: string;
  userId: string;
  message: string;
  type?: string;
  priority?: string;
  senderId?: string;
}

export class SMSService {
  private gateway: string;
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.gateway = process.env.SMS_GATEWAY_URL || '';
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'StudyHub';
  }

  /**
   * Send SMS
   */
  async send(payload: SMSPayload): Promise<boolean> {
    try {
      // Check rate limits
      const limit = rateLimiter.canSend(payload.userId, 'SMS', payload.type || 'general');
      if (!limit.allowed) {
        console.log(`SMS rate limited for user ${payload.userId}: ${limit.reason}`);
        return false;
      }

      // Format phone number to international format
      const phone = this.formatPhoneNumber(payload.to);
      if (!phone) {
        console.error('Invalid phone number:', payload.to);
        return false;
      }

      // Truncate message if too long (160 chars for single SMS)
      const message = payload.message.length > 160
        ? payload.message.substring(0, 157) + '...'
        : payload.message;

      // Send via SMS gateway (Africa's Talking, Twilio, etc.)
      const response = await this.sendViaGateway(phone, message, payload.senderId);

      if (response.success) {
        rateLimiter.recordSent(payload.userId, 'SMS', payload.type || 'general');
        return true;
      }

      return false;
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(
    recipients: Array<{ to: string; userId: string }>,
    message: string,
    type?: string
  ): Promise<{ successful: number; failed: number }> {
    const results = { successful: 0, failed: 0 };

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient =>
        this.send({
          to: recipient.to,
          userId: recipient.userId,
          message,
          type,
        }).then(success => {
          if (success) results.successful++;
          else results.failed++;
        })
      );

      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, userId: string, otp: string): Promise<boolean> {
    return this.send({
      to: phone,
      userId,
      message: `Your StudyHub verification code is: ${otp}. Valid for 10 minutes.`,
      type: 'OTP_VERIFICATION',
      priority: 'urgent',
    });
  }

  /**
   * Send payment confirmation via SMS
   */
  async sendPaymentConfirmation(
    phone: string,
    userId: string,
    amount: number,
    reference: string
  ): Promise<boolean> {
    return this.send({
      to: phone,
      userId,
      message: `Payment of MWK ${amount.toLocaleString()} confirmed. Ref: ${reference}. Thank you for using StudyHub!`,
      type: 'PAYMENT_CONFIRMATION',
      priority: 'high',
    });
  }

  /**
   * Send via SMS gateway API
   */
  private async sendViaGateway(
    phone: string,
    message: string,
    senderId?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // In production, integrate with Africa's Talking, Twilio, or local provider
      const response = await fetch(this.gateway, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          from: senderId || this.senderId,
          message,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        messageId: data.messageId,
      };
    } catch (error) {
      console.error('SMS gateway error:', error);
      return { success: false };
    }
  }

  /**
   * Format phone number to Malawi international format
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // If starts with 0, convert to +265
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `+265${cleaned.slice(1)}`;
    }

    // If already starts with 265, add +
    if (cleaned.length === 12 && cleaned.startsWith('265')) {
      return `+${cleaned}`;
    }

    // If already in international format
    if (cleaned.length === 13 && cleaned.startsWith('265')) {
      return `+${cleaned}`;
    }

    return null;
  }

  /**
   * Check SMS delivery status
   */
  async checkDeliveryStatus(messageId: string): Promise<{
    delivered: boolean;
    status: string;
    timestamp?: Date;
  }> {
    try {
      const response = await fetch(`${this.gateway}/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();

      return {
        delivered: data.status === 'delivered',
        status: data.status,
        timestamp: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to check SMS status:', error);
      return { delivered: false, status: 'unknown' };
    }
  }
}

export const smsService = new SMSService();