'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  variant?: 'full-color' | 'white' | 'navy-bg' | 'mark-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTagline?: boolean;
}

export function Logo({ 
  variant = 'full-color', 
  size = 'md', 
  className, 
  showTagline = false,
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20',
  };

  const widthMap = {
    sm: 120,
    md: 150,
    lg: 180,
  };

  const heightMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  // Map variant to the correct logo file
  const logoSrcMap: Record<string, string> = {
    'full-color': '/images/logo/logo-color.png',    // Colored logo for light backgrounds
    'white': '/images/logo/logo-white.png',          // White logo for dark backgrounds
    'navy-bg': '/images/logo/logo-white.png',        // White logo for navy backgrounds
    'mark-only': '/images/logo/logo-mark.png',       // Just the icon/mark (if you have it)
  };

  // Get the correct logo based on variant
  const logoSrc = logoSrcMap[variant] || logoSrcMap['full-color'];

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Color scheme for static fallback
  const colorScheme = {
    'full-color': {
      bg: 'bg-navy',
      text: 'text-white',
      icon: 'text-white',
      tagline: 'text-grey-medium',
      fallbackText: 'text-navy',
    },
    'white': {
      bg: 'bg-white/20',
      text: 'text-white',
      icon: 'text-white',
      tagline: 'text-slate-300',
      fallbackText: 'text-white',
    },
    'navy-bg': {
      bg: 'bg-white/20',
      text: 'text-white',
      icon: 'text-white',
      tagline: 'text-slate-300',
      fallbackText: 'text-white',
    },
    'mark-only': {
      bg: 'bg-navy',
      text: 'text-white',
      icon: 'text-white',
      tagline: 'text-grey-medium',
      fallbackText: 'text-white',
    },
  };

  const colors = colorScheme[variant];

  // Static fallback if image fails to load
  if (imgError) {
    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        {variant === 'mark-only' ? (
          // Just the icon for mark-only variant
          <div className={cn(
            'rounded-lg flex items-center justify-center',
            colors.bg,
            iconSizeClasses[size]
          )}>
            <GraduationCap className={cn(
              colors.icon, 
              size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
            )} />
          </div>
        ) : (
          // Full logo fallback: icon + text
          <div className="flex items-center gap-2">
            <div className={cn(
              'rounded-lg flex items-center justify-center',
              colors.bg,
              iconSizeClasses[size]
            )}>
              <GraduationCap className={cn(
                colors.icon, 
                size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
              )} />
            </div>
            <div>
              <h1 className={cn(
                'font-poppins font-bold leading-tight',
                textSizeClasses[size],
                colors.fallbackText
              )}>
                StudyHub
              </h1>
              <p className={cn(
                'text-xs -mt-0.5',
                variant === 'full-color' ? 'text-grey-medium' : 'text-slate-400'
              )}>
                Malawi
              </p>
            </div>
          </div>
        )}
        {showTagline && (
          <div className="hidden md:block">
            <p className={cn('text-xs italic', colors.tagline)}>
              Learn. Practice. Succeed.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Use PNG image
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <Image
          src={logoSrc}
          alt="StudyHub Malawi"
          width={widthMap[size]}
          height={heightMap[size]}
          className={cn('h-full w-auto object-contain', sizeClasses[size])}
          priority
          onError={() => setImgError(true)}
        />
      </div>
      {showTagline && (
        <div className="hidden md:block">
          <p className={cn(
            'text-xs italic',
            variant === 'full-color' ? 'text-grey-medium' : 'text-slate-300'
          )}>
            Learn. Practice. Succeed.
          </p>
        </div>
      )}
    </div>
  );
}

// Convenience exports
export function LogoFullColor(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="full-color" {...props} />;
}

export function LogoWhite(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="white" {...props} />;
}

export function LogoMark(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="mark-only" {...props} />;
}