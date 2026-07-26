import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/auth-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, phone, locale } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const user = await authService.register({
      email,
      password,
      fullName,
      role,
      phone,
      locale,
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
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}