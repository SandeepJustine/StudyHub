import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import bcrypt from 'bcryptjs';
import { emailService } from '@/services/email-service';
import { AuthService } from '@/lib/auth/auth-service';

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
    atRisk?: boolean;
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

    const include = {
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
    };

    let students: any[] = [];
    let total = 0;

    if (params.atRisk) {
      const allStudents = await prisma.student.findMany({
        where,
        include,
      });

      const atRiskStudents = allStudents.filter(s => {
        const avg = s.enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / (s.enrollments.length || 1);
        return avg < 50;
      });

      total = atRiskStudents.length;
      const start = (params.page - 1) * params.limit;
      students = atRiskStudents.slice(start, start + params.limit);
    } else {
      [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          include,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
        }),
        prisma.student.count({ where }),
      ]);
    }

    return {
      students: students.map(s => ({
        id: s.id,
        name: s.user.fullName,
        email: s.user.email,
        phone: s.user.phone,
        grade: s.grade,
        examBoard: s.examBoard,
        subjects: s.subjects,
        enrollmentCount: s.enrollments.length,
        averageProgress: s.enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / (s.enrollments.length || 1),
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
    examBoard?: string;
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
            examBoard: studentData.examBoard,
            subjects: studentData.subjects || [],
            institutionId,
          },
          update: {
            institutionId,
            grade: studentData.grade,
            examBoard: studentData.examBoard,
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
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: data.fullName,
          phone: data.phone,
        },
      });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, name: true },
    });

    const teacher = await prisma.schoolAdmin.create({
      data: {
        userId: user.id,
        institutionId,
        role: data.role || 'TEACHER',
      },
      include: { user: true },
    });

    await prisma.instructor.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: '',
        expertise: [],
      },
      update: {},
    });

    // Send invitation email with password reset link
    if (institution) {
      try {
        const authService = new AuthService();
        const resetResult = await authService.requestPasswordReset(user.email);
        if (resetResult.sent) {
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
        }
      } catch (error) {
        console.error('Failed to send teacher invitation email:', error);
      }
    }

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

  async getSettings(institutionId: string) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: {
        name: true,
        settings: true,
      },
    });

    if (!institution) throw new NotFoundError('Institution');

    const settings = (institution.settings as any) || {};

    return {
      name: institution.name,
      email: settings.email || '',
      phone: settings.phone || '',
      address: settings.address || '',
      website: settings.website || '',
      emailNotifications: settings.emailNotifications ?? true,
      smsNotifications: settings.smsNotifications ?? false,
      twoFactorEnabled: settings.twoFactorEnabled ?? false,
    };
  }

  async updateSettings(institutionId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    twoFactorEnabled?: boolean;
  }) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) throw new NotFoundError('Institution');

    const existingSettings = (institution.settings as any) || {};

    const updatedSettings = {
      ...existingSettings,
      email: data.email ?? existingSettings.email,
      phone: data.phone ?? existingSettings.phone,
      address: data.address ?? existingSettings.address,
      website: data.website ?? existingSettings.website,
      emailNotifications: data.emailNotifications ?? existingSettings.emailNotifications,
      smsNotifications: data.smsNotifications ?? existingSettings.smsNotifications,
      twoFactorEnabled: data.twoFactorEnabled ?? existingSettings.twoFactorEnabled,
    };

    // Update institution name if provided
    if (data.name) {
      await prisma.institution.update({
        where: { id: institutionId },
        data: {
          name: data.name,
          settings: updatedSettings,
        },
      });
    } else {
      await prisma.institution.update({
        where: { id: institutionId },
        data: {
          settings: updatedSettings,
        },
      });
    }

    return {
      name: data.name || institution.name,
      email: updatedSettings.email,
      phone: updatedSettings.phone,
      address: updatedSettings.address,
      website: updatedSettings.website,
      emailNotifications: updatedSettings.emailNotifications,
      smsNotifications: updatedSettings.smsNotifications,
      twoFactorEnabled: updatedSettings.twoFactorEnabled,
    };
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
    tagline?: string;
    customDomain?: string;
  }) {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) throw new NotFoundError('Institution');

    if (!['INSTITUTION_SILVER', 'INSTITUTION_GOLD'].includes(institution.tier)) {
      throw new AppError('Branding requires Silver tier or higher', 'TIER_RESTRICTED', 403);
    }

    const { customDomain, ...allowed } = branding;

    return prisma.institutionBranding.upsert({
      where: { institutionId },
      create: { institutionId, ...allowed },
      update: allowed,
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

    // Get total enrollments and certificates for analytics
    // Get total enrollments and certificates for analytics
  const totalEnrollments = await prisma.enrollment.count({
    where: {
      student: { institutionId },
    },
  });

  const certificatesIssued = await prisma.certificate.count({
    where: {
      student: { institutionId },
    },
  });

  // Calculate completion rate
  const completedEnrollments = await prisma.enrollment.count({
    where: {
      student: { institutionId },
      completedAt: { not: null },
    },
  });


    const courseCompletion = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Calculate average exam score
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        student: { institutionId },
      },
      select: { score: true, completedAt: true },
    });

    const averageScore = examAttempts.length > 0
      ? Math.round(examAttempts.reduce((sum, a) => sum + a.score, 0) / examAttempts.length)
      : 0;

    // Compute trend strings (comparing current month vs previous month)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    const currentMonthEnrollments = await prisma.enrollment.count({
      where: {
        student: { institutionId },
        enrolledAt: { gte: startOfMonth },
      },
    });

    const lastMonthEnrollments = await prisma.enrollment.count({
      where: {
        student: { institutionId },
        enrolledAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
      },
    });

    const enrollmentTrend = lastMonthEnrollments > 0
      ? `+${Math.round(((currentMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100)}% from last month`
      : currentMonthEnrollments > 0
        ? `+${currentMonthEnrollments} this month`
        : 'No data';

    const currentMonthCertificates = await prisma.certificate.count({
      where: {
        student: { institutionId },
        issuedAt: { gte: startOfMonth },
      },
    });

    const lastMonthCertificates = await prisma.certificate.count({
      where: {
        student: { institutionId },
        issuedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const certificateTrend = lastMonthCertificates > 0
      ? `+${Math.round(((currentMonthCertificates - lastMonthCertificates) / lastMonthCertificates) * 100)}% from last month`
      : currentMonthCertificates > 0
        ? `+${currentMonthCertificates} this month`
        : 'No data';

    const currentMonthExams = examAttempts.filter(
      a => a.completedAt && a.completedAt >= startOfMonth
    ).length;
    const lastMonthExams = examAttempts.filter(
      a => a.completedAt && a.completedAt >= startOfLastMonth && a.completedAt <= endOfLastMonth
    ).length;

    const scoreTrend = lastMonthExams > 0
      ? `+${Math.round(((currentMonthExams - lastMonthExams) / lastMonthExams) * 100)}% from last month`
      : currentMonthExams > 0
        ? `+${currentMonthExams} this month`
        : 'No data';

    const currentMonthCompleted = await prisma.enrollment.count({
      where: {
        student: { institutionId },
        completedAt: { gte: startOfMonth },
      },
    });

    const lastMonthCompleted = await prisma.enrollment.count({
      where: {
        student: { institutionId },
        completedAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const completionTrend = lastMonthCompleted > 0
      ? `+${Math.round(((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)}% from last month`
      : currentMonthCompleted > 0
        ? `+${currentMonthCompleted} this month`
        : 'No data';

    return {
      institution: {
        id: institution.id,
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
      analytics: {
        totalEnrollments,
        courseCompletion,
        averageScore,
        certificatesIssued,
        enrollmentTrend,
        completionTrend,
        scoreTrend,
        certificateTrend,
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

  async getInstitutionCourses(institutionId: string) {
    const courses = await prisma.course.findMany({
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

  async getCourses(institutionId: string) {
    const teachers = await prisma.schoolAdmin.findMany({
      where: { institutionId, role: 'TEACHER' },
      select: { userId: true },
    });

    const instructorIds = (
      await prisma.instructor.findMany({
        where: { userId: { in: teachers.map(t => t.userId) } },
        select: { id: true },
      })
    ).map(i => i.id);

    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: { in: instructorIds } },
          {
            enrollments: {
              some: {
                student: { institutionId },
              },
            },
          },
        ],
      },
      include: {
        instructor: { select: { user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      subject: c.subject,
      grade: c.grade || 'N/A',
      enrolledStudents: c._count.enrollments,
      status: this.mapCourseStatus(c.status),
      instructor: c.instructor?.user?.fullName || 'Unassigned',
      instructorId: c.instructorId,
      lastUpdated: c.updatedAt,
    }));
  }

  async getCourseById(institutionId: string, courseId: string) {
    const teachers = await prisma.schoolAdmin.findMany({
      where: { institutionId, role: 'TEACHER' },
      select: { userId: true },
    });

    const instructorIds = (
      await prisma.instructor.findMany({
        where: { userId: { in: teachers.map(t => t.userId) } },
        select: { id: true },
      })
    ).map(i => i.id);

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { enrollments: { some: { student: { institutionId } } } },
          { instructorId: { in: instructorIds } },
        ],
      },
      include: {
        instructor: { select: { user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundError('Course');

    return {
      id: course.id,
      title: course.title,
      subject: course.subject,
      grade: course.grade || 'N/A',
      description: course.description || '',
      examBoard: course.examBoard || '',
      price: course.price,
      status: this.mapCourseStatus(course.status),
      instructor: course.instructor?.user?.fullName || 'Unassigned',
      instructorId: course.instructorId,
      enrolledStudents: course._count.enrollments,
      lastUpdated: course.updatedAt,
    };
  }

  async createCourse(institutionId: string, data: {
    title: string;
    subject: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status?: string;
    instructorId?: string;
  }, fallbackUserId?: string) {
    const instructorId = await this.resolveInstructorId(institutionId, data.instructorId, fallbackUserId);

    const course = await prisma.course.create({
      data: {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        description: data.description,
        examBoard: data.examBoard,
        price: data.price || 0,
        status: this.unmapCourseStatus(data.status || 'draft'),
        instructorId,
      },
      include: {
        instructor: { select: { user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    return {
      id: course.id,
      title: course.title,
      subject: course.subject,
      grade: course.grade || 'N/A',
      enrolledStudents: course._count.enrollments,
      status: this.mapCourseStatus(course.status),
      instructor: course.instructor?.user?.fullName || 'Unassigned',
      lastUpdated: course.updatedAt,
    };
  }

  private async resolveInstructorId(institutionId: string, instructorId?: string, fallbackUserId?: string): Promise<string> {
    if (instructorId) {
      const existingInstructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
        select: { id: true },
      });
      if (existingInstructor) {
        return instructorId;
      }

      const teacher = await prisma.schoolAdmin.findUnique({
        where: { id: instructorId, institutionId },
        include: { user: true },
      });

      if (teacher) {
        let instructor = await prisma.instructor.findUnique({
          where: { userId: teacher.userId },
        });

        if (!instructor) {
          instructor = await prisma.instructor.create({
            data: {
              userId: teacher.userId,
              bio: '',
              expertise: [],
            },
          });
        }

        return instructor.id;
      }
    }

    const teacher = await prisma.schoolAdmin.findFirst({
      where: { institutionId, role: 'TEACHER' },
      include: { user: true },
    });

    let instructor = await prisma.instructor.findUnique({
      where: { userId: teacher?.userId || '' },
    });

    if (!instructor && teacher) {
      instructor = await prisma.instructor.create({
        data: {
          userId: teacher.userId,
          bio: '',
          expertise: [],
        },
      });
    }

    if (!instructor && fallbackUserId) {
      instructor = await prisma.instructor.create({
        data: {
          userId: fallbackUserId,
          bio: '',
          expertise: [],
        },
      });
    }

    if (!instructor) {
      throw new AppError('No instructor available to assign to this course. Please add a teacher first.', 'NO_INSTRUCTOR', 400);
    }

    return instructor.id;
  }

  async updateCourse(institutionId: string, courseId: string, data: {
    title?: string;
    subject?: string;
    grade?: string;
    description?: string;
    examBoard?: string;
    price?: number;
    status?: string;
    instructorId?: string;
  }) {
    const teachers = await prisma.schoolAdmin.findMany({
      where: { institutionId, role: 'TEACHER' },
      select: { userId: true },
    });

    const instructorIds = (
      await prisma.instructor.findMany({
        where: { userId: { in: teachers.map(t => t.userId) } },
        select: { id: true },
      })
    ).map(i => i.id);

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { enrollments: { some: { student: { institutionId } } } },
          { instructorId: { in: instructorIds } },
        ],
      },
    });

    if (!course) throw new NotFoundError('Course');

    const resolvedInstructorId = data.instructorId
      ? await this.resolveInstructorId(institutionId, data.instructorId)
      : undefined;

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        description: data.description,
        examBoard: data.examBoard,
        price: data.price,
        status: data.status ? this.unmapCourseStatus(data.status) : undefined,
        ...(resolvedInstructorId && { instructorId: resolvedInstructorId }),
      },
      include: {
        instructor: { select: { user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      subject: updated.subject,
      grade: updated.grade || 'N/A',
      enrolledStudents: updated._count.enrollments,
      status: this.mapCourseStatus(updated.status),
      instructor: updated.instructor?.user?.fullName || 'Unassigned',
      lastUpdated: updated.updatedAt,
    };
  }

  async deleteCourse(institutionId: string, courseId: string) {
    const teachers = await prisma.schoolAdmin.findMany({
      where: { institutionId, role: 'TEACHER' },
      select: { userId: true },
    });

    const instructorIds = (
      await prisma.instructor.findMany({
        where: { userId: { in: teachers.map(t => t.userId) } },
        select: { id: true },
      })
    ).map(i => i.id);

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { enrollments: { some: { student: { institutionId } } } },
          { instructorId: { in: instructorIds } },
        ],
      },
    });

    if (!course) throw new NotFoundError('Course');

    await prisma.course.delete({
      where: { id: courseId },
    });

    return { success: true };
  }

  // Helper: map Prisma ContentStatus to page status
  private mapCourseStatus(status: string): 'active' | 'draft' | 'archived' {
    switch (status) {
      case 'APPROVED':
        return 'active';
      case 'ARCHIVED':
      case 'REJECTED':
        return 'archived';
      case 'DRAFT':
      case 'PENDING_REVIEW':
      default:
        return 'draft';
    }
  }

  // Helper: map page status to Prisma ContentStatus
  private unmapCourseStatus(status: string): any {
    switch (status) {
      case 'active':
        return 'APPROVED';
      case 'archived':
        return 'ARCHIVED';
      case 'draft':
      default:
        return 'DRAFT';
    }
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
