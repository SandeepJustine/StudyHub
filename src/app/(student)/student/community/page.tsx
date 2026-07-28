import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, BookOpen, Search, Plus, ArrowRight, Clock, Eye, MessageCircle, User, Lock } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Mock data for forums
const MOCK_FORUMS = [
  { id: '1', name: 'MSCE Mathematics', slug: 'msce-math', description: 'Discuss MSCE Mathematics topics, share tips and ask questions', subject: 'Mathematics', icon: '📐', color: '#3b82f6', isPublic: true, threadCount: 45, memberCount: 230, isJoined: true, createdAt: new Date() },
  { id: '2', name: 'Physics Study Group', slug: 'physics-group', description: 'Collaborate on physics problems and practical experiments', subject: 'Physics', icon: '⚡', color: '#f59e0b', isPublic: true, threadCount: 32, memberCount: 180, isJoined: false, createdAt: new Date() },
  { id: '3', name: 'English Literature', slug: 'english-lit', description: 'Analyze texts, share essays and prepare for literature exams', subject: 'English', icon: '📚', color: '#10b981', isPublic: true, threadCount: 28, memberCount: 150, isJoined: true, createdAt: new Date() },
  { id: '4', name: 'Chemistry Lab', slug: 'chemistry-lab', description: 'Discuss chemical reactions, equations and lab practicals', subject: 'Chemistry', icon: '🧪', color: '#8b5cf6', isPublic: true, threadCount: 20, memberCount: 120, isJoined: false, createdAt: new Date() },
  { id: '5', name: 'Biology Corner', slug: 'biology-corner', description: 'Explore life sciences, anatomy and ecosystem discussions', subject: 'Biology', icon: '🧬', color: '#ef4444', isPublic: true, threadCount: 25, memberCount: 160, isJoined: true, createdAt: new Date() },
  { id: '6', name: 'ICAM Study Hub', slug: 'icam-hub', description: 'Dedicated forum for ICAM professional examination preparation', subject: 'Accounting', icon: '💼', color: '#6366f1', isPublic: false, threadCount: 15, memberCount: 80, isJoined: false, createdAt: new Date() },
];

const MOCK_THREADS = [
  { id: '1', title: 'Tips for MSCE Mathematics Paper 1', content: 'Share your best strategies for tackling the multiple choice section!', subject: 'Mathematics', tags: ['MSCE', 'Mathematics', 'Exam Tips'], viewsCount: 156, postsCount: 12, isPinned: true, isLocked: false, createdAt: new Date(Date.now() - 3600000), author: { fullName: 'John Phiri', role: 'STUDENT' }, forum: { id: '1', name: 'MSCE Mathematics', slug: 'msce-math' }, _count: { posts: 12 } },
  { id: '2', title: 'Study Group - Form 4 Physics', content: 'Looking to form a study group for Physics. We can meet online twice a week!', subject: 'Physics', tags: ['Physics', 'Study Group'], viewsCount: 89, postsCount: 8, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 86400000), author: { fullName: 'Mary Banda', role: 'STUDENT' }, forum: { id: '2', name: 'Physics Study Group', slug: 'physics-group' }, _count: { posts: 8 } },
  { id: '3', title: 'Best Resources for English Literature', content: 'Share your favorite books, websites and videos for English Lit preparation!', subject: 'English', tags: ['English', 'Resources'], viewsCount: 234, postsCount: 15, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 172800000), author: { fullName: 'Grace Mwale', role: 'STUDENT' }, forum: { id: '3', name: 'English Literature', slug: 'english-lit' }, _count: { posts: 15 } },
  { id: '4', title: 'ICAM Exam Strategy Discussion', content: 'How are you preparing for the upcoming ICAM exams? Let\'s share strategies!', subject: 'Accounting', tags: ['ICAM', 'Strategy'], viewsCount: 67, postsCount: 6, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 259200000), author: { fullName: 'Peter Kamanga', role: 'STUDENT' }, forum: { id: '6', name: 'ICAM Study Hub', slug: 'icam-hub' }, _count: { posts: 6 } },
  { id: '5', title: 'Chemistry Practical Tips', content: 'Essential tips for acing your chemistry practical examinations!', subject: 'Chemistry', tags: ['Chemistry', 'Practical'], viewsCount: 198, postsCount: 22, isPinned: false, isLocked: false, createdAt: new Date(Date.now() - 432000000), author: { fullName: 'Dr. Sarah Mwenda', role: 'INSTRUCTOR' }, forum: { id: '4', name: 'Chemistry Lab', slug: 'chemistry-lab' }, _count: { posts: 22 } },
];

