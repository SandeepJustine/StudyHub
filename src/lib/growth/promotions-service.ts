import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class PromotionsService {
  /**
   * Create promo code
   */
  async createPromoCode(adminId: string, data: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
    maxUses?: number;
    minAmount?: number;
    validFrom: Date;
    validUntil: Date;
    applicableTiers: string[];
  }) {
    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new AppError('Promo code already exists', 'CODE_EXISTS', 409);
    }

    return prisma.promoCode.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        createdBy: adminId,
      },
    });
  }

  /**
   * Validate and apply promo code
   */
  async applyPromoCode(code: string, userId: string, amount: number, tier: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new AppError('Invalid promo code', 'INVALID_CODE', 400);
    }

    // Validate
    if (!promoCode.isActive) {
      throw new AppError('Promo code is no longer active', 'CODE_INACTIVE', 400);
    }

    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      throw new AppError('Promo code has expired', 'CODE_EXPIRED', 400);
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      throw new AppError('Promo code usage limit reached', 'CODE_EXHAUSTED', 400);
    }

    if (promoCode.minAmount && amount < promoCode.minAmount) {
      throw new AppError(
        `Minimum order amount of MWK ${promoCode.minAmount.toLocaleString()} required`,
        'MIN_AMOUNT_NOT_MET',
        400
      );
    }

    if (!promoCode.applicableTiers.includes(tier)) {
      throw new AppError('Promo code not applicable to this plan', 'TIER_MISMATCH', 400);
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.type === 'PERCENTAGE') {
      discountAmount = Math.floor(amount * (promoCode.discount / 100));
    } else {
      discountAmount = Math.min(promoCode.discount, amount);
    }

    // Increment usage
    await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: { usedCount: { increment: 1 } },
    });

    return {
      code: promoCode.code,
      type: promoCode.type,
      discount: promoCode.discount,
      discountAmount,
      finalAmount: amount - discountAmount,
    };
  }

  /**
   * Create referral bonus
   */
  async createReferral(referrerId: string, refereeEmail: string) {
    // Generate unique referral code
    const referralCode = `${referrerId.slice(0, 6)}-${Date.now().toString(36)}`;

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId,
        refereeEmail,
        code: referralCode,
        status: 'pending',
      },
    });

    // Send invitation email
    // await emailService.sendReferralInvitation(refereeEmail, referralCode);

    return referral;
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(referralCode: string, newUserId: string) {
    const referral = await prisma.referral.findFirst({
      where: { code: referralCode, status: 'pending' },
    });

    if (!referral) {
      throw new NotFoundError('Referral');
    }

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        newUserId,
      },
    });

    // Give bonus to referrer (e.g., 1 free month)
    await this.giveReferralBonus(referral.referrerId);

    return { success: true };
  }

  /**
   * Give referral bonus
   */
  private async giveReferralBonus(userId: string) {
    // Create a free month coupon for referrer
    return prisma.promoCode.create({
      data: {
        code: `REFBONUS-${userId.slice(0, 8)}-${Date.now().toString(36)}`.toUpperCase(),
        discount: 100, // 100% off
        type: 'PERCENTAGE',
        maxUses: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        applicableTiers: ['STUDENT_BASIC', 'STUDENT_PREMIUM', 'STUDENT_ANNUAL'],
        createdBy: 'system',
      },
    });
  }

  /**
   * Track campaign performance
   */
  async getCampaignAnalytics(campaignId?: string) {
    const where: any = {};
    if (campaignId) where.campaignId = campaignId;

    const [promoCodes, referrals] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.findMany({
        where: { status: 'converted' },
      }),
    ]);

    const totalDiscounts = promoCodes.reduce((sum, p) => sum + (p.discount * p.usedCount), 0);
    const conversionRate = referrals.length > 0
      ? (referrals.filter(r => r.status === 'converted').length / referrals.length) * 100
      : 0;

    return {
      promoCodes: {
        total: promoCodes.length,
        active: promoCodes.filter(p => p.isActive).length,
        totalUses: promoCodes.reduce((sum, p) => sum + p.usedCount, 0),
        totalDiscounts,
      },
      referrals: {
        total: referrals.length,
        converted: referrals.filter(r => r.status === 'converted').length,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
    };
  }
}