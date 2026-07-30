import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import { courseService } from '@/lib/courses/course-service';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const status = params.status;
  const page = Number(params.page || '1');

  let courses: any[] = [];
  let pagination: any = {};
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);
    const result = await courseService.getInstructorCourses(instructor.id, {
      status: status as any,
      page,
      limit: 20,
    });
    courses = result.courses;
    pagination = result.pagination;
  } catch (e: any) {
    error = e.message || 'Failed to load courses';
  }

  const statusOptions = [
    { value: '', label: 'All Courses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" size="sm">Published</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'ARCHIVED':
        return <Badge variant="info" size="sm">Archived</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Courses</h1>
          <p className="text-sm text-grey-medium">Manage all your courses in one place</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button variant="primary" leftIcon={<Plus size={18} />}>
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/instructor/courses?status=${opt.value}&page=1`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              (status || '') === opt.value
                ? 'bg-navy text-white'
                : 'bg-white text-grey-dark hover:bg-navy/5 border border-grey-light'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No courses found</h3>
            <p className="text-grey-medium mb-4">
              {status ? `No courses with status "${status}"` : 'You haven\'t created any courses yet.'}
            </p>
            <Link href="/instructor/courses/new">
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Create Your First Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-navy text-lg line-clamp-1">{course.title}</h3>
                  {getStatusBadge(course.status)}
                </div>

                <p className="text-sm text-grey-medium mb-3 line-clamp-2">
                  {course.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-sm text-grey-dark mb-4">
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {course._count?.enrollments || 0} students
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {course._count?.modules || 0} modules
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-green">
                    {course.price > 0 ? formatCurrency(course.price) : 'Free'}
                  </span>
                  {course.rating > 0 && (
                    <span className="text-sm text-grey-dark">
                      ★ {course.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/instructor/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="flex-1">
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Link
                key={pageNum}
                href={`/instructor/courses?status=${status || ''}&page=${pageNum}`}
                className={`px-3 py-1 rounded-lg text-sm ${
                  pageNum === page
                    ? 'bg-navy text-white'
                    : 'bg-white text-grey-dark hover:bg-navy/5 border border-grey-light'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
