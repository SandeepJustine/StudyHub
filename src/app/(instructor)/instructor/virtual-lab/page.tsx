import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { labService } from '@/lib/lab/lab-service';
import { instructorService } from '@/lib/instructor/instructor-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Beaker, Users, BookOpen, ChevronRight, Microscope } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/formatters';
import { ExperimentManager } from './experiment-manager';

export const dynamic = 'force-dynamic';

export default async function InstructorVirtualLabPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const instructor = await instructorService.resolveByUserId(session.user.id);
  const [labs, experiments, courses, templates] = await Promise.all([
    labService.getInstructorLabs(instructor.id),
    labService.getAllExperiments(),
    labService.getInstructorCoursesWithModules(instructor.id),
    labService.getExperimentTemplates(),
  ]);

  // Serialize data for the client component (Date objects → strings)
  const serializedExperiments = JSON.parse(JSON.stringify(experiments));
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  const assignedCount = experiments.filter((e) => e.courseId).length;
  const unassignedCount = experiments.filter((e) => !e.courseId).length;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Virtual Lab Management</h1>
          <p className="text-lg text-grey-dark mt-1">
            Create, manage, and monitor virtual experiments for your students.
          </p>
        </div>
        <Link href="/instructor/courses">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Create New Experiment
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-navy">{experiments.length}</div>
            <p className="text-xs text-grey-medium">Total Experiments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green">{assignedCount}</div>
            <p className="text-xs text-grey-medium">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange">{unassignedCount}</div>
            <p className="text-xs text-grey-medium">Unassigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-navy">{labs.length}</div>
            <p className="text-xs text-grey-medium">Virtual Labs</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Virtual Labs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker size={20} />
            Your Virtual Labs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {labs.length > 0 ? (
            <div className="space-y-4">
              {labs.map((lab) => (
                <Link key={lab.id} href={`/instructor/virtual-lab/${lab.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-grey-light/50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-navy">{lab.title}</h3>
                        <p className="text-sm text-grey-medium">
                          Part of: {lab.course?.title || 'Unknown course'}
                          {lab.module?.title && ` > ${lab.module.title}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-grey-dark">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {lab._count.attempts} attempts
                          </span>
                          <span>Created: {formatDate(lab.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-grey-medium" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Beaker size={48} className="mx-auto text-grey-medium mb-4" />
              <h3 className="text-lg font-semibold text-navy">No virtual labs created yet.</h3>
              <p className="text-grey-dark mt-1 mb-4">
                Get started by creating a new experiment.
              </p>
              <Link href="/instructor/courses">
                <Button variant="primary">Create Experiment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Experiments with Assignment Controls */}
      <ExperimentManager
        experiments={serializedExperiments}
        courses={serializedCourses}
      />

      {/* Experiment Templates (Reference) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Experiment Templates (Reference)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="p-3 bg-grey-light/50 rounded-md">
              <p className="font-medium text-sm text-navy">{template.name}</p>
              <p className="text-xs text-grey-medium">{template.formula}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
