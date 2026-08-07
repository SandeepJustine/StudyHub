import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const ALLOWED_TYPES: Record<string, { extensions: string[]; maxSize: number; mimeTypes: string[]; folder: string }> = {
  PDF: {
    extensions: ['.pdf'],
    maxSize: 50 * 1024 * 1024,
    mimeTypes: ['application/pdf'],
    folder: 'past-papers',
  },
  DOC: {
    extensions: ['.doc', '.docx'],
    maxSize: 20 * 1024 * 1024,
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    folder: 'past-papers',
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('type') as string || 'PDF';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const config = ALLOWED_TYPES[fileType.toUpperCase()];
    if (!config) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${config.maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.extensions.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${config.extensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (file.type && !config.mimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type: ${file.type}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const filename = `${timestamp}-${sanitizedName}`;

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', config.folder);
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL || `http://localhost:3000`;
    const fileUrl = `${baseUrl}/uploads/${config.folder}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename,
        size: file.size,
        mimeType: file.type,
        contentType: file.type,
      },
    });
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
      status: 'APPROVED',
    };

    if (subject) where.subject = subject;
    if (examBoard) where.examBoard = examBoard;
    if (year) where.year = parseInt(year);

    const pastPapers = await prisma.pastPaper.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        examBoard: true,
        grade: true,
        year: true,
        fileUrl: true,
        contentType: true,
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
