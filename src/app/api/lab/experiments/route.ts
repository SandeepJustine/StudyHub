import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';
import { ChemistryEngine } from '@/services/lab/ChemistryEngine';
import { Experiment } from '@/types/lab';
import { BiologyExperiment } from '@/types/lab';
import { PhysicsExperiment } from '@/types/lab';
import { PhysicsEngine } from '@/services/lab/PhysicsEngine';
import { BiologyEngine } from '@/services/lab/BiologyEngine';
const engine = new ChemistryEngine();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;

    const experiments = await prisma.experiment.findMany({
      where: {
        ...(subject && { subject: subject as string }),
        ...(difficulty && { difficulty: difficulty as string }),
        status: 'published'
      },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(experiments);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experimentId, studentId } = body;

    const existingAttempt = await prisma.studentExperiment.findFirst({
      where: {
        experimentId,
        studentId,
        status: 'in_progress'
      }
    });

    if (existingAttempt) {
      return NextResponse.json(existingAttempt);
    }

    const attempt = await prisma.studentExperiment.create({
      data: {
        experimentId,
        studentId,
        status: 'in_progress',
        startedAt: new Date(),
        currentStep: 0,
        score: 0,
        xpEarned: 0,
        attempts: 1,
        observations: []
      }
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error('Error starting experiment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { attemptId, stepId, observations, action } = body;

    const attempt = await prisma.studentExperiment.findUnique({
      where: { id: attemptId },
      include: {
        experiment: {
          include: {
            steps: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
    }

    const processedObservations = observations.map((obs: any) => ({
      ...obs,
      isCorrect: obs.studentValue === obs.expectedValue,
      points: obs.studentValue === obs.expectedValue ? 5 : 0
    }));

    const totalPoints = processedObservations.reduce(
      (sum: number, obs: any) => sum + obs.points, 0
    );
    const maxPoints = processedObservations.length * 5;
    const stepScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const updatedAttempt = await prisma.studentExperiment.update({
      where: { id: attemptId },
      data: {
        currentStep: attempt.currentStep + 1,
        observations: {
          push: processedObservations.map((obs: any) => ({
            id: obs.id,
            stepId,
            type: obs.type,
            studentValue: obs.studentValue,
            expectedValue: obs.expectedValue,
            isCorrect: obs.isCorrect,
            points: obs.points,
            timestamp: new Date()
          }))
        },
        score: attempt.score + stepScore,
        xpEarned: attempt.xpEarned + totalPoints,
        ...(attempt.currentStep + 1 >= attempt.experiment.steps.length && {
          status: 'completed',
          completedAt: new Date()
        })
      }
    });

    await checkAndAwardBadges(attempt.studentId, attempt.experimentId);

    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error('Error updating experiment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function checkAndAwardBadges(studentId: string, experimentId: string) {
  const completedCount = await prisma.studentExperiment.count({
    where: {
      studentId,
      status: 'completed'
    }
  });

  if (completedCount === 1) {
    await awardBadge(studentId, 'first_experiment');
  } else if (completedCount === 5) {
    await awardBadge(studentId, 'chemistry_beginner');
  } else if (completedCount === 10) {
    await awardBadge(studentId, 'chemistry_expert');
  }

  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId }
  });

  if (experiment?.badgeId) {
    await awardBadge(studentId, experiment.badgeId);
  }
}

async function awardBadge(studentId: string, badgeId: string) {
  const existing = await prisma.studentBadge.findFirst({
    where: { studentId, badgeId }
  });

  if (!existing) {
    await prisma.studentBadge.create({
      data: {
        studentId,
        badgeId,
        awardedAt: new Date()
      }
    });
  }
}