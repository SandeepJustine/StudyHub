import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can rate instructors' }, { status: 403 });
    }

    const { instructorId } = await params;
    const body = await req.json();
    const { rating, comment, isAnonymous = false } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if student is enrolled in any course by this instructor
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        course: { instructorId },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in at least one course by this instructor to rate them' },
        { status: 403 }
      );
    }

    const existing = await prisma.instructorRating.findUnique({
      where: {
        instructorId_studentId: { instructorId, studentId: student.id },
      },
    });

    let ratingRecord;
    if (existing) {
      ratingRecord = await prisma.instructorRating.update({
        where: { id: existing.id },
        data: { rating, comment, isAnonymous },
      });
    } else {
      ratingRecord = await prisma.instructorRating.create({
        data: {
          instructorId,
          studentId: student.id,
          rating,
          comment,
          isAnonymous,
        },
      });
    }

    // Update instructor average rating
    const stats = await prisma.instructorRating.aggregate({
      where: { instructorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.instructor.update({
      where: { id: instructorId },
      data: {
        rating: stats._avg.rating || 0,
      },
    });

    return NextResponse.json({ success: true, data: ratingRecord }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const { instructorId } = await params;

    const ratings = await prisma.instructorRating.findMany({
      where: { instructorId },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formattedRatings = ratings.map((r: { id: string; isAnonymous: boolean; rating: number; comment: string | null; createdAt: Date; student: { user: { fullName: string } } }) => ({
      id: r.id,
      studentName: r.isAnonymous ? 'Anonymous' : r.student.user.fullName,
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt,
    }));

    const stats = await prisma.instructorRating.aggregate({
      where: { instructorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ratings: formattedRatings,
        average: stats._avg.rating || 0,
        count: stats._count.rating || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
