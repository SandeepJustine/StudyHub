import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { AppError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const examBoard = formData.get('examBoard') as string | null;
    const year = formData.get('year') as string | null;
    const subject = formData.get('subject') as string | null;
    const paperNumber = formData.get('paperNumber') as string | null;
    const duration = formData.get('duration') as string | null;

    if (!file || !examBoard || !year || !subject) {
      return NextResponse.json({ error: 'File, examBoard, year, and subject are required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-z0-9.-]/gi, '-')}`;
    const folder = 'past-papers';
    
    // Mock upload - replace with actual storage logic
    const pdfUrl = `${process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:3000'}/uploads/${folder}/${filename}`;

    // Create ContentItem record
    const contentItem = await prisma.contentItem.create({
      data: {
        title: `${subject} Past Paper ${year} - ${examBoard}`,
        type: 'PAST_PAPER',
        subject,
        examBoard,
        grade: formData.get('grade') || undefined,
        version: 1,
        status: 'APPROVED',
        uploadedBy: instructor.userId,
        fileUrl: pdfUrl,
        metadata: {
          year: parseInt(year),
          paperNumber: paperNumber ? parseInt(paperNumber) : 1,
          duration: duration ? parseInt(duration) : 180,
          filename: file.name,
          size: file.size,
          contentType: file.type,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contentItem,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Past paper upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload past paper' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const examBoard = searchParams.get('examBoard');
    const year = searchParams.get('year');

    const where: any = {
      type: 'PAST_PAPER',
      status: 'APPROVED',
    };

    if (subject) where.subject = subject;
    if (examBoard) where.examBoard = examBoard;
    if (year) where.metadata = { path: ['year'], equals: parseInt(year) };

    const pastPapers = await prisma.contentItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        examBoard: true,
        grade: true,
        fileUrl: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: pastPapers,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch past papers' }, { status: 500 });
  }
}
