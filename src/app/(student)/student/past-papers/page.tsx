import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { featureGating } from '@/lib/billing/feature-gating';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Search, Calendar, Lock } from 'lucide-react';
import { UpgradeBanner } from '@/components/features/subscription/upgrade-banner';
import { StudentPastPapersClient } from './student-past-papers-client';

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture'];

export default async function StudentPastPapersPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  let pastPapers: any[] = [];
  let canDownload = false;
  try {
    const access = await featureGating.checkAccess(session.user.id, 'past_paper:download');
    canDownload = access.hasAccess;

    pastPapers = await prisma.pastPaper.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch past papers:', error);
    pastPapers = [];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 rounded-xl"><FileText size={22} className="text-orange-600" /></div>
        <div><h1 className="text-2xl font-bold text-navy">Past Papers</h1><p className="text-sm text-grey-medium">Practice with real exam papers</p></div>
      </div>

      {!canDownload && (
        <UpgradeBanner type="download" />
      )}

      <StudentPastPapersClient pastPapers={pastPapers} canDownload={canDownload} />
    </div>
  );
}
