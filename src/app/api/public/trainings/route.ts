import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const skip = (page - 1) * limit;
    const category = searchParams.get('category');

    const [packages, total] = await Promise.all([
      prisma.corporateTrainingPackage.findMany({
        where: {
          status: 'ACTIVE',
          ...(category ? { category: category as any } : {}),
        },
        include: {
          corporate: {
            select: {
              id: true,
              companyName: true,
              logo: true,
              industry: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.corporateTrainingPackage.count({
        where: {
          status: 'ACTIVE',
          ...(category ? { category: category as any } : {}),
        },
      }),
    ]);

    const trainings = packages.map((pkg: any) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      category: pkg.category,
      mode: pkg.mode,
      level: pkg.level,
      pricePerParticipant: pkg.pricePerParticipant,
      maximumParticipants: pkg.maximumParticipants,
      totalBudget: pkg.totalBudget,
      status: pkg.status,
      startDate: pkg.startDate,
      endDate: pkg.endDate,
      durationDays: pkg.durationDays,
      certificationIncluded: pkg.certificationIncluded,
      instructorName: pkg.instructorName,
      createdAt: pkg.createdAt,
      client: pkg.corporate
        ? {
            id: pkg.corporate.id,
            companyName: pkg.corporate.companyName,
            logo: pkg.corporate.logo,
            industry: pkg.corporate.industry,
          }
        : undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: trainings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Public trainings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
      { status: 500 }
    );
  }
}
