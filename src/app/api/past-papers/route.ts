import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/past-papers
 * List past papers with filters
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
      type: searchParams.get('type') || 'PAST_PAPER',
      query: searchParams.get('query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const where: any = {
      type: params.type,
      status: 'APPROVED',
    };
    
    if (params.subject) where.subject = params.subject;
    if (params.examBoard) where.examBoard = params.examBoard;
    if (params.year) where.year = params.year;
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { subject: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    const [papers, total, boards, subjects, years] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.contentItem.count({ where }),
      prisma.contentItem.findMany({ where: { type: 'PAST_PAPER', status: 'APPROVED' }, select: { examBoard: true }, distinct: ['examBoard'] }),
      prisma.contentItem.findMany({ where: { type: 'PAST_PAPER', status: 'APPROVED' }, select: { subject: true }, distinct: ['subject'] }),
      prisma.contentItem.findMany({ where: { type: 'PAST_PAPER', status: 'APPROVED' }, select: { metadata: true }, orderBy: { createdAt: 'desc' }, take: 1 }),
    ]);

    return NextResponse.json({
      success: true,
      data: papers,
      filters: {
        examBoards: boards.map(b => b.examBoard).filter(Boolean),
        subjects: subjects.map(s => s.subject).filter(Boolean),
        latestYear: years[0]?.metadata?.year || new Date().getFullYear(),
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
 * Upload a new past paper (admin/instructor)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['PLATFORM_ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, subject, examBoard, year, paperNumber, fileUrl, markingSchemeUrl, duration } = body;

    if (!title || !subject || !examBoard || !year || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paper = await prisma.contentItem.create({
      data: {
        title,
        type: 'PAST_PAPER',
        subject,
        examBoard,
        grade: `Form ${Math.floor(Math.random() * 4) + 1}`,
        uploadedBy: session.user.id,
        fileUrl,
        status: 'PENDING_REVIEW',
        version: 1,
        metadata: {
          year: parseInt(year),
          paperNumber: paperNumber || 1,
          markingSchemeUrl: markingSchemeUrl || '',
          duration: duration || 180,
        },
      },
    });

    return NextResponse.json({ success: true, data: paper }, { status: 201 });

  } catch (error) {
    console.error('Upload past paper error:', error);
    return NextResponse.json({ error: 'Failed to upload past paper' }, { status: 500 });
  }
}
