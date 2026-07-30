import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LiveClassJoiner } from '@/components/live-classes/live-class-joiner';

export const dynamic = 'force-dynamic';

export default async function JoinLiveClassPage({ params }: { params: { classId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { classId } = params;

  let liveClass: any = null;
  try {
    liveClass = await prisma.liveClass.findUnique({
      where: { id: classId },
    });
  } catch (error) {
    console.error('Failed to fetch live class:', error);
  }

  if (!liveClass) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-navy">Class Not Found</h2>
        <Link href="/student/live-classes">
          <Button variant="primary" className="mt-3">Back to Live Classes</Button>
        </Link>
      </div>
    );
  }

  const roomName = `studyhub-class-${classId}`;
  const displayName = session.user.name || 'Student';

  return (
    <LiveClassJoiner
      roomName={roomName}
      displayName={displayName}
      email={session.user.email || ''}
      subject={liveClass.title || liveClass.subject}
    />
  );
}