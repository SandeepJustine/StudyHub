'use client';

import { useCallback, useRef } from 'react';

type UserType = 'anonymous' | 'student' | 'instructor' | 'admin' | 'school_admin' | 'corporate' | 'parent';

type TraceOptions = {
  userType?: UserType;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
};

type TraceEvent = {
  type: 'pageview' | 'interaction';
  path: string;
  method?: string;
  userType: UserType;
  userId?: string;
  sessionId?: string;
  referrer?: string;
  duration?: number;
  interaction?: string;
  target?: string;
};

const DEFAULT_ENDPOINT = '/api/trace';
const DEFAULT_BATCH = 10;
const DEFAULT_FLUSH = 5000;

/**
 * useTrace
 *
 * Client-side tracking helper for page views and key interactions.
 *
 * Usage:
 *   const { track, trackPageView, trackInteraction, flush } = useTrace({ userType: 'student' });
 *
 *   // on route change
 *   useEffect(() => { trackPageView(); }, [pathname]);
 *
 *   // on meaningful user action
 *   trackInteraction('enroll_click', 'course_card', { path: pathname });
 */
export function useTrace(options: TraceOptions = {}) {
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;
  const batchSize = options.batchSize ?? DEFAULT_BATCH;
  const flushIntervalMs = options.flushInterval ?? DEFAULT_FLUSH;

  const queueRef = useRef<TraceEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string>(options.sessionId || (typeof window !== 'undefined' ? (() => {
    try {
      const key = 'studyhub:session';
      let v = sessionStorage.getItem(key);
      if (!v) { v = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; sessionStorage.setItem(key, v); }
      return v;
    } catch { return `${Date.now()}-${Math.random()}`; }
  })() : `${Date.now()}-${Math.random()}`));
  const userType = options.userType || 'anonymous';
  const userId = options.userId;

  const send = useCallback(async (events: TraceEvent[]) => {
    if (typeof window === 'undefined' || events.length === 0) return;
    try {
      // fire-and-forget: tracking must never block the UI.
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(events),
        keepalive: events.length === 1,
      });
    } catch {
      // swallow - tracking is best-effort
    }
  }, [endpoint]);

  const flush = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;
    queueRef.current = [];
    send(q);
  }, [send]);

  const enqueue = useCallback((event: TraceEvent) => {
    queueRef.current.push(event);
    if (queueRef.current.length >= batchSize) flush();
  }, [batchSize, flush]);

  // Flush periodically and on page unload.
  if (typeof window !== 'undefined' && !timerRef.current) {
    timerRef.current = setInterval(flush, flushIntervalMs);
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
  }

  const trackPageView = useCallback((path?: string, referrer?: string) => {
    enqueue({
      type: 'pageview',
      path: path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      method: 'GET',
      userType,
      userId,
      sessionId: sessionIdRef.current,
      referrer,
    });
  }, [enqueue, userType, userId]);

  const trackInteraction = useCallback((interaction: string, target?: string, meta?: { path?: string; duration?: number }) => {
    enqueue({
      type: 'interaction',
      path: meta?.path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      method: 'POST',
      userType,
      userId,
      sessionId: sessionIdRef.current,
      duration: meta?.duration,
      interaction,
      target,
    });
  }, [enqueue, userType, userId]);

  return { trackPageView, trackInteraction, flush, sessionId: sessionIdRef.current };
}

export default useTrace;
