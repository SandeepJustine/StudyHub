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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'pending' | 'manual'

    let whereClause: any = {
      status: 'PENDING',
    };

    if (type === 'manual') {
      whereClause.paymentMethod = 'MANUAL_PAYMENT';
    } else if (type === 'auto') {
      whereClause.paymentMethod = { not: 'MANUAL_PAYMENT' };
    }

    const pending = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
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
    const { transactionId, reference, action } = body; // action: 'verify' | 'reject'

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
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          course: { select: { id: true, title: true, instructorId: true } },
        },
      });
    } else if (reference) {
      transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          course: { select: { id: true, title: true, instructorId: true } },
        },
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

    if (action === 'reject') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });

      // Notify user
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.send({
        userId: transaction.userId,
        type: 'SYSTEM_ALERT',
        title: 'Payment Rejected',
        message: `Your manual payment for ${transaction.course?.title} was rejected. Please check the proof and try again.`,
        channel: ['EMAIL', 'PUSH'],
        priority: 'high',
      });

      return NextResponse.json({
        success: true,
        data: { status: 'FAILED', message: 'Payment rejected' },
      });
    }

    // For manual payments, verify directly
    if (transaction.paymentMethod === 'MANUAL_PAYMENT') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Create enrollment
      const student = await prisma.student.findUnique({
        where: { userId: transaction.userId },
        select: { id: true },
      });

      if (student && transaction.courseId) {
        const existing = await prisma.enrollment.findFirst({
          where: { studentId: student.id, courseId: transaction.courseId },
        });

        if (!existing) {
          const course = await prisma.course.findUnique({
            where: { id: transaction.courseId },
            select: { modules: true, instructorId: true },
          });

          if (course) {
            await prisma.enrollment.create({
              data: {
                studentId: student.id,
                courseId: transaction.courseId,
                totalModules: course.modules.length,
                startedAt: new Date(),
              },
            });

            await prisma.course.update({
              where: { id: transaction.courseId },
              data: { studentsCount: { increment: 1 } },
            });

            await prisma.instructor.update({
              where: { id: course.instructorId },
              data: { studentsCount: { increment: 1 } },
            });
          }
        }
      }

      // Notify user
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.send({
        userId: transaction.userId,
        type: 'PAYMENT_CONFIRMATION',
        title: 'Payment Verified - Enrollment Confirmed',
        message: `Your manual payment for ${transaction.course?.title} has been verified. You are now enrolled!`,
        channel: ['EMAIL', 'PUSH'],
        priority: 'high',
      });

      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.id,
          reference: transaction.reference,
          status: 'COMPLETED',
          verified: true,
        },
      });
    }

    // For auto payments (mobile money, card), use payment service verification
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