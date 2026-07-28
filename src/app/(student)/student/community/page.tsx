'use client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, BookOpen, Eye, Clock, User, Plus, Search, ArrowRight, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Force dynamic rendering for this page
export default async function StudentCommunityPage() {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Session error:', error);
    redirect('/auth/login');
  }
  
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Use mock data to avoid prisma issues if database isn't available
  const threads = [
    { 
      id: '1', 
      title: 'Tips for MSCE Mathematics', 
      content: 'Share your best study tips for the upcoming MSCE Math exam! Let\'s help each other succeed.', 
      author: { fullName: 'John Phiri' }, 
      _count: { posts: 12 }, 
      viewsCount: 156, 
      createdAt: new Date(Date.now() - 3600000), 
      tags: ['Mathematics', 'MSCE', 'Exam Tips'] 
    },
    { 
      id: '2', 
      title: 'Study Group - Form 4 Physics', 
      content: 'Looking to form a study group for Physics. Anyone interested in joining? We can meet online twice a week.', 
      author: { fullName: 'Mary Banda' }, 
      _count: { posts: 8 }, 
      viewsCount: 89, 
      createdAt: new Date(Date.now() - 86400000), 
      tags: ['Physics', 'Study Group', 'Form 4'] 
    },
    { 
      id: '3', 
      title: 'Best resources for English Literature', 
      content: 'What are your recommended resources for English Lit? Books, websites, videos - share them all!', 
      author: { fullName: 'Grace Mwale' }, 
      _count: { posts: 15 }, 
      viewsCount: 234, 
      createdAt: new Date(Date.now() - 172800000), 
      tags: ['English', 'Resources', 'Literature'] 
    },
    { 
      id: '4', 
      title: 'ICAM Exam Preparation Strategy', 
      content: 'How are you preparing for the ICAM exams? Let\'s share strategies and study schedules!', 
      author: { fullName: 'Peter Kamanga' }, 
      _count: { posts: 6 }, 
      viewsCount: 67, 
      createdAt: new Date(Date.now() - 259200000), 
      tags: ['ICAM', 'Exam Prep', 'Strategy'] 
    },
    { 
      id: '5', 
      title: 'Welcome! Introduce Yourself', 
      content: 'New to StudyHub? Introduce yourself here and tell us what you\'re studying!', 
      author: { fullName: 'Platform Admin' }, 
      _count: { posts: 45 }, 
      viewsCount: 567, 
      createdAt: new Date(Date.now() - 604800000), 
      tags: ['Welcome', 'Introduction'] 
    },
  ];

  const threadCount = threads.length;
  const userCount = 10500;

  return (
    <div className="min-h-screen bg-grey-light">
      {/* Header */}
      <div className="bg-navy text-white p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins">Community</h1>
            <p className="text-slate-300 mt-2 text-lg">Connect with other learners and share knowledge</p>
          </div>
          <Link href="/student/community/new">
            <Button variant="primary" className="bg-green hover:bg-green-700">
              <Plus size={20} className="mr-2" /> New Discussion
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-navy/10 rounded-lg">
                <MessageSquare size={24} className="text-navy" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Discussions</p>
                <p className="text-2xl font-bold text-navy">{threadCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users size={24} className="text-green" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Members</p>
                <p className="text-2xl font-bold text-navy">{userCount.toLocaleString()}+</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-grey-medium">Study Groups</p>
                <p className="text-2xl font-bold text-navy">12</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
            <Input placeholder="Search discussions..." className="pl-10" />
          </div>
        </div>

        {/* Discussion Threads */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">Recent Discussions</h2>
            <Link href="/student/community/all">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/student/community/thread/${thread.id}`}>
                <Card hover padding="md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy mb-1">{thread.title}</h3>
                      <p className="text-sm text-grey-dark mb-3 line-clamp-1">{thread.content}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-grey-medium">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {thread.author?.fullName || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatRelativeTime(thread.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          {thread._count?.posts || 0} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {thread.viewsCount || 0} views
                        </span>
                      </div>

                      {thread.tags && thread.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {thread.tags.map((tag: string) => (
                            <Badge key={tag} size="sm" variant="neutral">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-grey-medium mt-1 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}