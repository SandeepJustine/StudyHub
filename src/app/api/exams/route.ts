import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { examEngine } from '@/lib/exams/exam-engine';

// Start exam
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await req.json();
    const studentId = session.user.studentId;

    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 400 });
    }

    const exam = await examEngine.startExam(studentId, quizId);

    return NextResponse.json({
      success: true,
      data: exam,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start exam' },
      { status: 500 }
    );
  }
}
