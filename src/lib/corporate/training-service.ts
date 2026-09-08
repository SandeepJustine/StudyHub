import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import type {
  CorporateTrainingPackage,
  TrainingCategory,
  TrainingMode,
  TrainingLevel,
  TrainingStatus,
  TrainingModule,
} from '@/hooks/types/corporate';

const PrismaJson = {
  parse: (v: any) => v === null ? undefined : v,
};

export class TrainingService {
  async getClientId(userId: string): Promise<string> {
    const client = await prisma.corporateClient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) throw new NotFoundError('Corporate client');
    return client.id;
  }

  async createTrainingPackage(corporateId: string, data: {
    title: string;
    description: string;
    category?: TrainingCategory;
    mode?: TrainingMode;
    level?: TrainingLevel;
    pricePerParticipant?: number;
    minimumParticipants?: number;
    maximumParticipants?: number;
    totalBudget?: number;
    currency?: string;
    startDate: Date | string;
    endDate: Date | string;
    durationDays?: number;
    schedule?: CorporateTrainingPackage['schedule'];
    curriculum?: TrainingModule[];
    prerequisites?: string[];
    learningOutcomes?: string[];
    materialsProvided?: string[];
    certificationIncluded?: boolean;
    instructorId?: string;
    instructorName?: string;
    instructorBio?: string;
    location?: CorporateTrainingPackage['location'];
    onlinePlatform?: CorporateTrainingPackage['onlinePlatform'];
    meetingLink?: string;
    requirements?: CorporateTrainingPackage['requirements'];
    status?: TrainingStatus;
  }): Promise<CorporateTrainingPackage> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const durationDays = data.durationDays || Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const pkg = await prisma.corporateTrainingPackage.create({
      data: {
        corporateId,
        title: data.title,
        description: data.description,
        category: data.category || 'OTHER',
        mode: data.mode || 'ONLINE',
        level: data.level || 'ALL_LEVELS',
        pricePerParticipant: data.pricePerParticipant || 0,
        minimumParticipants: data.minimumParticipants || 1,
        maximumParticipants: data.maximumParticipants || 50,
        totalBudget: data.totalBudget || 0,
        currency: data.currency || 'MWK',
        startDate: start,
        endDate: end,
        durationDays,
        schedule: (data.schedule || undefined) as any,
        curriculum: (data.curriculum || []) as any,
        prerequisites: data.prerequisites || [],
        learningOutcomes: data.learningOutcomes || [],
        materialsProvided: data.materialsProvided || [],
        certificationIncluded: data.certificationIncluded || false,
        instructorId: data.instructorId,
        instructorName: data.instructorName,
        instructorBio: data.instructorBio,
        location: (data.location || undefined) as any,
        onlinePlatform: data.onlinePlatform,
        meetingLink: data.meetingLink,
        requirements: (data.requirements || {}) as any,
        status: data.status || 'DRAFT',
      },
    });

    return this.mapToPackage(pkg);
  }

  async getTrainingPackage(id: string, corporateId: string): Promise<CorporateTrainingPackage> {
    const pkg = await prisma.corporateTrainingPackage.findFirst({
      where: { id, corporateId },
    });
    if (!pkg) throw new NotFoundError('Training package');
    return this.mapToPackage(pkg);
  }

  async listTrainingPackages(corporateId: string, params?: {
    status?: TrainingStatus;
    category?: TrainingCategory;
    page?: number;
    limit?: number;
  }): Promise<{ packages: CorporateTrainingPackage[]; total: number; page: number; limit: number }> {
    const { status, category, page = 1, limit = 20 } = params || {};
    const where: any = { corporateId };
    if (status) where.status = status;
    if (category) where.category = category;

    const [pkgs, total] = await Promise.all([
      prisma.corporateTrainingPackage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.corporateTrainingPackage.count({ where }),
    ]);

    return {
      packages: pkgs.map(p => this.mapToPackage(p)),
      total,
      page,
      limit,
    };
  }

  async updateTrainingPackage(id: string, corporateId: string, data: Partial<{
    title: string;
    description: string;
    category: TrainingCategory;
    mode: TrainingMode;
    level: TrainingLevel;
    pricePerParticipant: number;
    minimumParticipants: number;
    maximumParticipants: number;
    totalBudget: number;
    currency: string;
    startDate: Date | string;
    endDate: Date | string;
    durationDays: number;
    schedule: CorporateTrainingPackage['schedule'];
    curriculum: TrainingModule[];
    prerequisites: string[];
    learningOutcomes: string[];
    materialsProvided: string[];
    certificationIncluded: boolean;
    instructorId: string;
    instructorName: string;
    instructorBio: string;
    location: CorporateTrainingPackage['location'];
    onlinePlatform: CorporateTrainingPackage['onlinePlatform'];
    meetingLink: string;
    requirements: CorporateTrainingPackage['requirements'];
    status: TrainingStatus;
    approvalNotes: string;
  }>): Promise<CorporateTrainingPackage> {
    const existing = await prisma.corporateTrainingPackage.findFirst({
      where: { id, corporateId },
    });
    if (!existing) throw new NotFoundError('Training package');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.pricePerParticipant !== undefined) updateData.pricePerParticipant = data.pricePerParticipant;
    if (data.minimumParticipants !== undefined) updateData.minimumParticipants = data.minimumParticipants;
    if (data.maximumParticipants !== undefined) updateData.maximumParticipants = data.maximumParticipants;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.durationDays !== undefined) updateData.durationDays = data.durationDays;
    if (data.schedule !== undefined) updateData.schedule = data.schedule;
    if (data.curriculum !== undefined) updateData.curriculum = data.curriculum;
    if (data.prerequisites !== undefined) updateData.prerequisites = data.prerequisites;
    if (data.learningOutcomes !== undefined) updateData.learningOutcomes = data.learningOutcomes;
    if (data.materialsProvided !== undefined) updateData.materialsProvided = data.materialsProvided;
    if (data.certificationIncluded !== undefined) updateData.certificationIncluded = data.certificationIncluded;
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
    if (data.instructorName !== undefined) updateData.instructorName = data.instructorName;
    if (data.instructorBio !== undefined) updateData.instructorBio = data.instructorBio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.onlinePlatform !== undefined) updateData.onlinePlatform = data.onlinePlatform;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvalNotes !== undefined) updateData.approvalNotes = data.approvalNotes;

    const pkg = await prisma.corporateTrainingPackage.update({
      where: { id },
      data: updateData,
    });

    return this.mapToPackage(pkg);
  }

  async deleteTrainingPackage(id: string, corporateId: string): Promise<void> {
    const existing = await prisma.corporateTrainingPackage.findFirst({
      where: { id, corporateId },
    });
    if (!existing) throw new NotFoundError('Training package');

    await prisma.corporateTrainingPackage.delete({ where: { id } });
  }

  async activatePackage(id: string, corporateId: string): Promise<CorporateTrainingPackage> {
    return this.updateTrainingPackage(id, corporateId, { status: 'ACTIVE' });
  }

  async approvePackage(id: string, approvedBy: string, notes?: string): Promise<CorporateTrainingPackage> {
    const pkg = await prisma.corporateTrainingPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundError('Training package');

    const updated = await prisma.corporateTrainingPackage.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedBy,
        approvedAt: new Date(),
        approvalNotes: notes,
      },
    });

    return this.mapToPackage(updated);
  }

  private mapToPackage(pkg: any): CorporateTrainingPackage {
    return {
      id: pkg.id,
      corporateId: pkg.corporateId,
      title: pkg.title,
      description: pkg.description,
      category: pkg.category,
      mode: pkg.mode,
      level: pkg.level,
      pricePerParticipant: pkg.pricePerParticipant,
      minimumParticipants: pkg.minimumParticipants,
      maximumParticipants: pkg.maximumParticipants,
      totalBudget: pkg.totalBudget,
      currency: pkg.currency,
      startDate: pkg.startDate,
      endDate: pkg.endDate,
      durationDays: pkg.durationDays,
      schedule: pkg.schedule || undefined,
      curriculum: pkg.curriculum || [],
      prerequisites: pkg.prerequisites || [],
      learningOutcomes: pkg.learningOutcomes || [],
      materialsProvided: pkg.materialsProvided || [],
      certificationIncluded: pkg.certificationIncluded,
      instructorId: pkg.instructorId || undefined,
      instructorName: pkg.instructorName || undefined,
      instructorBio: pkg.instructorBio || undefined,
      location: pkg.location || undefined,
      onlinePlatform: pkg.onlinePlatform || undefined,
      meetingLink: pkg.meetingLink || undefined,
      requirements: pkg.requirements || {},
      status: pkg.status,
      approvalNotes: pkg.approvalNotes || undefined,
      approvedBy: pkg.approvedBy || undefined,
      approvedAt: pkg.approvedAt || undefined,
      enrolledCount: pkg.enrolledCount,
      completionRate: pkg.completionRate,
      averageRating: pkg.averageRating,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
