import { PaymentMethod, PaymentStatus, PaymentTransaction } from '@/types/payment';
import { AirtelMoneyAdapter } from '@/lib/payments/adapters/airtel-money.adapter';
import { TNMMpambaAdapter } from '@/lib/payments/adapters/tnm-mpamba.adapter';
import { PayChanguAdapter } from '@/lib/payments/adapters/paychangu.adapter';
import { BankTransferAdapter } from '@/lib/payments/adapters/bank-transfer.adapters';
import { prisma } from '@/lib/prisma';

export class PaymentService {
  private static adapters = {
    [PaymentMethod.AIRTEL_MONEY]: new AirtelMoneyAdapter(),
    [PaymentMethod.TNM_MPAMBA]: new TNMMpambaAdapter(),
    [PaymentMethod.PAYCHANGU]: new PayChanguAdapter(),
    [PaymentMethod.BANK_TRANSFER]: new BankTransferAdapter(),
    [PaymentMethod.CREDIT_CARD]: new PayChanguAdapter(), // Using PayChangu for card payments
  };

  static async initiatePayment(
    userId: string,
    amount: number,
    method: PaymentMethod,
    description: string,
    metadata?: Record<string, any>
  ): Promise<PaymentTransaction> {
    const adapter = this.adapters[method];
    if (!adapter) {
      throw new Error(`Unsupported payment method: ${method}`);
    }

    // Create payment transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        amount,
        method,
        status: PaymentStatus.PENDING,
        description,
        metadata: metadata || {},
      },
    });

    try {
      // Initiate payment with the adapter
      const paymentResult = await adapter.initiatePayment({
        amount,
        userId,
        transactionId: transaction.id,
        description,
        metadata: metadata || {},
      });

      // Update transaction with payment result
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          externalTransactionId: paymentResult.transactionId,
          status: paymentResult.status,
          metadata: {
            ...transaction.metadata,
            paymentResult: paymentResult.metadata,
          },
        },
      });

      return {
        ...transaction,
        externalTransactionId: paymentResult.transactionId,
        status: paymentResult.status,
        metadata: {
          ...transaction.metadata,
          paymentResult: paymentResult.metadata,
        },
      };
    } catch (error) {
      // Update transaction with error status
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...transaction.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });

      throw error;
    }
  }

  static async verifyPayment(transactionId: string): Promise<PaymentTransaction> {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const adapter = this.adapters[transaction.method];
    if (!adapter) {
      throw new Error(`Unsupported payment method: ${transaction.method}`);
    }

    try {
      // Verify payment with the adapter
      const verificationResult = await adapter.verifyPayment(
        transaction.externalTransactionId || ''
      );

      // Update transaction with verification result
      const updatedTransaction = await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: verificationResult.status,
          metadata: {
            ...transaction.metadata,
            verificationResult: verificationResult.metadata,
          },
        },
      });

      // If payment is successful, trigger any necessary actions
      if (verificationResult.status === PaymentStatus.COMPLETED) {
        await this.handleSuccessfulPayment(updatedTransaction);
      }

      return updatedTransaction;
    } catch (error) {
      throw error;
    }
  }

  static async handleSuccessfulPayment(transaction: PaymentTransaction): Promise<void> {
    // Handle successful payment based on transaction type
    // This could include:
    // - Activating a subscription
    // - Enrolling in a course
    // - Processing a marketplace purchase
    // etc.

    // For now, we'll just log the successful payment
    console.log(`Payment successful: ${transaction.id}`);
  }

  static async getTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
    return prisma.paymentTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
