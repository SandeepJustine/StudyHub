import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payments/payment-service';
import prisma from '@/lib/utils/prisma';
import { PaymentMethod, TransactionStatus } from '@prisma/client';
import { AppError, PaymentError } from '@/lib/utils/errors';

/**
 * GET /api/payments
 * Get user's payment history
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      status: searchParams.get('status') as TransactionStatus | undefined,
      method: searchParams.get('method') as PaymentMethod | undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const where: any = { userId: session.user.id };
    
    if (params.status) {
      where.status = params.status;
    }
    
    if (params.method) {
      where.paymentMethod = params.method;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          status: true,
          reference: true,
          description: true,
          createdAt: true,
          completedAt: true,
          subscription: {
            select: {
              tier: true,
              cycle: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary
    const summary = await prisma.transaction.aggregate({
      where: { userId: session.user.id, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalSpent: summary._sum.amount || 0,
        totalTransactions: summary._count,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Initiate a new payment
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, method, metadata, savePaymentMethod } = body;

    // Validate required fields
    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive integer (MWK)' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = paymentService.getAvailableMethods();
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        {
          error: 'Invalid payment method',
          availableMethods: validMethods,
        },
        { status: 400 }
      );
    }

    // Validate amount limits
    const limits: Record<string, { min: number; max: number }> = {
      AIRTEL_MONEY: { min: 100, max: 500000 },
      TNM_MPAMBA: { min: 100, max: 500000 },
      PAYCHANGU: { min: 1000, max: 5000000 },
      VISA: { min: 1000, max: 5000000 },
      MASTERCARD: { min: 1000, max: 5000000 },
      BANK_TRANSFER: { min: 5000, max: 10000000 },
      SCHOOL_INVOICE: { min: 50000, max: 10000000 },
    };

    const limit = limits[method];
    if (limit && (amount < limit.min || amount > limit.max)) {
      return NextResponse.json(
        {
          error: `Amount must be between MWK ${limit.min.toLocaleString()} and MWK ${limit.max.toLocaleString()} for ${method}`,
        },
        { status: 400 }
      );
    }

    // Process payment
    const result = await paymentService.processPayment({
      userId: session.user.id,
      amount,
      method: method as PaymentMethod,
      metadata: {
        ...metadata,
        name: session.user.name,
        email: session.user.email,
        phone: (session.user as any).phone,
        savePaymentMethod,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Payment failed' },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        reference: result.reference,
        redirectUrl: result.redirectUrl,
        message: result.message,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Payment initiation error:', error);

    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/methods
 * Get available payment methods
 */
export async function HEAD(req: Request) {
  try {
    const methods = paymentService.getAvailableMethods();
    
    const methodDetails = methods.map(method => ({
      id: method,
      name: method.replace(/_/g, ' '),
      type: ['AIRTEL_MONEY', 'TNM_MPAMBA'].includes(method) ? 'mobile_money' :
            ['VISA', 'MASTERCARD', 'PAYCHANGU'].includes(method) ? 'card' :
            'bank_transfer',
      icon: `/icons/payment/${method.toLowerCase()}.svg`,
      enabled: true,
      limits: {
        min: method === 'BANK_TRANSFER' ? 5000 : 100,
        max: method === 'BANK_TRANSFER' ? 10000000 : 500000,
      },
    }));

    return NextResponse.json({
      success: true,
      data: methodDetails,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}