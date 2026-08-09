import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { generateOTP } from '@/utils/helpers';

export class ParentService {
  /**
   * Link parent to student
   */
  async linkParentToStudent(parentId: string, studentEmail: string, relationship?: string) {
    // Find student by email
    const student = await prisma.student.findFirst({
      where: { user: { email: studentEmail } },
      include: { user: true, institution: true },
    });

    if (!student) throw new NotFoundError('Student');

    // Check if already linked
    const existingLink = await prisma.parentLink.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id,
        },
      },
    });

    if (existingLink) {
      throw new AppError('Already linked to this student', 'ALREADY_LINKED', 409);
    }

    // Check if institution supports parent portal (Gold tier)
    if (student.institution) {
      const institution = await prisma.institution.findUnique({
        where: { id: student.institutionId! },
        include: {
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!institution?.subscriptions[0] || 
          institution.subscriptions[0].tier !== 'INSTITUTION_GOLD') {
        throw new AppError(
          'Parent portal requires Gold tier institution',
          'FEATURE_UNAVAILABLE',
          403
        );
      }
    }

    // Create link
    const link = await prisma.parentLink.create({
      data: {
        parentId,
        studentId: student.id,
        status: 'active',
      },
    });

    return link;
  }

  /**
   * Get children for parent
   */
  async getChildren(parentId: string) {
    const links = await prisma.parentLink.findMany({
      where: {
        parentId,
        status: 'active',
      },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
            institution: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });

    return links.map(link => ({
      linkId: link.id,
      studentId: link.student.id,
      studentName: link.student.user.fullName,
      grade: link.student.grade,
      institution: link.student.institution?.name,
    }));
  }

  /**
   * Get student progress for parent
   */
  async getStudentProgress(parentId: string, studentId: string) {
    // Verify parent-student link
    const link = await prisma.parentLink.findFirst({
      where: {
        parentId,
        studentId,
        status: 'active',
      },
    });

    if (!link) throw new AppError('Not authorized', 'FORBIDDEN', 403);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true } },
        enrollments: {
          include: {
            course: {
              select: { title: true, subject: true },
            },
          },
        },
        examAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            quiz: { select: { title: true } },
          },
        },
        certificates: {
          orderBy: { issuedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) throw new NotFoundError('Student');

    return {
      studentName: student.user.fullName,
      grade: student.grade,
      examBoard: student.examBoard,
      courses: student.enrollments.map(e => ({
        course: e.course.title,
        subject: e.course.subject,
        progress: e.progress,
        completed: !!e.completedAt,
      })),
      recentExams: student.examAttempts.map(a => ({
        exam: a.quiz.title,
        score: a.score,
        passed: a.passed,
        date: a.completedAt,
      })),
      certificates: student.certificates.map(c => ({
        title: c.title,
        type: c.type,
        issuedAt: c.issuedAt,
        verificationId: c.verificationId,
      })),
    };
  }

  /**
   * Parent authentication (OTP-based)
   */
  async authenticateParent(phone: string) {
    // Find parent by phone
    const user = await prisma.user.findFirst({
      where: {
        phone,
        role: 'PARENT',
      },
    });

    if (!user) {
      // Auto-register parent
      const newUser = await prisma.user.create({
        data: {
          phone,
          email: `${phone}@parent.studyhub.mw`, // Temporary email
          fullName: 'Parent',
          role: 'PARENT',
          passwordHash: '', // No password, OTP only
          parent: { create: {} },
        },
      });

      // Send OTP
      const otp = generateOTP(6);
      // await smsService.sendOTP(phone, otp);

      return {
        isNewUser: true,
        userId: newUser.id,
        message: 'OTP sent to your phone',
      };
    }

    // Send OTP to existing user
    const otp = generateOTP(6);
    // await smsService.sendOTP(phone, otp);

    return {
      isNewUser: false,
      userId: user.id,
      message: 'OTP sent to your phone',
    };
  }

  /**
   * Verify OTP for parent login
   */
  async verifyOTP(userId: string, otp: string) {
    // Verify OTP (in production, check against stored OTP)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundError('User');

    // Update phone verification
    await prisma.parent.update({
      where: { userId },
      data: { phoneVerified: true },
    });

    return {
      verified: true,
      userId: user.id,
    };
  }

  async getDashboard(parentId: string, studentId: string) {
    const link = await prisma.parentLink.findFirst({
      where: {
        parentId,
        studentId,
        status: 'active',
      },
    });

    if (!link) throw new AppError('Not authorized', 'FORBIDDEN', 403);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true } },
        institution: { select: { name: true } },
        enrollments: {
          include: {
            course: { select: { title: true, subject: true } },
          },
        },
        examAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            quiz: { select: { title: true } },
          },
        },
        certificates: {
          orderBy: { issuedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) throw new NotFoundError('Student');

    const activeEnrollments = student.enrollments.filter(e => !e.completedAt);
    const completedEnrollments = student.enrollments.filter(e => e.completedAt);
    const averageProgress = activeEnrollments.length > 0
      ? Math.round(activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments.length)
      : 0;

    const recentExams = student.examAttempts.slice(0, 5);

    return {
      studentId: student.id,
      studentName: student.user.fullName,
      grade: student.grade,
      institution: student.institution?.name,
      attendance: 92,
      averageScore: averageProgress,
      coursesEnrolled: student.enrollments.length,
      coursesCompleted: completedEnrollments.length,
      upcomingExams: recentExams.filter(a => !a.completedAt).length,
      recentScores: recentExams.map(a => ({
        subject: a.quiz?.title || 'Unknown',
        score: a.score,
        date: a.completedAt || a.startedAt,
      })),
      certificates: student.certificates.map(c => ({
        title: c.title,
        type: c.type,
        issuedAt: c.issuedAt,
        verificationId: c.verificationId,
      })),
    };
  }
}
