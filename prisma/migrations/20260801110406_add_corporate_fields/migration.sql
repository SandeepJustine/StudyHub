/*
  Warnings:

  - Added the required column `title` to the `CorporateContract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CorporateContract" ADD COLUMN     "description" TEXT,
ADD COLUMN     "employees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RecruitmentPosting" ADD COLUMN     "applicationsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifications" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'Full-time',
ADD COLUMN     "urgent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" SET DEFAULT 50000;
