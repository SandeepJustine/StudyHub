import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { CertificateBranding } from '@/types/certificates';

export class CertificateBrandingService {
  async getBranding(institutionId: string): Promise<CertificateBranding | null> {
    const branding = await prisma.certificateBranding.findUnique({
      where: { institutionId },
    });

    return branding as CertificateBranding | null;
  }

  async createOrUpdateBranding(
    institutionId: string,
    data: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      fontFamily?: string;
      logoUrl?: string;
      sealUrl?: string;
      customTemplate?: Record<string, any>;
      isActive?: boolean;
    }
  ): Promise<CertificateBranding> {
    const branding = await prisma.certificateBranding.upsert({
      where: { institutionId },
      create: {
        institutionId,
        ...data,
        isActive: data.isActive ?? true,
      },
      update: data,
    });

    return branding as CertificateBranding;
  }

  async deleteBranding(institutionId: string): Promise<void> {
    await prisma.certificateBranding.delete({
      where: { institutionId },
    });
  }

  async getActiveBranding(institutionId: string): Promise<CertificateBranding | null> {
    const branding = await prisma.certificateBranding.findFirst({
      where: { institutionId, isActive: true },
    });

    return branding as CertificateBranding | null;
  }
}

export const certificateBrandingService = new CertificateBrandingService();
