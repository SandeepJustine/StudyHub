// src/lib/marketplace/course-service.ts
import { Course, PaymentMethod } from '@prisma/client';
import prisma from '@/lib/prisma';
import { paymentService } from '@/lib/payments/payment-service';
import { notificationService } from '@/lib/notifications/notification-service';
export class CourseService {
  async createCourse(
    instructorId: string,
    courseData: {
      title: string;
      description: string;
      subject: string;
      examBoard: string;
      price: number;
      modules: Array<{ title: string; contentType: string; contentUrl: string }>;
    }
  ): Promise<Course> {
    // Check instructor subscription tier
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { user: { include: { subscriptions: true } } },
    });

    const activeSub = instructor?.user.subscriptions.find(s => s.status === 'active');
    if (!activeSub) throw new Error('No active instructor subscription');

    // Create course with pending review status
    const course = await prisma.course.create({
      data: {
        instructorId,
        title: courseData.title,
        description: courseData.description,
        subject: courseData.subject,
        examBoard: courseData.examBoard,
        price: courseData.price,
        status: 'PENDING_REVIEW',
        modules: {
          create: courseData.modules.map((mod, index) => ({
            title: mod.title,
            order: index + 1,
            contentType: mod.contentType as any,
            contentUrl: mod.contentUrl,
          })),
        },
      },
      include: { modules: true },
    });

    return course;
  }

  async purchaseCourse(studentId: string, courseId: string, paymentMethod: PaymentMethod) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true },
    });

    if (!course) throw new Error('Course not found');

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, courseId },
    });

    if (existing) throw new Error('Already enrolled in this course');

    // Process payment
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student?.user) {
      throw new Error('Student not found');
    }

    const transaction = await paymentService.processPayment({
      userId: student.userId,
      amount: course.price,
      method: paymentMethod,
      metadata: {
        courseId,
        instructorId: course.instructorId,
        type: 'course_purchase',
      },
    });

    // Calculate revenue share
    const revenueShare = course.instructor.revenueShare || 0.70;
    const instructorEarnings = Math.floor(course.price * revenueShare);
    const platformFee = course.price - instructorEarnings;

    // Update transaction with revenue split
    await prisma.transaction.update({
      where: { id: transaction.transactionId! },
      data: {
        instructorId: course.instructorId,
        revenueSplit: revenueShare,
        platformFee,
      },
    });

    // Create enrollment
    await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
    });

    // Update instructor earnings
    await prisma.instructor.update({
      where: { id: course.instructorId },
      data: {
        totalEarnings: { increment: instructorEarnings },
      },
    });

    return { enrollment: true, transaction };
  }

  async calculateInstructorPayouts(period: string): Promise<void> {
    // period format: "2026-07"
    const [year, month] = period.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    // Get all instructor earnings for the period
    const transactions = await prisma.transaction.groupBy({
      by: ['instructorId'],
      where: {
        instructorId: { not: null },
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    // Create payout records
    for (const transaction of transactions) {
      if (!transaction.instructorId) continue;

      const actualAmount = Math.floor((transaction._sum.amount || 0) * 0.70); // After platform fee

      await prisma.payout.create({
        data: {
          instructorId: transaction.instructorId,
          amount: actualAmount,
          period,
          status: 'pending',
        },
      });
    }
  }

  async processInstructorPayout(payoutId: string): Promise<void> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { instructor: { include: { user: true } } },
    });

    if (!payout) throw new Error('Payout not found');

    // Process payment to instructor's mobile money or bank account
    // This would integrate with payment providers for disbursement

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        paidAt: new Date(),
        reference: `PAYOUT-${Date.now()}`,
      },
    });

    // Notify instructor
    await notificationService.send({
      userId: payout.instructor.userId,
      type: 'PAYOUT_PROCESSED',
      title: 'Payout Processed',
      message: `Your payout of MWK ${payout.amount.toLocaleString()} for ${payout.period} has been processed.`,
      channel: 'SMS',
    });
  }
}