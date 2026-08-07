import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paperId } = await params;

    const paper = await prisma.pastPaper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      return NextResponse.json({ error: 'Past paper not found' }, { status: 404 });
    }

    // Check download permission for students
    if (session.user.role === 'STUDENT') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:download');
      if (!access.hasAccess) {
        return NextResponse.json({ error: 'Upgrade to Premium to download past papers' }, { status: 403 });
      }
    }

    // Check upload permission for viewing by non-students
    if (session.user.role !== 'STUDENT') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:upload');
      if (!access.hasAccess && session.user.role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Extract filename from URL
    const urlParts = paper.fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const filePath = join(process.cwd(), 'public', 'uploads', 'past-papers', filename);

    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': paper.contentType || 'application/pdf',
          'Content-Disposition': `attachment; filename="${paper.title.replace(/[^a-z0-9.-]/gi, '-')}.${paper.contentType.includes('pdf') ? 'pdf' : 'docx'}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch {
      // If file not found on disk, redirect to URL
      return NextResponse.redirect(paper.fileUrl);
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download past paper' }, { status: 500 });
  }
}
