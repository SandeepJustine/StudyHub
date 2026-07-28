import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, User, Clock, Eye, Pin, Lock, Plus } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const FORUM_THREADS: Record<string, any[]> = {
  'forum-1': [
    { id: '1', title: 'Tips for MSCE Math Paper 1', content: 'Share your best strategies!', author: { fullName: 'John Phiri', role: 'STUDENT' }, _count: { posts: 12 }, viewsCount: 156, isPinned: true, isLocked: false, createdAt: new Date(Date.now() - 3600000), tags: ['MSCE', 'Math'] },
    { id: '2', title: 'Algebra Problem Solving', content: 'Need help with quadratic equations', author: { fullName: 'Mary Banda', role: 'STUDENT' }, _count: { posts: 5 }, viewsCount: 67, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 86400000), tags: ['Algebra'] },
    { id: '3', title: 'Geometry Tips & Tricks', content: 'Best ways to remember formulas', author: { fullName: 'Peter Kamanga', role: 'STUDENT' }, _count: { posts: 8 }, viewsCount: 89, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 172800000), tags: ['Geometry'] },
  ],
  'forum-2': [
    { id: '4', title: 'Study Group - Form 4 Physics', content: 'Looking for study group members', author: { fullName: 'Grace Mwale', role: 'STUDENT' }, _count: { posts: 8 }, viewsCount: 89, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 86400000), tags: ['Physics', 'Study Group'] },
  ],
  'forum-3': [
    { id: '5', title: 'Best English Resources', content: 'Share your favorite books', author: { fullName: 'John Phiri', role: 'STUDENT' }, _count: { posts: 15 }, viewsCount: 234, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 172800000), tags: ['English', 'Resources'] },
  ],
};

const FORUM_INFO: Record<string, any> = {
  'forum-1': { id: 'forum-1', name: 'MSCE Mathematics', slug: 'msce-math', description: 'Discuss MSCE Mathematics topics, share tips and ask questions', subject: 'Mathematics', icon: '📐', color: '#3b82f6', threadCount: 45, memberCount: 230 },
  'forum-2': { id: 'forum-2', name: 'Physics Study Group', slug: 'physics-group', description: 'Collaborate on physics problems and practical experiments', subject: 'Physics', icon: '⚡', color: '#f59e0b', threadCount: 32, memberCount: 180 },
  'forum-3': { id: 'forum-3', name: 'English Literature', slug: 'english-lit', description: 'Analyze texts, share essays and prepare for exams', subject: 'English', icon: '📚', color: '#10b981', threadCount: 28, memberCount: 150 },
  'forum-4': { id: 'forum-4', name: 'Chemistry Lab', slug: 'chemistry-lab', description: 'Discuss chemical reactions and lab practicals', subject: 'Chemistry', icon: '🧪', color: '#8b5cf6', threadCount: 20, memberCount: 120 },
  'forum-5': { id: 'forum-5', name: 'Biology Corner', slug: 'biology-corner', description: 'Explore life sciences and ecosystem discussions', subject: 'Biology', icon: '🧬', color: '#ef4444', threadCount: 25, memberCount: 160 },
  'forum-6': { id: 'forum-6', name: 'ICAM Study Hub', slug: 'icam-hub', description: 'ICAM professional examination preparation', subject: 'Accounting', icon: '💼', color: '#6366f1', threadCount: 15, memberCount: 80 },
};

interface ForumPageProps {
  params: Promise<{ forumId: string }>;
}

export async function generateMetadata({ params }: ForumPageProps) {
  const { forumId } = await params;
  const forum = FORUM_INFO[forumId];
  return {
    title: forum ? `${forum.name} - StudyHub Community` : 'Forum - StudyHub',
    description: forum?.description || 'Join the discussion',
  };
}

export default async function ForumPage({ params }: ForumPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { forumId } = await params;
  const forum = FORUM_INFO[forumId];
  const threads = FORUM_THREADS[forumId] || [];

  if (!forum) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-navy">Forum Not Found</h2>
        <Link href="/student/community"><Button variant="primary" className="mt-3">Back to Community</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/student/community" className="text-grey-medium hover:text-navy flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> Back to Community
      </Link>

      {/* Forum Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${forum.color}20` }}>
                {forum.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy">{forum.name}</h1>
                <p className="text-sm text-grey-dark mt-1">{forum.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-grey-medium">
                  <span className="flex items-center gap-1"><MessageSquare size={12} />{forum.threadCount} threads</span>
                  <span className="flex items-center gap-1"><User size={12} />{forum.memberCount} members</span>
                </div>
              </div>
            </div>
            <Link href={`/student/community/new?forum=${forumId}`}>
              <Button variant="primary" size="sm"><Plus size={14} className="mr-1" />New Thread</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Threads */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3">Threads ({threads.length})</h2>
        <div className="space-y-2">
          {threads.length > 0 ? threads.map((thread) => (
            <Link key={thread.id} href={`/student/community/thread/${thread.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && <Badge size="sm" variant="warning"><Pin size={10} className="mr-0.5" />Pinned</Badge>}
                        {thread.isLocked && <Badge size="sm" variant="error"><Lock size={10} className="mr-0.5" />Locked</Badge>}
                      </div>
                      <h3 className="font-semibold text-navy text-sm mb-1">{thread.title}</h3>
                      <p className="text-xs text-grey-dark mb-2 line-clamp-1">{thread.content}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-grey-medium">
                        <span className="flex items-center gap-1"><User size={11} />{thread.author.fullName}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(thread.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} />{thread._count.posts} replies</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{thread.viewsCount} views</span>
                      </div>
                      {thread.tags && <div className="flex gap-1 mt-1.5">{thread.tags.map((tag: string) => <Badge key={tag} size="sm" variant="neutral">{tag}</Badge>)}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )) : (
            <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><MessageSquare size={32} className="mx-auto text-grey-medium mb-2" /><p className="text-sm text-grey-dark">No threads yet. Start a discussion!</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}