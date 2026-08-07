import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

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

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        template: true,
        enrollment: {
          include: {
            course: { select: { title: true, subject: true } },
            student: { include: { user: { select: { fullName: true } } } },
          },
        },
        examAttempt: {
          include: {
            quiz: { select: { title: true } },
            student: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: session.user.id },
      });

      if (!schoolAdmin) {
        return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 });
      }

      const institution = await prisma.institution.findUnique({
        where: { id: schoolAdmin.institutionId },
        include: { students: { select: { id: true } } },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
      }

      const studentIds = institution.students.map((s) => s.id);
      if (!studentIds.includes(certificate.studentId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    console.error('Get certificate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            course: true,
          },
        },
        examAttempt: {
          include: {
            quiz: {
              include: {
                module: {
                  include: {
                    course: true,
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

    if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: session.user.id },
      });

      if (!schoolAdmin) {
        return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 });
      }

      const institution = await prisma.institution.findUnique({
        where: { id: schoolAdmin.institutionId },
        include: { students: { select: { id: true } } },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
      }

      const studentIds = institution.students.map((s) => s.id);
      if (!studentIds.includes(certificate.studentId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.certificate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate revoked successfully',
    });
  } catch (error: any) {
    console.error('Revoke certificate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke certificate' },
      { status: 500 }
    );
  }
}
