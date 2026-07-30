import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { courseService } from '@/lib/courses/course-service';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/courses
 * List the authenticated instructor's own courses (optionally filtered by status).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const result = await courseService.getInstructorCourses(instructor.id, {
      status: status as any,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result.courses, pagination: result.pagination });
  } catch (error: any) {
    console.error('Instructor courses list error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/courses
 * Create a course owned by the authenticated instructor.
 *
 * Note: courseService.createCourse expects an *instructor profile id*, so we
 * resolve the session user → Instructor row here. (The generic /api/courses
 * handler passes the user id, which is a latent bug we avoid here.)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const contentType = req.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const modulesRaw = formData.get('modules');
      body = {
        title: formData.get('title')?.toString() || '',
        description: formData.get('description')?.toString() || undefined,
        subject: formData.get('subject')?.toString() || '',
        examBoard: formData.get('examBoard')?.toString() || undefined,
        grade: formData.get('grade')?.toString() || undefined,
        price: Number(formData.get('price') || '0'),
        tags: formData.get('tags')
          ? (formData.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        modules: modulesRaw ? JSON.parse(modulesRaw.toString()) : [],
      };
    } else {
      body = await req.json();
    }

    const course = await courseService.createCourse(instructor.id, body);

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error: any) {
    console.error('Instructor create course error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: error.statusCode || 500 },
    );
  }
}
