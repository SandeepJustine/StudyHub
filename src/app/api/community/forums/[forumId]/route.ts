import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';

/**
 * GET /api/community/forum/[forumId]
 * Get forum threads filtered by subject
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { forumId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'latest';

    // Extract subject from forumId (format: "forum-1")
    const forums = await forumService.getForums(session.user.id);
    const forumIndex = parseInt(forumId.replace('forum-', '')) - 1;
    const forum = forums[forumIndex];

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }

    // Get threads for this subject
    const threadsResult = await forumService.getThreads({
      subject: forum.subject,
      page,
      limit,
      sortBy: sortBy as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        forum,
        threads: threadsResult.threads,
        pagination: threadsResult.pagination,
      },
    });

  } catch (error: any) {
    console.error('Forum error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/forum/[forumId]
 * Create thread in forum
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { forumId } = await params;
    const body = await req.json();
    const { title, content, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Get forum subject
    const forums = await forumService.getForums(session.user.id);
    const forumIndex = parseInt(forumId.replace('forum-', '')) - 1;
    const forum = forums[forumIndex];

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    }

    const thread = await forumService.createThread(session.user.id, {
      title,
      content,
      subject: forum.subject,
      tags: tags || [],
    });

    return NextResponse.json({
      success: true,
      data: thread,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: 500 }
    );
  }
}