import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  const roleRedirects: Record<string, string> = {
    STUDENT: '/student/dashboard',
    SCHOOL_ADMIN: '/school-admin/dashboard',
    INSTRUCTOR: '/instructor/dashboard',
    CORPORATE_CLIENT: '/corporate/dashboard',
    PLATFORM_ADMIN: '/admin/dashboard',
    PARENT: '/parent/dashboard',
  };

  redirect(roleRedirects[session.user.role] || '/auth/login');
}