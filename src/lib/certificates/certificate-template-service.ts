import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, AuthorizationError } from '@/lib/utils/errors';
import { CertificateTemplate } from '@/types/certificates';

export class CertificateTemplateService {
  async createTemplate(data: {
    name: string;
    description?: string;
    designConfig?: Record<string, any>;
    createdBy: string;
    createdByRole: string;
    institutionId?: string;
    isDefault?: boolean;
  }): Promise<CertificateTemplate> {
    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        designConfig: data.designConfig,
        createdBy: data.createdBy,
        createdByRole: data.createdByRole,
        institutionId: data.institutionId,
        isDefault: data.isDefault || false,
        isActive: true,
      },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });

    return template as CertificateTemplate;
  }

  async getTemplates(filters?: {
    institutionId?: string;
    createdByRole?: string;
    isActive?: boolean;
  }): Promise<CertificateTemplate[]> {
    const where: any = {};
    if (filters?.institutionId) where.institutionId = filters.institutionId;
    if (filters?.createdByRole) where.createdByRole = filters.createdByRole;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const templates = await prisma.certificateTemplate.findMany({
      where,
      orderBy: { isDefault: 'desc' },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });

    return templates as CertificateTemplate[];
  }

  async getTemplateById(id: string): Promise<CertificateTemplate> {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Certificate template');
    }

    return template as CertificateTemplate;
  }

  async updateTemplate(
    id: string,
    data: {
      name?: string;
      description?: string;
      designConfig?: Record<string, any>;
      isActive?: boolean;
      isDefault?: boolean;
    },
    userId: string,
    userRole: string
  ): Promise<CertificateTemplate> {
    const template = await this.getTemplateById(id);

    if (template.createdBy !== userId && userRole !== 'PLATFORM_ADMIN') {
      throw new AuthorizationError('You can only update your own templates');
    }

    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.certificateTemplate.update({
      where: { id },
      data,
    });

    return updated as CertificateTemplate;
  }

  async deleteTemplate(id: string, userId: string, userRole: string): Promise<void> {
    const template = await this.getTemplateById(id);

    if (template.createdBy !== userId && userRole !== 'PLATFORM_ADMIN') {
      throw new AuthorizationError('You can only delete your own templates');
    }

    if (template.isDefault) {
      throw new AppError('Cannot delete default template', 'CANNOT_DELETE_DEFAULT', 400);
    }

    await prisma.certificateTemplate.delete({
      where: { id },
    });
  }

  async getDefaultTemplate(): Promise<CertificateTemplate | null> {
    const template = await prisma.certificateTemplate.findFirst({
      where: { isDefault: true, isActive: true },
    });

    return template as CertificateTemplate | null;
  }
}

export const certificateTemplateService = new CertificateTemplateService();
