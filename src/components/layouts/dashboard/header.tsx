'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, Search, User, Settings, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  unreadNotifications?: number;
}

export function DashboardHeader({ title, description, unreadNotifications = 0 }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get role-specific routes
  const getRoleRoutes = () => {
    const role = session?.user?.role;
    switch (role) {
      case 'STUDENT':
        return { profile: '/student/profile', settings: '/student/settings', dashboard: '/student/dashboard' };
      case 'INSTRUCTOR':
        return { profile: '/instructor/profile', settings: '/instructor/settings', dashboard: '/instructor/dashboard' };
      case 'SCHOOL_ADMIN':
        return { profile: '/school-admin/settings', settings: '/school-admin/settings', dashboard: '/school-admin/dashboard' };
      case 'CORPORATE_CLIENT':
        return { profile: '/corporate/settings', settings: '/corporate/settings', dashboard: '/corporate/dashboard' };
      case 'PLATFORM_ADMIN':
        return { profile: '/admin/settings', settings: '/admin/settings', dashboard: '/admin/dashboard' };
      case 'PARENT':
        return { profile: '/parents/settings', settings: '/parents/settings', dashboard: '/parents/dashboard' };
      default:
        return { profile: '/profile', settings: '/settings', dashboard: '/' };
    }
  };

  const routes = getRoleRoutes();
  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';
  const userRole = session?.user?.role?.replace(/_/g, ' ') || 'User';

  const handleSignOut = () => {
    setShowUserMenu(false);
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <header className="bg-white border-b border-grey-light px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left - Title */}
        <div>
          <h1 className="text-2xl font-bold text-navy font-poppins">{title}</h1>
          {description && (
            <p className="text-sm text-grey-dark mt-1">{description}</p>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:block w-64">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-grey-light rounded-lg transition-colors">
            <Bell size={20} className="text-grey-dark" />
            {unreadNotifications > 0 && (
              <Badge
                variant="error"
                size="sm"
                className="absolute -top-1 -right-1 min-w-[20px] justify-center"
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Badge>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-grey-light rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                <span className="text-white text-sm font-medium">{userInitial}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-grey-dark">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-grey-medium">{userRole}</p>
              </div>
              <ChevronDown size={16} className="hidden md:block text-grey-medium" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-grey-light py-1 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-grey-light">
                    <p className="text-sm font-medium text-navy truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-grey-medium truncate">
                      {session?.user?.email || ''}
                    </p>
                    <Badge variant="neutral" size="sm" className="mt-1">
                      {userRole}
                    </Badge>
                  </div>

                  {/* Dashboard Link */}
                  <Link
                    href={routes.dashboard}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-grey-dark hover:bg-grey-light transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>

                  {/* Profile Link - Role Specific */}
                  <Link
                    href={routes.profile}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-grey-dark hover:bg-grey-light transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </Link>

                  {/* Settings Link - Role Specific */}
                  <Link
                    href={routes.settings}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-grey-dark hover:bg-grey-light transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>

                  <hr className="my-1 border-grey-light" />

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red hover:bg-red/5 w-full text-left transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}