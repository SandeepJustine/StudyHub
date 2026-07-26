'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: '/images/slider/students-learning.jpg',
    title: 'Learn. Practice. Succeed.',
    subtitle: 'Welcome to StudyHub Malawi',
    description: 'Access quality education anytime, anywhere. Prepare for MSCE, JCE, ICAM, and TEVETA with our comprehensive learning platform.',
    ctaText: 'Start Learning Free',
    ctaLink: '/auth/register',
    secondaryCtaText: 'Explore Courses',
    secondaryCtaLink: '/pricing',
  },
  {
    id: 2,
    image: '/images/slider/online-education.jpg',
    title: 'Master Your Exams',
    subtitle: 'Mock Tests & Past Papers',
    description: 'Practice with real exam questions, get instant feedback, and track your progress. Join thousands of students already succeeding with StudyHub.',
    ctaText: 'Try Mock Exams',
    ctaLink: '/auth/register',
    secondaryCtaText: 'View Pricing',
    secondaryCtaLink: '/pricing',
  },
  {
    id: 3,
    image: '/images/slider/digital-learning.jpg',
    title: 'Learn from the Best',
    subtitle: 'Expert Instructors & AI Tutor',
    description: 'Get personalized learning support from qualified instructors and our AI-powered tutor. Your success is our mission.',
    ctaText: 'Get Started Today',
    ctaLink: '/auth/register',
    secondaryCtaText: 'Learn More',
    secondaryCtaLink: '/about',
  },
];

export function HomeSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  return (
    <div 
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-navy"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      role="region"
      aria-label="Hero slider"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-in-out',
            index === currentSlide 
              ? 'opacity-100 translate-x-0' 
              : index < currentSlide 
                ? 'opacity-0 -translate-x-full' 
                : 'opacity-0 translate-x-full'
          )}
          aria-hidden={index !== currentSlide}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${slides.length}`}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-linear scale-105"
            style={{ 
              backgroundImage: `url(${slide.image})`,
              transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          
          {/* Blue Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/40" />
          <div className="absolute inset-0 bg-navy/20" />

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
            <div className="max-w-2xl text-white animate-slide-up">
              <span className="inline-block px-4 py-2 bg-red/90 rounded-full text-sm font-medium mb-6">
                {slide.subtitle}
              </span>
              
              <h1 className="text-4xl md:text-6xl text-white lg:text-7xl font-bold font-poppins mb-6 leading-tight">
                {slide.title}
              </h1>
              
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                {slide.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={slide.ctaLink}
                  className="inline-flex items-center justify-center px-8 py-4 bg-red hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {slide.ctaText}
                  <ChevronRight size={20} className="ml-2" />
                </a>
                {slide.secondaryCtaText && (
                  <a
                    href={slide.secondaryCtaLink}
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/10"
                  >
                    {slide.secondaryCtaText}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3" role="tablist">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              index === currentSlide 
                ? 'bg-red scale-125 w-8' 
                : 'bg-white/50 hover:bg-white/80'
            )}
            role="tab"
            aria-selected={index === currentSlide}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-red transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}