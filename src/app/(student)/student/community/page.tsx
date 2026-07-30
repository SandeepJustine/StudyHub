import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, BookOpen, Search, Plus, ArrowRight, Clock, Eye, MessageCircle, User, Lock, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import { forumService } from '@/lib/community/forum-service';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentCommunityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Fetch from API
  let forums: any[] = [];
  let threads: any[] = [];
  let error: string | null = null;

  try {
    const [forumsResult, threadsResult] = await Promise.all([
      forumService.getForums(session.user.id),
      forumService.getThreads({ page: 1, limit: 10 }),
    ]);
    forums = forumsResult || [];
    threads = threadsResult.threads || [];
  } catch (err: any) {
    console.error('Failed to fetch community data:', err);
    error = err.message || 'Failed to load community data';
  }

  const totalThreads = forums.reduce((sum, f) => sum + (f.threadCount || 0), 0) + threads.length;
  const totalMembers = forums.reduce((sum, f) => sum + (f.memberCount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy/10 rounded-xl"><MessageSquare size={22} className="text-navy" /></div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Community</h1>
            <p className="text-sm text-grey-medium">Connect with other learners</p>
          </div>
        </div>
        <Link href="/student/community/new">
          <Button variant="primary" className="bg-green hover:bg-green-700">
            <Plus size={18} className="mr-1" /> New Discussion
          </Button>
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
          <AlertCircle size={16} />
          <span>{error}. Showing available data.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Discussions', v: totalThreads || 0, icon: <MessageSquare size={16} className="text-navy" />, bg: 'bg-navy/10' },
          { l: 'Members', v: totalMembers > 0 ? `${totalMembers}+` : '0', icon: <Users size={16} className="text-green" />, bg: 'bg-green-50' },
          { l: 'Forums', v: forums.length, icon: <BookOpen size={16} className="text-blue-600" />, bg: 'bg-blue-50' },
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

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
        <Input placeholder="Search discussions..." className="pl-10" />
      </div>

      {/* Forums Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy">Study Forums</h2>
          {forums.length > 0 && (
            <Link href="/student/community/forums">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>View All</Button>
            </Link>
          )}
        </div>

        {forums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {forums.map((forum) => (
              <Link key={forum.id} href={`/student/community/forum/${forum.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${forum.color || '#6b7280'}20` }}>
                          {forum.icon || '💬'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy text-sm group-hover:text-red transition-colors">{forum.name}</h3>
                          {forum.subject && <Badge size="sm" variant="info">{forum.subject}</Badge>}
                        </div>
                      </div>
                      {forum.isJoined && <Badge size="sm" variant="success">Joined</Badge>}
                      {!forum.isPublic && <Lock size={12} className="text-grey-medium" />}
                    </div>
                    {forum.description && <p className="text-xs text-grey-dark mb-2 line-clamp-2">{forum.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-grey-medium">
                      <span className="flex items-center gap-1"><MessageSquare size={11} />{forum.threadCount || 0} threads</span>
                      <span className="flex items-center gap-1"><Users size={11} />{forum.memberCount || 0} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <MessageSquare size={40} className="mx-auto text-grey-medium mb-3" />
              <h3 className="font-semibold text-navy mb-1">No Forums Yet</h3>
              <p className="text-sm text-grey-dark mb-4">Be the first to start a discussion and create a forum!</p>
              <Link href="/student/community/new">
                <Button variant="primary"><Plus size={14} className="mr-1" /> Start Discussion</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Threads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy">Recent Discussions</h2>
          {threads.length > 0 && (
            <Link href="/student/community/threads">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>View All</Button>
            </Link>
          )}
        </div>

        {threads.length > 0 ? (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/student/community/thread/${thread.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {thread.isPinned && <Badge size="sm" variant="warning">📌 Pinned</Badge>}
                          {thread.subject && <Badge size="sm" variant="neutral">{thread.subject}</Badge>}
                        </div>
                        <h3 className="font-semibold text-navy text-sm mb-1">{thread.title}</h3>
                        <p className="text-xs text-grey-dark mb-2 line-clamp-1">{thread.content}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-grey-medium">
                          <span className="flex items-center gap-1"><User size={11} />{thread.author?.fullName || 'Anonymous'}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(thread.createdAt)}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={11} />{thread._count?.posts || thread.postsCount || 0} replies</span>
                          <span className="flex items-center gap-1"><Eye size={11} />{thread.viewsCount || 0} views</span>
                        </div>
                        {thread.tags && thread.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {thread.tags.map((tag: string) => <Badge key={tag} size="sm" variant="neutral">{tag}</Badge>)}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-grey-medium mt-1 flex-shrink-0 ml-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <MessageSquare size={40} className="mx-auto text-grey-medium mb-3" />
              <h3 className="font-semibold text-navy mb-1">No Discussions Yet</h3>
              <p className="text-sm text-grey-dark mb-4">Be the first to start a discussion in the community!</p>
              <Link href="/student/community/new">
                <Button variant="primary"><Plus size={14} className="mr-1" /> Start Discussion</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}