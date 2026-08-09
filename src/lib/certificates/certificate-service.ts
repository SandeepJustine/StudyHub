import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, AuthorizationError, PaymentError } from '@/lib/utils/errors';
import { Certificate, CertificateTemplate, CertificateBranding, GenerateCertificateData, CertificateType, CertificatePaymentStatus } from '@/types/certificates';
import { paymentService } from '@/lib/payments/payment-service';
import { NotificationService } from '@/lib/notifications/notification-service';
import { certificateTemplateService } from '@/lib/certificates/certificate-template-service';
import { certificateBrandingService } from '@/lib/certificates/certificate-branding-service';

const CERTIFICATE_PRICES: Record<CertificateType, number> = {
  DIGITAL: 2000,
  PRINTED: 5000,
  VERIFIED: 10000,
};

export class CertificateService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async generateCertificate(data: GenerateCertificateData): Promise<Certificate> {
    const verificationId = this.generateVerificationId();
    const certificateNumber = this.generateCertificateNumber();

    const template = await certificateTemplateService.getTemplateById(data.templateId);

    const price = data.delivery === 'DIGITAL' ? 0 : CERTIFICATE_PRICES[data.type];

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId: data.studentId,
        examAttemptId: data.examAttemptId,
        templateId: data.templateId,
        type: data.type,
        delivery: data.delivery,
        title: data.title,
        description: data.description,
        verificationId,
        paymentStatus: price === 0 ? 'FREE' : 'PENDING',
        amount: price,
        issuedBy: data.issuedBy,
        metadata: {
          issuer: 'StudyHub Malawi',
          templateName: template.name,
          generatedAt: new Date().toISOString(),
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        template: true,
        enrollment: {
          include: {
            course: {
              select: { title: true, subject: true },
            },
          },
        },
        examAttempt: {
          include: {
            quiz: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (data.enrollmentId) {
      await prisma.enrollment.update({
        where: { id: data.enrollmentId },
        data: { certificateId: certificate.id },
      });
    }

    return certificate as Certificate;
  }

  async requestCertificate(
    studentId: string,
    data: {
      certificateId: string;
      paymentMethod: string;
      phone?: string;
    }
  ): Promise<{ certificate: Certificate; paymentRequired: boolean }> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: data.certificateId },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate');
    }

    if (certificate.studentId !== studentId) {
      throw new AuthorizationError('You can only request your own certificates');
    }

    if (certificate.paymentStatus === 'PAID') {
      return { certificate: certificate as Certificate, paymentRequired: false };
    }

    if (certificate.amount === 0) {
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { paymentStatus: 'FREE' },
      });
      return { certificate: { ...certificate, paymentStatus: 'FREE' } as Certificate, paymentRequired: false };
    }

    const userId = certificate.student?.userId || (await prisma.student.findUnique({
      where: { id: certificate.studentId },
      select: { userId: true },
    }))?.userId || '';

    if (!userId) {
      throw new Error('Student user account not found for certificate payment');
    }

    const paymentResult = await paymentService.processPayment({
      userId,
      amount: certificate.amount,
      method: data.paymentMethod as any,
      metadata: {
        type: 'certificate',
        certificateId: certificate.id,
        certificateNumber: certificate.certificateNumber,
        description: `Certificate ${certificate.certificateNumber}`,
        ...(data.phone && { phone: data.phone }),
      },
    });

    if (!paymentResult.success) {
      throw new PaymentError(paymentResult.message || 'Payment failed');
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference: paymentResult.reference },
    });

    const isDevMode = process.env.NODE_ENV === 'development' && process.env.PAYMENT_SIMULATION_ENABLED !== 'false';
    const paymentVerified = isDevMode || transaction?.status === 'COMPLETED';

    if (paymentVerified) {
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: {
          paymentStatus: 'PAID',
          transactionId: paymentResult.reference,
        },
      });

      await this.notificationService.sendPaymentConfirmation(certificate.studentId, {
        amount: certificate.amount,
        planName: `Certificate ${certificate.certificateNumber}`,
        paymentMethod: data.paymentMethod,
        transactionReference: paymentResult.reference,
      });
    }

    const updatedCertificate = await prisma.certificate.findUnique({
      where: { id: certificate.id },
    });

    return {
      certificate: updatedCertificate as Certificate,
      paymentRequired: !paymentVerified,
    };
  }

  async verifyCertificate(verificationId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                subject: true,
                instructorId: true,
              },
            },
          },
        },
        examAttempt: {
          include: {
            quiz: {
              include: {
                module: {
                  select: {
                    courseId: true,
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

    let courseTitle: string | null = null;
    let instructorName: string | null = null;

    if (certificate.enrollment?.course) {
      courseTitle = certificate.enrollment.course.title;
      if (certificate.enrollment.course.instructorId) {
        const instructor = await prisma.instructor.findUnique({
          where: { id: certificate.enrollment.course.instructorId },
          include: {
            user: {
              select: { fullName: true },
            },
          },
        });
        instructorName = instructor?.user.fullName || null;
      }
    }

    if (!courseTitle && certificate.examAttempt?.quiz?.module?.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: certificate.examAttempt.quiz.module.courseId },
        select: { title: true },
      });
      courseTitle = course?.title || null;
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
        courseTitle,
        instructorName,
        metadata: certificate.metadata,
      },
    };
  }

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
              select: { title: true },
            },
          },
        },
        template: true,
      },
    });
  }

  generateQRData(verificationId: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL}/verify-certificate/${verificationId}`;

    return {
      url: verificationUrl,
      verificationId,
      timestamp: new Date().toISOString(),
    };
  }

  async getCertificateForRendering(certificateId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
        template: true,
        enrollment: {
          include: {
            course: {
              select: { title: true, subject: true, instructorId: true },
            },
          },
        },
        examAttempt: {
          include: {
            quiz: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate');
    }

    let branding: CertificateBranding | null = null;

    return {
      certificate,
      branding,
    };
  }

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

  private generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CERT-${year}-${random}`;
  }
}

export const certificateService = new CertificateService();
