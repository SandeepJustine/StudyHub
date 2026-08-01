import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { paymentService } from '@/lib/payments/payment-service';

export class RecruitmentService {
  /**
   * Resolve the CorporateClient ID from a User ID
   */
  async getClientId(userId: string): Promise<string> {
    const client = await prisma.corporateClient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) throw new NotFoundError('Corporate client');
    return client.id;
  }

  /**
   * Get company profile for a corporate client
   */
  async getCompanyProfile(userId: string) {
    const client = await prisma.corporateClient.findUnique({
      where: { userId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });
    if (!client) throw new NotFoundError('Corporate client');

    return {
      companyName: client.companyName,
      industry: client.industry,
      isVerified: client.isVerified,
      logo: client.logo,
      contactName: client.user.fullName,
      contactEmail: client.user.email,
      contactPhone: client.user.phone,
    };
  }

  /**
   * Update company profile for a corporate client
   */
  async updateCompanyProfile(userId: string, data: {
    companyName?: string;
    industry?: string;
    logo?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) {
    const client = await prisma.corporateClient.findUnique({
      where: { userId },
    });
    if (!client) throw new NotFoundError('Corporate client');

    // Update user fields
    if (data.contactName || data.contactEmail || data.contactPhone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
        },
      });
    }

    // Update client fields
    const updated = await prisma.corporateClient.update({
      where: { id: client.id },
      data: {
        companyName: data.companyName,
        industry: data.industry,
        logo: data.logo,
      },
    });

    return {
      companyName: updated.companyName,
      industry: updated.industry,
      isVerified: updated.isVerified,
      logo: updated.logo,
    };
  }

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
    featured?: boolean;
    urgent?: boolean;
  }) {
    const price = this.calculatePostingPrice(data);

    // Create posting
    const posting = await prisma.recruitmentPosting.create({
      data: {
        clientId,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        qualifications: data.qualifications,
        salary: data.salary,
        location: data.location,
        type: data.type,
        deadline: data.deadline,
        price,
        featured: data.featured || false,
        urgent: data.urgent || false,
        status: 'active',
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
      postings: postings.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        requirements: p.requirements,
        qualifications: p.qualifications,
        salary: p.salary,
        location: p.location,
        type: p.type,
        deadline: p.deadline,
        status: p.status,
        price: p.price,
        featured: p.featured,
        urgent: p.urgent,
        applications: p._count.applications,
        createdAt: p.createdAt,
      })),
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
   * Get all applications for a client across all postings
   */
  async getAllApplications(clientId: string, params?: {
    status?: string;
    query?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, query, page = 1, limit = 20 } = params || {};

    const where: any = {
      posting: { clientId },
    };
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { student: { user: { fullName: { contains: query, mode: 'insensitive' } } } },
        { student: { user: { email: { contains: query, mode: 'insensitive' } } } },
        { posting: { title: { contains: query, mode: 'insensitive' } } },
      ];
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
          posting: {
            select: { title: true },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return {
      applications: applications.map(a => ({
        id: a.id,
        applicantName: a.student?.user?.fullName || 'Unknown',
        applicantEmail: a.student?.user?.email || '',
        position: a.posting?.title || '',
        postingId: a.postingId,
        postingTitle: a.posting?.title || '',
        appliedAt: a.appliedAt,
        status: a.status,
        coverLetter: a.coverLetter,
        cvUrl: a.cvUrl,
        notes: a.notes,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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
