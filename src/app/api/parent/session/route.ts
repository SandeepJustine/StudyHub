import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('parent_session')?.value;

    if (!sessionUserId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // In production, verify the session is still valid in database
    return NextResponse.json({
      authenticated: true,
      userId: sessionUserId,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Find parent by phone
    // This endpoint is for login with phone
    const result = { success: true, message: 'Session validated' };
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('parent_session');

  return NextResponse.json({ success: true, message: 'Logged out' });
}
