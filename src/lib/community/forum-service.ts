import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class ForumService {
  async getForums(userId?: string) {
    try {
      const threads = await prisma.forumThread.findMany({
        where: { isDeleted: false },
        select: { subject: true },
        distinct: ['subject'],
      });
      const map = new Map<string, { subject: string; threadCount: number }>();
      for (const t of threads) {
        const s = t.subject || 'General';
        if (!map.has(s)) map.set(s, { subject: s, threadCount: 0 });
        map.get(s)!.threadCount++;
      }
      return Array.from(map.values()).map((f, i) => ({
        id: `forum-${i + 1}`,
        name: `${f.subject} Discussion`,
        slug: f.subject.toLowerCase().replace(/\s+/g, '-'),
        description: `Discuss ${f.subject} topics and share knowledge`,
        subject: f.subject,
        icon: this.getIcon(f.subject),
        color: this.getColor(f.subject),
        isPublic: true,
        threadCount: f.threadCount,
        memberCount: 0,
        isJoined: false,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching forums:', error);
      return [];
    }
  }

  async getThreads(params: {
    subject?: string;
    courseId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const { subject, courseId, page = 1, limit = 20, sortBy = 'latest' } = params;
    const where: any = { isDeleted: false };
    if (subject) where.subject = subject;
    if (courseId) where.courseId = courseId;
    const orderBy: any = {};
    if (sortBy === 'pinned') orderBy.isPinned = 'desc';
    else if (sortBy === 'popular') orderBy.viewsCount = 'desc';
    else orderBy.createdAt = 'desc';

    try {
      const [threads, total] = await Promise.all([
        prisma.forumThread.findMany({
          where,
          orderBy: [orderBy, { createdAt: 'desc' }],
          include: {
            author: { select: { fullName: true, avatar: true, role: true } },
            _count: { select: { posts: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.forumThread.count({ where }),
      ]);

      return {
        threads: threads.map((t) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          subject: t.subject,
          tags: t.tags,
          viewsCount: t.viewsCount,
          postsCount: t.postsCount,
          isPinned: t.isPinned,
          isLocked: t.isLocked,
          createdAt: t.createdAt,
          author: t.author,
          _count: t._count,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('Error fetching threads:', error);
      return { threads: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }

  async getThread(threadId: string) {
    try {
      const thread = await prisma.forumThread.findUnique({
        where: { id: threadId },
        include: {
          author: { select: { fullName: true, avatar: true, role: true } },
          posts: {
            where: { isDeleted: false },
            include: { author: { select: { fullName: true, avatar: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!thread) throw new NotFoundError('Thread');

      await prisma.forumThread.update({
        where: { id: threadId },
        data: { viewsCount: { increment: 1 } },
      });

      return {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        subject: thread.subject,
        tags: thread.tags,
        viewsCount: thread.viewsCount + 1,
        postsCount: thread.postsCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        createdAt: thread.createdAt,
        author: thread.author,
        posts: thread.posts.map((p) => ({
          id: p.id,
          content: p.content,
          likes: p.likes,
          isDeleted: p.isDeleted,
          createdAt: p.createdAt,
          author: p.author,
        })),
      };
    } catch (error) {
      console.error('Error fetching thread:', error);
      return null;
    }
  }

  async createThread(authorId: string, data: {
    subject?: string;
    courseId?: string;
    title: string;
    content: string;
    tags?: string[];
  }) {
    try {
      return await prisma.forumThread.create({
        data: {
          authorId,
          title: data.title,
          content: data.content,
          subject: data.subject,
          courseId: data.courseId,
          tags: data.tags || [],
        },
        include: {
          author: { select: { fullName: true, avatar: true, role: true } },
          _count: { select: { posts: true } },
        },
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new AppError('Failed to create thread', 'CREATE_FAILED', 500);
    }
  }

  async createReply(authorId: string, data: {
    threadId: string;
    content: string;
    parentId?: string;
  }) {
    try {
      const thread = await prisma.forumThread.findUnique({ where: { id: data.threadId } });
      if (!thread) throw new NotFoundError('Thread');
      if (thread.isLocked) throw new AppError('Thread is locked', 'THREAD_LOCKED', 403);

      const post = await prisma.forumPost.create({
        data: {
          threadId: data.threadId,
          authorId,
          content: data.content,
          parentId: data.parentId,
        },
        include: { author: { select: { fullName: true, avatar: true } } },
      });

      await prisma.forumThread.update({
        where: { id: data.threadId },
        data: { postsCount: { increment: 1 } },
      });

      return post;
    } catch (error: any) {
      if (error instanceof AppError || error instanceof NotFoundError) throw error;
      throw new AppError('Failed to create reply', 'CREATE_FAILED', 500);
    }
  }

  async togglePinThread(threadId: string) {
    const t = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!t) throw new NotFoundError('Thread');
    return prisma.forumThread.update({ where: { id: threadId }, data: { isPinned: !t.isPinned } });
  }

  async toggleLockThread(threadId: string) {
    const t = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!t) throw new NotFoundError('Thread');
    return prisma.forumThread.update({ where: { id: threadId }, data: { isLocked: !t.isLocked } });
  }

  async deletePost(postId: string) {
    const p = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!p) throw new NotFoundError('Post');
    return prisma.forumPost.update({ where: { id: postId }, data: { isDeleted: true } });
  }

  private getIcon(s: string): string {
    const icons: Record<string, string> = {
      Mathematics: '📐', Physics: '⚡', English: '📚',
      Chemistry: '🧪', Biology: '🧬', Accounting: '💼',
    };
    return icons[s] || '💬';
  }

  private getColor(s: string): string {
    const colors: Record<string, string> = {
      Mathematics: '#3b82f6', Physics: '#f59e0b', English: '#10b981',
      Chemistry: '#8b5cf6', Biology: '#ef4444', Accounting: '#6366f1',
    };
    return colors[s] || '#6b7280';
  }
}

export const forumService = new ForumService();
