import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, AuthorizationError } from '@/lib/utils/errors';

export class CertificateSignatureService {
  async createSignature(data: {
    name: string;
    title: string;
    imageUrl: string;
    type: 'ADMIN' | 'INSTRUCTOR' | 'INSTITUTION';
    relatedId: string;
    instructorId?: string;
    institutionId?: string;
  }) {
    return prisma.certificateSignature.create({
      data: {
        name: data.name,
        title: data.title,
        imageUrl: data.imageUrl,
        type: data.type,
        relatedId: data.relatedId,
        instructorId: data.instructorId,
        institutionId: data.institutionId,
        isActive: true,
      },
    });
  }

  async getSignatures(filters?: {
    type?: string;
    relatedId?: string;
    instructorId?: string;
    institutionId?: string;
    isActive?: boolean;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.relatedId) where.relatedId = filters.relatedId;
    if (filters?.instructorId) where.instructorId = filters.instructorId;
    if (filters?.institutionId) where.institutionId = filters.institutionId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.certificateSignature.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSignatureById(id: string) {
    const signature = await prisma.certificateSignature.findUnique({
      where: { id },
    });

    if (!signature) {
      throw new NotFoundError('Signature');
    }

    return signature;
  }

  async updateSignature(
    id: string,
    data: {
      name?: string;
      title?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
    userId: string,
    userRole: string
  ) {
    const signature = await this.getSignatureById(id);

    if (signature.relatedId !== userId && userRole !== 'PLATFORM_ADMIN') {
      throw new AuthorizationError('You can only update your own signatures');
    }

    return prisma.certificateSignature.update({
      where: { id },
      data,
    });
  }

  async deleteSignature(id: string, userId: string, userRole: string): Promise<void> {
    const signature = await this.getSignatureById(id);

    if (signature.relatedId !== userId && userRole !== 'PLATFORM_ADMIN') {
      throw new AuthorizationError('You can only delete your own signatures');
    }

    await prisma.certificateSignature.delete({
      where: { id },
    });
  }
}

export const certificateSignatureService = new CertificateSignatureService();
