-- Add courseId and moduleId fields to Experiment table
ALTER TABLE "Experiment" ADD COLUMN "courseId" VARCHAR(255) REFERENCES "Course"("id") ON DELETE SET NULL;
ALTER TABLE "Experiment" ADD COLUMN "moduleId" VARCHAR(255) REFERENCES "CourseModule"("id") ON DELETE SET NULL;

-- Create indexes for the new fields
CREATE INDEX "Experiment_courseId_idx" ON "Experiment"("courseId");
CREATE INDEX "Experiment_moduleId_idx" ON "Experiment"("moduleId");