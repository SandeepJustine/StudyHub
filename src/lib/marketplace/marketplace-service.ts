import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class MarketplaceService {
  /**
   * Create listing
   */
  async createListing(sellerId: string, data: {
    title: string;
    description?: string;
    price: number;
    category: string;
    condition?: string;
    images: string[];
    stock: number;
  }) {
    // Calculate platform commission (10-20% based on category)
    const commissionRate = this.getCommissionRate(data.category);

    return prisma.marketplaceListing.create({
      data: {
        sellerId,
        ...data,
        commission: commissionRate,
        status: 'active',
      },
    });
  }

  /**
   * Get listings with filters
   */
  async getListings(params: {
    category?: string;
    condition?: string;
    priceMin?: number;
    priceMax?: number;
    query?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
    page?: number;
    limit?: number;
  }) {
    const { category, condition, priceMin, priceMax, query, sortBy = 'newest', page = 1, limit = 20 } = params;

    const where: any = {
      status: 'active',
      stock: { gt: 0 },
    };
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'price_asc': orderBy.price = 'asc'; break;
      case 'price_desc': orderBy.price = 'desc'; break;
      case 'popular': orderBy.viewsCount = 'desc'; break;
      default: orderBy.createdAt = 'desc';
    }

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        orderBy,
        include: {
          seller: {
            select: { fullName: true, avatar: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    return {
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Purchase listing (calculate commission)
   */
  async purchaseListing(listingId: string, buyerId: string, quantity: number = 1) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) throw new NotFoundError('Listing');
    if (listing.stock < quantity) {
      throw new AppError('Insufficient stock', 'OUT_OF_STOCK', 400);
    }
    if (listing.sellerId === buyerId) {
      throw new AppError('Cannot purchase your own listing', 'INVALID_PURCHASE', 400);
    }

    const totalAmount = listing.price * quantity;
    const platformCommission = Math.floor(totalAmount * listing.commission);
    const sellerAmount = totalAmount - platformCommission;

    // Update stock
    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        stock: { decrement: quantity },
        salesCount: { increment: quantity },
        ...(listing.stock - quantity <= 0 && { status: 'inactive' }),
      },
    });

    // Create transaction for commission
    // In production, integrate with payment service

    return {
      totalAmount,
      platformCommission,
      sellerAmount,
      sellerId: listing.sellerId,
    };
  }

  private getCommissionRate(category: string): number {
    const rates: Record<string, number> = {
      TEXTBOOKS: 0.15,
      UNIFORMS: 0.10,
      CALCULATORS: 0.12,
      STATIONERY: 0.20,
    };
    return rates[category] || 0.15;
  }
}