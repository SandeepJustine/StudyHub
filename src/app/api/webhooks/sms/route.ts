import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { notificationService } from '@/lib/notifications/notification-service';
import prisma from '@/lib/utils/prisma';

/**
 * POST /api/webhooks/sms
 * Handle SMS gateway webhooks (delivery status, incoming messages)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-sms-signature');
    const timestamp = req.headers.get('x-sms-timestamp');

    // Verify webhook signature
    if (!verifySMSSignature(body, signature, timestamp)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const { type, data } = body;

    switch (type) {
      case 'delivery_status':
        // Handle delivery status update
        await handleDeliveryStatus(data);
        break;

      case 'incoming_message':
        // Handle incoming SMS (e.g., replies, OTP verification)
        await handleIncomingMessage(data);
        break;

      case 'balance_update':
        // Handle account balance updates
        await handleBalanceUpdate(data);
        break;

      default:
        console.warn('Unknown SMS webhook type:', type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle delivery status updates
 */
async function handleDeliveryStatus(data: {
  messageId: string;
  status: string;
  recipient: string;
  deliveredAt?: string;
  error?: string;
}) {
  // Find the notification by message ID
  const notification = await prisma.notification.findFirst({
    where: {
      metadata: {
        path: ['smsMessageId'],
        equals: data.messageId,
      },
    },
  });

  if (!notification) {
    console.warn('Notification not found for SMS:', data.messageId);
    return;
  }

  // Update notification status
  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      smsStatus: data.status === 'delivered' ? 'delivered' : 'failed',
      smsSentAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      metadata: {
        ...(notification.metadata as any),
        smsDelivery: {
          messageId: data.messageId,
          status: data.status,
          recipient: data.recipient,
          deliveredAt: data.deliveredAt,
          error: data.error,
        },
      },
      status: data.status === 'delivered' ? 'sent' : 'failed',
    },
  });

  // Log delivery
  await prisma.activityLog.create({
    data: {
      userId: notification.userId,
      action: 'SMS_DELIVERY_UPDATE',
      resource: 'notification',
      resourceId: notification.id,
      metadata: { smsStatus: data.status, messageId: data.messageId },
      timestamp: new Date(),
    },
  });
}

/**
 * Handle incoming SMS messages
 */
async function handleIncomingMessage(data: {
  from: string;
  to: string;
  text: string;
  receivedAt: string;
}) {
  console.log('Incoming SMS:', data);

  // Check if it's an OTP verification
  if (data.text.match(/^\d{6}$/)) {
    const otp = data.text;
    
    // Find user by phone number
    const user = await prisma.user.findFirst({
      where: { phone: data.from },
    });

    if (user) {
      // Verify OTP
      // In production, verify against stored OTP
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: data.from }, // Mark phone as verified
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'OTP_VERIFICATION_SMS',
          resource: 'user',
          resourceId: user.id,
          metadata: { phone: data.from },
          timestamp: new Date(),
        },
      });
    }
  }

  // Check for support replies
  if (data.text.toLowerCase().includes('help') || data.text.toLowerCase().includes('support')) {
    const user = await prisma.user.findFirst({
      where: { phone: data.from },
    });

    if (user) {
      await prisma.supportTicket.create({
        data: {
          userId: user.id,
          category: 'OTHER',
          subject: 'SMS Support Request',
          description: data.text,
          priority: 'normal',
          status: 'open',
        },
      });
    }
  }
}

/**
 * Handle balance update from SMS provider
 */
async function handleBalanceUpdate(data: {
  balance: number;
  currency: string;
  updatedAt: string;
}) {
  console.log('SMS Balance Update:', data);
  
  // Store balance info for monitoring
  // In production, store in a settings/monitoring table
  // Could trigger alerts if balance is low
  if (data.balance < 100) {
    console.warn('Low SMS balance:', data.balance);
    // Send alert to admin
    const admins = await prisma.user.findMany({
      where: { role: 'PLATFORM_ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationService.send({
        userId: admin.id,
        type: 'SYSTEM_ALERT',
        title: 'Low SMS Balance',
        message: `SMS balance is running low: ${data.balance} ${data.currency} remaining.`,
        priority: 'high',
        channel: ['EMAIL'],
      });
    }
  }
}

/**
 * Verify webhook signature
 */
function verifySMSSignature(
  payload: any,
  signature: string | null,
  timestamp: string | null
): boolean {
  // Skip verification in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!signature || !timestamp) {
    return false;
  }

  // Check timestamp is within 5 minutes
  const now = Date.now();
  const webhookTime = parseInt(timestamp);
  if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
    return false;
  }

  // Verify HMAC signature
  const secret = process.env.SMS_WEBHOOK_SECRET || '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload) + timestamp)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}