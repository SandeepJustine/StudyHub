import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/jobs/[jobId]
 * Get job posting details
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.recruitmentPosting.findUnique({
      where: { id: jobId },
      include: {
        client: { select: { companyName: true, industry: true, companySize: true, website: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user has applied
    let hasApplied = false;
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (student) {
        const application = await prisma.jobApplication.findUnique({
          where: { postingId_studentId: { postingId: jobId, studentId: student.id } },
        });
        hasApplied = !!application;
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...job, hasApplied },
    });

  } catch (error) {
    console.error('Job detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 });
  }
}
