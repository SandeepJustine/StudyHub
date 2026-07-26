import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layouts/dashboard/shell';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  Award,
  Briefcase,
  Settings,
} from 'lucide-react';

const studentMenuItems = [
  { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Courses', href: '/student/courses', icon: <BookOpen size={20} /> },
  { label: 'Mock Exams', href: '/student/exams', icon: <GraduationCap size={20} /> },
  { label: 'Live Classes', href: '/student/live-classes', icon: <Calendar size={20} /> },
  { label: 'Community', href: '/student/community', icon: <MessageSquare size={20} /> },
  { label: 'Certificates', href: '/student/certificates', icon: <Award size={20} /> },
  { label: 'Jobs', href: '/student/jobs', icon: <Briefcase size={20} /> },
  { label: 'Settings', href: '/student/settings', icon: <Settings size={20} /> },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'STUDENT') {
    redirect('/auth/login');
  }

  return (
    <DashboardShell
      role="STUDENT"
      title={`Hello, ${session.user.name?.split(' ')[0]}`}
      description="Continue your learning journey"
      menuItems={studentMenuItems}
      unreadNotifications={3}
    >
      {children}
    </DashboardShell>
  );
}