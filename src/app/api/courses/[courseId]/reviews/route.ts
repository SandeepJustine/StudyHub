import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import prisma from '@/lib/utils/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can review courses' }, { status: 403 });
    }

    const { courseId } = await params;
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

    const review = await courseService.addReview(student.id, courseId, {
      rating,
      comment,
      isAnonymous,
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Must be enrolled to review') {
      return NextResponse.json({ error: 'You must be enrolled to review this course' }, { status: 403 });
    }
    if (error.message === 'Already reviewed this course') {
      return NextResponse.json({ error: 'You have already reviewed this course' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const reviews = await prisma.courseReview.findMany({
      where: { courseId },
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

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      studentName: r.isAnonymous ? 'Anonymous' : r.student.user.fullName,
      avatar: r.isAnonymous ? undefined : r.student.user.avatar,
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ success: true, data: formattedReviews });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
