import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class InstitutionService {
  async getInstitutionByUserId(userId: string) {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId },
      include: {
        institution: {
          include: {
            _count: {
              select: { students: true, admins: true },
            },
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!schoolAdmin) throw new NotFoundError('Institution');

    return schoolAdmin.institution;
  }

  async getStudents(institutionId: string, params: {
    query?: string;
    grade?: string;
    page: number;
    limit: number;
  }) {
    const where: any = { institutionId };

    if (params.query) {
      where.user = {
        OR: [
          { fullName: { contains: params.query, mode: 'insensitive' } },
          { email: { contains: params.query, mode: 'insensitive' } },
        ],
      };
    }

    if (params.grade) {
      where.grade = params.grade;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              lastLoginAt: true,
            },
          },
          enrollments: {
            select: {
              progress: true,
              course: { select: { title: true, subject: true } },
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.student.count({ where }),
    ]);

    return {
      students: students.map(s => ({
        id: s.id,
        name: s.user.fullName,
        email: s.user.email,
        phone: s.user.phone,
        grade: s.grade,
        subjects: s.subjects,
        enrollmentCount: s.enrollments.length,
        averageProgress: s.enrollments.reduce((sum, e) => sum + e.progress, 0) / (s.enrollments.length || 1),
        lastActive: s.user.lastLoginAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async bulkEnrollStudents(institutionId: string, students: Array<{
    email: string;
    name: string;
    grade?: string;
    subjects?: string[];
    courseIds?: string[];
  }>) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: { _count: { select: { students: true } } },
    });

    if (!institution) throw new NotFoundError('Institution');

    const remainingCapacity = institution.maxStudents - institution._count.students;
    if (students.length > remainingCapacity && institution.maxStudents > 0) {
      throw new AppError(
        `Insufficient capacity. Can only add ${remainingCapacity} more students.`,
        'CAPACITY_EXCEEDED',
        400
      );
    }

    const results = { successful: 0, failed: 0, errors: [] as string[] };

    for (const studentData of students) {
      try {
        // Create or find user
        let user = await prisma.user.findUnique({
          where: { email: studentData.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: studentData.email,
              fullName: studentData.name,
              role: 'STUDENT',
              passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
            },
          });
        }

        // Create student profile
        const student = await prisma.student.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            grade: studentData.grade,
            subjects: studentData.subjects || [],
            institutionId,
          },
          update: {
            institutionId,
            grade: studentData.grade,
          },
        });

        // Enroll in courses
        if (studentData.courseIds?.length) {
          for (const courseId of studentData.courseIds) {
            await prisma.enrollment.upsert({
              where: {
                studentId_courseId: {
                  studentId: student.id,
                  courseId,
                },
              },
              create: {
                studentId: student.id,
                courseId,
                totalModules: 0,
              },
              update: {},
            });
          }
        }

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${studentData.email}: ${error.message}`);
      }
    }

    // Update institution student count
    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        currentStudents: { increment: results.successful },
      },
    });

    return results;
  }

  async updateInstitution(institutionId: string, data: any) {
    return prisma.institution.update({
      where: { id: institutionId },
      data,
    });
  }

  async updateBranding(institutionId: string, branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
    customDomain?: string;
  }) {
    // Check tier allows branding
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) throw new NotFoundError('Institution');

    if (!['INSTITUTION_SILVER', 'INSTITUTION_GOLD'].includes(institution.tier)) {
      throw new AppError('Branding requires Silver tier or higher', 'TIER_RESTRICTED', 403);
    }

    return prisma.institutionBranding.upsert({
      where: { institutionId },
      create: { institutionId, ...branding },
      update: branding,
    });
  }

  async getProgressReports(institutionId: string) {
    const students = await prisma.student.findMany({
      where: { institutionId },
      include: {
        user: { select: { fullName: true } },
        examAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            quiz: {
              select: { title: true, module: { select: { course: { select: { subject: true } } } } },
            },
          },
        },
        enrollments: {
          include: {
            course: { select: { title: true, subject: true } },
          },
        },
      },
    });

    return students.map(student => ({
      studentId: student.id,
      name: student.user.fullName,
      grade: student.grade,
      subjects: student.subjects,
      averageScore: student.examAttempts.length > 0
        ? student.examAttempts.reduce((sum, a) => sum + a.score, 0) / student.examAttempts.length
        : 0,
      coursesEnrolled: student.enrollments.length,
      coursesCompleted: student.enrollments.filter(e => e.completedAt).length,
      recentExams: student.examAttempts.slice(0, 5).map(a => ({
        exam: a.quiz.title,
        subject: a.quiz.module.course.subject,
        score: a.score,
        passed: a.passed,
        date: a.completedAt,
      })),
    }));
  }
}