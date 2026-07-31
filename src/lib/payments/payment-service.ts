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
import { TNMMpambaAdapter } from './adapters/tnm-mpamba.adapter';
import { PayChanguAdapter } from './adapters/paychangu.adapter';
import { BankTransferAdapter } from './adapters/bank-transfer.adapters';

export class PaymentService {
  private providers: Map<PaymentMethod, PaymentProvider> = new Map();
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeProviders();
  }

  /**
   * Initialize payment providers
   */
  private initializeProviders() {
    // Mobile Money Providers
    if (process.env.AIRTEL_API_KEY) {
      this.providers.set('AIRTEL_MONEY', new AirtelMoneyAdapter());
    }
    
    if (process.env.TNM_API_KEY) {
      this.providers.set('TNM_MPAMBA', new TNMMpambaAdapter());
    }

    // Card Payment (PayChangu handles Visa/Mastercard)
    if (process.env.PAYCHANGU_SECRET_KEY) {
      const payChangu = new PayChanguAdapter();
      this.providers.set('PAYCHANGU', payChangu);
      this.providers.set('VISA', payChangu);
      this.providers.set('MASTERCARD', payChangu);
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

    // Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
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

        // For instant payments (mobile money), verify immediately
        if (['AIRTEL_MONEY', 'TNM_MPAMBA'].includes(method)) {
          // Verification will happen via webhook or polling
          // For now, mark as pending verification
        }
      }

      return {
        ...result,
        reference,
        transactionId: transaction.id,
      };
    } catch (error) {
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
        error.message || 'Payment processing failed',
        error
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
    const verification = await provider.verifyPayment(reference);

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
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        providerRef: verification.providerReference,
        metadata: {
          ...((await this.getTransactionMetadata(transactionId)) as any),
          verification,
        },
      },
      include: { user: true },
    });

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
    const provider = this.getProvider(method as any);
    await provider.handleWebhook(payload);

    // Process webhook payload
    const chargeId = payload.data?.charge_id || payload.data?.ref_id || payload.id;
    const status = payload.data?.status || payload.status;
    const eventType = payload.event_type || payload.type;

    if (!chargeId) {
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