import prisma from '@/lib/utils/prisma';
import { AppError, PaymentError } from '@/lib/utils/errors';
import { NotificationService } from '@/lib/notifications/notification-service';
import { PaymentMethod } from '@/types/subscription';
import {
  PaymentRequest, 
  PaymentResult, 
  PaymentProvider,
  PaymentVerification,
  RevenueSplit 
} from './types';
import { AirtelMoneyAdapter } from './adapters/airtel-money.adapter';
import { MpambaAdapter } from './adapters/tnm-mpamba.adapter';
import { PayChanguAdapter } from './adapters/paychangu.adapter';
import { BankTransferAdapter } from './adapters/bank-transfer.adapters';
import { logger } from '@/lib/utils/logger';

export class PaymentService {
  private providers: Map<PaymentMethod, PaymentProvider> = new Map();
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeProviders();
  }

  /**
   * In development mode, payments are simulated as successful so that
   * the full payment → verification → enrollment/subscription flow
   * can be tested end-to-end without real PayChangu API calls.
   */
  private get isDevMode(): boolean {
     return process.env.NODE_ENV === 'development' && process.env.PAYMENT_SIMULATION_ENABLED !== 'false';
  }

  /**
   * Initialize payment providers
   */
  private initializeProviders() {
    // Card Payment (PayChangu handles Visa/Mastercard)
    if (process.env.PAYCHANGU_SECRET_KEY) {
      const payChangu = new PayChanguAdapter();
      this.providers.set('PAYCHANGU', payChangu);
      this.providers.set('VISA', payChangu);
      this.providers.set('MASTERCARD', payChangu);

      // Mobile money via PayChangu — register when PayChangu is configured
      this.providers.set('AIRTEL_MONEY', new AirtelMoneyAdapter());
      this.providers.set('TNM_MPAMBA', new MpambaAdapter());
    }

    // Mobile Money Providers (standalone — only if direct API keys are set)
    if (process.env.AIRTEL_API_KEY) {
      this.providers.set('AIRTEL_MONEY', new AirtelMoneyAdapter());
    }

    if (process.env.TNM_API_KEY) {
      this.providers.set('TNM_MPAMBA', new MpambaAdapter());
    }

    // Bank Transfer (always available)
    this.providers.set('BANK_TRANSFER', new BankTransferAdapter());
    this.providers.set('SCHOOL_INVOICE', new BankTransferAdapter());
  }

  /**
   * Process a payment
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const { userId, amount, method, metadata } = request;

    logger.info('Processing payment', { userId, amount, method, reference: metadata?.reference });

    // Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
      logger.error('Invalid payment amount', undefined, { userId, amount, method });
      throw new AppError('Invalid payment amount', 'INVALID_AMOUNT', 400);
    }

    // Get provider
    const provider = this.getProvider(method);

    // Generate reference
    const reference = this.generateReference();

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: 'MWK',
        paymentMethod: method,
        status: 'PENDING',
        reference,
        description: metadata?.description,
        metadata,
        ...(metadata?.instructorId && {
          instructorId: metadata.instructorId,
        }),
      },
    });

    logger.info('Transaction created', { transactionId: transaction.id, reference, method });

    try {
      // Initiate payment with provider
      const result = await provider.initiatePayment({
        userId,
        amount,
        method,
        metadata: {
          ...metadata,
          reference,
          phone: metadata?.phone,
          email: metadata?.email,
        },
      });

      logger.info('Payment initiated', { transactionId: transaction.id, reference, success: result.success, message: result.message });

      if (result.success) {
        // Update transaction with provider reference
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            providerRef: result.providerReference,
            metadata: {
              ...(transaction.metadata as any),
              providerResponse: result,
            },
          },
        });

        // In development mode, auto-verify and complete the transaction
        // so the full payment → verification → enrollment/subscription flow works end-to-end
        // without real PayChangu API calls or mobile money confirmations.
        if (this.isDevMode) {
          logger.info('Dev mode: auto-verifying payment', { transactionId: transaction.id, reference });
          const verification = await provider.verifyPayment(reference);
          if (verification.verified) {
            await this.completeTransaction(transaction.id, verification);
          }
        }
      }

      return {
        ...result,
        reference,
        transactionId: transaction.id,
      };
    } catch (error: any) {
      logger.error('Payment processing failed', error, { transactionId: transaction.id, reference, method });

      // Mark transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...(transaction.metadata as any),
            error: error.message,
          },
        },
      });

      throw new PaymentError(
        error.message || 'Payment processing failed. Please try again.',
        { providerError: error }
      );
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      logger.error('Transaction not found for verification', undefined, { reference });
      throw new AppError('Transaction not found', 'NOT_FOUND', 404);
    }

    if (transaction.status === 'COMPLETED') {
      return {
        verified: true,
        status: 'COMPLETED',
        providerReference: transaction.providerRef || undefined,
      };
    }

    const provider = this.getProvider(transaction.paymentMethod);
    logger.info('Verifying payment', { reference, method: transaction.paymentMethod });
    const verification = await provider.verifyPayment(reference);

    logger.info('Payment verification result', { reference, verified: verification.verified, status: verification.status });

    if (verification.verified) {
      await this.completeTransaction(transaction.id, verification);
    }

    return verification;
  }

  /**
   * Complete a successful transaction
   */
  private async completeTransaction(
    transactionId: string,
    verification: PaymentVerification
  ) {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId, status: { not: 'COMPLETED' } },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        providerRef: verification.providerReference,
        metadata: {
          // Important: We must fetch existing metadata first, then merge.
          // Otherwise, we overwrite the metadata set during payment initiation.
          ...((await this.getTransactionMetadata(transactionId)) as any),
          verification,
        },
      },
      include: { user: true },
    });

    if (!transaction) {
      return null; // Transaction was already completed
    }

    // Send payment confirmation
    await this.notificationService.sendPaymentConfirmation(
      transaction.userId,
      {
        amount: transaction.amount,
        planName: transaction.description || 'Purchase',
        paymentMethod: transaction.paymentMethod,
        transactionReference: transaction.reference,
      }
    );

    // Handle post-payment actions (e.g., activate subscription)
    const metadata = transaction.metadata as any;
    if (metadata?.type === 'subscription') {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: transaction.userId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'active' },
        });
        if (subscription.institutionId && metadata.tier.startsWith('INSTITUTION_')) {
          await prisma.institution.update({
            where: { id: subscription.institutionId },
            data: { tier: metadata.tier },
          });
        }
      }
    } else if (metadata?.type === 'subscription_upgrade' && metadata.subscriptionId) {
      const { subscriptionId, newTier, newCycle } = metadata;
      const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            tier: newTier,
            cycle: newCycle,
            status: 'active',
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + (newCycle === 'ANNUAL' ? 1 : 0))),
          },
        });
        if (subscription.institutionId && newTier.startsWith('INSTITUTION_')) {
          await prisma.institution.update({
            where: { id: subscription.institutionId },
            data: { tier: newTier },
          });
        }
      }
    } else if (metadata?.type === 'course_enrollment' && metadata.courseId) {
      // Create enrollment record when payment is confirmed
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: transaction.userId,
          courseId: metadata.courseId,
        },
      });

      let enrollment = null;
      if (!existingEnrollment) {
        const course = await prisma.course.findUnique({
          where: { id: metadata.courseId },
          select: { modules: { select: { id: true } }, instructorId: true },
        });

        if (course) {
          enrollment = await prisma.enrollment.create({
            data: {
              studentId: transaction.userId,
              courseId: metadata.courseId,
              totalModules: course.modules.length,
              startedAt: new Date(),
            },
          });

          await prisma.course.update({
            where: { id: metadata.courseId },
            data: { studentsCount: { increment: 1 } },
          });

          if (course.instructorId) {
            await prisma.instructor.update({
              where: { id: course.instructorId },
              data: { studentsCount: { increment: 1 } },
            });
          }

          logger.info('Enrollment created from webhook verification', { transactionId, courseId: metadata.courseId, userId: transaction.userId });
        }
      } else {
        enrollment = existingEnrollment;
        logger.info('Enrollment already exists for course enrollment payment', { transactionId, courseId: metadata.courseId });
      }

      // Link transaction to enrollment
      if (enrollment) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            courseId: metadata.courseId,
            metadata: {
              ...(transaction.metadata as any),
              enrollmentId: enrollment.id,
            },
          },
        });
      }
    }

    // Calculate revenue share if applicable
    if (transaction.instructorId) {
      await this.calculateRevenueShare(transaction);
    }

    return transaction;
  }

  /**
   * Calculate revenue share for instructor
   */
  private async calculateRevenueShare(transaction: any) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: transaction.instructorId },
    });

    if (!instructor) return;

    const revenueShare = instructor.revenueShare || 0.70;
    const instructorEarnings = Math.floor(transaction.amount * revenueShare);
    const platformFee = transaction.amount - instructorEarnings;

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        revenueSplit: revenueShare,
        platformFee,
        instructorPayout: instructorEarnings,
      },
    });

    await prisma.instructor.update({
      where: { id: instructor.id },
      data: {
        pendingEarnings: { increment: instructorEarnings },
      },
    });
  }

  /**
   * Process a refund
   */
  async processRefund(transactionId: string, amount?: number, reason?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 'NOT_FOUND', 404);
    }

    if (transaction.status !== 'COMPLETED') {
      throw new AppError('Only completed transactions can be refunded', 'INVALID_STATUS', 400);
    }

    const refundAmount = amount || transaction.amount;
    
    if (refundAmount > transaction.amount) {
      throw new AppError('Refund amount exceeds transaction amount', 'INVALID_AMOUNT', 400);
    }

    const provider = this.getProvider(transaction.paymentMethod);
    
    if (!provider.refundPayment) {
      throw new AppError('Refunds not supported for this payment method', 'UNSUPPORTED', 400);
    }

    const refund = await provider.refundPayment(transaction.providerRef!, refundAmount);

    if (refund.success) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'REFUNDED',
          refundedAmount: refundAmount,
          refundedAt: new Date(),
          metadata: {
            ...(transaction.metadata as any),
            refund: {
              amount: refundAmount,
              reason,
              refundId: refund.refundId,
              processedAt: new Date().toISOString(),
            },
          },
        },
      });

      // Notify user
      await this.notificationService.send({
        userId: transaction.userId,
        type: 'REFUND_PROCESSED',
        title: 'Refund Processed',
        message: `A refund of MWK ${refundAmount.toLocaleString()} has been processed for your transaction ${transaction.reference}.`,
        channel: ['EMAIL', 'SMS'],
        priority: 'high',
      });
    }

    return refund;
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(method: any, payload: any) {
    logger.info('Received webhook', { method, eventType: payload.event_type || payload.type, chargeId: payload.data?.charge_id || payload.data?.ref_id || payload.id });

    const provider = this.getProvider(method as any);
    await provider.handleWebhook(payload);

    // Process webhook payload
    const chargeId = payload.data?.charge_id || payload.data?.ref_id || payload.id;
    const status = payload.data?.status || payload.status;
    const eventType = payload.event_type || payload.type;

    if (!chargeId) {
      logger.warn('Webhook received with no chargeId', { method });
      return;
    }

    // Find transaction by provider reference
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { providerRef: chargeId },
          { reference: chargeId },
          { providerRef: payload.data?.trans_id },
        ],
      },
    });

    if (!transaction) {
      console.warn(`Webhook received for unknown transaction: ${chargeId}`);
      return;
    }

    const normalizedStatus = this.normalizeStatus(status);

    // Only update if status changed
    if (transaction.status !== normalizedStatus) {
      if (normalizedStatus === 'COMPLETED') {
        await this.completeTransaction(transaction.id, {
          verified: true,
          status: 'COMPLETED',
          providerReference: chargeId,
          metadata: payload,
        });
      } else if (normalizedStatus === 'FAILED') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...((transaction.metadata as any) || {}),
              webhookFailureReason: payload.data?.logs || payload.message,
            },
          },
        });
      }
    }
  }

  /**
   * Auto-verify pending payments (fallback when webhook fails)
   * Call this from a cron job or scheduled task
   */
  async verifyPendingPayments(maxAgeMinutes: number = 30) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoffTime },
        paymentMethod: { not: 'BANK_TRANSFER' },
      },
      take: 50,
    });

    const results = {
      verified: 0,
      failed: 0,
      stillPending: 0,
    };

    for (const transaction of pendingTransactions) {
      try {
        const provider = this.getProvider(transaction.paymentMethod);
        const verification = await provider.verifyPayment(transaction.reference);

        if (verification.verified && verification.status === 'COMPLETED') {
          await this.completeTransaction(transaction.id, verification);
          results.verified++;
        } else if (verification.status === 'FAILED') {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...((transaction.metadata as any) || {}),
                autoVerificationFailed: true,
                verificationError: verification.metadata,
              },
            },
          });
          results.failed++;
        } else {
          results.stillPending++;
        }
      } catch (error) {
        console.error(`Auto-verification failed for ${transaction.reference}:`, error);
        results.stillPending++;
      }
    }

    return results;
  }

  /**
   * Get pending payments that need verification
   */
  async getPendingVerifications(maxAgeMinutes: number = 30) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    return prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoffTime },
        paymentMethod: { not: 'BANK_TRANSFER' },
      },
      select: {
        id: true,
        reference: true,
        providerRef: true,
        paymentMethod: true,
        amount: true,
        createdAt: true,
        attempts: true,
      },
      take: 50,
    });
  }

  private normalizeStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' {
    const normalized = status.toLowerCase();
    if (['success', 'completed', 'paid', 'active'].includes(normalized)) {
      return 'COMPLETED';
    }
    if (['failed', 'cancelled', 'declined', 'expired'].includes(normalized)) {
      return 'FAILED';
    }
    return 'PENDING';
  }

  /**
   * Get available payment methods
   */
  getAvailableMethods(): PaymentMethod[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if payment method is available
   */
  isMethodAvailable(method: PaymentMethod): boolean {
    return this.providers.has(method);
  }

  /**
   * Get provider for payment method
   */
  private getProvider(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) {
      throw new AppError(
        `Payment method ${method} is not available`,
        'PROVIDER_UNAVAILABLE',
        400
      );
    }
    return provider;
  }

  /**
   * Generate unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SH-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get transaction metadata
   */
  private async getTransactionMetadata(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { metadata: true },
    });
    return transaction?.metadata;
  }
}

export const paymentService = new PaymentService();