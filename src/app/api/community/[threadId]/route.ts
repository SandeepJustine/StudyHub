import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';

// Get a single thread with posts
export async function GET(
  req: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await forumService.getThread(params.threadId);

    return NextResponse.json({
      success: true,
      data: thread,
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

// Reply to a thread
export async function POST(
  req: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, parentId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const post = await forumService.createReply(session.user.id, {
      threadId: params.threadId,
      content,
      parentId,
    });

    return NextResponse.json({
      success: true,
      data: post,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reply' },
      { status: error.statusCode || 500 }
    );
  }
}
