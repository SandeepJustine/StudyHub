import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      prisma.corporateContract.findMany({
        where: { status: 'active' },
        include: {
          client: {
            include: {
              user: {
                select: {
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.corporateContract.count({
        where: { status: 'active' },
      }),
    ]);

    const trainings = contracts.map((contract) => {
      let parsedCourses: any[] = [];
      try {
        parsedCourses = JSON.parse(contract.courses as string);
      } catch {
        parsedCourses = [];
      }

      return {
        id: contract.id,
        title: contract.title,
        description: contract.description,
        employees: contract.employees,
        courses: parsedCourses,
        totalAmount: contract.totalAmount,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        createdAt: contract.createdAt,
        client: contract.client
          ? {
              id: contract.client.id,
              companyName: contract.client.companyName,
              logo: contract.client.logo,
              user: {
                fullName: contract.client.user.fullName,
                avatar: contract.client.user.avatar,
              },
            }
          : undefined,
      };
    });

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
