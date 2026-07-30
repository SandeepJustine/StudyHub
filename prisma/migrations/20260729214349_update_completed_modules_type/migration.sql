/*
  Warnings:

  - The `completedModules` column on the `Enrollment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "completedModules",
ADD COLUMN     "completedModules" TEXT[];
