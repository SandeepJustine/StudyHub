-- AlterTable
ALTER TABLE "CorporateClient" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "bankDetails" JSONB,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