export default async function StudentCommunityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Use mock data directly to avoid API dependency issues
  const forums = MOCK_FORUMS;
  const recentThreads = MOCK_THREADS;
  const totalThreads = forums.reduce((sum, f) => sum + f.threadCount, 0);
  const totalMembers = forums.reduce((sum, f) => sum + f.memberCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy/10 rounded-xl"><MessageSquare size={22} className="text-navy" /></div>
          <div><h1 className="text-2xl font-bold text-navy">Community</h1><p className="text-sm text-grey-medium">Connect with other learners</p></div>
        </div>
        <Link href="/student/community/new">
          <Button variant="primary" className="bg-green hover:bg-green-700"><Plus size={18} className="mr-1" /> New Discussion</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l:'Discussions', v:totalThreads, i:<MessageSquare size={16} className="text-navy" />, b:'bg-navy/10' },
          { l:'Members', v:`${totalMembers}+`, i:<Users size={16} className="text-green" />, b:'bg-green-50' },
          { l:'Forums', v:forums.length, i:<BookOpen size={16} className="text-blue-600" />, b:'bg-blue-50' },
        ].map((s,i) => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" /><Input placeholder="Search discussions..." className="pl-10" /></div>

      {/* Forums Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy">Study Forums</h2>
          <Link href="/student/community/forums"><Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>View All</Button></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forums.map((forum) => (
            <Link key={forum.id} href={`/student/community/forum/${forum.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${forum.color}20` }}>{forum.icon}</div>
                      <div>
                        <h3 className="font-semibold text-navy text-sm group-hover:text-red transition-colors">{forum.name}</h3>
                        {forum.subject && <Badge size="sm" variant="info">{forum.subject}</Badge>}
                      </div>
                    </div>
                    {forum.isJoined && <Badge size="sm" variant="success">Joined</Badge>}
                    {!forum.isPublic && <Lock size="sm" className="text-grey-medium" />}
                  </div>
                  {forum.description && <p className="text-xs text-grey-dark mb-2 line-clamp-2">{forum.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-grey-medium">
                    <span className="flex items-center gap-1"><MessageSquare size={11} />{forum.threadCount} threads</span>
                    <span className="flex items-center gap-1"><Users size={11} />{forum.memberCount} members</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Threads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy">Recent Discussions</h2>
          <Link href="/student/community/threads"><Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>View All</Button></Link>
        </div>
        <div className="space-y-2">
          {recentThreads.map((thread) => (
            <Link key={thread.id} href={`/student/community/thread/${thread.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && <Badge size="sm" variant="warning">📌 Pinned</Badge>}
                        {thread.forum && <Badge size="sm" variant="neutral">{thread.forum.name}</Badge>}
                      </div>
                      <h3 className="font-semibold text-navy text-sm mb-1">{thread.title}</h3>
                      <p className="text-xs text-grey-dark mb-2 line-clamp-1">{thread.content}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-grey-medium">
                        <span className="flex items-center gap-1"><User size={11} />{thread.author?.fullName}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(thread.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} />{thread._count.posts} replies</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{thread.viewsCount} views</span>
                      </div>
                      {thread.tags && <div className="flex gap-1 mt-1.5">{thread.tags.map((tag: string) => <Badge key={tag} size="sm" variant="neutral">{tag}</Badge>)}</div>}
                    </div>
                    <ArrowRight size={14} className="text-grey-medium mt-1 flex-shrink-0 ml-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}