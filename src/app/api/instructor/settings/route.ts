import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { instructorService } from '@/lib/instructor/instructor-service';

/**
 * GET /api/instructor/settings
 * Instructor settings: notification preferences, payout method, profile visibility.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        locale: true,
        notificationPreferences: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        instructor: {
          id: instructor.id,
          revenueShare: instructor.revenueShare,
          isVerified: instructor.isVerified,
          bankDetails: instructor.bankDetails,
          totalEarnings: instructor.totalEarnings,
        },
      },
    });
  } catch (error: any) {
    console.error('Instructor settings error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/instructor/settings
 * Update instructor settings.
 * Body: { notificationPreferences?, phone?, locale?, bankDetails? }
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructor = await instructorService.resolveByUserId(session.user.id);

    const body = await req.json();
    const { notificationPreferences, phone, locale, bankDetails } = body;

    // Update user-level settings
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(locale !== undefined && { locale }),
        ...(notificationPreferences !== undefined && { notificationPreferences }),
      },
    });

    // Update instructor-level settings (bank details)
    if (bankDetails !== undefined) {
      await prisma.instructor.update({
        where: { id: instructor.id },
        data: { bankDetails },
      });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Instructor update settings error:', error);
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: error.statusCode || 500 },
    );
  }
}
