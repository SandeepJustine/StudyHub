CREATE TABLE "VisitorLog" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'GET',
  "userType" TEXT NOT NULL DEFAULT 'anonymous',
  "userId" TEXT,
  "sessionId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "duration" INTEGER,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VisitorLog_path_idx" ON "VisitorLog"("path");
CREATE INDEX "VisitorLog_timestamp_idx" ON "VisitorLog"("timestamp");
CREATE INDEX "VisitorLog_userType_idx" ON "VisitorLog"("userType");
CREATE INDEX "VisitorLog_userId_idx" ON "VisitorLog"("userId");
CREATE INDEX "VisitorLog_sessionId_idx" ON "VisitorLog"("sessionId");
