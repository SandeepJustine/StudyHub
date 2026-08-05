'use client';

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';

interface RecaptchaProps {
  siteKey: string;
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

export interface RecaptchaHandle {
  reset: () => void;
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export function isRecaptchaClientEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
}

export const Recaptcha = forwardRef<RecaptchaHandle, RecaptchaProps>(
  function Recaptcha(props, ref) {
    const {
      siteKey,
      onVerify,
      onExpired,
      theme = 'auto',
      size = 'normal',
      className,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | number | null>(null);
    const onVerifyRef = useRef(onVerify);
    const onExpiredRef = useRef(onExpired);
    const [scriptError, setScriptError] = useState<string | null>(null);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpiredRef.current = onExpired;
    }, [onVerify, onExpired]);

    const handleVerify = useCallback((token: string) => {
      onVerifyRef.current(token);
    }, []);

    const handleExpired = useCallback(() => {
      onVerifyRef.current(null);
      onExpiredRef.current?.();
    }, []);

    useEffect(() => {
      if (!containerRef.current || !siteKey) return;

      loadRecaptchaScript()
        .then(() => {
          if (!containerRef.current || !window.grecaptcha) {
            return;
          }

          widgetIdRef.current = window.grecaptcha.render(
            containerRef.current,
            {
              sitekey: siteKey,
              theme,
              size,
              callback: handleVerify,
              'expired-callback': handleExpired,
            }
          );
        })
        .catch(() => {
          setScriptError('Unable to load reCAPTCHA. Please try again later.');
        });

      return () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        widgetIdRef.current = null;
      };
    }, [siteKey, theme, size, handleVerify, handleExpired]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
          onVerifyRef.current(null);
        }
      },
    }));

    return (
      <>
        {scriptError && (
          <p className="text-sm text-red-600 mb-2">{scriptError}</p>
        )}
        <div
          ref={containerRef}
          className={className}
          data-sitekey={siteKey}
          data-theme={theme}
          data-size={size}
        />
      </>
    );
  }
);
