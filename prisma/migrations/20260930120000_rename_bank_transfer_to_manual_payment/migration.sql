-- Rename the legacy BANK_TRANSFER payment method to MANUAL_PAYMENT.
-- These are the same concept: a proof-of-payment bank transfer that an admin
-- verifies manually. RENAME VALUE keeps every existing row and the enum's
-- sort position, so no data is rewritten or dropped.
ALTER TYPE "PaymentMethod" RENAME VALUE 'BANK_TRANSFER' TO 'MANUAL_PAYMENT';

-- Align the subject-assignment index name with the @@unique constraint
-- declared in schema.prisma (the earlier migration created it as ..._k).
ALTER INDEX "ExperimentSubjectAssignment_experimentId_subject_instructorId_k"
  RENAME TO "ExperimentSubjectAssignment_experimentId_subject_instructor_key";
