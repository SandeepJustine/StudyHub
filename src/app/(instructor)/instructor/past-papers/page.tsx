import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { InstructorPastPapersClient } from './instructor-past-papers-client';

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture'];

export default async function InstructorPastPapersPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user || session.user.role !== 'INSTRUCTOR') redirect('/auth/login');

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!instructor) redirect('/instructor/dashboard');

  const access = await featureGating.checkAccess(session.user.id, 'past_paper:upload');
  const canUpload = access.hasAccess;

  const myPapers = await prisma.pastPaper.findMany({
    where: { uploadedBy: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <InstructorPastPapersClient
      canUpload={canUpload}
      myPapers={myPapers}
      examBoards={EXAM_BOARDS}
      subjects={SUBJECTS}
    />
  );
}
