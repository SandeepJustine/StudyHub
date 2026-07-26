import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentMethod } from '@/types/subscription';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-webhook-signature');

    // Verify webhook signature (implementation depends on provider)
    // This is a simplified example
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Determine payment method from webhook payload
    const paymentMethod = determinePaymentMethod(body);

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Unknown payment method' }, { status: 400 });
    }

    // Process webhook
    await paymentService.handleWebhook(paymentMethod, body);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(payload: any, signature: string | null): boolean {
  // In production, verify using provider's signing secret
  if (process.env.NODE_ENV === 'development') return true;
  
  if (!signature) return false;
  
  // Example for PayChangu
  const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!secret) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

function determinePaymentMethod(payload: any): PaymentMethod | null {
  // Logic to determine which provider sent the webhook
  if (payload.provider === 'airtel') return 'AIRTEL_MONEY';
  if (payload.provider === 'tnm') return 'TNM_MPAMBA';
  if (payload.provider === 'paychangu') return 'PAYCHANGU';
  
  return null;
}