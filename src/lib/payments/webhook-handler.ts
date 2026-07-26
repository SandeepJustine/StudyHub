import { paymentService } from '@/lib/payments/payment-service';
import prisma from '@/lib/utils/prisma';

export async function handlePaymentWebhook(payload: any, signature: string | null) {
  // Determine provider from payload
  const provider = determineProvider(payload);
  
  if (!provider) {
    throw new Error('Unknown payment provider');
  }

  // Process webhook through payment service
  await paymentService.handleWebhook(provider, payload);

  // Log the webhook
  await prisma.activityLog.create({
    data: {
      userId: 'system',
      action: 'PAYMENT_WEBHOOK',
      resource: 'payment',
      resourceId: payload.reference || payload.transactionId,
      metadata: { provider, payload },
      timestamp: new Date(),
    },
  });

  return { provider, processed: true };
}

function determineProvider(payload: any): string | null {
  // Airtel Money
  if (payload.transaction?.id || payload.data?.transaction) {
    return 'AIRTEL_MONEY';
  }
  
  // TNM Mpamba
  if (payload.reference && payload.status && !payload.event) {
    return 'TNM_MPAMBA';
  }
  
  // PayChangu
  if (payload.event === 'charge.completed' || payload.data?.checkout_url) {
    return 'PAYCHANGU';
  }
  
  return null;
}