import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateService } from '@/lib/certificates/certificate-service';
import { verificationService } from '@/lib/certificates/verification-service';
import { CertificateType } from '@prisma/client';

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
      const result = await verificationService.verifyById(verifyId);
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
 * Generate a new certificate
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, enrollmentId, examAttemptId, title, description } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Certificate type and title are required' },
        { status: 400 }
      );
    }

    // Validate certificate type
    if (!Object.values(CertificateType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid certificate type' },
        { status: 400 }
      );
    }

    // Get student ID
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Calculate price
    const priceMap: Record<CertificateType, number> = {
      DIGITAL: 2000,
      PRINTED: 5000,
      VERIFIED: 10000,
    };

    // For paid certificates, verify enrollment/exam
    if (type !== 'DIGITAL') {
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
      type,
      title,
      description,
    });

    return NextResponse.json({
      success: true,
      data: certificate,
      price: priceMap[type as CertificateType],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}