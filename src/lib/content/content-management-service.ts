import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class ContentManagementService {
  /**
   * Bulk upload content items
   */
  async bulkUploadContent(uploadedBy: string, items: Array<{
    title: string;
    type: 'VIDEO' | 'NOTES' | 'PAST_PAPER' | 'QUIZ';
    subject: string;
    examBoard: string;
    grade?: string;
    fileUrl: string;
    contentData?: any;
    tags?: string[];
  }>) {
    const results = { successful: 0, failed: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        await prisma.contentItem.create({
          data: {
            ...item,
            uploadedBy,
            status: 'PENDING_REVIEW',
            version: 1,
            tags: item.tags || [],
          },
        });
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${item.title}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Review content (approve/reject)
   */
  async reviewContent(contentId: string, reviewerId: string, decision: {
    approved: boolean;
    feedback?: string;
  }) {
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) throw new NotFoundError('Content');

    return prisma.contentItem.update({
      where: { id: contentId },
      data: {
        status: decision.approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: reviewerId,
        metadata: {
          reviewFeedback: decision.feedback,
          reviewedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Update content with versioning
   */
  async updateContent(contentId: string, data: {
    title?: string;
    fileUrl?: string;
    contentData?: any;
  }) {
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) throw new NotFoundError('Content');

    // Create new version instead of updating
    const newVersion = await prisma.contentItem.create({
      data: {
        ...content,
        ...data,
        version: content.version + 1,
        status: 'PENDING_REVIEW',
        id: undefined, // Let Prisma generate new ID
        originalId: contentId,
      },
    });

    // Archive old version
    await prisma.contentItem.update({
      where: { id: contentId },
      data: { status: 'ARCHIVED' },
    });

    return newVersion;
  }

  /**
   * Get content by subject/exam board
   */
  async getContent(params: {
    type?: string;
    subject?: string;
    examBoard?: string;
    grade?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, subject, examBoard, grade, status = 'APPROVED', page = 1, limit = 20 } = params;

    const where: any = { status };
    if (type) where.type = type;
    if (subject) where.subject = subject;
    if (examBoard) where.examBoard = examBoard;
    if (grade) where.grade = grade;

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentItem.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get pending review queue
   */
  async getPendingReview(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getContent({
      ...params,
      status: 'PENDING_REVIEW',
    });
  }

  /**
   * Get content versions
   */
  async getContentVersions(originalId: string) {
    return prisma.contentItem.findMany({
      where: {
        OR: [
          { id: originalId },
          { originalId },
        ],
      },
      orderBy: { version: 'desc' },
    });
  }
}