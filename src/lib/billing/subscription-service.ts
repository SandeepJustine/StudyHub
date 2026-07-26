import prisma from '../utils/prisma';
import { AppError, SubscriptionError } from '@/lib/utils/errors';
import { PRICING_TIERS, getTierPricing, calculateProration } from './pricing-tiers';
import { PaymentService } from '@/lib/payments/payment-service';
import { NotificationService } from '@/lib/notifications/notification-service';
import { SubscriptionTier, BillingCycle, PaymentMethod } from '@/types/subscription';

export class SubscriptionService {
  private paymentService: PaymentService;
  private notificationService: NotificationService;

  constructor() {
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: {
    userId: string;
    tier: SubscriptionTier;
    cycle: BillingCycle;
    paymentMethod: PaymentMethod;
    institutionId?: string;
    promoCode?: string;
    metadata?: any;
  }) {
    const pricing = PRICING_TIERS[data.tier];
    if (!pricing) {
      throw new AppError('Invalid subscription tier', 'INVALID_TIER', 400);
    }

    const amount = getTierPricing(data.tier, data.cycle);
    
    // Apply promo code if provided
    let discountAmount = 0;
    if (data.promoCode) {
      const discount = await this.validatePromoCode(data.promoCode, data.tier);
      if (discount) {
        discountAmount = discount.type === 'PERCENTAGE' 
          ? Math.floor(amount * (discount.discount / 100))
          : discount.discount;
      }
    }

    const finalAmount = amount - discountAmount;

    // Check for existing active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId: data.userId,
        status: 'active',
      },
    });

    // Handle upgrade/downgrade
    if (existingSub) {
      return this.upgradeSubscription(existingSub.id, data.tier, data.cycle);
    }

    // Process payment (free tiers skip payment)
    let transaction = null;
    if (finalAmount > 0) {
      const paymentResult = await this.paymentService.processPayment({
        userId: data.userId,
        amount: finalAmount,
        method: data.paymentMethod,
        metadata: {
          type: 'subscription',
          tier: data.tier,
          cycle: data.cycle,
          description: `${pricing.name} - ${data.cycle.toLowerCase()}`,
          ...data.metadata,
        },
      });

      if (!paymentResult.success) {
        throw new PaymentError(paymentResult.message || 'Payment failed');
      }

      transaction = await prisma.transaction.findUnique({
        where: { reference: paymentResult.reference },
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, data.cycle);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        institutionId: data.institutionId,
        tier: data.tier,
        cycle: data.cycle,
        status: finalAmount > 0 ? 'active' : 'active',
        amount: finalAmount,
        discountAmount,
        startDate,
        endDate,
        autoRenew: true,
        paymentMethod: data.paymentMethod,
        promoCode: data.promoCode,
        metadata: data.metadata,
      },
    });

    // Create invoice for paid subscriptions
    if (finalAmount > 0 && transaction) {
      await this.generateInvoice(subscription.id, transaction.id, finalAmount);
    }

    // Update institution tier if applicable
    if (data.institutionId && data.tier.startsWith('INSTITUTION_')) {
      await this.updateInstitutionTier(data.institutionId, data.tier);
    }

    // Update instructor revenue share if applicable
    if (data.tier === 'INSTRUCTOR_PRO') {
      await prisma.instructor.updateMany({
        where: { userId: data.userId },
        data: { revenueShare: 0.80 },
      });
    }

    // Send confirmation
    await this.notificationService.sendPaymentConfirmation(data.userId, {
      amount: finalAmount,
      planName: pricing.name,
      paymentMethod: data.paymentMethod,
      transactionReference: transaction?.reference || 'FREE',
    });

    return subscription;
  }

  /**
   * Upgrade or downgrade subscription
   */
  async upgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    newCycle: BillingCycle
  ) {
    const existingSub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!existingSub) {
      throw new AppError('Subscription not found', 'NOT_FOUND', 404);
    }

    // Calculate proration
    const remainingDays = this.getRemainingDays(existingSub.endDate);
    const proration = calculateProration(
      existingSub.tier,
      newTier,
      remainingDays,
      existingSub.cycle
    );

    // Process additional charge if needed
    if (proration.netAmount > 0) {
      await this.paymentService.processPayment({
        userId: existingSub.userId,
        amount: proration.netAmount,
        method: existingSub.paymentMethod as PaymentMethod,
        metadata: {
          type: 'subscription_upgrade',
          oldTier: existingSub.tier,
          newTier,
          prorationCredit: proration.credit,
        },
      });
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        tier: newTier,
        cycle: newCycle,
        amount: getTierPricing(newTier, newCycle),
        endDate: this.calculateEndDate(new Date(), newCycle),
        metadata: {
          ...(existingSub.metadata as any),
          upgradedFrom: existingSub.tier,
          upgradedAt: new Date().toISOString(),
        },
      },
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 'NOT_FOUND', 404);
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false,
        cancelledAt: new Date(),
        metadata: {
          ...(subscription.metadata as any),
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    // Send cancellation confirmation
    await this.notificationService.send({
      userId: subscription.userId,
      type: 'SUBSCRIPTION_CANCELLED',
      title: 'Subscription Cancelled',
      message: `Your ${subscription.tier} subscription has been cancelled. You will have access until ${subscription.endDate.toLocaleDateString()}.`,
      channel: ['EMAIL'],
      priority: 'normal',
    });
  }

  /**
   * Handle auto-renewal
   */
  async handleAutoRenewal(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription || !subscription.autoRenew || subscription.status !== 'active') {
      return;
    }

    // Check if within renewal window (3 days before expiry)
    const now = new Date();
    const daysUntilExpiry = this.getRemainingDays(subscription.endDate);
    
    if (daysUntilExpiry > 3) return;

    try {
      const amount = getTierPricing(subscription.tier, subscription.cycle);

      // Process renewal payment
      const paymentResult = await this.paymentService.processPayment({
        userId: subscription.userId,
        amount,
        method: subscription.paymentMethod as PaymentMethod,
        metadata: {
          type: 'subscription_renewal',
          subscriptionId: subscription.id,
          tier: subscription.tier,
          cycle: subscription.cycle,
        },
      });

      if (paymentResult.success) {
        // Extend subscription
        const newEndDate = this.calculateEndDate(subscription.endDate, subscription.cycle);
        
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            endDate: newEndDate,
            status: 'active',
          },
        });

        // Send renewal confirmation
        await this.notificationService.sendPaymentConfirmation(subscription.userId, {
          amount,
          planName: PRICING_TIERS[subscription.tier].name,
          paymentMethod: subscription.paymentMethod as PaymentMethod,
          transactionReference: paymentResult.reference || '',
        });
      } else {
        throw new Error(paymentResult.message);
      }
    } catch (error) {
      console.error(`Auto-renewal failed for subscription ${subscriptionId}:`, error);
      
      // Send renewal failure notification
      await this.notificationService.send({
        userId: subscription.userId,
        type: 'RENEWAL_FAILED',
        title: 'Subscription Renewal Failed',
        message: 'We were unable to process your subscription renewal. Please update your payment method to avoid service interruption.',
        channel: ['EMAIL', 'SMS'],
        priority: 'high',
        metadata: {
          subscriptionId,
          tier: subscription.tier,
          retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Retry in 24 hours
        },
      });
    }
  }

  /**
   * Process all pending renewals (CRON job)
   */
  async processAllRenewals() {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        endDate: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Next 3 days
        },
      },
    });

    for (const subscription of subscriptions) {
      await this.handleAutoRenewal(subscription.id).catch(error => {
        console.error(`Failed to process renewal for ${subscription.id}:`, error);
      });
    }

    return { processed: subscriptions.length };
  }

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return false;

    const tierConfig = PRICING_TIERS[subscription.tier];
    return tierConfig?.features.includes(feature) || false;
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Validate promo code
   */
  private async validatePromoCode(code: string, tier: SubscriptionTier) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode || !promoCode.isActive) return null;
    
    // Check validity period
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) return null;
    
    // Check usage limit
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) return null;
    
    // Check applicable tiers
    if (!promoCode.applicableTiers.includes(tier)) return null;

    // Increment usage
    await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: { usedCount: { increment: 1 } },
    });

    return promoCode;
  }

  /**
   * Generate invoice
   */
  private async generateInvoice(
    subscriptionId: string,
    transactionId: string,
    amount: number
  ) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

    return prisma.invoice.create({
      data: {
        subscriptionId,
        transactionId,
        invoiceNumber,
        amount,
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
      },
    });
  }

  /**
   * Update institution tier
   */
  private async updateInstitutionTier(institutionId: string, tier: SubscriptionTier) {
    const tierConfig = PRICING_TIERS[tier];
    
    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        tier,
        maxStudents: tierConfig.limits.students || 200,
      },
    });
  }

  /**
   * Calculate subscription end date
   */
  private calculateEndDate(startDate: Date, cycle: BillingCycle): Date {
    const date = new Date(startDate);
    
    if (cycle === 'MONTHLY') {
      date.setMonth(date.getMonth() + 1);
    } else if (cycle === 'ANNUAL') {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date;
  }

  /**
   * Get remaining days in subscription
   */
  private getRemainingDays(endDate: Date): number {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get subscription analytics for admin
   */
  async getSubscriptionAnalytics() {
    const [
      totalActive,
      totalCancelled,
      subscriptionsByTier,
      mrr,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'cancelled' } }),
      prisma.subscription.groupBy({
        by: ['tier'],
        where: { status: 'active' },
        _count: true,
        _sum: { amount: true },
      }),
      this.calculateMRR(),
    ]);

    const churnRate = totalActive > 0 
      ? (totalCancelled / (totalActive + totalCancelled)) * 100 
      : 0;

    return {
      totalActive,
      totalCancelled,
      churnRate: Math.round(churnRate * 100) / 100,
      mrr,
      byTier: subscriptionsByTier,
    };
  }

  /**
   * Calculate Monthly Recurring Revenue
   */
  private async calculateMRR(): Promise<number> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      if (sub.cycle === 'MONTHLY') {
        mrr += sub.amount;
      } else if (sub.cycle === 'ANNUAL') {
        mrr += Math.floor(sub.amount / 12);
      }
    }

    return mrr;
  }
}

// Export singleton
export const subscriptionService = new SubscriptionService();