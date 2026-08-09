import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { paymentService } from '@/lib/payments/payment-service';
import { NotFoundError, AppError } from '@/lib/utils/errors';

/**
 * GET /api/payments/[transactionId]
 * Get transaction details
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        subscription: {
          select: {
            tier: true,
            cycle: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        course: {
          select: {
            title: true,
            subject: true,
          },
        },
        invoice: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    // Verify ownership or admin
    if (transaction.userId !== session.user.id && session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/[transactionId]/verify
 * Verify a pending payment
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: { status: 'COMPLETED', message: 'Payment already verified' },
      });
    }

    // Verify with payment provider
    const verification = await paymentService.verifyPayment(transaction.reference);

    return NextResponse.json({
      success: true,
      data: {
        status: verification.status,
        verified: verification.verified,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/[transactionId]/refund
 * Request a refund
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, reason } = await req.json();

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    // Only admin or transaction owner can request refund
    if (transaction.userId !== session.user.id && session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if refund is possible
    if (transaction.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed transactions can be refunded' },
        { status: 400 }
      );
    }

    if (transaction.refundedAmount && transaction.refundedAmount >= transaction.amount) {
      return NextResponse.json(
        { error: 'Transaction already fully refunded' },
        { status: 400 }
      );
    }

    // Check refund window (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (transaction.completedAt && transaction.completedAt < thirtyDaysAgo) {
      return NextResponse.json(
        { error: 'Refund window of 30 days has expired' },
        { status: 400 }
      );
    }

    // Process refund
    const refundAmount = amount || (transaction.refundedAmount ? transaction.amount - transaction.refundedAmount : transaction.amount);
    const result = await paymentService.processRefund(
      transactionId,
      refundAmount,
      reason
    );

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Refund failed' },
      { status: 500 }
    );
  }
}