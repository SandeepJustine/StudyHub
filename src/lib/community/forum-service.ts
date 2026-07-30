import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class ForumService {
  async getForums(userId?: string) {
    const forums = await prisma.forum.findMany({
      where: { isPublic: true },
      include: {
        _count: { select: { threads: true, subscriptions: true } },
        subscriptions: userId ? { where: { userId } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return forums.map((forum: any) => ({
      id: forum.id, name: forum.name, slug: forum.slug,
      description: forum.description, subject: forum.subject,
      icon: forum.icon || '💬', color: forum.color || '#6b7280',
      isPublic: forum.isPublic,
      threadCount: forum._count.threads,
      memberCount: forum._count.subscriptions,
      isJoined: userId ? forum.subscriptions?.length > 0 : false,
      createdAt: forum.createdAt,
    }));
  }

  async getThreads(params: {
    forumId?: string; subject?: string; page?: number; limit?: number; sortBy?: string;
  }) {
    const { forumId, subject, page = 1, limit = 10, sortBy = 'latest' } = params;
    const where: any = { isDeleted: false };
    if (forumId) where.forumId = forumId;
    if (subject) where.subject = subject;

    const orderBy: any = sortBy === 'pinned' ? { isPinned: 'desc' } 
      : sortBy === 'popular' ? { viewsCount: 'desc' } 
      : { createdAt: 'desc' };

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where, orderBy,
        include: {
          author: { select: { fullName: true, avatar: true, role: true } },
          _count: { select: { posts: true } },
        },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.forumThread.count({ where }),
    ]);

    return {
      threads: threads.map((t: any) => ({
        id: t.id, title: t.title, content: t.content, subject: t.subject,
        tags: t.tags, viewsCount: t.viewsCount, postsCount: t.postsCount,
        isPinned: t.isPinned, isLocked: t.isLocked, createdAt: t.createdAt,
        author: t.author, forumId: t.forumId, _count: t._count,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getThread(threadId: string) {
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
    await prisma.forumThread.update({ where: { id: threadId }, data: { viewsCount: { increment: 1 } } });
    return {
      id: thread.id, title: thread.title, content: thread.content,
      subject: thread.subject, tags: thread.tags,
      viewsCount: thread.viewsCount + 1, postsCount: thread.postsCount,
      isPinned: thread.isPinned, isLocked: thread.isLocked,
      createdAt: thread.createdAt, author: thread.author,
      posts: thread.posts.map((p: any) => ({
        id: p.id, content: p.content, likes: p.likes,
        isDeleted: p.isDeleted, createdAt: p.createdAt, author: p.author,
      })),
    };
  }

  async createThread(authorId: string, data: {
    forumId?: string; subject?: string; title: string; content: string; tags?: string[];
  }) {
    return prisma.forumThread.create({
      data: {
        authorId, forumId: data.forumId || null,
        title: data.title, content: data.content,
        subject: data.subject, tags: data.tags || [],
      },
      include: { author: { select: { fullName: true, avatar: true, role: true } } },
    });
  }

  async createReply(authorId: string, data: { threadId: string; content: string }) {
    const thread = await prisma.forumThread.findUnique({ where: { id: data.threadId } });
    if (!thread) throw new NotFoundError('Thread');
    if (thread.isLocked) throw new AppError('Thread is locked', 'THREAD_LOCKED', 403);
    const post = await prisma.forumPost.create({
      data: { threadId: data.threadId, authorId, content: data.content },
      include: { author: { select: { fullName: true, avatar: true } } },
    });
    await prisma.forumThread.update({ where: { id: data.threadId }, data: { postsCount: { increment: 1 } } });
    return post;
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
}

export const forumService = new ForumService();
