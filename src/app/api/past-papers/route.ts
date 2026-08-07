import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';

/**
 * GET /api/past-papers
 * List past papers with filters
 * Returns papers with canDownload flag based on user's subscription tier
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      subject: searchParams.get('subject') || undefined,
      examBoard: searchParams.get('examBoard') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      courseId: searchParams.get('courseId') || undefined,
      query: searchParams.get('query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {
      status: 'APPROVED',
    };

    if (params.subject) where.subject = params.subject;
    if (params.examBoard) where.examBoard = params.examBoard;
    if (params.year) where.year = params.year;
    if (params.courseId) where.courseId = params.courseId;
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { subject: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    const [papers, total, boards, subjects, years] = await Promise.all([
      prisma.pastPaper.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.pastPaper.count({ where }),
      prisma.pastPaper.findMany({ where: { status: 'APPROVED' }, select: { examBoard: true }, distinct: ['examBoard'] }),
      prisma.pastPaper.findMany({ where: { status: 'APPROVED' }, select: { subject: true }, distinct: ['subject'] }),
      prisma.pastPaper.findMany({ where: { status: 'APPROVED' }, select: { year: true }, orderBy: { year: 'desc' }, distinct: ['year'] }),
    ]);

    let canDownload = false;
    if (session.user.role === 'STUDENT') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:download');
      canDownload = access.hasAccess;
    }

    return NextResponse.json({
      success: true,
      data: papers,
      canDownload,
      filters: {
        examBoards: boards.map(b => b.examBoard).filter(Boolean),
        subjects: subjects.map(s => s.subject).filter(Boolean),
        years: years.map(y => y.year).filter(Boolean).sort((a, b) => b - a),
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Past papers error:', error);
    return NextResponse.json({ error: 'Failed to fetch past papers' }, { status: 500 });
  }
}

/**
 * POST /api/past-papers
 * Upload a new past paper
 * Allowed: INSTRUCTOR_PRO, PLATFORM_ADMIN, or SCHOOL_ADMIN with institution tier that has past_paper:upload
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, subject, examBoard, year, paperNumber, fileUrl, markingSchemeUrl, duration, courseId, contentType, fileSize } = body;

    if (!title || !subject || !examBoard || !year || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check upload permission
    let hasUploadAccess = false;
    if (session.user.role === 'PLATFORM_ADMIN') {
      hasUploadAccess = true;
    } else if (session.user.role === 'INSTRUCTOR') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:upload');
      hasUploadAccess = access.hasAccess;
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:upload');
      hasUploadAccess = access.hasAccess;
    }

    if (!hasUploadAccess) {
      return NextResponse.json({ error: 'Upgrade to Pro or Institution tier to upload past papers' }, { status: 403 });
    }

    const paper = await prisma.pastPaper.create({
      data: {
        title,
        subject,
        examBoard,
        year: parseInt(year),
        paperNumber: paperNumber ? parseInt(paperNumber) : 1,
        duration: duration ? parseInt(duration) : 180,
        fileUrl,
        fileSize: fileSize ? parseInt(fileSize) : undefined,
        contentType: contentType || 'application/pdf',
        markingSchemeUrl: markingSchemeUrl || undefined,
        courseId: courseId || undefined,
        uploadedBy: session.user.id,
        status: 'APPROVED',
      },
    });

    return NextResponse.json({ success: true, data: paper }, { status: 201 });

  } catch (error: any) {
    console.error('Upload past paper error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload past paper' }, { status: 500 });
  }
}
