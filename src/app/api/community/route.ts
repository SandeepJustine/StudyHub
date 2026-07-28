import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ForumService } from '@/lib/community/forum-service';

const forumService = new ForumService();

// Get forum threads
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      subject: searchParams.get('subject') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      sortBy: (searchParams.get('sortBy') || 'latest') as 'latest' | 'popular' | 'pinned',
    };

    const result = await forumService.getThreads(params);

    return NextResponse.json({
      success: true,
      data: result.threads,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

// Create a new thread
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, subject, courseId, tags, isAnnouncement } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const thread = await forumService.createThread(session.user.id, {
      title,
      content,
      subject,
      courseId,
      tags,
      isAnnouncement,
    });

    return NextResponse.json({
      success: true,
      data: thread,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: error.statusCode || 500 }
    );
  }
}
