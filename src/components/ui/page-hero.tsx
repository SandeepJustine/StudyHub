import { cn } from '@/utils/cn';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  align?: 'left' | 'center';
  size?: 'sm' | 'md' | 'lg';
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  description,
  backgroundImage = '/images/hero/default-hero.jpg',
  ctaText,
  ctaLink,
  breadcrumbs,
  align = 'center',
  size = 'md',
  overlayOpacity = 85,
  children,
}: PageHeroProps) {
  const sizeClasses = {
    sm: 'py-16 md:py-20',
    md: 'py-20 md:py-28',
    lg: 'py-24 md:py-36',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Navy Blue Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: `rgba(13, 27, 61, ${overlayOpacity / 100})`,
          background: `linear-gradient(135deg, rgba(13, 27, 61, ${overlayOpacity / 100}) 0%, rgba(13, 27, 61, ${(overlayOpacity - 5) / 100}) 100%)`,
        }}
      />
      
      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url("/images/patterns/dots.svg")',
          backgroundRepeat: 'repeat',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Content */}
      <div className={cn('relative', sizeClasses[size])}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={cn('max-w-3xl', align === 'center' && 'mx-auto', alignClasses[align])}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 mb-6 text-sm" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight size={14} className="text-slate-400" />}
                    {crumb.href ? (
                      <Link 
                        href={crumb.href} 
                        className="text-slate-300 hover:text-white transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-white font-medium">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}

            {/* Subtitle Badge */}
            {subtitle && (
              <span className="inline-block px-4 py-2 bg-red/80 backdrop-blur-sm rounded-full text-sm font-medium text-white mb-6">
                {subtitle}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-poppins text-white mb-6 leading-tight">
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}

            {/* CTA Button */}
            {ctaText && ctaLink && (
              <Link
                href={ctaLink}
                className="inline-flex items-center px-8 py-4 bg-red hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {ctaText}
                <ChevronRight size={20} className="ml-2" />
              </Link>
            )}

            {/* Additional Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 60C240 120 480 0 720 30C960 60 1200 0 1440 45V120H0V60Z" 
            fill="#F2F4F7"
          />
        </svg>
      </div>
    </section>
  );
}