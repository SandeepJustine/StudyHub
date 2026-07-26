'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Book,
  BarChart,
  CreditCard,
  Settings,
  Building,
  Briefcase,
  FileText,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/institutions', icon: Building, label: 'Institutions' },
  { href: '/admin/courses', icon: Book, label: 'Courses' },
  { href: '/admin/analytics', icon: BarChart, label: 'Analytics' },
  { href: '/admin/payouts', icon: CreditCard, label: 'Payouts' },
  { href: '/admin/sponsorships', icon: Briefcase, label: 'Sponsorships' },
  { href: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminSidebar() {
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