// Student-facing read of the lab subject catalogue and its experiments.
// Honours instructor subject assignments (see ExperimentSubjectAssignment).

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { labService } from '@/lib/lab/lab-service';
import { AppError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      const catalog = await labService.getLabSubjectCatalog();
      return NextResponse.json({ success: true, data: catalog });
    }

    const experiments = await labService.getExperimentsForSubject(subject);

    return NextResponse.json({
      success: true,
      subject,
      data: experiments.map((exp) => ({
        id: exp.id,
        title: exp.title,
        subject: exp.subject,
        difficulty: exp.difficulty,
        description: exp.description,
        duration: exp.duration,
        xpReward: exp.xpReward,
        objectives: exp.objectives,
        steps: exp.steps,
      })),
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to load lab subjects' }, { status: 500 });
  }
}