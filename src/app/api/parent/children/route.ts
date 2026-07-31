import { NextResponse } from 'next/server';
import { ParentService } from '@/lib/parent/parent-service';
import { cookies } from 'next/headers';

const parentService = new ParentService();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const parentId = cookieStore.get('parent_session')?.value;

    if (!parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const children = await parentService.getChildren(parentId);

    return NextResponse.json({ success: true, data: children });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch children' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const parentId = cookieStore.get('parent_session')?.value;

    if (!parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentEmail, relationship } = await req.json();

    if (!studentEmail) {
      return NextResponse.json({ error: 'Student email is required' }, { status: 400 });
    }

    const link = await parentService.linkParentToStudent(parentId, studentEmail, relationship);

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Failed to link student' }, { status });
  }
}
