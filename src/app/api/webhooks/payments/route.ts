import { NextResponse } from 'next/server';

/**
 * NOTE: This route is a duplicate of /api/payments/webhook/route.ts
 * 
 * The payment webhook logic is already fully implemented there.
 * This file exists as a backup/alternative endpoint for payment providers
 * that may need a different URL structure.
 * 
 * For now, it redirects to the main payment webhook handler.
 */

export async function POST(req: Request) {
  // Forward to main payment webhook handler
  const { handlePaymentWebhook } = await import('@/lib/payments/webhook-handler');
  
  try {
    const body = await req.json();
    const signature = req.headers.get('x-paychangu-signature') || 
                     req.headers.get('x-webhook-signature');
    
    const result = await handlePaymentWebhook(body, signature);
    
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error('Payment webhook (alt) error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Also support GET for provider verification
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');
  
  // Some providers verify the endpoint with a GET request
  if (challenge) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ status: 'ok' });
}