import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateService } from '@/lib/certificates/certificate-service';
import { certificatePDFService } from '@/lib/certificates/certificate-pdf-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    const instructor = session.user.role === 'INSTRUCTOR' ? await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    }) : null;

    if (!student && !instructor) {
      return NextResponse.json({ error: 'Student or Instructor profile not found' }, { status: 404 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
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
              include: {
                module: {
                  select: {
                    course: {
                      select: { title: true, instructorId: true },
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
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    let hasAccess = false;

    if (student && certificate.studentId === student.id) {
      hasAccess = true;
    } else if (instructor) {
      const courseInstructorId = certificate.enrollment?.course.instructorId || certificate.examAttempt?.quiz.module.course.instructorId;
      if (courseInstructorId === instructor.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (student && certificate.paymentStatus !== 'PAID' && certificate.paymentStatus !== 'FREE') {
      return NextResponse.json(
        { error: 'Payment required to download certificate' },
        { status: 402 }
      );
    }

    const { certificate: cert, branding } = await certificateService.getCertificateForRendering(id);
    const html = certificatePDFService.generateHTML(cert, cert.template, branding);
    const printableHtml = certificatePDFService.generatePrintableHTML(html);

    return new NextResponse(printableHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to download certificate' },
      { status: 500 }
    );
  }
}
