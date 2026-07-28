import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layouts/dashboard/shell';
import { LayoutDashboard, Users, GraduationCap, BookOpen, BarChart3, Palette, Upload, Settings } from 'lucide-react';

const menu = [
  { label: 'Dashboard', href: '/school-admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Students', href: '/school-admin/students', icon: <Users size={20} /> },
  { label: 'Teachers', href: '/school-admin/teachers', icon: <GraduationCap size={20} /> },
  { label: 'Courses', href: '/school-admin/courses', icon: <BookOpen size={20} /> },
  { label: 'Analytics', href: '/school-admin/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Branding', href: '/school-admin/branding', icon: <Palette size={20} /> },
  { label: 'Bulk Import', href: '/school-admin/import', icon: <Upload size={20} /> },
  { label: 'Settings', href: '/school-admin/settings', icon: <Settings size={20} /> },
];

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') redirect('/auth/login');
  return <DashboardShell role="SCHOOL_ADMIN" title="School Portal" description="Manage your institution" menuItems={menu}>{children}</DashboardShell>;
}
