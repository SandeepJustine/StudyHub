import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateService } from '@/lib/certificates/certificate-service';
import { certificatePDFService } from '@/lib/certificates/certificate-pdf-service';
import { CertificateType } from '@prisma/client';
import { featureGating } from '@/lib/billing/feature-gating';

/**
 * GET /api/certificates
 * List user's certificates or verify a certificate
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    // Certificate verification by ID (public)
    const verifyId = searchParams.get('verify');
    if (verifyId) {
      const result = await certificateService.verifyCertificate(verifyId);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Require authentication for listing certificates
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's certificates
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      type: searchParams.get('type') as CertificateType | undefined,
    };

    const where: any = { studentId: student.id };
    if (params.type) {
      where.type = params.type;
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          examAttempt: {
            select: {
              quiz: { select: { title: true } },
              score: true,
              passed: true,
            },
          },
          template: {
            select: { id: true, name: true },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: certificates,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Certificates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * Generate a new certificate, request payment, or instructor issue
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, type, enrollmentId, examAttemptId, templateId, title, description, delivery, certificateId, paymentMethod, phone } = body;

    // Instructor issuing a certificate
    if (action === 'issue') {
      if (!enrollmentId || !templateId || !title) {
        return NextResponse.json(
          { error: 'Enrollment ID, template ID, and title are required' },
          { status: 400 }
        );
      }

      const instructor = await prisma.instructor.findUnique({
        where: { userId: session.user.id },
      });

      if (!instructor) {
        return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
      }

      const hasAccess = await featureGating.checkAccess(session.user.id, 'certificate:issue');
      if (!hasAccess.hasAccess) {
        return NextResponse.json(
          { error: 'Instructor Pro subscription required to issue certificates' },
          { status: 403 }
        );
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId },
        include: {
          course: { select: { instructorId: true, title: true } },
          student: { include: { user: { select: { fullName: true, email: true } } } },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      if (enrollment.course.instructorId !== instructor.id) {
        return NextResponse.json({ error: 'You can only issue certificates for your own courses' }, { status: 403 });
      }

      const certificate = await certificateService.generateCertificate({
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        templateId,
        type: (type as CertificateType) || 'DIGITAL',
        delivery: (delivery as any) || 'DIGITAL',
        title,
        description,
        issuedBy: instructor.id,
      });

      return NextResponse.json({
        success: true,
        data: certificate,
      }, { status: 201 });
    }

    // Student actions
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Request payment for existing certificate
    if (action === 'request' && certificateId) {
      const result = await certificateService.requestCertificate(student.id, {
        certificateId,
        paymentMethod,
        phone,
      });

      return NextResponse.json({
        success: true,
        data: result.certificate,
        paymentRequired: result.paymentRequired,
      });
    }

    // Generate new certificate
    if (!type || !templateId || !title) {
      return NextResponse.json(
        { error: 'Certificate type, template ID, and title are required' },
        { status: 400 }
      );
    }

    if (!Object.values(CertificateType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid certificate type' },
        { status: 400 }
      );
    }

    // Verify enrollment/exam ownership for paid certificates
    if (delivery !== 'DIGITAL') {
      if (enrollmentId) {
        const enrollment = await prisma.enrollment.findFirst({
          where: { id: enrollmentId, studentId: student.id },
        });
        if (!enrollment) {
          return NextResponse.json(
            { error: 'Invalid enrollment' },
            { status: 400 }
          );
        }
      }

      if (examAttemptId) {
        const attempt = await prisma.examAttempt.findFirst({
          where: { id: examAttemptId, studentId: student.id },
        });
        if (!attempt || !attempt.passed) {
          return NextResponse.json(
            { error: 'Invalid or failed exam attempt' },
            { status: 400 }
          );
        }
      }
    }

    // Generate certificate
    const certificate = await certificateService.generateCertificate({
      studentId: student.id,
      enrollmentId,
      examAttemptId,
      templateId,
      type: type as CertificateType,
      delivery: delivery || 'DIGITAL',
      title,
      description,
    });

    return NextResponse.json({
      success: true,
      data: certificate,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
