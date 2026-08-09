import React from 'react';
import { DashboardHeader } from '../components/layouts/dashboard/header';
import { Sidebar } from '../components/layouts/dashboard/sidebar';

export default function AdminLayout({
  children,
  role = 'PLATFORM_ADMIN',
  menuItems = [],
}: {
  children: React.ReactNode;
  role?: string;
  menuItems?: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }>;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-grey-light">
      <Sidebar role={role} menuItems={menuItems} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <DashboardHeader title="Dashboard" />
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}