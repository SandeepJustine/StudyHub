import prisma from '@/lib/utils/prisma';
import { NotFoundError } from '@/lib/utils/errors';
import crypto from 'crypto';

export class VerificationService {
  /**
   * Verify certificate by ID
   */
  async verifyById(verificationId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      select: {
        id: true,
        verificationId: true,
        type: true,
        title: true,
        issuedAt: true,
        student: {
          select: {
            user: {
              select: { fullName: true },
            },
          },
        },
        enrollment: {
          select: {
            course: {
              select: {
                title: true,
                subject: true,
              },
            },
          },
        },
        examAttempt: {
          select: {
            score: true,
            passed: true,
            quiz: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    return {
      verified: true,
      certificate,
    };
  }

  /**
   * Generate digital signature for certificate
   */
  generateSignature(data: any): string {
    const secret = process.env.CERTIFICATE_SIGNING_KEY || 'studyhub-secret-key';
    const payload = JSON.stringify(data);
    
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify digital signature
   */
  verifySignature(data: any, signature: string): boolean {
    const expectedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    const [total, byType, recentVerifications] = await Promise.all([
      prisma.certificate.count(),
      prisma.certificate.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.certificate.count({
        where: {
          issuedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      total,
      byType,
      recentVerifications,
      last30Days: recentVerifications,
    };
  }
}

export const verificationService = new VerificationService();