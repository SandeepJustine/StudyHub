import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { StudentCertificatesClient } from './certificates-client';

export default async function StudentCertificatesPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Student Profile Not Found</h2>
          <p className="text-grey-dark">Please contact support.</p>
        </div>
      </div>
    );
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    orderBy: { issuedAt: 'desc' },
    include: {
      template: {
        select: { id: true, name: true },
      },
    },
  });

  return (
    <StudentCertificatesClient initialCertificates={certificates} />
  );
}
