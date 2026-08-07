import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import AdminCertificatesClient from './admin-client';

export default async function AdminCertificatesPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') redirect('/auth/login');

  return <AdminCertificatesClient />;
}
