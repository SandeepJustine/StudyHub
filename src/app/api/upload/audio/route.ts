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
    const generateTranscript = formData.get('generateTranscript') === 'true';

    if (!file || !moduleId) {
      return NextResponse.json({ error: 'File and moduleId are required' }, { status: 400 });
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid audio format. Allowed: MP3, WAV, OGG, M4A, AAC, FLAC' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 100MB' }, { status: 400 });
    }

    // Verify ownership
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

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-z0-9.-]/gi, '-')}`;
    const folder = 'audio';
    
    // Mock upload - replace with actual storage logic
    const fileUrl = `${process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:3000'}/uploads/${folder}/${filename}`;

    // In production, generate transcript using speech-to-text service
    let transcript = null;
    if (generateTranscript) {
      // This would call a transcription service (AWS Transcribe, Google Speech-to-Text, etc.)
      // For now, return a placeholder
      transcript = null;
    }

    // Update module
    await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        contentType: 'AUDIO',
        contentUrl: fileUrl,
        fileSize: file.size,
        contentData: JSON.stringify({
          type: 'AUDIO',
          provider: 'UPLOAD',
          url: fileUrl,
          downloadUrl: `${fileUrl}?download=1`,
          duration: 0, // Would be extracted in production
          transcript,
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.name,
        size: file.size,
        moduleId,
        transcript,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload audio' },
      { status: 500 }
    );
  }
}
