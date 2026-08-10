'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, UserCheck, X } from 'lucide-react';

export default function ImpersonationBanner() {
  const [userName, setUserName] = useState<string>('User');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/impersonation')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.impersonatedUserId) {
          setUserName(`User (${data.impersonatedUserId.slice(0, 8)}...)`);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleStopImpersonating = async () => {
    await fetch('/api/admin/stop-impersonating', { method: 'POST' });
    window.location.href = '/admin/dashboard';
  };

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-yellow-800">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          Loading impersonation info...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-yellow-100 rounded-lg">
            <UserCheck size={18} className="text-yellow-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              You are currently viewing as <span className="font-semibold">{userName}</span>
            </p>
            <p className="text-xs text-yellow-700">
              Actions performed here will be attributed to this user account
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonating}
          leftIcon={<X size={14} />}
          className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
        >
          Stop Viewing As
        </Button>
      </div>
    </div>
  );
}
