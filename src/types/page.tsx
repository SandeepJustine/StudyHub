import type { ReactNode } from 'react';
import { UserRole } from './common';

/**
 * Represents metadata for a page, primarily for SEO purposes.
 */
export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterHandle?: string;
}

/**
 * Represents a single item in a breadcrumb trail.
 */
export interface Breadcrumb {
  label: string;
  href: string;
  isCurrent?: boolean;
}

/**
 * Defines the props for a standard page layout component.
 */
export interface PageLayoutProps {
  children: ReactNode;
  metadata: PageMetadata;
  breadcrumbs?: Breadcrumb[];
  showTitle?: boolean;
  accessControl?: {
    allowedRoles: UserRole[];
  };
}

/**
 * Represents a generic section on a landing page or marketing page.
 */
export interface PageSection<T = Record<string, any>> {
  id: string;
  type: 'hero' | 'features' | 'testimonial' | 'faq' | 'cta' | 'content';
  title?: string;
  subtitle?: string;
  content?: string;
  props?: T; // Component-specific props
}

/**
 * Represents a Call to Action element.
 */
export interface CallToAction {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: ReactNode;
}

/**
 * Represents a feature item, often used in a 'features' section.
 */
export interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
}

/**
 * Represents a testimonial.
 */
export interface Testimonial {
  quote: string;
  author: {
    name: string;
    title?: string;
    avatar?: string;
  };
}

/**
 * Represents a Frequently Asked Question item.
 */
export interface FAQItem {
  question: string;
  answer: string;
}