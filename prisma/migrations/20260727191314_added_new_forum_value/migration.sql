/*
  Warnings:

  - The values [SLIDES,LINK,ASSIGNMENT,PAST_PAPER] on the enum `ContentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userAgent` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `companySize` on the `CorporateClient` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `CorporateContract` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CorporateContract` table. All the data in the column will be lost.
  - You are about to drop the column `attendedAt` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Institution` table. All the data in the column will be lost.
  - You are about to drop the column `pendingEarnings` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `relationship` on the `ParentLink` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `eventRegistrationId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `instructorPayout` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `providerRef` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContentType_new" AS ENUM ('TEXT', 'VIDEO', 'AUDIO', 'PDF', 'QUIZ', 'LIVE_SESSION', 'EMBED');
ALTER TABLE "CourseModule" ALTER COLUMN "contentType" DROP DEFAULT;
ALTER TABLE "CourseModule" ALTER COLUMN "contentType" TYPE "ContentType_new" USING ("contentType"::text::"ContentType_new");
ALTER TYPE "ContentType" RENAME TO "ContentType_old";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";
DROP TYPE "ContentType_old";
ALTER TABLE "CourseModule" ALTER COLUMN "contentType" SET DEFAULT 'TEXT';
COMMIT;

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_eventRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "EventRegistration_eventId_userId_key";

-- DropIndex
DROP INDEX "Payout_instructorId_period_idx";

-- DropIndex
DROP INDEX "Payout_status_idx";

-- DropIndex
DROP INDEX "Transaction_reference_idx";

-- DropIndex
DROP INDEX "Transaction_status_createdAt_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "CorporateClient" DROP COLUMN "companySize";

-- AlterTable
ALTER TABLE "CorporateContract" DROP COLUMN "signedAt",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "attendedAt",
DROP COLUMN "status",
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "ForumThread" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Institution" DROP COLUMN "address";

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "pendingEarnings";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "priority",
DROP COLUMN "readAt";

-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "occupation";

-- AlterTable
ALTER TABLE "ParentLink" DROP COLUMN "relationship";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "createdAt",
DROP COLUMN "metadata",
DROP COLUMN "paymentMethod",
DROP COLUMN "processedAt",
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "cancelledAt",
DROP COLUMN "discountAmount",
DROP COLUMN "metadata",
DROP COLUMN "paymentMethod";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "courseId",
DROP COLUMN "description",
DROP COLUMN "eventId",
DROP COLUMN "eventRegistrationId",
DROP COLUMN "instructorPayout",
DROP COLUMN "providerRef",
DROP COLUMN "refundedAmount",
DROP COLUMN "refundedAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationExpires",
DROP COLUMN "emailVerificationToken",
DROP COLUMN "metadata",
DROP COLUMN "passwordResetExpires",
DROP COLUMN "passwordResetToken";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
