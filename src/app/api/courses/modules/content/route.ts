// app/api/courses/modules/content/route.ts
// Module content management API.
// - POST: create module content for a course module (process + persist)
// - PUT:  update an existing module's content

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { courseService } from '@/lib/courses/course-service';
import { multimediaService } from '@/lib/courses/multimedia-service';
import { ContentType } from '@/lib/courses/content-types';
import { AppError } from '@/lib/utils/errors';

/**
 * Create a new module (with content) for a course.
 * Body: { courseId, title, description?, contentType, contentData?, order?, ... }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, moduleId, title, description, contentType, contentData, order } = body ?? {};

    if (!courseId || !title || !contentType) {
      return NextResponse.json(
        { error: 'courseId, title and contentType are required' },
        { status: 400 }
      );
    }

    // Process content via the multimedia service when content is provided.
    let processedContent: unknown = undefined;
    if (contentData) {
      try {
        processedContent = await multimediaService.processContent(contentData, contentType as ContentType);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid content data';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // Update an existing module's content, or add a new module to the course.
    if (moduleId) {
      const updated = await courseService.addModule(courseId, session.instructorId ?? '', {
        title,
        description,
        contentType: contentType as ContentType,
        contentData: processedContent,
        order,
      });
      return NextResponse.json({ module: updated });
    }

    const module_ = await courseService.addModule(courseId, session.instructorId ?? '', {
      title,
      description,
      contentType: contentType as ContentType,
      contentData: processedContent,
      order,
    });

    return NextResponse.json({ module: module_ }, { status: 201 });
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
  }
}


/**
 * Update module content.
 * Body: { moduleId, contentData, contentType }
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { contentType, contentData } = body ?? {};

    if (!contentType || !contentData) {
      return NextResponse.json(
        { error: 'contentType and contentData are required' },
        { status: 400 }
      );
    }

    const processedContent = await multimediaService.processContent(
      contentData,
      contentType as ContentType
    );

    return NextResponse.json({ content: processedContent });
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
  }
}
