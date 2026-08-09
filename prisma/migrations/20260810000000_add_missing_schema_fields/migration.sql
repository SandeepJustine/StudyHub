-- CreateEnum
CREATE TYPE "CertificateDelivery" AS ENUM ('DIGITAL', 'PRINTED', 'BOTH');

-- CreateEnum
CREATE TYPE "CertificatePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FREE');

-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_examAttemptId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "certificateNumber" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "delivery" "CertificateDelivery" NOT NULL DEFAULT 'DIGITAL',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "issuedBy" TEXT,
ADD COLUMN     "paymentStatus" "CertificatePaymentStatus" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "templateId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "examAttemptId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "originalId" TEXT,
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CorporateClient" ADD COLUMN     "companySize" TEXT;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "attendedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'registered';

-- AlterTable
ALTER TABLE "ExamAttempt" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "timeSpent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "salesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ParentLink" ADD COLUMN     "relationship" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minAmount" INTEGER;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "refereeEmail" TEXT;

-- AlterTable
ALTER TABLE "SponsorshipSlot" ADD COLUMN     "placement" TEXT;

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "CertificateBranding_institutionId_key" ON "CertificateBranding"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_verificationId_idx" ON "Certificate"("verificationId");

-- CreateIndex
CREATE INDEX "Certificate_certificateNumber_idx" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_templateId_idx" ON "Certificate"("templateId");

-- CreateIndex
CREATE INDEX "Certificate_issuedAt_idx" ON "Certificate"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_certificateId_key" ON "Enrollment"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_postingId_studentId_key" ON "JobApplication"("postingId", "studentId");

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateSignature" ADD CONSTRAINT "CertificateSignature_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateSignature" ADD CONSTRAINT "CertificateSignature_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateBranding" ADD CONSTRAINT "CertificateBranding_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "ExamAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

