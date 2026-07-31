import { NextResponse } from 'next/server';
import { ParentService } from '@/lib/parent/parent-service';
import { cookies } from 'next/headers';

const parentService = new ParentService();

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const parentId = cookieStore.get('parent_session')?.value;

    if (!parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const progress = await parentService.getDashboard(parentId, studentId);

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch progress' }, { status });
  }
}
