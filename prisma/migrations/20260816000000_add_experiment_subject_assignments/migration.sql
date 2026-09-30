-- Instructor-curated assignment of existing experiments to teaching subjects.
-- Kept separate from Experiment.subject, which is the lab simulator type.
CREATE TABLE "ExperimentSubjectAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentSubjectAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExperimentSubjectAssignment_experimentId_subject_instructorId_key" ON "ExperimentSubjectAssignment"("experimentId", "subject", "instructorId");

CREATE INDEX "ExperimentSubjectAssignment_instructorId_subject_idx" ON "ExperimentSubjectAssignment"("instructorId", "subject");

CREATE INDEX "ExperimentSubjectAssignment_subject_idx" ON "ExperimentSubjectAssignment"("subject");

ALTER TABLE "ExperimentSubjectAssignment" ADD CONSTRAINT "ExperimentSubjectAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExperimentSubjectAssignment" ADD CONSTRAINT "ExperimentSubjectAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;