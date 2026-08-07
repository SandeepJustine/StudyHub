import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { threadId } = await params;

    const thread = await forumService.getThread(threadId);

    return NextResponse.json({
      success: true,
      data: thread,
    });
  } catch (error: any) {
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
