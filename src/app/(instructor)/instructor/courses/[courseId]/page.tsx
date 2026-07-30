import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Users, Star, Edit, Plus, Layout } from 'lucide-react';
import { formatCurrency, formatDuration, formatDate } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import { SubmitReviewButton } from '@/components/courses/submit-review-button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstructorCourseDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const { courseId } = await params;
  const instructor = await instructorService.resolveByUserId(session.user.id);
  
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          quiz: { 
            select: { 
              id: true, 
              title: true, 
              questionsCount: true 
            } 
          },
        },
      },
      _count: { 
        select: { 
          enrollments: true, 
          reviews: true 
        } 
      },
    },
  });
  
  if (!course) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Course Not Found</h2>
          <p className="text-grey-dark mb-4">The course you are looking for does not exist or has been removed.</p>
          <Link href="/instructor/courses">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (course.instructorId !== instructor.id) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Access Denied</h2>
          <p className="text-grey-dark mb-4">You don't have permission to view this course.</p>
          <Link href="/instructor/courses">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PENDING_REVIEW': return <Badge variant="warning">Pending Review</Badge>;
      case 'DRAFT': return <Badge variant="neutral">Draft</Badge>;
      case 'REJECTED': return <Badge variant="error">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link href="/instructor/courses" className="text-grey-medium hover:text-navy flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info">{course.subject}</Badge>
                {course.examBoard && <Badge variant="neutral">{course.examBoard}</Badge>}
                {course.grade && <Badge variant="neutral">{course.grade}</Badge>}
                {getStatusBadge(course.status)}
              </div>
              
              <h1 className="text-2xl font-bold text-navy mb-2">{course.title}</h1>
              <p className="text-grey-dark mb-4">{course.description || 'No description'}</p>

              <div className="flex items-center gap-4 text-sm text-grey-medium mb-4">
                <span className="flex items-center gap-1"><Clock size={14} />{formatDuration(course.duration || 0)}</span>
                <span className="flex items-center gap-1"><Users size={14} />{course._count.enrollments} students</span>
                <span className="flex items-center gap-1"><BookOpen size={14} />{course.modules.length} modules</span>
                {course.rating > 0 && (
                  <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" />{course.rating.toFixed(1)}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-navy">
                  {course.price > 0 ? formatCurrency(course.price) : 'Free'}
                </span>
                <span className="text-xs text-grey-medium">• Created {formatDate(course.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-grey-light">
            <Link href={`/instructor/courses/${course.id}/builder`}>
              <Button variant="primary" size="sm">
                <Layout size={14} className="mr-1" /> Course Builder
              </Button>
            </Link>
            {course.status === 'DRAFT' && (
              <>
                <Link href={`/instructor/courses/${course.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit size={14} className="mr-1" /> Edit Course
                  </Button>
                </Link>
                <SubmitReviewButton courseId={course.id} />
                <Link href={`/instructor/courses/${course.id}/quiz/new`}>
                  <Button variant="outline" size="sm">
                    <Plus size={14} className="mr-1" /> Add Quiz
                  </Button>
                </Link>
              </>
            )}
            
            {course.status === 'PENDING_REVIEW' && (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800 w-full">
                ⏳ This course is pending admin review. You'll be notified once it's approved.
              </div>
            )}

            {course.status === 'APPROVED' && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800 w-full">
                ✅ This course is live and available to students.
              </div>
            )}

            {course.status === 'REJECTED' && (
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800 w-full">
                ❌ This course was rejected. Please review the feedback and resubmit.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">
              Modules ({course.modules.length})
            </h2>
            <Link href={`/instructor/courses/${course.id}/builder`}>
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" /> Add Module
              </Button>
            </Link>
          </div>
          {course.modules.length > 0 ? (
            <div className="space-y-3">
              {course.modules.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-grey-light/50 rounded-lg">
                  <span className="text-sm font-medium text-navy w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-grey-medium">{m.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm">{m.contentType}</Badge>
                    {m.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                    {m.quiz && <Badge variant="info" size="sm">{m.quiz.questionsCount} Q</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-grey-medium mb-3" />
              <p className="text-sm text-grey-medium mb-4">No modules added yet.</p>
              <Link href={`/instructor/courses/${course.id}/builder`}>
                <Button variant="primary">Add Your First Module</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
