'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Search, User, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  unreadNotifications?: number;
}

export function DashboardHeader({ title, description, unreadNotifications = 0 }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

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
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-grey-dark">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-grey-medium">
                  {session?.user?.role}
                </p>
              </div>
              <ChevronDown size={16} className="hidden md:block text-grey-medium" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-grey-light py-1 z-50">
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-grey-dark hover:bg-grey-light"
                >
                  <User size={16} />
                  Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-grey-dark hover:bg-grey-light"
                >
                  <Settings size={16} />
                  Settings
                </a>
                <hr className="my-1 border-grey-light" />
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red hover:bg-grey-light w-full text-left"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}