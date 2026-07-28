import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, TrendingUp, Award, ChevronRight, Play, Star, GraduationCap, Target } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export default async function StudentDashboard() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({ where: { userId: session.user.id }, select: { id: true, grade: true, examBoard: true } });
  if (!student) return <div className="min-h-screen bg-grey-light flex items-center justify-center"><p className="text-grey-dark">Student profile not found.</p></div>;

  let enrollments: any[] = []; let examAttempts: any[] = [];
  try {
    enrollments = await prisma.enrollment.findMany({ where: { studentId: student.id }, include: { course: { include: { instructor: { include: { user: { select: { fullName: true } } } } } } }, orderBy: { lastAccessedAt: 'desc' }, take: 5 });
    examAttempts = await prisma.examAttempt.findMany({ where: { studentId: student.id }, include: { quiz: { include: { module: { include: { course: { select: { title: true } } } } } } }, orderBy: { completedAt: 'desc' }, take: 5 });
  } catch {}

  const active = enrollments.filter(e => !e.completedAt);
  const completed = enrollments.filter(e => e.completedAt);
  const avgProgress = active.length > 0 ? Math.round(active.reduce((s, e) => s + e.progress, 0) / active.length) : 0;
  const hours = Math.round((examAttempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / 60) * 10) / 10;

  return (
    <div className="min-h-screen bg-grey-light p-6 space-y-6">
      <Card className="bg-gradient-to-r from-white to-grey-light border-0 shadow-sm"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center"><span className="text-2xl font-bold text-navy">{session.user.name?.charAt(0)?.toUpperCase()}</span></div><div><h1 className="text-2xl font-bold text-navy">Hello, {session.user.name?.split(' ')[0]}! 👋</h1><p className="text-grey-dark mt-1">Ready to continue learning today?</p>{student.grade && <div className="flex gap-2 mt-2"><Badge variant="neutral" size="sm">{student.grade}</Badge>{student.examBoard && <Badge variant="neutral" size="sm">{student.examBoard}</Badge>}</div>}</div></div><Link href="/student/courses"><Button variant="primary" rightIcon={<ChevronRight size={16} />}>Browse Courses</Button></Link></div></CardContent></Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Courses', value: active.length, icon: <BookOpen size={20} className="text-green" />, bg: 'bg-green-100' },{ label: 'Completed', value: completed.length, icon: <Award size={20} className="text-blue-600" />, bg: 'bg-blue-100' },{ label: 'Avg Progress', value: `${avgProgress}%`, icon: <TrendingUp size={20} className="text-yellow-600" />, bg: 'bg-yellow-100' },{ label: 'Study Hours', value: `${hours}h`, icon: <Clock size={20} className="text-red" />, bg: 'bg-red-100' }].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><div className={`p-2.5 rounded-xl ${stat.bg}`}>{stat.icon}</div><p className="text-sm font-medium text-grey-medium">{stat.label}</p></div><p className="text-3xl font-bold text-navy">{stat.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-navy flex items-center gap-2"><BookOpen size={18} className="text-green" />Active Courses</h2><Link href="/student/courses"><Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button></Link></div>
          <div className="space-y-3">
            {active.length > 0 ? active.map((enrollment) => (
              <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}`}><Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-navy group-hover:text-red transition-colors">{enrollment.course.title}</h3>{enrollment.certificateId && <Badge variant="success" size="sm">Certified</Badge>}</div><p className="text-sm text-grey-medium">{enrollment.course.subject} • {enrollment.course.instructor?.user?.fullName || 'Unknown'}</p><div className="mt-3"><div className="flex items-center justify-between text-xs mb-1.5"><span className="text-grey-medium">Progress</span><span className="font-semibold text-navy">{enrollment.progress}%</span></div><div className="w-full bg-grey-light rounded-full h-2"><div className="bg-green rounded-full h-2 transition-all duration-500" style={{ width: `${enrollment.progress}%` }} /></div></div></div><Button variant="primary" size="sm" className="ml-4 flex-shrink-0"><Play size={14} className="mr-1" /> Continue</Button></div></CardContent></Card></Link>
            )) : <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><BookOpen size={40} className="mx-auto text-grey-medium mb-3" /><h3 className="font-semibold text-navy mb-1">No active courses</h3><p className="text-sm text-grey-dark mb-4">Start learning by enrolling</p><Link href="/student/courses"><Button variant="primary">Browse Courses</Button></Link></CardContent></Card>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-navy flex items-center gap-2"><Target size={18} className="text-red" />Recent Exams</h2><Link href="/student/exams"><Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>View All</Button></Link></div>
          <div className="space-y-3">
            {examAttempts.length > 0 ? examAttempts.slice(0, 5).map((a) => (
              <Card key={a.id} className="border-0 shadow-sm hover:shadow-md"><CardContent className="p-4"><div className="flex items-start justify-between"><div className="min-w-0"><h4 className="font-medium text-navy text-sm truncate">{a.quiz?.title || 'Unknown'}</h4><p className="text-xs text-grey-medium mt-0.5">{a.quiz?.module?.course?.title || 'Unknown'}</p><p className="text-xs text-grey-medium mt-1">{a.completedAt ? formatRelativeTime(a.completedAt) : 'In progress'}</p></div><div className="text-right ml-3"><p className={`text-lg font-bold ${a.passed ? 'text-green' : 'text-red'}`}>{a.score}%</p><Badge variant={a.passed ? 'success' : 'error'} size="sm">{a.passed ? 'Pass' : 'Fail'}</Badge></div></div></CardContent></Card>
            )) : <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center"><Target size={32} className="mx-auto text-grey-medium mb-2" /><h4 className="font-semibold text-navy text-sm mb-1">No exams yet</h4><Link href="/student/exams"><Button variant="primary" size="sm">Take an Exam</Button></Link></CardContent></Card>}
          </div>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><h3 className="font-semibold text-navy text-sm mb-3">Quick Links</h3><div className="space-y-2"><Link href="/student/certificates" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy"><Award size={14} />My Certificates</Link><Link href="/student/lab" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy"><Star size={14} />Virtual Lab</Link><Link href="/student/community" className="flex items-center gap-2 text-sm text-grey-dark hover:text-navy"><GraduationCap size={14} />Community</Link></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
