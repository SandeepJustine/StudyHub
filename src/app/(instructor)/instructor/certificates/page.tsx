import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { InstructorCertificatesClient } from './certificates-client';

export default async function InstructorCertificatesPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user || session.user.role !== 'INSTRUCTOR') redirect('/auth/login');

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
  });

  if (!instructor) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Instructor Profile Not Found</h2>
          <p className="text-grey-dark">Please contact support.</p>
        </div>
      </div>
    );
  }

  const courses = await prisma.course.findMany({
    where: { instructorId: instructor.id, status: { not: 'ARCHIVED' } },
    select: { id: true, title: true, subject: true },
    orderBy: { updatedAt: 'desc' },
  });

  const courseIds = courses.map((c) => c.id);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: { in: courseIds },
      progress: { gte: 100 },
    },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true } },
        },
      },
      course: { select: { title: true, subject: true } },
      certificate: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 50,
  });

  const certificates = await prisma.certificate.findMany({
    where: {
      OR: [
        { enrollment: { course: { instructorId: instructor.id } } },
        { examAttempt: { quiz: { module: { course: { instructorId: instructor.id } } } } },
      ],
    },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true } },
        },
      },
      template: { select: { id: true, name: true } },
      enrollment: {
        include: {
          course: { select: { title: true, subject: true } },
        },
      },
      examAttempt: {
        include: {
          quiz: { select: { title: true } },
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
    take: 50,
  });

  return (
    <InstructorCertificatesClient
      instructorId={instructor.id}
      courses={courses}
      enrollments={enrollments}
      initialCertificates={certificates}
    />
  );
}
