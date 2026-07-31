import { NextResponse } from 'next/server';
import { ParentService } from '@/lib/parent/parent-service';
import { cookies } from 'next/headers';

const parentService = new ParentService();

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await parentService.authenticateParent(phone);

    // Store temp userId in a short-lived cookie for OTP verification
    const cookieStore = await cookies();
    cookieStore.set('parent_auth_temp', result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      isNewUser: result.isNewUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
