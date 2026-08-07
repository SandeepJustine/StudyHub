import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { MessageSquare, Plus, Search, User, Clock, Pin, Megaphone, Send, ArrowRight, Eye } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import prisma from '@/lib/utils/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstructorCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; course?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const type = params.type || 'all';
  const courseFilter = params.course || undefined;

  let data: any = null;
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);

    // Fetch instructor's courses
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: instructor.id, status: { not: 'ARCHIVED' } },
      select: { id: true, title: true, subject: true, _count: { select: { enrollments: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    const courseIds = instructorCourses.map((c) => c.id);

    // Build thread filter
    const threadWhere: any = {
      isDeleted: false,
      OR: [
        { courseId: courseFilter ? courseFilter : { in: courseIds } },
        { authorId: session.user.id },
      ],
    };

    // Fetch threads
    const threads = await prisma.forumThread.findMany({
      where: threadWhere,
      include: {
        forum: { select: { name: true, subject: true, color: true } },
        course: { select: { title: true, subject: true } },
        author: { select: { fullName: true, avatar: true, role: true } },
        _count: { select: { posts: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });

    // Fetch recent posts
    const posts = await prisma.forumPost.findMany({
      where: {
        isDeleted: false,
        thread: { isDeleted: false },
        OR: [
          { thread: { courseId: { in: courseIds } } },
          { authorId: session.user.id },
        ],
      },
      include: {
        author: { select: { fullName: true, avatar: true, role: true } },
        thread: {
          select: { id: true, title: true, course: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Count stats
    const [totalThreads, totalPosts, announcementCount] = await Promise.all([
      prisma.forumThread.count({ where: { courseId: { in: courseIds }, isDeleted: false } }),
      prisma.forumPost.count({ where: { thread: { courseId: { in: courseIds } }, isDeleted: false } }),
      prisma.forumThread.count({ where: { courseId: { in: courseIds }, isDeleted: false, isPinned: true } }),
    ]);

    data = {
      courses: instructorCourses,
      threads,
      posts,
      stats: { totalThreads, totalPosts, announcementCount, courseCount: instructorCourses.length },
    };
  } catch (e: any) {
    console.error('Community error:', e);
    error = e.message || 'Failed to load community data';
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy/10 rounded-xl">
            <MessageSquare size={22} className="text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Community</h1>
            <p className="text-sm text-grey-medium">Manage discussions in your course forums</p>
          </div>
        </div>
        <Link href="/instructor/community/new">
          <Button variant="primary" leftIcon={<Megaphone size={16} />}>
            Create Announcement
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'My Courses', v: data.stats.courseCount, icon: <MessageSquare size={16} className="text-navy" />, bg: 'bg-navy/10' },
            { l: 'Threads', v: data.stats.totalThreads, icon: <MessageSquare size={16} className="text-blue-600" />, bg: 'bg-blue-50' },
            { l: 'Replies', v: data.stats.totalPosts, icon: <MessageSquare size={16} className="text-green" />, bg: 'bg-green-50' },
            { l: 'Announcements', v: data.stats.announcementCount, icon: <Pin size={16} className="text-purple-600" />, bg: 'bg-purple-50' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className={`p-1.5 rounded-lg ${s.bg} inline-block mb-1`}>{s.icon}</div>
                <p className="text-xl font-bold text-navy">{s.v}</p>
                <p className="text-xs text-grey-medium">{s.l}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Filter */}
      {data?.courses && data.courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/instructor/community?type=all"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !courseFilter ? 'bg-navy text-white' : 'bg-white text-grey-dark border border-grey-light hover:bg-navy/5'
            }`}
          >
            All Courses
          </Link>
          {data.courses.map((course: any) => (
            <Link
              key={course.id}
              href={`/instructor/community?course=${course.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                courseFilter === course.id ? 'bg-navy text-white' : 'bg-white text-grey-dark border border-grey-light hover:bg-navy/5'
              }`}
            >
              {course.title} ({course._count?.enrollments || 0})
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'threads', label: 'Threads' },
          { id: 'posts', label: 'Recent Replies' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/instructor/community?type=${tab.id}${courseFilter ? `&course=${courseFilter}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              type === tab.id
                ? 'bg-navy text-white'
                : 'bg-white text-grey-dark hover:bg-navy/5 border border-grey-light'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Threads */}
      {(type === 'all' || type === 'threads') && (
        <div>
          <h2 className="text-base font-bold text-navy mb-3">
            {courseFilter ? 'Course Discussions' : 'All Discussions'} ({data?.threads?.length || 0})
          </h2>
          <div className="space-y-3">
            {data?.threads && data.threads.length > 0 ? (
              data.threads.map((thread: any) => (
                <Link key={thread.id} href={`/instructor/community/thread/${thread.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.isPinned && <Badge size="sm" variant="warning"><Pin size={10} className="mr-0.5" />Pinned</Badge>}
                            {thread.course && <Badge size="sm" variant="neutral">{thread.course.title}</Badge>}
                            {thread.forum && <Badge size="sm" variant="info">{thread.forum.name || thread.forum.subject}</Badge>}
                          </div>
                          <h3 className="font-semibold text-navy text-sm mb-1">{thread.title}</h3>
                          <p className="text-xs text-grey-dark mb-2 line-clamp-1">{thread.content}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-grey-medium">
                            <span className="flex items-center gap-1"><User size={11} />{thread.author?.fullName}</span>
                            <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(thread.createdAt)}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={11} />{thread._count?.posts || 0} replies</span>
                            <span className="flex items-center gap-1"><Eye size={11} />{thread.viewsCount || 0} views</span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-grey-medium mt-1 flex-shrink-0 ml-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <MessageSquare size={40} className="mx-auto text-grey-medium mb-3" />
                  <h3 className="font-semibold text-navy mb-1">No Discussions Yet</h3>
                  <p className="text-sm text-grey-dark">Discussions will appear when students start asking questions in your courses.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      {(type === 'all' || type === 'posts') && (
        <div>
          <h2 className="text-base font-bold text-navy mb-3">Recent Replies ({data?.posts?.length || 0})</h2>
          <div className="space-y-2">
            {data?.posts && data.posts.length > 0 ? (
              data.posts.map((post: any) => (
                <Link key={post.id} href={`/instructor/community/thread/${post.thread?.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-navy">{post.author?.fullName || 'Anonymous'}</span>
                            <span className="text-xs text-grey-medium">replied to</span>
                            <span className="text-xs text-navy truncate">{post.thread?.title}</span>
                          </div>
                          <p className="text-xs text-grey-dark line-clamp-1">{post.content}</p>
                          <span className="text-xs text-grey-medium">{formatRelativeTime(post.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-grey-dark">No recent replies found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}