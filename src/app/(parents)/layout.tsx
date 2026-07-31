import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Allow parent cookie-based sessions
  const cookieStore = await cookies();
  const parentSession = cookieStore.get('parent_session')?.value;

  const isParent = session?.user?.role === 'PARENT' || !!parentSession;

  if (!isParent) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
