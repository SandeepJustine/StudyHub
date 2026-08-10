import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/utils/prisma';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function createImpersonationJWT(payload: Record<string, any>, expiresInSeconds = 3600): string {
  if (!NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', NEXTAUTH_SECRET).update(data).digest('base64url');

  return `${data}.${signature}`;
}

export function verifyImpersonationJWT(token: string): Record<string, any> | null {
  if (!NEXTAUTH_SECRET) return null;

  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto.createHmac('sha256', NEXTAUTH_SECRET).update(data).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('x-impersonation-token')?.value;
  if (!token) return null;

  const payload = verifyImpersonationJWT(token);
  return payload?.userId || null;
}

export async function getOriginalAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('x-impersonation-admin')?.value;
  if (!token) return null;

  const payload = verifyImpersonationJWT(token);
  return payload?.userId || null;
}

export async function createImpersonation(userId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
  if (!NEXTAUTH_SECRET) {
    return { success: false, error: 'NEXTAUTH_SECRET is not configured' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
      locale: true,
      avatar: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Get role-specific profile IDs
  let institutionId: string | undefined;
  let studentId: string | undefined;
  let instructorId: string | undefined;
  
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, institutionId: true },
    });
    if (student) {
      institutionId = student.institutionId || undefined;
      studentId = student.id;
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id },
      select: { institutionId: true },
    });
    if (schoolAdmin) {
      institutionId = schoolAdmin.institutionId;
    }
  } else if (user.role === 'INSTRUCTOR') {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (instructor) {
      instructorId = instructor.id;
    }
  }

  const payload: Record<string, any> = {
    sub: user.id,
    userId: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
    phone: user.phone || undefined,
    locale: user.locale || 'en',
    avatar: user.avatar || undefined,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : undefined,
    institutionId,
    studentId,
    instructorId,
  };

  const token = createImpersonationJWT(payload, 3600); // 1 hour
  const adminToken = createImpersonationJWT({ userId: adminId }, 3600);

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'x-impersonation-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
  response.cookies.set({
    name: 'x-impersonation-admin',
    value: adminToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });

  return { success: true };
}

export async function stopImpersonation(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'x-impersonation-token',
    value: '',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set({
    name: 'x-impersonation-admin',
    value: '',
    maxAge: 0,
    path: '/',
  });
  return response;
}
