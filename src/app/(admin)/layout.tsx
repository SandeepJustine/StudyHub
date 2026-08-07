import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layouts/dashboard/shell';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CreditCard,
  BarChart3,
  Shield,
  Megaphone,
  HelpCircle,
  Settings,
  Award,
  FileText,
} from 'lucide-react';

const adminMenuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Users', href: '/admin/users', icon: <Users size={20} />, badge: 'New' },
  { label: 'Institutions', href: '/admin/institutions', icon: <Building2 size={20} /> },
  { label: 'Courses', href: '/admin/courses', icon: <GraduationCap size={20} /> },
  { label: 'Certificates', href: '/admin/certificates', icon: <Award size={20} /> },
  { label: 'Templates', href: '/admin/certificates/templates', icon: <FileText size={20} /> },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: <CreditCard size={20} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Payouts', href: '/admin/payouts', icon: <CreditCard size={20} /> },
  { label: 'Sponsorships', href: '/admin/sponsorships', icon: <Megaphone size={20} /> },
  { label: 'Support', href: '/admin/support', icon: <HelpCircle size={20} />, badge: '3' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: <Shield size={20} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    redirect('/auth/login');
  }

  return (
    <DashboardShell
      role="PLATFORM_ADMIN"
      title="Admin Dashboard"
      description="Platform management and analytics"
      menuItems={adminMenuItems}
    >
      {children}
    </DashboardShell>
  );
}
