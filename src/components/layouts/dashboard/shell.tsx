'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { DashboardHeader } from './header';

interface DashboardShellProps {
  children: React.ReactNode;
  role: string;
  title: string;
  description?: string;
  menuItems: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }>;
  unreadNotifications?: number;
}

export function DashboardShell({
  children,
  role,
  title,
  description,
  menuItems,
  unreadNotifications,
}: DashboardShellProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-grey-light">
        <Sidebar role={role} menuItems={menuItems} />
        
        <div className="lg:ml-64">
          <DashboardHeader
            title={title}
            description={description}
            unreadNotifications={unreadNotifications}
          />
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}