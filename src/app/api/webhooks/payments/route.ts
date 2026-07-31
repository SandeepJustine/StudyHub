import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';
import prisma from '@/lib/utils/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-paychangu-signature') || 
                     req.headers.get('x-webhook-signature') ||
                     req.headers.get('signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process webhook
    const result = await paymentService.handleWebhook('PAYCHANGU', body);

    // Log the webhook
    await prisma.activityLog.create({
      data: {
        userId: 'system',
        action: 'PAYMENT_WEBHOOK',
        resource: 'payment',
        resourceId: body.data?.charge_id || body.data?.ref_id || body.id,
        metadata: { 
          provider: 'PAYCHANGU',
          eventType: body.event_type || body.type,
          status: body.data?.status || body.status,
          payload: body,
        },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ received: true, processed: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// PayChangu may verify the endpoint with a GET request
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ status: 'ok' });
}

function verifyWebhookSignature(payload: any, signature: string | null): boolean {
  // In development, skip verification
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
