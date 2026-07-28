import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/jobs
 * List job postings with filters
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      type: searchParams.get('type') || undefined,
      location: searchParams.get('location') || undefined,
      query: searchParams.get('query') || undefined,
      status: searchParams.get('status') || 'active',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '15'),
    };

    const where: any = { status: params.status };
    if (params.type) where.type = params.type;
    if (params.location) where.location = { contains: params.location, mode: 'insensitive' };
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { client: { companyName: { contains: params.query, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total, locations, types] = await Promise.all([
      prisma.recruitmentPosting.findMany({
        where,
        include: {
          client: { select: { companyName: true, industry: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.recruitmentPosting.count({ where }),
      prisma.recruitmentPosting.findMany({ where: { status: 'active' }, select: { location: true }, distinct: ['location'] }),
      prisma.recruitmentPosting.findMany({ where: { status: 'active' }, select: { type: true }, distinct: ['type'] }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      filters: {
        locations: locations.map(l => l.location).filter(Boolean),
        types: types.map(t => t.type).filter(Boolean),
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * POST /api/jobs
 * Apply for a job (student)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { postingId, coverLetter, cvUrl } = body;

    if (!postingId) {
      return NextResponse.json({ error: 'Posting ID is required' }, { status: 400 });
    }

    // Check if posting exists and is active
    const posting = await prisma.recruitmentPosting.findUnique({
      where: { id: postingId },
    });

    if (!posting || posting.status !== 'active') {
      return NextResponse.json({ error: 'Job posting not found or closed' }, { status: 404 });
    }

    // Check deadline
    if (posting.deadline && new Date() > posting.deadline) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Get student profile
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: { postingId_studentId: { postingId, studentId: student.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already applied for this position' }, { status: 409 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        postingId,
        studentId: student.id,
        coverLetter: coverLetter || '',
        cvUrl: cvUrl || '',
        status: 'pending',
      },
    });

    // Update application count
    await prisma.recruitmentPosting.update({
      where: { id: postingId },
      data: { applicationsCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: application, message: 'Application submitted' }, { status: 201 });

  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
