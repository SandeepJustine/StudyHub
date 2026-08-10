import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement');
    const type = searchParams.get('type');

    const now = new Date();
    const where: any = {
      status: 'active',
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (placement) where.placement = placement;
    if (type) where.type = type;

    const sponsorships = await prisma.sponsorshipSlot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Increment impressions
    for (const s of sponsorships) {
      await prisma.sponsorshipSlot.update({
        where: { id: s.id },
        data: { impressions: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: sponsorships.map(s => ({
        id: s.id,
        sponsor: s.sponsor,
        type: s.type,
        targetUrl: s.targetUrl,
        imageUrl: s.imageUrl,
        image: s.image,
        placement: s.placement,
        description: s.description,
        impressions: s.impressions + 1,
        clicks: s.clicks,
      })),
    });
  } catch (error) {
    console.error('Public sponsorships error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsorships' },
      { status: 500 }
    );
  }
}
