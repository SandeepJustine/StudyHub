"use client";

import { useEffect, useCallback } from "react";
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
  const handleSignOut = useCallback(() => {
    clearSessionCookies();
    signOut({ callbackUrl: "/auth/login" }).catch(() => {
      // ignore network errors on unload
    });
  }, []);

  useEffect(() => {
    const handlers = ["pagehide", "beforeunload", "visibilitychange"];

    const onUnload = () => {
      handleSignOut();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSignOut();
      }
    };

    handlers.forEach((event) => {
      window.addEventListener(event, onUnload, { passive: true });
    });
    window.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

    return () => {
      handlers.forEach((event) => {
        window.removeEventListener(event, onUnload);
      });
      window.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [handleSignOut]);
}
