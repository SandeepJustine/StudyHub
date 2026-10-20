"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const NEXT_AUTH_SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
];

function clearSessionCookies() {
  NEXT_AUTH_SESSION_COOKIE_NAMES.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    document.cookie = `${name}=; path=/; domain=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
  });
}

export function useBrowserCloseLogout() {
  const hiddenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const HIDDEN_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  const startHiddenTimer = () => {
    cancelHiddenTimer();
    hiddenTimerRef.current = setTimeout(() => {
      clearSessionCookies();
      signOut({ callbackUrl: "/auth/login" }).catch(() => {
        // ignore
      });
    }, HIDDEN_TIMEOUT_MS);
  };

  const cancelHiddenTimer = () => {
    if (hiddenTimerRef.current) {
      clearTimeout(hiddenTimerRef.current);
      hiddenTimerRef.current = null;
    }
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        startHiddenTimer();
      } else {
        cancelHiddenTimer();
      }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelHiddenTimer();
      window.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
