CREATE TYPE "CertificateDelivery" AS ENUM ('DIGITAL', 'PRINTED', 'BOTH');

CREATE TYPE "CertificatePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FREE');

ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_examAttemptId_fkey";

ALTER TABLE "AuditLog"
ADD COLUMN "userAgent" TEXT;

ALTER TABLE "Certificate"
ADD COLUMN "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "certificateNumber" TEXT NOT NULL,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "delivery" "CertificateDelivery" NOT NULL DEFAULT 'DIGITAL',
ADD COLUMN "description" TEXT,
ADD COLUMN "issuedBy" TEXT,
ADD COLUMN "paymentStatus" "CertificatePaymentStatus" NOT NULL DEFAULT 'FREE',
ADD COLUMN "templateId" TEXT NOT NULL,
ADD COLUMN "title" TEXT NOT NULL,
ADD COLUMN "transactionId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "examAttemptId" DROP NOT NULL;

ALTER TABLE "ContentItem"
ADD COLUMN "originalId" TEXT,
ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "CorporateClient"
ADD COLUMN "companySize" TEXT;

ALTER TABLE "EventRegistration"
ADD COLUMN "attendedAt" TIMESTAMP(3),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'registered';

ALTER TABLE "ExamAttempt"
ADD COLUMN "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "timeSpent" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "JobApplication"
ADD COLUMN "notes" TEXT;

ALTER TABLE "MarketplaceListing"
ADD COLUMN "salesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "ParentLink"
ADD COLUMN "relationship" TEXT;

ALTER TABLE "PromoCode"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "minAmount" INTEGER;

ALTER TABLE "Referral"
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "refereeEmail" TEXT;

ALTER TABLE "SponsorshipSlot"
ADD COLUMN "placement" TEXT;

ALTER TABLE "SupportTicket"
ADD COLUMN "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "CertificateTemplate" (
"id" TEXT NOT NULL,
"name" TEXT NOT NULL,
"description" TEXT,
"isDefault" BOOLEAN NOT NULL DEFAULT false,
"isActive" BOOLEAN NOT NULL DEFAULT true,
"designConfig" JSONB,
"createdBy" TEXT NOT NULL,
"createdByRole" TEXT NOT NULL,
"institutionId" TEXT,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,

CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")

);

CREATE TABLE "CertificateSignature" (
"id" TEXT NOT NULL,
"name" TEXT NOT NULL,
"title" TEXT NOT NULL,
"imageUrl" TEXT NOT NULL,
"type" TEXT NOT NULL,
"relatedId" TEXT NOT NULL,
"instructorId" TEXT,
"institutionId" TEXT,
"isActive" BOOLEAN NOT NULL DEFAULT true,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,
"tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
"reviewedBy" TEXT,
"originalId" TEXT,

CONSTRAINT "CertificateSignature_pkey" PRIMARY KEY ("id")

);

CREATE TABLE "CertificateBranding" (
"id" TEXT NOT NULL,
"institutionId" TEXT NOT NULL,
"primaryColor" TEXT DEFAULT '#1a1a2e',
"secondaryColor" TEXT DEFAULT '#16213e',
"accentColor" TEXT DEFAULT '#e94560',
"fontFamily" TEXT DEFAULT 'serif',
"logoUrl" TEXT,
"sealUrl" TEXT,
"customTemplate" JSONB,
"isActive" BOOLEAN NOT NULL DEFAULT true,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,

CONSTRAINT "CertificateBranding_pkey" PRIMARY KEY ("id")

);

CREATE UNIQUE INDEX "CertificateBranding_institutionId_key"
ON "CertificateBranding"("institutionId");

CREATE UNIQUE INDEX "Certificate_certificateNumber_key"
ON "Certificate"("certificateNumber");

CREATE INDEX "Certificate_studentId_idx"
ON "Certificate"("studentId");

CREATE INDEX "Certificate_verificationId_idx"
ON "Certificate"("verificationId");

CREATE INDEX "Certificate_certificateNumber_idx"
ON "Certificate"("certificateNumber");

CREATE INDEX "Certificate_templateId_idx"
ON "Certificate"("templateId");

CREATE INDEX "Certificate_issuedAt_idx"
ON "Certificate"("issuedAt");

CREATE UNIQUE INDEX "Enrollment_certificateId_key"
ON "Enrollment"("certificateId");

CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key"
ON "EventRegistration"("eventId", "userId");

CREATE UNIQUE INDEX "JobApplication_postingId_studentId_key"
ON "JobApplication"("postingId", "studentId");

ALTER TABLE "CertificateTemplate"
ADD CONSTRAINT "CertificateTemplate_institutionId_fkey"
FOREIGN KEY ("institutionId")
REFERENCES "Institution"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CertificateSignature"
ADD CONSTRAINT "CertificateSignature_instructorId_fkey"
FOREIGN KEY ("instructorId")
REFERENCES "Instructor"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CertificateSignature"
ADD CONSTRAINT "CertificateSignature_institutionId_fkey"
FOREIGN KEY ("institutionId")
REFERENCES "Institution"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CertificateBranding"
ADD CONSTRAINT "CertificateBranding_institutionId_fkey"
FOREIGN KEY ("institutionId")
REFERENCES "Institution"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_certificateId_fkey"
FOREIGN KEY ("certificateId")
REFERENCES "Certificate"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Certificate"
ADD CONSTRAINT "Certificate_examAttemptId_fkey"
FOREIGN KEY ("examAttemptId")
REFERENCES "ExamAttempt"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Certificate"
ADD CONSTRAINT "Certificate_templateId_fkey"
FOREIGN KEY ("templateId")
REFERENCES "CertificateTemplate"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
