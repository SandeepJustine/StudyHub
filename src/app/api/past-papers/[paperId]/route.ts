import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/past-papers/[paperId]
 * Get past paper details with download URL
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

    const paper = await prisma.contentItem.findUnique({
      where: { id: paperId },
    });

    if (!paper || paper.type !== 'PAST_PAPER') {
      return NextResponse.json({ error: 'Past paper not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: paper });

  } catch (error) {
    console.error('Past paper detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch past paper' }, { status: 500 });
  }
}
