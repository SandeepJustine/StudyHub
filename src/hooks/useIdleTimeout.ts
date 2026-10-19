"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

export function useIdleTimeout(timeoutMs = 30 * 60 * 1000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/auth/login" });
    }, timeoutMs);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "visibilitychange",
    ];

    const handleActivity = () => {
      resetTimeout();
    };

    resetTimeout();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs]);
}
