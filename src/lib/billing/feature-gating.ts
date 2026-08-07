/**
 * Feature gating system for tier-based access control
 */

import prisma from '../utils/prisma';
import { PRICING_TIERS, hasFeature, getTierLimit } from './pricing-tiers';

export interface FeatureGate {
  feature: string;
  hasAccess: boolean;
  limit?: number;
  current?: number;
  remaining?: number;
}

export class FeatureGatingService {
  /**
   * Check if a user has access to a specific feature
   */
  async checkAccess(userId: string, feature: string): Promise<FeatureGate> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        feature,
        hasAccess: false,
      };
    }

    const tierConfig = PRICING_TIERS[subscription.tier];
    const hasFeatureAccess = tierConfig?.features.includes(feature) || false;

    // Special handling for institution-based past paper upload access
    if (feature === 'past_paper:upload' && !hasFeatureAccess) {
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId },
        include: { institution: true },
      });
      if (schoolAdmin?.institution) {
        const institutionTier = schoolAdmin.institution.tier;
        const institutionConfig = PRICING_TIERS[institutionTier];
        if (institutionConfig?.features.includes('past_paper:upload')) {
          return {
            feature,
            hasAccess: true,
          };
        }
      }
    }

    // Check limits if applicable
    let limit: number | undefined;
    let current: number | undefined;

    switch (feature) {
      case 'course:create':
        limit = getTierLimit(subscription.tier, 'courses');
        if (limit > 0) {
          current = await prisma.course.count({
            where: {
              instructor: { userId },
              status: { not: 'ARCHIVED' },
            },
          });
        }
        break;

      case 'live_class':
        limit = getTierLimit(subscription.tier, 'liveClasses');
        if (limit > 0) {
          current = await prisma.liveClass.count({
            where: {
              instructor: { userId },
              status: 'scheduled',
            },
          });
        }
        break;

      case 'student_enrollment':
        const institution = await prisma.schoolAdmin.findFirst({
          where: { userId },
          include: { institution: true },
        });
        if (institution) {
          limit = institution.institution.maxStudents;
          current = institution.institution.currentStudents;
        }
        break;
    }

    return {
      feature,
      hasAccess: hasFeatureAccess,
      limit,
      current,
      remaining: limit !== undefined && current !== undefined 
        ? Math.max(0, limit - current)
        : undefined,
    };
  }

  /**
   * Check multiple features at once
   */
  async checkMultipleAccess(
    userId: string,
    features: string[]
  ): Promise<Record<string, FeatureGate>> {
    const results = await Promise.all(
      features.map(feature => this.checkAccess(userId, feature))
    );

    return results.reduce((acc, result) => {
      acc[result.feature] = result;
      return acc;
    }, {} as Record<string, FeatureGate>);
  }

  /**
   * Enforce access - throws if user doesn't have access
   */
  async enforceAccess(userId: string, feature: string): Promise<void> {
    const access = await this.checkAccess(userId, feature);

    if (!access.hasAccess) {
      throw new Error(`Access denied: ${feature} requires a premium subscription`);
    }

    if (access.limit !== undefined && access.remaining !== undefined && access.remaining <= 0) {
      throw new Error(`Limit reached: ${feature} limit of ${access.limit} exceeded`);
    }
  }

  /**
   * Get all features available to a user
   */
  async getAvailableFeatures(userId: string): Promise<string[]> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return [];

    const tierConfig = PRICING_TIERS[subscription.tier];
    return tierConfig?.features || [];
  }

  /**
   * Get upgrade suggestions based on attempted access
   */
  async getUpgradeSuggestions(userId: string, requiredFeature: string): Promise<{
    currentTier: string;
    suggestedTiers: string[];
    message: string;
  }> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentTier = subscription?.tier || 'FREE';
    const suggestedTiers: string[] = [];

    // Find tiers that include the required feature
    for (const [tier, config] of Object.entries(PRICING_TIERS)) {
      if (config.features.includes(requiredFeature) && tier !== currentTier) {
        suggestedTiers.push(tier);
      }
    }

    return {
      currentTier,
      suggestedTiers,
      message: `Upgrade to ${suggestedTiers[0]} to access ${requiredFeature}`,
    };
  }
}

export const featureGating = new FeatureGatingService();