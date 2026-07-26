import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { CertificateType } from '@/types/certificates';

export class CertificateService {
  /**
   * Generate certificate
   */
  async generateCertificate(data: {
    studentId: string;
    enrollmentId?: string;
    examAttemptId?: string;
    type: CertificateType;
    title: string;
    description?: string;
  }) {
    const verificationId = this.generateVerificationId();
    
    // Calculate price based on type
    const priceMap = {
      DIGITAL: 2000,
      PRINTED: 5000,
      VERIFIED: 10000,
    };

    const certificate = await prisma.certificate.create({
      data: {
        ...data,
        verificationId,
        issuedAt: new Date(),
        metadata: {
          issuer: 'StudyHub Malawi',
          price: priceMap[data.type],
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // If paid certificate, create transaction
    if (data.type !== 'DIGITAL') {
      // Process payment for certificate upgrade
    }

    return certificate;
  }

  /**
   * Verify certificate authenticity
   */
  async verifyCertificate(verificationId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                subject: true,
                instructor: {
                  select: {
                    user: {
                      select: { fullName: true },
                    },
                  },
                },
              },
            },
          },
        },
        examAttempt: {
          include: {
            quiz: {
              select: {
                title: true,
                passingScore: true,
                module: {
                  select: {
                    course: {
                      select: { title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate');
    }

    return {
      verified: true,
      certificate: {
        id: certificate.id,
        verificationId: certificate.verificationId,
        type: certificate.type,
        title: certificate.title,
        description: certificate.description,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        studentName: certificate.student.user.fullName,
        courseTitle: certificate.enrollment?.course.title || 
                    certificate.examAttempt?.quiz.module.course.title,
        instructorName: certificate.enrollment?.course.instructor.user.fullName,
        metadata: certificate.metadata,
      },
    };
  }

  /**
   * Get student's certificates
   */
  async getStudentCertificates(studentId: string) {
    return prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                subject: true,
              },
            },
          },
        },
        examAttempt: {
          include: {
            quiz: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Generate QR code data for certificate
   */
  generateQRData(verificationId: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL}/verify-certificate/${verificationId}`;
    
    return {
      url: verificationUrl,
      verificationId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate verification ID
   */
  private generateVerificationId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    
    return `SH-${segments.join('-')}`;
  }
}

export const certificateService = new CertificateService();