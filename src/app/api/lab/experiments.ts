// pages/api/lab/experiments.ts
// API endpoints for virtual lab

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { ChemistryEngine } from '../../../services/lab/ChemistryEngine';

const engine = new ChemistryEngine();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getExperiments(req, res);
    case 'POST':
      return startExperiment(req, res);
    case 'PUT':
      return updateExperiment(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getExperiments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { subject, difficulty } = req.query;
    
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

    res.status(200).json(experiments);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function startExperiment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { experimentId, studentId } = req.body;

    // Check if student already has an active attempt
    const existingAttempt = await prisma.studentExperiment.findFirst({
      where: {
        experimentId,
        studentId,
        status: 'in_progress'
      }
    });

    if (existingAttempt) {
      return res.status(200).json(existingAttempt);
    }

    // Create new experiment attempt
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

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error starting experiment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateExperiment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { attemptId, stepId, observations, action } = req.body;

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
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Process observations using chemistry engine
    const processedObservations = observations.map((obs: any) => {
      // In a real app, you'd validate against the reaction rules
      return {
        ...obs,
        isCorrect: obs.studentValue === obs.expectedValue,
        points: obs.studentValue === obs.expectedValue ? 5 : 0
      };
    });

    const totalPoints = processedObservations.reduce(
      (sum: number, obs: any) => sum + obs.points, 0
    );
    const maxPoints = processedObservations.length * 5;
    const stepScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    // Update attempt
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

    // Check for badge achievements
    await checkAndAwardBadges(attempt.studentId, attempt.experimentId);

    res.status(200).json(updatedAttempt);
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function checkAndAwardBadges(studentId: string, experimentId: string) {
  // Check experiment completion badges
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

  // Check specific experiment badges
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