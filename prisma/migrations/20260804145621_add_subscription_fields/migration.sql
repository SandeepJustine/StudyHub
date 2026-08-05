-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "discountAmount" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "promoCode" TEXT;
