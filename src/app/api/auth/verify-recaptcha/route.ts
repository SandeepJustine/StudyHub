import { NextResponse } from 'next/server';
import { verifyRecaptcha, isRecaptchaEnabled } from '@/lib/captcha';

export async function POST(req: Request) {
  if (!isRecaptchaEnabled()) {
    return NextResponse.json(
      { success: true, skipped: true },
      { status: 200 }
    );
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    const result = await verifyRecaptcha(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA verification failed' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, hostname: result.hostname },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: error.statusCode || 500 }
    );
  }
}
