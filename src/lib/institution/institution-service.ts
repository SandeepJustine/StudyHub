import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import bcrypt from 'bcryptjs';

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

  // ──────────────────────────────────────────────────────────────
  // STUDENT CRUD
  // ──────────────────────────────────────────────────────────────

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

  async getStudentById(institutionId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            lastLoginAt: true,
            avatar: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: { id: true, title: true, subject: true, thumbnail: true },
            },
          },
        },
        examAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            quiz: {
              select: { title: true, module: { select: { course: { select: { subject: true } } } } },
            },
          },
        },
      },
    });

    if (!student) throw new NotFoundError('Student');

    return {
      id: student.id,
      name: student.user.fullName,
      email: student.user.email,
      phone: student.user.phone,
      grade: student.grade,
      examBoard: student.examBoard,
      subjects: student.subjects,
      lastActive: student.user.lastLoginAt,
      enrollments: student.enrollments.map(e => ({
        id: e.id,
        courseId: e.course.id,
        courseTitle: e.course.title,
        subject: e.course.subject,
        progress: e.progress,
        completedAt: e.completedAt,
      })),
      recentExams: student.examAttempts.map(a => ({
        id: a.id,
        quizTitle: a.quiz.title,
        subject: a.quiz.module.course.subject,
        score: a.score,
        passed: a.passed,
        completedAt: a.completedAt,
      })),
    };
  }

  async updateStudent(institutionId: string, studentId: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    grade?: string;
    subjects?: string[];
    examBoard?: string;
  }) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId },
    });
    if (!student) throw new NotFoundError('Student');

    // Update user fields
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
    });

    // Update student fields
    return prisma.student.update({
      where: { id: studentId },
      data: {
        grade: data.grade,
        subjects: data.subjects,
        examBoard: data.examBoard,
      },
    });
  }

  async deleteStudent(institutionId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId },
    });
    if (!student) throw new NotFoundError('Student');

    // Delete user (will cascade delete student record)
    await prisma.user.delete({
      where: { id: student.userId },
    });

    return { success: true };
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

  // ──────────────────────────────────────────────────────────────
  // TEACHER CRUD (teachers are SchoolAdmin records with role 'TEACHER')
  // ──────────────────────────────────────────────────────────────

  async getTeachers(institutionId: string, params: {
    query?: string;
    page: number;
    limit: number;
  }) {
    const where: any = { institutionId, role: 'TEACHER' };

    if (params.query) {
      where.user = {
        OR: [
          { fullName: { contains: params.query, mode: 'insensitive' } },
          { email: { contains: params.query, mode: 'insensitive' } },
        ],
      };
    }

    const [teachers, total] = await Promise.all([
      prisma.schoolAdmin.findMany({
        where,
        include: { user: true },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.schoolAdmin.count({ where }),
    ]);

    return {
      teachers: teachers.map(t => ({
        id: t.id,
        name: t.user.fullName,
        email: t.user.email,
        phone: t.user.phone,
        role: t.role,
        status: t.user.lockedUntil && t.user.lockedUntil > new Date() ? 'locked' : 'active',
        lastActive: t.user.lastLoginAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getTeacherById(institutionId: string, teacherId: string) {
    const teacher = await prisma.schoolAdmin.findFirst({
      where: { id: teacherId, institutionId, role: 'TEACHER' },
      include: { user: true },
    });
    if (!teacher) throw new NotFoundError('Teacher');

    return {
      id: teacher.id,
      name: teacher.user.fullName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      role: teacher.role,
      status: teacher.user.lockedUntil && teacher.user.lockedUntil > new Date() ? 'locked' : 'active',
      lastActive: teacher.user.lastLoginAt,
    };
  }

  async createTeacher(institutionId: string, data: {
    email: string;
    fullName: string;
    phone?: string;
    role?: string;
  }) {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          role: 'INSTRUCTOR',
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: data.fullName,
          phone: data.phone,
        },
      });
    }

    // Create school admin record
    const teacher = await prisma.schoolAdmin.create({
      data: {
        userId: user.id,
        institutionId,
        role: data.role || 'TEACHER',
      },
      include: { user: true },
    });

    return {
      id: teacher.id,
      name: teacher.user.fullName,
      email: teacher.user.email,
      phone: teacher.user.phone,
      role: teacher.role,
      status: 'active',
    };
  }

  async updateTeacher(institutionId: string, teacherId: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
  }) {
    const teacher = await prisma.schoolAdmin.findFirst({
      where: { id: teacherId, institutionId, role: 'TEACHER' },
    });
    if (!teacher) throw new NotFoundError('Teacher');

    // Update user
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
    });

    // Update school admin
    const updated = await prisma.schoolAdmin.update({
      where: { id: teacherId },
      data: { role: data.role },
      include: { user: true },
    });

    return {
      id: updated.id,
      name: updated.user.fullName,
      email: updated.user.email,
      phone: updated.user.phone,
      role: updated.role,
    };
  }

  async deleteTeacher(institutionId: string, teacherId: string) {
    const teacher = await prisma.schoolAdmin.findFirst({
      where: { id: teacherId, institutionId, role: 'TEACHER' },
    });
    if (!teacher) throw new NotFoundError('Teacher');

    // Delete school admin record
    await prisma.schoolAdmin.delete({
      where: { id: teacherId },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    return { success: true };
  }

  // ──────────────────────────────────────────────────────────────
  // INSTITUTION SETTINGS & BRANDING
  // ──────────────────────────────────────────────────────────────

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

  async getBranding(institutionId: string) {
    const branding = await prisma.institutionBranding.findUnique({
      where: { institutionId },
    });

    if (!branding) {
      // Fall back to institution-level branding
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId },
      });
      if (!institution) throw new NotFoundError('Institution');

      return {
        logo: institution.logo,
        primaryColor: institution.primaryColor,
        accentColor: institution.accentColor,
        tagline: null,
        customDomain: null,
      };
    }

    return {
      logo: branding.logo,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      tagline: branding.tagline,
      customDomain: null,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // DASHBOARD DATA
  // ──────────────────────────────────────────────────────────────

  async getDashboardData(institutionId: string) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        _count: { select: { students: true, admins: true } },
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!institution) throw new NotFoundError('Institution');

    // Get courses for the institution
    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            student: { institutionId },
          },
        },
      },
      select: { id: true, title: true, subject: true, studentsCount: true },
    });

    // Get student performance
    const students = await prisma.student.findMany({
      where: { institutionId },
      include: {
        user: { select: { fullName: true, lastLoginAt: true } },
        enrollments: { select: { progress: true } },
        examAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: { score: true, passed: true },
        },
      },
    });

    const totalStudents = institution._count.students;
    const totalTeachers = institution._count.admins;
    const activeStudents = students.filter(
      s => s.user.lastLoginAt && s.user.lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const averageProgress =
      students.reduce((sum, s) => {
        const avg = s.enrollments.reduce((e, en) => e + en.progress, 0) / (s.enrollments.length || 1);
        return sum + avg;
      }, 0) / (students.length || 1);

    const studentsAtRisk = students.filter(s => {
      const avgProgress = s.enrollments.reduce((e, en) => e + en.progress, 0) / (s.enrollments.length || 1);
      return avgProgress < 50;
    }).length;

    const activeSubscription = institution.subscriptions[0];

    return {
      institution: {
        name: institution.name,
        tier: institution.tier,
        studentCount: totalStudents,
        maxStudents: institution.maxStudents,
        currentStudents: institution.currentStudents,
      },
      stats: {
        totalStudents,
        totalTeachers,
        activeStudents,
        coursesAssigned: courses.length,
        averageProgress: Math.round(averageProgress),
        studentsAtRisk,
      },
      subscription: activeSubscription
        ? {
            status: activeSubscription.status,
            tier: activeSubscription.tier,
            endDate: activeSubscription.endDate,
            autoRenew: activeSubscription.autoRenew,
          }
        : null,
      courses,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // COURSES
  // ──────────────────────────────────────────────────────────────

  async getCourses(institutionId: string) {
    return prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            student: { institutionId },
          },
        },
      },
      include: {
        instructor: { select: { user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // PROGRESS REPORTS
  // ──────────────────────────────────────────────────────────────

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
