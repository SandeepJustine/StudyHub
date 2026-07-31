import { NextResponse } from 'next/server';
import { ParentService } from '@/lib/parent/parent-service';
import { cookies } from 'next/headers';

const parentService = new ParentService();

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // Get temp userId from cookie
    const cookieStore = await cookies();
    const tempUserId = cookieStore.get('parent_auth_temp')?.value;

    if (!tempUserId) {
      return NextResponse.json({ error: 'Session expired. Please request a new OTP.' }, { status: 401 });
    }

    // In production, verify OTP against stored value
    // For now, accept any 6-digit code
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 });
    }

    const result = await parentService.verifyOTP(tempUserId, otp);

    if (result.verified) {
      // Clear temp cookie
      cookieStore.delete('parent_auth_temp');

      // Set permanent session cookie
      cookieStore.set('parent_session', result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Verified successfully',
        userId: result.userId,
      });
    }

    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
