import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/community
 * Instructor's community overview:
 *   - threads in forums related to their courses
 *   - recent forum posts on their courses
 *   - forum subscriptions they moderate
 *
 * Query params:
 *   type – 'threads' | 'posts' | 'all' (default: 'all')
 *   page – number (default 1)
 *   limit – number (default 20)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch courses owned by this instructor (to find related forum threads)
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: instructor.id },
      select: { id: true, title: true },
    });
    const courseIds = instructorCourses.map((c) => c.id);

    const result: any = {
      courses: instructorCourses,
      threads: [],
      posts: [],
      pagination: { page, limit },
    };

    if (type === 'threads' || type === 'all') {
      const threads = await prisma.forumThread.findMany({
        where: {
          OR: [
            { courseId: { in: courseIds } },
            { authorId: session.user.id },
          ],
          isDeleted: false,
        },
        include: {
          forum: { select: { name: true, subject: true, color: true } },
          course: { select: { title: true } },
          author: { select: { fullName: true, avatar: true } },
          _count: { select: { posts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      result.threads = threads;
      result.pagination.threadsTotal = await prisma.forumThread.count({
        where: {
          OR: [
            { courseId: { in: courseIds } },
            { authorId: session.user.id },
          ],
          isDeleted: false,
        },
      });
    }

    if (type === 'posts' || type === 'all') {
      const posts = await prisma.forumPost.findMany({
        where: {
          thread: {
            OR: [
              { courseId: { in: courseIds } },
              { authorId: session.user.id },
            ],
            isDeleted: false,
          },
        },
        include: {
          author: { select: { fullName: true, avatar: true } },
          thread: {
            select: {
              id: true,
              title: true,
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      result.posts = posts;
      result.pagination.postsTotal = await prisma.forumPost.count({
        where: {
          thread: {
            OR: [
              { courseId: { in: courseIds } },
              { authorId: session.user.id },
            ],
            isDeleted: false,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Instructor community error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch community data' }, { status: 500 });
  }
}
