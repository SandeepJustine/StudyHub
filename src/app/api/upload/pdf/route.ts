import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { AppError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only instructors can upload PDFs
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const moduleId = formData.get('moduleId') as string | null;
    const courseId = formData.get('courseId') as string | null;

    if (!file && !moduleId && !courseId) {
      return NextResponse.json({ error: 'File and moduleId/courseId are required' }, { status: 400 });
    }

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    // Verify ownership if moduleId provided
    if (moduleId) {
      const module = await prisma.courseModule.findUnique({
        where: { id: moduleId },
        include: { course: true },
      });

      if (!module) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      if (module.course.instructorId !== instructor.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-z0-9.-]/gi, '-')}`;
    const folder = moduleId ? 'modules' : 'courses';
    
    // Mock upload - replace with actual storage logic
    const fileUrl = `${process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:3000'}/uploads/${folder}/${filename}`;
    const downloadUrl = `${fileUrl}?download=1`;
    const embedUrl = `${process.env.NEXT_PUBLIC_URL}/embed/pdf?url=${encodeURIComponent(fileUrl)}`;

    // Update module if moduleId provided
    if (moduleId) {
      await prisma.courseModule.update({
        where: { id: moduleId },
        data: {
          contentType: 'PDF',
          contentUrl: fileUrl,
          fileSize: file.size,
          contentData: JSON.stringify({
            type: 'PDF',
            url: fileUrl,
            downloadUrl,
            embedUrl,
            pageCount: 0, // Would be extracted in production
          }),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        downloadUrl,
        embedUrl,
        filename: file.name,
        size: file.size,
        moduleId,
        courseId,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check if user has access
    const isInstructor = module.course.instructorId === session.user.id;
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: module.courseId,
        student: { userId: session.user.id },
      },
    });

    if (!isInstructor && !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Check if premium subscription required
    const contentData = module.contentData as any;
    if (contentData?.requiresPremium && !isInstructor) {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
        include: { institution: true },
      });

      if (student?.institution) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            institutionId: student.institutionId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!subscription || !['SILVER', 'GOLD'].includes(subscription.tier)) {
          return NextResponse.json({ error: 'Premium subscription required', requiresUpgrade: true }, { status: 403 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: module.contentUrl,
        contentData,
        canDownload: isInstructor || contentData?.isDownloadable,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch PDF' }, { status: 500 });
  }
}
