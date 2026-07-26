import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class ForumService {
  /**
   * Create discussion thread
   */
  async createThread(authorId: string, data: {
    subject?: string;
    courseId?: string;
    title: string;
    content: string;
    tags?: string[];
    isAnnouncement?: boolean;
  }) {
    // If course-specific, verify enrollment
    if (data.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          courseId: data.courseId,
          student: { userId: authorId },
        },
      });

      if (!enrollment) {
        throw new AppError('Must be enrolled to post in course forum', 'NOT_ENROLLED', 403);
      }
    }

    const thread = await prisma.forumThread.create({
      data: {
        ...data,
        authorId,
        tags: data.tags || [],
      },
      include: {
        author: {
          select: { fullName: true, avatar: true, role: true },
        },
        _count: { select: { posts: true } },
      },
    });

    return thread;
  }

  /**
   * Get threads with filters
   */
  async getThreads(params: {
    subject?: string;
    courseId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'pinned';
  }) {
    const { subject, courseId, page = 1, limit = 20, sortBy = 'latest' } = params;

    const where: any = {
      isDeleted: false,
    };
    if (subject) where.subject = subject;
    if (courseId) where.courseId = courseId;

    const orderBy: any = {};
    if (sortBy === 'pinned') orderBy.isPinned = 'desc';
    else if (sortBy === 'popular') orderBy.viewsCount = 'desc';
    else orderBy.createdAt = 'desc';

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [orderBy, { createdAt: 'desc' }],
        include: {
          author: {
            select: { fullName: true, avatar: true, role: true },
          },
          _count: { select: { posts: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.forumThread.count({ where }),
    ]);

    return {
      threads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get thread with posts
   */
  async getThread(threadId: string) {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: { fullName: true, avatar: true, role: true },
        },
        posts: {
          include: {
            author: {
              select: { fullName: true, avatar: true, role: true },
            },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) throw new NotFoundError('Thread');

    // Increment view count
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { viewsCount: { increment: 1 } },
    });

    return thread;
  }

  /**
   * Reply to thread
   */
  async createReply(authorId: string, data: {
    threadId: string;
    content: string;
    parentId?: string;
  }) {
    const thread = await prisma.forumThread.findUnique({
      where: { id: data.threadId },
    });

    if (!thread) throw new NotFoundError('Thread');
    if (thread.isLocked) {
      throw new AppError('Thread is locked', 'THREAD_LOCKED', 403);
    }

    const post = await prisma.forumPost.create({
      data: {
        threadId: data.threadId,
        authorId,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: { fullName: true, avatar: true },
        },
      },
    });

    // Update thread post count
    await prisma.forumThread.update({
      where: { id: data.threadId },
      data: { postsCount: { increment: 1 } },
    });

    return post;
  }

  /**
   * Moderate post (flag, delete)
   */
  async moderatePost(postId: string, moderatorId: string, action: 'flag' | 'delete' | 'hide') {
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundError('Post');

    switch (action) {
      case 'delete':
        return prisma.forumPost.update({
          where: { id: postId },
          data: { isDeleted: true },
        });
      case 'hide':
        return prisma.forumPost.update({
          where: { id: postId },
          data: { isDeleted: true }, // Soft delete
        });
      default:
        return post;
    }
  }

  /**
   * Pin/unpin thread (moderator)
   */
  async togglePinThread(threadId: string, moderatorId: string) {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) throw new NotFoundError('Thread');

    return prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    });
  }

  /**
   * Lock/unlock thread (moderator)
   */
  async toggleLockThread(threadId: string, moderatorId: string) {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) throw new NotFoundError('Thread');

    return prisma.forumThread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
    });
  }
}