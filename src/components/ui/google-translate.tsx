'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Globe } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleTranslateProps {
  className?: string;
  pageLanguage?: string;
  includedLanguages?: string;
  layout?: 'simple' | 'vertical' | 'horizontal';
}

export function GoogleTranslate({
  className,
  pageLanguage = 'en',
  includedLanguages = 'en,ny,fr,de,es,it,pt,ru,zh-CN,ja,ko,ar',
  layout = 'simple',
}: GoogleTranslateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const initTranslateElement = useCallback(() => {
    if (!containerRef.current || !(window as any).google?.translate?.TranslateElement) {
      return;
    }

    const layoutMap: Record<string, string> = {
      simple: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
      vertical: (window as any).google.translate.TranslateElement.InlineLayout.VERTICAL,
      horizontal: (window as any).google.translate.TranslateElement.InlineLayout.HORIZONTAL,
    };

    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage,
        layout: layoutMap[layout],
        includedLanguages,
        gaTrack: false,
        autoDisplay: true,
      },
      'google_translate_element'
    );
  }, [pageLanguage, includedLanguages, layout]);

  const loadScript = useCallback(() => {
    if (scriptLoadedRef.current) {
      initTranslateElement();
      return;
    }

    if (typeof window === 'undefined') return;

    (window as any).googleTranslateElementInit = () => {
      initTranslateElement();
    };

    const script = document.createElement('script');
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    script.onerror = () => {
      setScriptError('Unable to load translation service');
    };
    document.head.appendChild(script);
  }, [initTranslateElement]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.translate) {
      initTranslateElement();
      scriptLoadedRef.current = true;
      return;
    }

    loadScript();

    return () => {
      const el = document.getElementById('google_translate_element');
      if (el) {
        el.innerHTML = '';
      }
    };
  }, [initTranslateElement, loadScript]);

  return (
    <div className={`translate-container ${className ?? ''}`}>
      <div className="flex items-center gap-2 text-sm text-grey-dark mb-2">
        <Globe size={16} className="text-navy" />
        <span className="font-medium">Translate</span>
      </div>
      {scriptError ? (
        <p className="text-xs text-red-600">{scriptError}</p>
      ) : (
        <div
          ref={containerRef}
          id="google_translate_element"
          className="translate-inner"
        />
      )}
    </div>
  );
}
