import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layouts/dashboard/shell';
import { LayoutDashboard, BookOpen, DollarSign, BarChart3, MessageSquare, Settings, Video } from 'lucide-react';

const menu = [
  { label: 'Dashboard', href: '/instructor/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Courses', href: '/instructor/courses', icon: <BookOpen size={20} /> },
  { label: 'Live Classes', href: '/instructor/live-classes', icon: <Video size={20} /> },
  { label: 'Earnings', href: '/instructor/earnings', icon: <DollarSign size={20} /> },
  { label: 'Analytics', href: '/instructor/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Community', href: '/instructor/community', icon: <MessageSquare size={20} /> },
  { label: 'Settings', href: '/instructor/settings', icon: <Settings size={20} /> },
];

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') redirect('/auth/login');
  return <DashboardShell role="INSTRUCTOR" title="Instructor Dashboard" description="Manage your courses" menuItems={menu}>{children}</DashboardShell>;
}
