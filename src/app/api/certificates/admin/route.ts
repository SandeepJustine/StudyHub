import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    let where: any = {};

    if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: session.user.id },
      });

      if (!schoolAdmin) {
        return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 });
      }

      const institution = await prisma.institution.findUnique({
        where: { id: schoolAdmin.institutionId },
        include: { students: { select: { id: true } } },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
      }

      const studentIds = institution.students.map((s) => s.id);
      where.studentId = { in: studentIds };
    } else if (session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (search) {
      where.OR = [
        { certificateNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.paymentStatus = status;
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
          template: { select: { id: true, name: true } },
          enrollment: {
            include: {
              course: { select: { title: true, subject: true } },
            },
          },
          examAttempt: {
            include: {
              quiz: { select: { title: true } },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin certificates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}
