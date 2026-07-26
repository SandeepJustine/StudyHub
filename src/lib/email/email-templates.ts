/**
 * Email template registry and management
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  variables: string[];
  category: string;
  version: number;
  locale: string;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'payment-confirmation': {
    name: 'Payment Confirmation',
    subject: 'Payment Confirmed - {{planName}}',
    variables: ['userName', 'amount', 'planName', 'transactionReference', 'date'],
    category: 'transactional',
    version: 1,
    locale: 'en',
  },
  'welcome': {
    name: 'Welcome Email',
    subject: 'Welcome to StudyHub Malawi! 🎉',
    variables: ['userName', 'role', 'features'],
    category: 'onboarding',
    version: 1,
    locale: 'en',
  },
  'otp-verification': {
    name: 'OTP Verification',
    subject: 'Your Verification Code: {{otp}}',
    variables: ['userName', 'otp', 'purpose', 'expiryMinutes'],
    category: 'security',
    version: 1,
    locale: 'en',
  },
  'exam-result': {
    name: 'Exam Result',
    subject: 'Exam Result: {{quizTitle}}',
    variables: ['userName', 'quizTitle', 'score', 'passed', 'certificateUrl'],
    category: 'educational',
    version: 1,
    locale: 'en',
  },
  'renewal-reminder': {
    name: 'Renewal Reminder',
    subject: 'Subscription Renewing in {{daysRemaining}} Days',
    variables: ['userName', 'tier', 'amount', 'endDate', 'daysRemaining'],
    category: 'billing',
    version: 1,
    locale: 'en',
  },
};

/**
 * Get template by name and locale
 */
export function getEmailTemplate(name: string, locale: string = 'en'): EmailTemplate | null {
  const key = `${name}-${locale}`;
  return EMAIL_TEMPLATES[key] || EMAIL_TEMPLATES[name] || null;
}

/**
 * Get all templates for a category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES).filter(t => t.category === category);
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: EmailTemplate,
  providedVariables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing = template.variables.filter(v => !(v in providedVariables));
  return {
    valid: missing.length === 0,
    missing,
  };
}