'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTrace } from '@/hooks/useTrace';

/**
 * TraceProvider
 *
 * Mounted once in the root layout. Fires a pageview on every route change
 * and flushes remaining events when the user leaves the page.
 */
export function TraceProvider({ userType = 'anonymous', userId }: { userType?: string; userId?: string }) {
  const pathname = usePathname();
  const { trackPageView, flush } = useTrace({
    userType: (userType as any) || 'anonymous',
    userId,
  });

  useEffect(() => {
    trackPageView(pathname, document.referrer || undefined);
  }, [pathname, trackPageView]);

  return null;
}

export default TraceProvider;
