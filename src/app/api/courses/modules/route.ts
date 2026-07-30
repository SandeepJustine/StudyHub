// API route for module management within a course.
// - GET: list all modules for a course (instructor only)
// - POST: create a new module
// - PUT: update an existing module
// - DELETE: delete a module

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { AppError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Verify instructor owns the course
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            questionsCount: true,
            passingScore: true,
            timeLimit: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: modules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch modules' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { courseId, title, description, contentType, contentUrl, contentData, duration, isPreview, order } = body;

    if (!courseId || !title || !contentType) {
      return NextResponse.json(
        { error: 'courseId, title, and contentType are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Calculate order if not provided
    let moduleOrder = order;
    if (moduleOrder === undefined) {
      const maxOrder = await prisma.courseModule.aggregate({
        where: { courseId },
        _max: { order: true },
      });
      moduleOrder = (maxOrder._max.order || 0) + 1;
    }

    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title,
        description,
        contentType: contentType as any,
        contentUrl,
        contentData: contentData ? JSON.stringify(contentData) : undefined,
        duration,
        isPreview: isPreview || false,
        isRequired: true,
        order: moduleOrder,
      },
    });

    return NextResponse.json({ success: true, data: module }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create module' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { moduleId, title, description, contentType, contentUrl, contentData, duration, isPreview, order, thumbnailUrl, embedCode } = body;

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    // Verify ownership
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    if (existingModule.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(contentType !== undefined && { contentType: contentType as any }),
        ...(contentUrl !== undefined && { contentUrl }),
        ...(contentData !== undefined && { contentData: JSON.stringify(contentData) }),
        ...(duration !== undefined && { duration }),
        ...(isPreview !== undefined && { isPreview }),
        ...(order !== undefined && { order }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(embedCode !== undefined && { embedCode }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update module' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    // Verify ownership
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    if (existingModule.course.instructorId !== instructor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete the module (cascade will handle quiz, questions, etc.)
    await prisma.courseModule.delete({
      where: { id: moduleId },
    });

    // Reorder remaining modules
    const remainingModules = await prisma.courseModule.findMany({
      where: { courseId: existingModule.courseId },
      orderBy: { order: 'asc' },
    });

    await prisma.$transaction(
      remainingModules.map((mod, index) =>
        prisma.courseModule.update({
          where: { id: mod.id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Module deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete module' }, { status: 500 });
  }
}
