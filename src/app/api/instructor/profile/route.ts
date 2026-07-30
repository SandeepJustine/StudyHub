import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/profile
 * Public-ish profile view (excludes bank details).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);
    const profile = await instructorService.getProfile(instructor.id);

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Instructor profile error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PUT /api/instructor/profile
 * Update editable instructor profile fields.
 * Body: { bio?, expertise?, bankDetails? }
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const body = await req.json();
    const { bio, expertise, bankDetails } = body;

    const updated = await instructorService.updateProfile(instructor.id, {
      ...(bio !== undefined && { bio }),
      ...(expertise !== undefined && { expertise }),
      ...(bankDetails !== undefined && { bankDetails }),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Instructor update profile error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: error.statusCode || 500 },
    );
  }
}
