import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { PaymentMethod } from '@prisma/client';
import { PayChanguAdapter } from './adapters/paychangu.adapter';

const payChangu = new PayChanguAdapter();

export class PayoutService {
  /**
   * Calculate earnings for a period
   */
  async calculateEarnings(period?: string, instructorId?: string) {
    // If no period specified, use previous month
    if (!period) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth()).padStart(2, '0'); // Previous month
      period = `${year}-${month}`;
    }

    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Get completed transactions for the period
    const where: any = {
      status: 'COMPLETED',
      instructorId: { not: null },
      instructorPayout: { not: null },
      completedAt: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (instructorId) {
      where.instructorId = instructorId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        instructor: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        course: { select: { title: true } },
      },
    });

    // Group by instructor
    const earningsByInstructor: Record<string, {
      instructorId: string;
      instructorName: string;
      instructorEmail: string;
      revenueShare: number;
      totalRevenue: number;
      platformFees: number;
      instructorEarnings: number;
      transactionCount: number;
      transactions: any[];
    }> = {};

    for (const txn of transactions) {
      const key = txn.instructorId!;
      
      if (!earningsByInstructor[key]) {
        earningsByInstructor[key] = {
          instructorId: txn.instructorId!,
          instructorName: txn.instructor?.user.fullName || 'Unknown',
          instructorEmail: txn.instructor?.user.email || '',
          revenueShare: txn.instructor?.revenueShare || 0.7,
          totalRevenue: 0,
          platformFees: 0,
          instructorEarnings: 0,
          transactionCount: 0,
          transactions: [],
        };
      }

      earningsByInstructor[key].totalRevenue += txn.amount;
      earningsByInstructor[key].platformFees += txn.platformFee || 0;
      earningsByInstructor[key].instructorEarnings += txn.instructorPayout || 0;
      earningsByInstructor[key].transactionCount++;
      earningsByInstructor[key].transactions.push({
        id: txn.id,
        amount: txn.amount,
        courseName: txn.course?.title,
        platformFee: txn.platformFee,
        instructorPayout: txn.instructorPayout,
        date: txn.completedAt,
      });
    }

    // Create payout records for each instructor
    const payouts = [];
    
    for (const [instructorId, earnings] of Object.entries(earningsByInstructor)) {
      if (earnings.instructorEarnings > 0) {
        // Check if payout already exists for this period
        const existingPayout = await prisma.payout.findFirst({
          where: {
            instructorId,
            period,
          },
        });

        if (!existingPayout) {
          const payout = await prisma.payout.create({
            data: {
              instructorId,
              amount: earnings.instructorEarnings,
              period,
              status: 'pending',
              metadata: {
                transactionCount: earnings.transactionCount,
                totalRevenue: earnings.totalRevenue,
                platformFees: earnings.platformFees,
                calculatedAt: new Date().toISOString(),
              },
            },
          });

          // Update instructor pending earnings
          await prisma.instructor.update({
            where: { id: instructorId },
            data: {
              pendingEarnings: { increment: earnings.instructorEarnings },
            },
          });

          payouts.push(payout);
        }
      }
    }

    return {
      period,
      calculatedAt: new Date(),
      instructorsCount: Object.keys(earningsByInstructor).length,
      totalEarnings: Object.values(earningsByInstructor).reduce((sum, e) => sum + e.instructorEarnings, 0),
      payoutsCreated: payouts.length,
      earnings: Object.values(earningsByInstructor),
    };
  }

  /**
   * Process a single payout
   */
  async processPayout(payoutId: string, method?: string, accountDetails?: any) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        instructor: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!payout) throw new NotFoundError('Payout');
    
    if (payout.status !== 'pending') {
      throw new AppError(`Cannot process payout with status: ${payout.status}`, 'INVALID_STATUS', 400);
    }

    // Check minimum payout threshold
    const minPayout = 10000; // MWK 10,000
    if (payout.amount < minPayout) {
      throw new AppError(
        `Payout amount (MWK ${payout.amount.toLocaleString()}) is below minimum (MWK ${minPayout.toLocaleString()})`,
        'BELOW_MINIMUM',
        400
      );
    }

    // Determine payment method
    const paymentMethod = method || 
      (payout.instructor?.bankDetails as any)?.preferredMethod || 
      'AIRTEL_MONEY';

    const chargeId = `PO-${payout.id}-${Date.now()}`.toUpperCase();
    let payoutResult: { success: boolean; message?: string; providerReference?: string; transactionId?: string } = { success: false };

    // Initiate payout via PayChangu
    if (paymentMethod === 'AIRTEL_MONEY' || paymentMethod === 'TNM_MPAMBA') {
      let operatorRefId = accountDetails?.operatorRefId || '';
      const mobile = accountDetails?.phone || payout.instructor?.user?.phone || '';

      if (!operatorRefId) {
        operatorRefId = await payChangu.resolveOperatorRefId(paymentMethod);
      }

      if (!mobile) {
        throw new AppError('Mobile money payout requires a phone number', 'MISSING_DETAILS', 400);
      }

      payoutResult = await payChangu.initiateMobileMoneyPayout({
        mobile,
        operatorRefId,
        amount: payout.amount.toString(),
        chargeId,
        email: payout.instructor?.user?.email,
        firstName: payout.instructor?.user?.fullName?.split(' ')[0],
        lastName: payout.instructor?.user?.fullName?.split(' ').slice(1).join(' ') || '',
      });
    } else if (paymentMethod === 'BANK_TRANSFER') {
      const bankUuid = accountDetails?.bankUuid || '';
      const bankAccountName = accountDetails?.bankAccountName || payout.instructor?.user?.fullName || '';
      const bankAccountNumber = accountDetails?.bankAccountNumber || '';
      
      if (!bankUuid || !bankAccountName || !bankAccountNumber) {
        throw new AppError('Bank payout requires bank UUID, account name, and account number', 'MISSING_DETAILS', 400);
      }

      payoutResult = await payChangu.initiateBankPayout({
        bankUuid,
        amount: payout.amount.toString(),
        chargeId,
        bankAccountName,
        bankAccountNumber,
        email: payout.instructor?.user?.email,
        firstName: payout.instructor?.user?.fullName?.split(' ')[0],
        lastName: payout.instructor?.user?.fullName?.split(' ').slice(1).join(' ') || '',
      });
    } else {
      throw new AppError(`Unsupported payout method: ${paymentMethod}`, 'UNSUPPORTED_METHOD', 400);
    }

    if (!payoutResult.success) {
      throw new AppError(payoutResult.message || 'Payout initialization failed', 'PAYOUT_FAILED', 400);
    }

    // Update payout status
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'processing',
        paymentMethod,
        reference: payoutResult.providerReference || chargeId,
        metadata: {
          ...(payout.metadata as any),
          processingStartedAt: new Date().toISOString(),
          method: paymentMethod,
          chargeId,
          providerTransactionId: payoutResult.transactionId,
          accountDetails: accountDetails ? {
            phone: accountDetails.phone?.slice(-4),
            bank: accountDetails.bank,
            operatorRefId: accountDetails.operatorRefId,
          } : undefined,
        },
      },
    });

    return {
      payout: updatedPayout,
      message: 'Payout processing initiated via PayChangu',
      estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      providerReference: payoutResult.providerReference,
    };
  }

  /**
   * Process multiple payouts in bulk
   */
  async bulkProcessPayouts(payoutIds: string[], method?: string) {
    if (payoutIds.length > 50) {
      throw new AppError('Cannot process more than 50 payouts at once', 'BATCH_TOO_LARGE', 400);
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const payoutId of payoutIds) {
      try {
        await this.processPayout(payoutId, method);
        results.successful.push(payoutId);
      } catch (error: any) {
        results.failed.push({ id: payoutId, reason: error.message });
      }
    }

    return {
      ...results,
      total: payoutIds.length,
      successRate: (results.successful.length / payoutIds.length) * 100,
    };
  }

  /**
   * Mark payout as paid manually (offline payment)
   */
  async markAsPaid(payoutId: string, reference?: string, notes?: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) throw new NotFoundError('Payout');

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        reference: reference || `MANUAL-${Date.now()}`,
        processedAt: new Date(),
        metadata: {
          ...(payout.metadata as any),
          notes,
          markedPaidAt: new Date().toISOString(),
          paymentType: 'manual',
        },
      },
    });

    // Update instructor earnings
    await prisma.instructor.update({
      where: { id: payout.instructorId },
      data: {
        pendingEarnings: { decrement: payout.amount },
        totalEarnings: { increment: payout.amount },
      },
    });

    return updatedPayout;
  }

  /**
   * Cancel a payout
   */
  async cancelPayout(payoutId: string, reason?: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) throw new NotFoundError('Payout');
    
    if (!['pending', 'failed'].includes(payout.status)) {
      throw new AppError('Only pending or failed payouts can be cancelled', 'INVALID_STATUS', 400);
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'cancelled',
        metadata: {
          ...(payout.metadata as any),
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    // Return earnings to pending
    if (payout.status === 'pending') {
      await prisma.instructor.update({
        where: { id: payout.instructorId },
        data: {
          pendingEarnings: { decrement: payout.amount },
        },
      });
    }

    return updatedPayout;
  }
}