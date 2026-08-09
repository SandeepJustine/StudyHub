ALTER TABLE "User"
ADD COLUMN "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");