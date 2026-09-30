import { TransactionStatus } from '@prisma/client';
import prisma from '@/lib/utils/prisma';

const MANUAL_METHODS = ['MANUAL_PAYMENT', 'SCHOOL_INVOICE'];

export type EnrollmentState = 'not_enrolled' | 'enrolled' | 'completed' | 'payment_pending';

export interface PaymentStatusPayload {
  enrollmentStatus: EnrollmentState;
  transaction: {
    reference: string;
    status: TransactionStatus;
    paymentMethod: string;
    amount: number;
    createdAt: string;
    providerRef: string | null;
    requiresAdminReview: boolean;
    failureReason?: string;
  } | null;
  canVerify: boolean;
  message?: string;
}

export class StudentProfileNotFoundError extends Error {
  constructor() {
    super('Student profile not found');
    this.name = 'StudentProfileNotFoundError';
  }
}

/**
 * Resolves the current payment/enrollment state for a student on a course.
 * Shared by the read-only status endpoint and the direct verification endpoint.
 */
export async function buildPaymentStatusPayload(userId: string, courseId: string): Promise<PaymentStatusPayload> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new StudentProfileNotFoundError();
  }

  const [enrollment, transaction] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId },
      select: { id: true, completedAt: true },
    }),
    prisma.transaction.findFirst({
      where: { userId, courseId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  let enrollmentStatus: EnrollmentState = 'not_enrolled';
  if (enrollment) {
    enrollmentStatus = enrollment.completedAt ? 'completed' : 'enrolled';
  } else if (transaction?.status === 'PENDING') {
    enrollmentStatus = 'payment_pending';
  }

  const requiresAdminReview = transaction ? MANUAL_METHODS.includes(transaction.paymentMethod) : false;
  const metadata = (transaction?.metadata ?? null) as Record<string, any> | null;

  return {
    enrollmentStatus,
    transaction: transaction
      ? {
          reference: transaction.reference,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          amount: transaction.amount,
          createdAt: transaction.createdAt.toISOString(),
          providerRef: transaction.providerRef ?? null,
          requiresAdminReview,
          ...(metadata?.error ? { failureReason: String(metadata.error) } : {}),
          ...(metadata?.webhookFailureReason ? { failureReason: String(metadata.webhookFailureReason) } : {}),
        }
      : null,
    canVerify: transaction?.status === 'PENDING' && !requiresAdminReview && !enrollment,
  };
}

export async function findVerifiableTransaction(userId: string, courseId: string, reference?: string) {
  return prisma.transaction.findFirst({
    where: {
      userId,
      courseId,
      ...(reference ? { reference } : { status: 'PENDING' }),
    },
    orderBy: { createdAt: 'desc' },
  });
}