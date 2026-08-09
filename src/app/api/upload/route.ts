// API route for file uploads (video, audio, PDF, slides, images).
// Accepts multipart/form-data and returns the uploaded file URL.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

function getBaseUrl(req: Request): string {
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

// Allowed file types and max sizes
const ALLOWED_TYPES: Record<string, { extensions: string[]; maxSize: number; mimeTypes: string[] }> = {
  VIDEO: {
    extensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    maxSize: 500 * 1024 * 1024, // 500MB
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  },
  AUDIO: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
  },
  PDF: {
    extensions: ['.pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: ['application/pdf'],
  },
  SLIDES: {
    extensions: ['.ppt', '.pptx', '.pdf', '.key'],
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ],
  },
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string;

    if (!file || !fileType) {
      return NextResponse.json(
        { error: 'file and type are required' },
        { status: 400 }
      );
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
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileType.toLowerCase());
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Generate URLs
    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${fileType.toLowerCase()}/${filename}`;
    const downloadUrl = `${fileUrl}?download=1`;

    // Generate thumbnail for videos
    let thumbnailUrl: string | undefined;
    if (fileType.toUpperCase() === 'VIDEO') {
      thumbnailUrl = `${baseUrl}/uploads/thumbnails/${filename}.jpg`;
    }

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        downloadUrl,
        filename,
        size: file.size,
        mimeType: file.type,
        thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Get upload info (for checking if file exists, etc.)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json(
      { error: 'filename is required' },
      { status: 400 }
    );
  }

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${filename}`;

  return NextResponse.json({
    success: true,
    data: {
      url: fileUrl,
      filename,
    },
  });
}
