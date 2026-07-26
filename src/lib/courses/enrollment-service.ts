import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class EnrollmentService {
  /**
   * Get student's enrolled courses
   */
  async getStudentEnrollments(studentId: string, params?: {
    status?: 'in_progress' | 'completed';
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = params || {};

    const where: any = { studentId };

    if (status === 'in_progress') {
      where.completedAt = null;
    } else if (status === 'completed') {
      where.completedAt = { not: null };
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        orderBy: { lastAccessedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  user: {
                    select: { fullName: true },
                  },
                },
              },
              _count: {
                select: { modules: true },
              },
            },
          },
          certificate: {
            select: {
              id: true,
              verificationId: true,
              issuedAt: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get enrollment details
   */
  async getEnrollmentDetails(enrollmentId: string, studentId: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId,
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
            },
          },
        },
        certificate: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment');
    }

    return enrollment;
  }

  /**
   * Get course statistics for instructor
   */
  async getEnrollmentStats(courseId: string) {
    const stats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { courseId },
      _count: true,
    });

    const completedCount = await prisma.enrollment.count({
      where: {
        courseId,
        completedAt: { not: null },
      },
    });

    const totalCount = await prisma.enrollment.count({
      where: { courseId },
    });

    return {
      total: totalCount,
      completed: completedCount,
      inProgress: totalCount - completedCount,
      completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };
  }

  /**
   * Get learning progress for institution
   */
  async getInstitutionProgress(institutionId: string) {
    const students = await prisma.student.findMany({
      where: { institutionId },
      select: {
        id: true,
        user: {
          select: { fullName: true },
        },
        enrollments: {
          select: {
            progress: true,
            course: {
              select: { title: true, subject: true },
            },
          },
        },
      },
    });

    return students.map(student => ({
      studentId: student.id,
      studentName: student.user.fullName,
      coursesEnrolled: student.enrollments.length,
      averageProgress: student.enrollments.length > 0
        ? student.enrollments.reduce((sum, e) => sum + e.progress, 0) / student.enrollments.length
        : 0,
      courses: student.enrollments.map(e => ({
        courseName: e.course.title,
        subject: e.course.subject,
        progress: e.progress,
      })),
    }));
  }

  /**
   * Get popular courses
   */
  async getPopularCourses(limit: number = 10) {
    return prisma.course.findMany({
      where: { status: 'APPROVED' },
      orderBy: { studentsCount: 'desc' },
      take: limit,
      include: {
        instructor: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });
  }

  /**
   * Get recommended courses for student
   */
  async getRecommendedCourses(studentId: string, limit: number = 6) {
    // Get student's interests based on enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            subject: true,
            examBoard: true,
            grade: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      // Return popular courses if no enrollment history
      return this.getPopularCourses(limit);
    }

    // Get subjects of enrolled courses
    const subjects = [...new Set(enrollments.map(e => e.course.subject))];
    const examBoards = [...new Set(enrollments.map(e => e.course.examBoard).filter(Boolean))];

    // Find related courses
    return prisma.course.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { subject: { in: subjects } },
          ...(examBoards.length > 0 ? [{ examBoard: { in: examBoards } }] : []),
        ],
        id: {
          notIn: enrollments.map(e => e.courseId),
        },
      },
      orderBy: [{ rating: 'desc' }, { studentsCount: 'desc' }],
      take: limit,
      include: {
        instructor: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });
  }
}

export const enrollmentService = new EnrollmentService();