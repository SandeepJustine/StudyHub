'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  role: string;
  menuItems: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }>;
}

export function Sidebar({ role, menuItems }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-navy text-white z-50 transition-all duration-300',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-light">
          {!isCollapsed && (
            <Logo variant="white" size="sm" />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 hover:bg-navy-light rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-red text-white'
                    : 'text-grey-light hover:bg-navy-light hover:text-white',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red rounded-full text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-navy-light space-y-2">
          <Link
            href="/help"
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-grey-light hover:text-white rounded-lg transition-colors',
              isCollapsed && 'justify-center'
            )}
          >
            <HelpCircle size={20} />
            {!isCollapsed && <span className="text-sm">Help & Support</span>}
          </Link>
          
          <button
            onClick={() => signOut()}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-grey-light hover:text-white rounded-lg transition-colors w-full',
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content margin */}
      <div className={cn(
        'transition-all duration-300',
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      )} />
    </>
  );
}