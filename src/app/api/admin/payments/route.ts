import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payments/payment-service';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pending = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: { not: 'BANK_TRANSFER' },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: pending,
      count: pending.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, reference } = body;

    if (!transactionId && !reference) {
      return NextResponse.json(
        { error: 'transactionId or reference is required' },
        { status: 400 }
      );
    }

    let transaction;
    if (transactionId) {
      transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
    } else if (reference) {
      transaction = await prisma.transaction.findUnique({
        where: { reference },
      });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: { status: 'COMPLETED', message: 'Payment already verified' },
      });
    }

    if (transaction.status === 'FAILED') {
      return NextResponse.json(
        { error: 'Cannot verify a failed transaction' },
        { status: 400 }
      );
    }

    const verification = await paymentService.verifyPayment(transaction.reference);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        reference: transaction.reference,
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