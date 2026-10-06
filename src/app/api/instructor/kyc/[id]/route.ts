import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

const KYC_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'kyc');

/**
 * DELETE /api/instructor/kyc/[id]
 * Delete own KYC document (only if PENDING).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const doc = await prisma.kycDocument.findFirst({
      where: { id, instructorId: instructor.id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Cannot delete a document that has already been reviewed',
      }, { status: 400 });
    }

    // Remove file from disk
    const filepath = join(KYC_UPLOAD_DIR, doc.fileUrl.split('/').pop() || '');
    try { await unlink(filepath); } catch { /* ignore missing file */ }

    await prisma.kycDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('KYC delete error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
