'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { DashboardHeader } from './header';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useBrowserCloseLogout } from '@/hooks/useBrowserCloseLogout';

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
}

function IdleTimeoutWrapper({ children }: { children: React.ReactNode }) {
  useIdleTimeout(30 * 60 * 1000); // 30 minutes inactive
  useBrowserCloseLogout(); // logout on browser close / tab hidden
  return <>{children}</>;
}

export function DashboardShell({
  children,
  role,
  title,
  description,
  menuItems,
}: DashboardShellProps) {
  return (
    <SessionProvider>
      <IdleTimeoutWrapper>
        <div className='min-h-screen bg-grey-light overflow-x-hidden'>
          <Sidebar role={role} menuItems={menuItems} />
          <div className='lg:ml-64'>
            <DashboardHeader title={title} description={description} />
            <main className='p-4 sm:p-6'>{children}</main>
          </div>
        </div>
      </IdleTimeoutWrapper>
    </SessionProvider>
  );
}
