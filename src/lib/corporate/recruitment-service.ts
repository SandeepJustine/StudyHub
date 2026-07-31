import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { paymentService } from '@/lib/payments/payment-service';

export class RecruitmentService {
  /**
   * Create job posting
   */
  async createJobPosting(clientId: string, data: {
    title: string;
    description: string;
    requirements?: string;
    qualifications?: string;
    salary?: string;
    location?: string;
    type?: string;
    deadline?: Date;
  }) {
    // Calculate price based on features
    const price = this.calculatePostingPrice(data);

    // Process payment
    const payment = await paymentService.processPayment({
      userId: clientId,
      amount: price,
      method: 'BANK_TRANSFER',
      metadata: {
        type: 'job_posting',
        description: `Job posting: ${data.title}`,
      },
    });

    // Create posting
    const posting = await prisma.recruitmentPosting.create({
      data: {
        clientId,
        ...data,
        price,
        status: payment.success ? 'active' : 'draft',
      },
    });

    return posting;
  }

  /**
   * Get job postings
   */
  async getJobPostings(params: {
    status?: string;
    page?: number;
    limit?: number;
    clientId?: string;
  }) {
    const { status = 'active', page = 1, limit = 10, clientId } = params;

    const where: any = { status };
    if (clientId) where.clientId = clientId;

    const [postings, total] = await Promise.all([
      prisma.recruitmentPosting.findMany({
        where,
        include: {
          client: {
            select: {
              companyName: true,
              industry: true,
              logo: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recruitmentPosting.count({ where }),
    ]);

    return {
      postings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Apply for job
   */
  async applyForJob(studentId: string, postingId: string, data: {
    coverLetter?: string;
    cvUrl?: string;
  }) {
    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        postingId_studentId: { postingId, studentId },
      },
    });

    if (existing) {
      throw new AppError('Already applied for this position', 'ALREADY_APPLIED', 409);
    }

    // Check deadline
    const posting = await prisma.recruitmentPosting.findUnique({
      where: { id: postingId },
    });

    if (!posting) throw new NotFoundError('Job posting');
    if (posting.deadline && new Date() > posting.deadline) {
      throw new AppError('Application deadline has passed', 'DEADLINE_PASSED', 400);
    }

    const application = await prisma.jobApplication.create({
      data: {
        postingId,
        studentId,
        ...data,
      },
    });

    return application;
  }

  /**
   * Review applications (corporate client)
   */
  async reviewApplication(applicationId: string, clientId: string, data: {
    status: 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
    notes?: string;
  }) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        posting: true,
      },
    });

    if (!application) throw new NotFoundError('Application');
    if (application.posting.clientId !== clientId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        notes: data.notes,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Get applications for a posting
   */
  async getApplications(postingId: string, clientId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = params || {};

    const where: any = { postingId };
    if (status) where.status = status;

    // Verify ownership
    const posting = await prisma.recruitmentPosting.findUnique({
      where: { id: postingId },
    });

    if (!posting || posting.clientId !== clientId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private calculatePostingPrice(data: any): number {
    // Base price
    let price = 50000;

    // Premium features
    if (data.featured) price += 100000;
    if (data.urgent) price += 50000;
    if (data.extendedDuration) price += 100000;

    return Math.min(price, 300000);
  }
}