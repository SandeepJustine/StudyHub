import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { paymentService } from '@/lib/payments/payment-service';
import {
  buildPaymentStatusPayload,
  findVerifiableTransaction,
  StudentProfileNotFoundError,
} from '@/lib/courses/payment-status';

export const dynamic = 'force-dynamic';

const MANUAL_METHODS = ['MANUAL_PAYMENT', 'SCHOOL_INVOICE'];
const MAX_ATTEMPTS = 20;
const MIN_SECONDS_BETWEEN_ATTEMPTS = 10;

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await req.json().catch(() => ({}) as { reference?: string });

    const transaction = await findVerifiableTransaction(session.user.id, courseId, body?.reference);

    if (!transaction) {
      const payload = await buildPaymentStatusPayload(session.user.id, courseId);
      return NextResponse.json(
        { ...payload, message: 'No payment is awaiting verification for this course.' },
        { status: 404 }
      );
    }

    const buildResponse = async (message?: string) =>
      NextResponse.json(
        { ...(await buildPaymentStatusPayload(session.user.id, courseId)), message },
        { status: 200 }
      );

    if (transaction.status === 'COMPLETED') {
      return buildResponse('This payment has already been confirmed.');
    }

    // Manual/bank transfers are settled by an admin, never by a provider lookup.
    if (MANUAL_METHODS.includes(transaction.paymentMethod)) {
      return buildResponse(
        'Your receipt is with our team. Bank transfers are confirmed by an admin within 1-2 business days.'
      );
    }

    if (transaction.attempts >= MAX_ATTEMPTS) {
      return buildResponse('We have checked this payment many times already. Please contact support.');
    }

    const metadata = (transaction.metadata ?? {}) as Record<string, any>;
    const lastAttemptAt = metadata.lastVerifiedAt ? new Date(metadata.lastVerifiedAt).getTime() : 0;
    const secondsSinceLastAttempt = (Date.now() - lastAttemptAt) / 1000;

    if (transaction.attempts > 0 && secondsSinceLastAttempt < MIN_SECONDS_BETWEEN_ATTEMPTS) {
      const wait = Math.ceil(MIN_SECONDS_BETWEEN_ATTEMPTS - secondsSinceLastAttempt);
      return buildResponse(`Please wait ${wait}s before checking again.`);
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        attempts: { increment: 1 },
        metadata: {
          ...metadata,
          lastVerifiedAt: new Date().toISOString(),
        },
      },
    });

    const verification = await paymentService.verifyPayment(transaction.reference);

    if (verification.verified && verification.status === 'COMPLETED') {
      return buildResponse('Payment confirmed. Your enrolment has been activated.');
    }

    if (verification.status === 'FAILED') {
      return buildResponse(
        verification.metadata?.reason
          ? `Payment failed: ${verification.metadata.reason}`
          : 'Payment was declined or could not be completed. Please try again.'
      );
    }

    return buildResponse(
      'We have not received confirmation yet. Make sure you approved the payment prompt on your phone, then check again.'
    );
  } catch (error: any) {
    if (error instanceof StudentProfileNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const statusCode = error?.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: statusCode }
    );
  }
}