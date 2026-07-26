'use client';

import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationBellProps {
  count: number;
  onClick?: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-grey-light rounded-lg transition-colors"
      title={`${count} notifications`}
    >
      <Bell size={20} className="text-grey-dark" />
      {count > 0 && (
        <Badge
          variant="error"
          size="sm"
          className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs px-1"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </button>
  );
}