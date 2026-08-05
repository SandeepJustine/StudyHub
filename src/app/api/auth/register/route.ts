import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';
import { verifyRecaptcha, isRecaptchaEnabled } from '@/lib/captcha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, phone, locale, institution, corporate, recaptchaToken } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isRecaptchaEnabled()) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification is required' },
          { status: 403 }
        );
      }

      try {
        await verifyRecaptcha(recaptchaToken);
      } catch (captchaError: any) {
        return NextResponse.json(
          { error: captchaError.message || 'reCAPTCHA verification failed' },
          { status: captchaError.statusCode || 403 }
        );
      }
    }

    const authService = new AuthService();
    const user = await authService.register({
      email,
      password,
      fullName,
      role,
      phone,
      locale,
      institution,
      corporate,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'EMAIL_EXISTS') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
