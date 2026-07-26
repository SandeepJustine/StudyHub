import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layouts/dashboard/shell';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  BarChart3,
  Building2,
  Settings,
  CreditCard,
} from 'lucide-react';

const corporateMenuItems = [
  { label: 'Dashboard', href: '/corporate/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Training', href: '/corporate/training', icon: <FileText size={20} /> },
  { label: 'Recruitment', href: '/corporate/recruitment', icon: <Briefcase size={20} /> },
  { label: 'Applications', href: '/corporate/applications', icon: <Users size={20} />, badge: '5' },
  { label: 'Contracts', href: '/corporate/contracts', icon: <CreditCard size={20} /> },
  { label: 'Analytics', href: '/corporate/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Company Profile', href: '/corporate/settings', icon: <Building2 size={20} /> },
];

export default async function CorporateLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
    redirect('/auth/login');
  }

  return (
    <DashboardShell
      role="CORPORATE_CLIENT"
      title="Corporate Portal"
      description="Manage training and recruitment"
      menuItems={corporateMenuItems}
    >
      {children}
    </DashboardShell>
  );
}