'use client';

import Link from 'next/link';
import {
  Home,
  BookOpen,
  ClipboardCheck,
  Award,
  User,
  Settings,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/student/exams', icon: ClipboardCheck, label: 'Exams' },
  { href: '/student/certificates', icon: Award, label: 'Certificates' },
  { href: '/student/community', icon: Users, label: 'Community' },
  { href: '/student/profile', icon: User, label: 'Profile' },
  { href: '/student/settings', icon: Settings, label: 'Settings' },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-white sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-grey-dark transition-colors hover:text-navy md:h-8 md:w-8',
              pathname.startsWith(item.href) ? 'bg-grey-light text-navy' : ''
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}