'use client';

import { useEffect } from 'react';

export default function TawkToWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.querySelector('script[src*="embed.tawk.to"]');
    if (existingScript) return;

    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = 'https://embed.tawk.to/68909a79b40fb6192870a658/1k0081vbt';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    const s0 = document.getElementsByTagName('script')[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.body.appendChild(s1);
    }
  }, []);

  return null;
}
