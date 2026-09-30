/**
 * Idempotent sync of the built-in virtual lab catalogue into the database.
 *
 * Run with:  npx tsx scripts/seed-lab-experiments.ts
 *
 * Upserts by the catalogue slug (which is also the student route's `labId`), so
 * running it repeatedly updates titles/steps instead of duplicating rows.
 * Subject assignments are never touched: they are instructor-owned.
 */

import prisma from '../src/lib/utils/prisma';
import { EXPERIMENT_CATALOG } from '../src/lib/lab/experiment-catalog';

async function main() {
  let created = 0;
  let updated = 0;

  for (const experiment of EXPERIMENT_CATALOG) {
    const data = {
      title: experiment.title,
      subject: experiment.labType,
      description: experiment.description,
      objectives: experiment.objectives,
      difficulty: experiment.difficulty,
      duration: experiment.duration,
      xpReward: experiment.xpReward,
      status: 'published',
    };

    const existing = await prisma.experiment.findUnique({
      where: { id: experiment.id },
      select: { id: true },
    });

    await prisma.experiment.upsert({
      where: { id: experiment.id },
      create: { id: experiment.id, ...data },
      update: data,
    });

    if (existing) updated += 1;
    else created += 1;

    // Steps have no unique (experimentId, order) constraint, so replace them.
    await prisma.experimentStep.deleteMany({ where: { experimentId: experiment.id } });

    if (experiment.steps.length > 0) {
      await prisma.experimentStep.createMany({
        data: experiment.steps.map((step, index) => ({
          experimentId: experiment.id,
          order: index + 1,
          instruction: step.instruction,
          expectedAction: step.expectedAction ?? null,
          equipmentNeeded: step.equipmentNeeded,
          observationFields: step.observationFields,
        })),
      });
    }
  }

  const totals = {
    experiments: await prisma.experiment.count(),
    steps: await prisma.experimentStep.count(),
    assignments: await prisma.experimentSubjectAssignment.count(),
  };

  console.log(`Lab experiments synced: ${created} created, ${updated} updated.`);
  console.log('Database now holds:', totals);
}

main()
  .catch((error) => {
    console.error('Failed to sync lab experiments:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });