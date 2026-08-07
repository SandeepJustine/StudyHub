import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';
import prisma from '@/lib/utils/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const courseId = searchParams.get('courseId');

    let where: any = {
      isDeleted: false,
      thread: { isDeleted: false },
    };

    if (courseId) {
      where.thread.courseId = courseId;
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        include: {
          author: { select: { fullName: true, avatar: true, role: true } },
          thread: {
            select: { id: true, title: true, courseId: true, course: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.forumPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get replies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch replies' },
      { status: 500 }
    );
  }

}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, content } = body;

    if (!threadId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Thread ID and content are required' },
        { status: 400 }
      );
    }

    const post = await forumService.createReply(session.user.id, {
      threadId,
      content: content.trim(),
    });

    return NextResponse.json({
      success: true,
      data: post,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reply' },
      { status: 500 }
    );
  }
}
