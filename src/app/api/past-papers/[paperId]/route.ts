import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';

/**
 * GET /api/past-papers/[paperId]
 * Get past paper details with download permission flag
 */
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
      include: {
        course: {
          select: { id: true, title: true, subject: true },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: 'Past paper not found' }, { status: 404 });
    }

    let canDownload = false;
    if (session.user.role === 'STUDENT') {
      const access = await featureGating.checkAccess(session.user.id, 'past_paper:download');
      canDownload = access.hasAccess;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...paper,
        canDownload,
      },
    });

  } catch (error) {
    console.error('Past paper detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch past paper' }, { status: 500 });
  }
}
