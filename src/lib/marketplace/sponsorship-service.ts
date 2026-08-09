import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class SponsorshipService {
  /**
   * Create sponsorship slot
   */
  async createSponsorship(data: {
    sponsor: string;
    type: 'BANNER' | 'WEBINAR' | 'PROMOTED_COURSE' | 'FEATURED_LISTING';
    title?: string;
    description?: string;
    targetUrl?: string;
    imageUrl?: string;
    startDate: Date;
    endDate: Date;
    price: number;
    placement: string;
  }) {
    // Check for slot availability
    const conflictingSlots = await prisma.sponsorshipSlot.count({
      where: {
        status: 'active',
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    });

    if (conflictingSlots > 0) {
      throw new AppError('Slot already booked for this period', 'SLOT_UNAVAILABLE', 409);
    }

    return prisma.sponsorshipSlot.create({
      data: {
        ...data,
        status: 'scheduled',
      },
    });
  }

  /**
   * Get active sponsorships
   */
  async getActiveSponsorships(placement?: string) {
    const now = new Date();

    const where: any = {
      status: 'active',
      startDate: { lte: now },
      endDate: { gte: now },
    };
    if (placement) where.placement = placement;

    return prisma.sponsorshipSlot.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Track impression/click
   */
  async trackEngagement(slotId: string, type: 'impression' | 'click') {
    const updateData = type === 'impression'
      ? { impressions: { increment: 1 } }
      : { clicks: { increment: 1 } };

    return prisma.sponsorshipSlot.update({
      where: { id: slotId },
      data: updateData,
    });
  }

  /**
   * Get sponsorship analytics
   */
  async getSponsorshipAnalytics(sponsorId?: string) {
    const where: any = {};
    if (sponsorId) where.sponsor = sponsorId;

    const slots = await prisma.sponsorshipSlot.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    const totalImpressions = slots.reduce((sum, s) => sum + s.impressions, 0);
    const totalClicks = slots.reduce((sum, s) => sum + s.clicks, 0);
    const totalRevenue = slots.reduce((sum, s) => sum + s.price, 0);

    return {
      totalSlots: slots.length,
      activeSlots: slots.filter(s => s.status === 'active').length,
      totalImpressions,
      totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalRevenue,
      slots,
    };
  }
}