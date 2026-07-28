import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';

/**
 * GET /api/community/forums
 * Get all public forums
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject') || undefined;

    let forums = await forumService.getForums(session.user.id);

    if (subject) {
      forums = forums.filter((f: any) => f.subject === subject);
    }

    return NextResponse.json({
      success: true,
      data: forums,
    });

  } catch (error: any) {
    console.error('Get forums error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forums' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/forums
 * Create a new forum thread (any authenticated user)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, subject, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create a thread (since we don't have a separate Forum model)
    const thread = await forumService.createThread(session.user.id, {
      title,
      content,
      subject: subject || 'General',
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