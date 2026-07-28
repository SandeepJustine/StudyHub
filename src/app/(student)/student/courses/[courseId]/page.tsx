import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Users, Star, Play, FileText, CheckCircle, Lock, ChevronRight, GraduationCap } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/utils/formatters';
import Link from 'next/link';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);
  const { courseId } = await params;

  const student = await prisma.student.findFirst({ where: { userId: session.user.id }, select: { id: true } });
  if (!student) return <div className="min-h-screen bg-grey-light flex items-center justify-center"><p>Student profile not found.</p></div>;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { include: { user: { select: { fullName: true } } } },
      modules: { orderBy: { order: 'asc' }, include: { quiz: { select: { id: true, title: true, questionsCount: true } } } },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) return <div className="min-h-screen bg-grey-light flex items-center justify-center"><div className="text-center"><BookOpen size={48} className="mx-auto text-grey-medium mb-4" /><h2 className="text-xl font-bold text-navy mb-2">Course Not Found</h2><Link href="/student/courses"><Button variant="primary">Browse Courses</Button></Link></div></div>;

  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: student.id, courseId } });
  const isEnrolled = !!enrollment;

  return (
    <div className="min-h-screen bg-grey-light">
      <div className="bg-white border-b p-4"><div className="max-w-7xl mx-auto"><Link href="/student/courses" className="text-grey-medium hover:text-navy flex items-center gap-1 text-sm"><ArrowLeft size={16} /> Back to Courses</Link></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex gap-2 mb-3"><Badge variant="info">{course.subject}</Badge>{course.examBoard && <Badge variant="neutral">{course.examBoard}</Badge>}</div>
              <h1 className="text-3xl font-bold text-navy mb-3">{course.title}</h1>
              <p className="text-grey-dark mb-4">{course.description}</p>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl"><div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center"><GraduationCap size={24} className="text-navy" /></div><div><p className="font-semibold text-navy">{course.instructor?.user?.fullName || 'Unknown'}</p><p className="text-sm text-grey-medium">Course Instructor</p></div></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Card><CardContent className="p-3 text-center"><Clock size={20} className="mx-auto text-navy mb-1" /><p className="text-lg font-bold text-navy">{formatDuration(course.duration || 0)}</p><p className="text-xs text-grey-medium">Duration</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><BookOpen size={20} className="mx-auto text-navy mb-1" /><p className="text-lg font-bold text-navy">{course.modules.length}</p><p className="text-xs text-grey-medium">Modules</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><Users size={20} className="mx-auto text-navy mb-1" /><p className="text-lg font-bold text-navy">{course._count.enrollments}</p><p className="text-xs text-grey-medium">Students</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><Star size={20} className="mx-auto text-yellow-500 mb-1" /><p className="text-lg font-bold text-navy">{course.rating > 0 ? course.rating.toFixed(1) : 'N/A'}</p><p className="text-xs text-grey-medium">Rating</p></CardContent></Card>
            </div>
            <div><h2 className="text-xl font-bold text-navy mb-4">Course Content</h2>
              <div className="space-y-3">
                {course.modules.map((mod, i) => (
                  <Card key={mod.id} padding="md"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-sm font-bold text-navy">{i + 1}</div><div><h3 className="font-semibold text-navy">{mod.title}</h3><div className="flex items-center gap-3 mt-1"><Badge size="sm" variant="neutral">{mod.contentType}</Badge>{mod.duration && <span className="text-xs text-grey-medium"><Clock size={12} /> {mod.duration} min</span>}{mod.quiz && <span className="text-xs text-blue-600"><FileText size={12} /> {mod.quiz.questionsCount} questions</span>}</div></div></div>{mod.isPreview || isEnrolled ? <Button variant="ghost" size="sm"><Play size={14} className="mr-1" /> Preview</Button> : <Lock size={16} className="text-grey-medium" />}</div></Card>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="sticky top-24"><CardContent className="p-6">
              <div className="text-center mb-4">{course.price > 0 ? <><p className="text-3xl font-bold text-navy">{formatCurrency(course.price)}</p><p className="text-sm text-grey-medium">One-time purchase</p></> : <><p className="text-3xl font-bold text-green">Free</p><p className="text-sm text-grey-medium">No payment required</p></>}</div>
              {isEnrolled ? (
                <div className="space-y-3"><div className="p-3 bg-green-50 rounded-lg text-center"><CheckCircle size={20} className="mx-auto text-green mb-1" /><p className="font-medium text-green">You're enrolled!</p>{enrollment.progress > 0 && <div className="mt-2"><div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{enrollment.progress}%</span></div><div className="w-full bg-grey-light rounded-full h-1.5"><div className="bg-green rounded-full h-1.5" style={{ width: `${enrollment.progress}%` }} /></div></div>}</div><Link href={`/student/courses/${courseId}/learn`}><Button variant="primary" fullWidth size="lg">Continue Learning <ChevronRight size={20} className="ml-1" /></Button></Link></div>
              ) : (
                <div className="space-y-3"><Button variant="primary" fullWidth size="lg">{course.price > 0 ? 'Enroll Now' : 'Start Learning Free'}</Button><Button variant="outline" fullWidth>Add to Wishlist</Button></div>
              )}
              <div className="mt-6 space-y-2"><h4 className="font-semibold text-navy text-sm">This course includes:</h4><ul className="space-y-1.5"><li className="flex items-center gap-2 text-sm text-grey-dark"><CheckCircle size={14} className="text-green" /> {course.modules.length} modules</li><li className="flex items-center gap-2 text-sm text-grey-dark"><CheckCircle size={14} className="text-green" /> {course.modules.filter(m => m.quiz).length} quizzes</li><li className="flex items-center gap-2 text-sm text-grey-dark"><CheckCircle size={14} className="text-green" /> Certificate of completion</li><li className="flex items-center gap-2 text-sm text-grey-dark"><CheckCircle size={14} className="text-green" /> Lifetime access</li></ul></div>
            </CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
