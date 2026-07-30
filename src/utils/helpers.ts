/**
 * Helper utilities for StudyHub Malawi
 */

import crypto from 'crypto';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a unique reference
 */
export function generateReference(prefix: string = 'SH'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; backoff?: boolean } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1000, backoff = true } = options;

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        attempts++;
        if (attempts >= retries) {
          reject(error);
        } else {
          const waitTime = backoff ? delayMs * Math.pow(2, attempts - 1) : delayMs;
          setTimeout(attempt, waitTime);
        }
      }
    };

    attempt();
  });
}

/**
 * Split array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'card'): string {
  switch (type) {
    case 'email': {
      const [name, domain] = data.split('@');
      const maskedName = name.charAt(0) + '***' + name.charAt(name.length - 1);
      return `${maskedName}@${domain}`;
    }
    case 'phone': {
      return data.slice(0, 6) + '****' + data.slice(-2);
    }
    case 'card': {
      return '****-****-****-' + data.slice(-4);
    }
    default:
      return data;
  }
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Merge class names
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeEmbedUrl(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
    }
  }
  return url;
}

/**
 * Check if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}
