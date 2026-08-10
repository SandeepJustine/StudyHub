// Data/service layer for the Instructor portal.
// Mirrors the conventions used by course-service, forum-service and
// payout-service: a class with domain methods plus an exported singleton.
// All Prisma reads/writes here stay aligned with prisma/schema.prisma.

import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export interface InstructorAnalyticsRange {
  /** ISO start (inclusive). Defaults to 30 days ago. */
  from?: Date;
  /** ISO end (exclusive). Defaults to now. */
  to?: Date;
}

class InstructorService {
  /**
   * Resolve the Instructor profile row from the authenticated user's id.
   * Throws NotFoundError (HTTP 404) when the profile is missing.
   */
  async resolveByUserId(userId: string) {
    const instructor = await prisma.instructor.findUnique({
      where: { userId },
    });
    if (!instructor) {
      throw new NotFoundError('Instructor profile');
    }
    return instructor;
  }

  /**
   * Aggregate dashboard stats for the instructor.
   */
  async getDashboardStats(instructorId: string) {
    const [
      instructor,
      courses,
      publishedCourses,
      enrollments,
      liveClasses,
      pendingPayout,
    ] = await Promise.all([
      prisma.instructor.findUnique({ where: { id: instructorId } }),
      prisma.course.count({
        where: { instructorId, status: { not: 'ARCHIVED' } },
      }),
      prisma.course.count({
        where: { instructorId, status: 'APPROVED' },
      }),
      prisma.enrollment.findMany({
        where: { course: { instructorId }, completedAt: null },
        select: { id: true },
      }),
      prisma.liveClass.count({
        where: { instructorId, status: { in: ['scheduled', 'live'] } },
      }),
      prisma.payout.aggregate({
        where: { instructorId, status: 'pending' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCourses: courses,
      publishedCourses,
      activeStudents: enrollments.length,
      upcomingLiveClasses: liveClasses,
      totalEarnings: instructor?.totalEarnings ?? 0,
      pendingPayouts: pendingPayout._sum.amount ?? 0,
      pendingEarnings: instructor?.pendingEarnings ?? 0,
      revenueShare: instructor?.revenueShare ?? 0.7,
      rating: instructor?.rating ?? 0,
      studentsCount: instructor?.studentsCount ?? 0,
      isVerified: instructor?.isVerified ?? false,
    };
  }

  /**
   * Recent courses for the instructor (for dashboard widgets).
   */
  async getRecentCourses(instructorId: string, take = 5) {
    return prisma.course.findMany({
      where: { instructorId, status: { not: 'ARCHIVED' } },
      orderBy: { updatedAt: 'desc' },
      take,
      include: {
        _count: {
          select: { enrollments: true, modules: true, reviews: true },
        },
      },
    });
  }

  /**
   * Earnings summary used by the earnings page and route.
   * Builds a 12-month revenue series plus payout + transaction history.
   */
  async getEarningsSummary(instructorId: string) {
    const [instructor, payouts, pending, paid, transactions, pendingTransactions] = await Promise.all([
      prisma.instructor.findUnique({ where: { id: instructorId } }),
      prisma.payout.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.payout.aggregate({
        where: { instructorId, status: 'pending' },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { instructorId, status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { instructorId, status: 'COMPLETED' },
        include: { course: { select: { title: true } } },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: { instructorId, status: 'PENDING' },
        include: { course: { select: { title: true } }, user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Build a 12-month revenue series from completed transactions.
    const now = new Date();
    const months: { period: string; label: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        period: key,
        label: d.toLocaleString('en-US', { month: 'short' }),
        amount: 0,
      });
    }
    const indexByKey = new Map(months.map((m, i) => [m.period, i]));
    for (const t of transactions) {
      const ref = t.completedAt ?? t.createdAt;
      const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
      const idx = indexByKey.get(key);
      if (idx !== undefined) {
        months[idx].amount += t.instructorPayout ?? 0;
      }
    }

    return {
      summary: {
        totalEarnings: instructor?.totalEarnings ?? 0,
        pendingEarnings: instructor?.pendingEarnings ?? 0,
        revenueShare: instructor?.revenueShare ?? 0.7,
        totalPaidOut: paid._sum.amount ?? 0,
        pendingPayout: pending._sum.amount ?? 0,
      },
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        period: p.period,
        status: p.status,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        paidAt: p.paidAt,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
      recentTransactions: [
        ...transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          courseTitle: t.course?.title,
          platformFee: t.platformFee,
          yourEarnings: t.instructorPayout,
          date: t.completedAt ?? t.createdAt,
          status: 'COMPLETED',
          studentName: undefined,
        })),
        ...pendingTransactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          courseTitle: t.course?.title,
          platformFee: t.platformFee,
          yourEarnings: undefined,
          date: t.createdAt,
          status: 'PENDING',
          studentName: t.user?.fullName || t.user?.email || undefined,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      monthlyEarnings: months,
    };
  }

  /**
   * Analytics aggregates for charts/tables on the analytics page.
   */
  async getAnalytics(instructorId: string, range?: InstructorAnalyticsRange) {
    const to = range?.to ?? new Date();
    const from = range?.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [courses, enrollments, transactions, ratingsAgg] = await Promise.all([
      prisma.course.findMany({
        where: { instructorId, status: { not: 'ARCHIVED' } },
        include: {
          _count: { select: { enrollments: true, reviews: true, modules: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.findMany({
        where: { course: { instructorId }, startedAt: { gte: from, lt: to } },
        select: { id: true, startedAt: true, progress: true },
      }),
      prisma.transaction.findMany({
        where: {
          instructorId,
          status: 'COMPLETED',
          completedAt: { gte: from, lt: to },
        },
        select: {
          id: true,
          amount: true,
          instructorPayout: true,
          completedAt: true,
          courseId: true,
          course: { select: { title: true } },
        },
      }),
      prisma.courseReview.aggregate({
        where: { course: { instructorId } },
        _count: { rating: true },
        _avg: { rating: true },
      }),
    ]);

    // Daily enrollment series for the range.
    const enrollmentByDay = this.bucketByDay(
      enrollments.map((e) => e.startedAt),
      from,
      to,
    );

    // Revenue trend (instructor payout) per day.
    const revenueByDay = this.bucketByDay(
      transactions
        .map((t) => t.completedAt ?? new Date(0))
        .filter((d) => d.getTime() > 0),
      from,
      to,
    );
    const revenueTrend = revenueByDay.map((b, i) => ({
      date: b.date,
      amount: revenueByDay[i].count,
    }));

    // Revenue by course.
    const revenueByCourseMap = new Map<string, { title: string; amount: number }>();
    for (const t of transactions) {
      const key = t.courseId ?? 'uncategorized';
      const title = t.course?.title ?? 'Other';
      const existing = revenueByCourseMap.get(key) ?? { title, amount: 0 };
      existing.amount += t.instructorPayout ?? 0;
      revenueByCourseMap.set(key, existing);
    }
    const revenueByCourse = [...revenueByCourseMap.values()]
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Rating distribution (1-5).
    const distribution = [0, 0, 0, 0, 0]; // index 0 = 1 star
    const allReviews = await prisma.courseReview.findMany({
      where: { course: { instructorId } },
      select: { rating: true },
    });
    for (const r of allReviews) {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
    }

    // Top courses by enrollment count.
    const topCourses = courses
      .map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        status: c.status,
        students: c._count.enrollments,
        rating: c.rating,
        revenue: c._count.enrollments, // placeholder count; replaced below
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    // Attach real revenue per top course.
    const topCourseIds = topCourses.map((c) => c.id);
    if (topCourseIds.length) {
      const revByCourse = await prisma.transaction.groupBy({
        by: ['courseId'],
        where: {
          instructorId,
          status: 'COMPLETED',
          courseId: { in: topCourseIds },
        },
        _sum: { instructorPayout: true },
      });
      const revMap = new Map(
        revByCourse
          .filter((r): r is (typeof revByCourse)[number] & { courseId: string } => !!r.courseId)
          .map((r) => [r.courseId, r._sum.instructorPayout ?? 0]),
      );
      for (const tc of topCourses) {
        tc.revenue = revMap.get(tc.id) ?? 0;
      }
    }

    return {
      range: { from, to },
      overview: {
        totalCourses: courses.length,
        totalEnrollments: courses.reduce((s, c) => s + c._count.enrollments, 0),
        totalReviews: courses.reduce((s, c) => s + c._count.reviews, 0),
        averageRating: ratingsAgg._avg.rating ?? 0,
        totalRevenue: transactions.reduce((s, t) => s + (t.instructorPayout ?? 0), 0),
        enrollmentsInPeriod: enrollments.length,
      },
      enrollmentByDay,
      revenueTrend,
      revenueByCourse,
      ratingDistribution: distribution.map((count, i) => ({
        stars: i + 1,
        count,
      })),
      topCourses,
    };
  }

  /**
   * Public-ish profile view (excludes bank details).
   */
  async getProfile(instructorId: string) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        _count: { select: { courses: true, liveClasses: true } },
      },
    });
    if (!instructor) throw new NotFoundError('Instructor profile');

    return {
      id: instructor.id,
      bio: instructor.bio,
      expertise: instructor.expertise,
      revenueShare: instructor.revenueShare,
      totalEarnings: instructor.totalEarnings,
      pendingEarnings: instructor.pendingEarnings,
      isVerified: instructor.isVerified,
      rating: instructor.rating,
      coursesCount: instructor.coursesCount,
      studentsCount: instructor.studentsCount,
      hasBankDetails: !!instructor.bankDetails,
      user: instructor.user,
      _count: instructor._count,
    };
  }

  /**
   * Update editable instructor profile fields.
   */
  async updateProfile(instructorId: string, data: {
    bio?: string;
    expertise?: string[];
    bankDetails?: any;
  }) {
    return prisma.instructor.update({
      where: { id: instructorId },
      data: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.expertise !== undefined && { expertise: data.expertise }),
        ...(data.bankDetails !== undefined && { bankDetails: data.bankDetails }),
      },
    });
  }

  /**
   * Request a payout: deducts from pending balance and records a payout row.
   */
  async requestPayout(instructorId: string, data: {
    amount: number;
    method?: string;
    accountDetails?: any;
  }) {
    const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
    if (!instructor) throw new NotFoundError('Instructor profile');

    if (!data.amount || data.amount <= 0) {
      throw new AppError('Valid payout amount is required', 'VALIDATION', 400);
    }

    const minPayout = 10000; // MWK 10,000
    if (data.amount < minPayout) {
      throw new AppError(
        `Minimum payout is MWK ${minPayout.toLocaleString()}`,
        'VALIDATION',
        400,
      );
    }

    if (data.amount > instructor.pendingEarnings) {
      throw new AppError(
        `Insufficient balance. Available: MWK ${instructor.pendingEarnings.toLocaleString()}`,
        'VALIDATION',
        400,
      );
    }

    const payout = await prisma.payout.create({
      data: {
        instructorId,
        amount: data.amount,
        period: new Date().toISOString().slice(0, 7),
        status: 'pending',
        paymentMethod: data.method || 'AIRTEL_MONEY',
        metadata: {
          requestedBy: instructor.userId,
          requestedAt: new Date().toISOString(),
          accountDetails: data.accountDetails,
        },
      },
    });

    // Reduce the available pending balance until the payout is processed.
    await prisma.instructor.update({
      where: { id: instructorId },
      data: { pendingEarnings: { decrement: data.amount } },
    });

    return payout;
  }

  // ---------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------

  private bucketByDay(dates: Date[], from: Date, to: Date) {
    const buckets: { date: string; count: number }[] = [];
    const byKey = new Map<string, number>();
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      buckets.push({ date: key, count: 0 });
      byKey.set(key, buckets.length - 1);
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const d of dates) {
      const key = new Date(d).toISOString().slice(0, 10);
      const idx = byKey.get(key);
      if (idx !== undefined) buckets[idx].count++;
    }
    return buckets;
  }
}

export const instructorService = new InstructorService();
