import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/courses
 * List all courses with filtering and stats (Admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      query: searchParams.get('query') || undefined,
      subject: searchParams.get('subject') || undefined,
      examBoard: searchParams.get('examBoard') || undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Build where clause
    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { subject: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.subject) where.subject = params.subject;
    if (params.examBoard) where.examBoard = params.examBoard;
    if (params.status) where.status = params.status;

    // Fetch courses with pagination, stats, and related data
    const [courses, total, statusStats] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              modules: true,
            },
          },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.course.count({ where }),
      prisma.course.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Calculate total revenue from courses
    const revenueStats = await prisma.transaction.aggregate({
      where: {
        courseId: { not: null },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: true,
    });

    // Format courses for response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      examBoard: course.examBoard,
      grade: course.grade,
      price: course.price,
      status: course.status,
      rating: course.rating,
      reviewsCount: course.reviewsCount,
      studentsCount: course.studentsCount,
      duration: course.duration,
      thumbnail: course.thumbnail,
      language: course.language,
      tags: course.tags,
      instructor: course.instructor ? {
        id: course.instructor.id,
        name: course.instructor.user.fullName,
        email: course.instructor.user.email,
        avatar: course.instructor.user.avatar,
      } : null,
      stats: {
        enrollments: course._count.enrollments,
        reviews: course._count.reviews,
        modules: course._count.modules,
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      publishedAt: course.publishedAt,
    }));

    // Format status stats
    const statusBreakdown = statusStats.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: formattedCourses,
      stats: {
        totalCourses: total,
        byStatus: statusBreakdown,
        totalEnrollments: formattedCourses.reduce((sum, c) => sum + c.stats.enrollments, 0),
        totalRevenue: revenueStats._sum.amount || 0,
        totalTransactions: revenueStats._count,
        averageRating: formattedCourses.length > 0 
          ? formattedCourses.reduce((sum, c) => sum + c.rating, 0) / formattedCourses.length 
          : 0,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Admin courses list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses
 * Approve, reject, feature, or archive a course
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, action, feedback } = body;

    if (!courseId || !action) {
      return NextResponse.json(
        { error: 'courseId and action are required' },
        { status: 400 }
      );
    }

    // Find the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let updatedCourse;
    let auditAction;

    switch (action) {
      case 'approve':
        if (course.status !== 'PENDING_REVIEW') {
          return NextResponse.json(
            { error: 'Only courses pending review can be approved' },
            { status: 400 }
          );
        }
        updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: {
            status: 'APPROVED',
            publishedAt: course.publishedAt || new Date(),
          },
        });
        auditAction = 'COURSE_APPROVED';
        break;

      case 'reject':
        if (course.status !== 'PENDING_REVIEW') {
          return NextResponse.json(
            { error: 'Only courses pending review can be rejected' },
            { status: 400 }
          );
        }
        updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: {
            status: 'REJECTED',
            metadata: {
              ...(course.metadata as any),
              reviewFeedback: feedback,
              reviewedBy: session.user.id,
              reviewedAt: new Date().toISOString(),
            },
          },
        });
        auditAction = 'COURSE_REJECTED';
        break;

      case 'archive':
        updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: { status: 'ARCHIVED' },
        });
        auditAction = 'COURSE_ARCHIVED';
        break;

      case 'feature':
        updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: {
            metadata: {
              ...(course.metadata as any),
              featured: true,
              featuredAt: new Date().toISOString(),
              featuredBy: session.user.id,
            },
          },
        });
        auditAction = 'COURSE_FEATURED';
        break;

      case 'unfeature':
        updatedCourse = await prisma.course.update({
          where: { id: courseId },
          data: {
            metadata: {
              ...(course.metadata as any),
              featured: false,
              unfeaturedAt: new Date().toISOString(),
            },
          },
        });
        auditAction = 'COURSE_UNFEATURED';
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: approve, reject, archive, feature, unfeature` },
          { status: 400 }
        );
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: auditAction,
        entity: 'COURSE',
        entityId: courseId,
        changes: { 
          from: course.status, 
          to: updatedCourse.status, 
          feedback,
          action 
        },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        status: updatedCourse.status,
        previousStatus: course.status,
      },
      message: `Course ${action}ed successfully`,
    });

  } catch (error) {
    console.error('Admin course action error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses
 * Permanently delete a course (use with caution)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Only allow deleting archived or rejected courses
    if (!['ARCHIVED', 'REJECTED', 'DRAFT'].includes(course.status)) {
      return NextResponse.json(
        { error: 'Only archived, rejected, or draft courses can be deleted' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.enrollment.deleteMany({ where: { courseId } }),
      prisma.courseReview.deleteMany({ where: { courseId } }),
      prisma.courseModule.deleteMany({ where: { courseId } }),
      prisma.forumThread.deleteMany({ where: { courseId } }),
      prisma.course.delete({ where: { id: courseId } }),
    ]);

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'COURSE_DELETED',
        entity: 'COURSE',
        entityId: courseId,
        changes: { title: course.title, status: course.status },
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course permanently deleted',
    });

  } catch (error) {
    console.error('Admin course delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
