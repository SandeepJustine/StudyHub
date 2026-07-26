import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { examEngine } from '@/lib/exams/exam-engine';

export async function POST(
  req: Request,
  { params }: { params: { attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers } = await req.json();
    const studentId = session.user.studentId;

    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const result = await examEngine.submitExam(params.attemptId, studentId, answers);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit exam' },
      { status: 500 }
    );
  }
}