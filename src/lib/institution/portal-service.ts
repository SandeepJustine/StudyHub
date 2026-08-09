// src/lib/institution/portal-service.ts
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { SubscriptionTier } from '@prisma/client';
export class InstitutionPortalService {
  async getInstitutionDashboard(institutionId: string): Promise<InstitutionDashboard> {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        students: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!institution) throw new Error('Institution not found');

    const activeSubscription = institution.subscriptions[0];
    const tierFeatures = this.getTierFeatures(institution.tier as string);

    // Aggregate student performance
    const studentPerformance = await this.getStudentPerformance(institutionId);
    
    // Get course completion rates
    const completionRates = await this.getCourseCompletionRates(institutionId);

    return {
      institution: {
        name: institution.name,
        tier: institution.tier,
        studentCount: institution.students.length,
        maxStudents: institution.maxStudents,
        features: tierFeatures,
      },
      performance: studentPerformance,
      courses: completionRates,
      subscription: activeSubscription ? {
        status: activeSubscription.status,
        endDate: activeSubscription.endDate,
        autoRenew: activeSubscription.autoRenew,
      } : null,
    };
  }

  private getTierFeatures(tier: string): string[] {
    const features: Record<string, string[]> = {
      INSTITUTION_BRONZE: ['basic_lms', 'student_reports', 'teacher_accounts'],
      INSTITUTION_SILVER: [
        ...this.getTierFeatures('INSTITUTION_BRONZE'),
        'custom_branding',
        'ai_reports',
        'bulk_enrollment',
        'advanced_analytics',
      ],
      INSTITUTION_GOLD: [
        ...this.getTierFeatures('INSTITUTION_SILVER'),
        'api_access',
        'parent_dashboard',
        'white_label',
        'unlimited_students',
        'custom_integrations',
      ],
    };

    return features[tier] || [];
  }

  async bulkEnrollStudents(
    institutionId: string,
    students: Array<{ email: string; name: string; grade: string }>,
    courseIds: string[]
  ): Promise<BulkEnrollmentResult> {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: { students: true },
    });

    if (!institution) throw new Error('Institution not found');

    // Check capacity
    const remainingCapacity = institution.maxStudents - institution.students.length;
    if (students.length > remainingCapacity) {
      throw new Error(`Insufficient capacity. Remaining: ${remainingCapacity}`);
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

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
              passwordHash: await bcrypt.hash('temporary123', 12), // Would send reset link
            },
          });
        }

        // Create student profile
        const student = await prisma.student.create({
          data: {
            userId: user.id,
            grade: studentData.grade,
            institutionId: institution.id,
          },
        });

        // Enroll in courses
        for (const courseId of courseIds) {
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              courseId,
            },
          });
        }

        results.successful++;
      } catch (error: unknown) {
        results.failed++;
        results.errors.push(`Failed for ${studentData.email}: ${(error as Error).message}`);
      }
    }

    return results;
  }

  async configureBranding(
    institutionId: string,
    branding: {
      logo?: string;
      primaryColor?: string;
      accentColor?: string;
    }
  ): Promise<void> {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) throw new Error('Institution not found');

    // Only Silver and Gold can customize branding
    if (!['INSTITUTION_SILVER', 'INSTITUTION_GOLD'].includes(institution.tier)) {
      throw new Error('Branding customization requires Silver tier or higher');
    }

    await prisma.institution.update({
      where: { id: institutionId },
      data: {
        logo: branding.logo,
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
      },
    });
  }

  private async getStudentPerformance(institutionId: string) {
    const students = await prisma.student.findMany({
      where: { institutionId },
      include: {
        user: { select: { fullName: true } },
        examAttempts: {
          include: { quiz: true },
          orderBy: { completedAt: 'desc' },
        },
        enrollments: {
          include: { course: true },
        },
      },
    });

    return students.map(student => ({
      studentId: student.id,
      name: student.user?.fullName || 'Unknown',
      averageScore: student.examAttempts.reduce((sum, a) => sum + a.score, 0) / 
                   (student.examAttempts.length || 1),
      coursesEnrolled: student.enrollments.length,
      coursesCompleted: student.enrollments.filter(e => e.completedAt).length,
      recentExams: student.examAttempts.slice(0, 5).map(a => ({
        quiz: a.quiz.title,
        score: a.score,
        date: a.completedAt,
      })),
    }));
  }

  private async getCourseCompletionRates(institutionId: string) {
    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            student: { institutionId },
          },
        },
      },
      include: {
        enrollments: {
          where: { student: { institutionId } },
        },
      },
    });

    return courses.map(course => ({
      courseId: course.id,
      title: course.title,
      totalEnrolled: course.enrollments.length,
      completed: course.enrollments.filter(e => e.completedAt).length,
      completionRate: course.enrollments.length > 0
        ? (course.enrollments.filter(e => e.completedAt).length / course.enrollments.length) * 100
        : 0,
    }));
  }
}

interface InstitutionDashboard {
  institution: {
    name: string;
    tier: SubscriptionTier;
    studentCount: number;
    maxStudents: number;
    features: string[];
  };
  performance: any[];
  courses: any[];
  subscription: {
    status: string;
    endDate: Date;
    autoRenew: boolean;
  } | null;
}

interface BulkEnrollmentResult {
  successful: number;
  failed: number;
  errors: string[];
}