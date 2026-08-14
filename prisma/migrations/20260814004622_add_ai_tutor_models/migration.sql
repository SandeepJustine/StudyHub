CREATE TABLE "AIConversation" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT,
  "subject" TEXT,
  "courseId" TEXT,
  "moduleId" TEXT,
  "quizId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "subject" TEXT,
  "courseId" TEXT,
  "moduleId" TEXT,
  "quizId" TEXT,
  "tokensUsed" INTEGER,
  "modelVersion" TEXT,
  "isError" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_studentId_createdAt_idx"
ON "AIConversation"("studentId", "createdAt");

CREATE INDEX "AIConversation_courseId_idx"
ON "AIConversation"("courseId");

CREATE INDEX "AIConversation_moduleId_idx"
ON "AIConversation"("moduleId");

CREATE INDEX "AIMessage_conversationId_createdAt_idx"
ON "AIMessage"("conversationId", "createdAt");

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_studentId_fkey"
FOREIGN KEY ("studentId")
REFERENCES "Student"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_courseId_fkey"
FOREIGN KEY ("courseId")
REFERENCES "Course"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_moduleId_fkey"
FOREIGN KEY ("moduleId")
REFERENCES "CourseModule"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "AIConversation"
ADD CONSTRAINT "AIConversation_quizId_fkey"
FOREIGN KEY ("quizId")
REFERENCES "Quiz"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "AIMessage"
ADD CONSTRAINT "AIMessage_conversationId_fkey"
FOREIGN KEY ("conversationId")
REFERENCES "AIConversation"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
