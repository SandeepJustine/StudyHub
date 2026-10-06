import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const KYC_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'kyc');
const ALLOWED_TYPES = ['NATIONAL_ID', 'CERTIFICATE', 'OTHER'];
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
]);

async function ensureUploadDir() {
  await mkdir(KYC_UPLOAD_DIR, { recursive: true });
}

function getBaseUrl(req: Request) {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

/**
 * GET /api/instructor/kyc
 * List own KYC documents.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const docs = await prisma.kycDocument.findMany({
      where: { instructorId: instructor.id },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { fullName: true, email: true } } },
    });

    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('KYC list error:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC documents' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/kyc
 * Upload a KYC document.
 * FormData: file (required), type (NATIONAL_ID | CERTIFICATE | OTHER)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string | null)?.trim().toUpperCase();

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({
        error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF',
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
    }

    await ensureUploadDir();

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filepath = join(KYC_UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filepath, buffer);

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/kyc/${filename}`;

    const doc = await prisma.kycDocument.create({
      data: {
        instructorId: instructor.id,
        type,
        fileName: file.name,
        fileUrl,
        fileSize: buffer.length,
        mimeType: file.type,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
