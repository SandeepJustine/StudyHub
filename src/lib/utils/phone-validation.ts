/**
 * Phone number validation utilities for Malawi mobile money payments.
 *
 * Supported formats:
 *  - Airtel Money: 099XXXXXXXX or 098XXXXXXXX (or +26599XXXXXXXX / +26598XXXXXXXX)
 *  - TNM Mpamba:   088XXXXXXXX or +26588XXXXXXXX
 */

export type MobileOperator = 'AIRTEL_MONEY' | 'TNM_MPAMBA';

export interface PhoneValidationResult {
  valid: boolean;
  operator: MobileOperator | null;
  formatted: string;
  error?: string;
}

const OPERATOR_PATTERNS: Record<MobileOperator, RegExp> = {
  AIRTEL_MONEY: /^(099|098|\+26599|\+26598)\d{7}$/,
  TNM_MPAMBA: /^(088|\+26588)\d{7}$/,
};

const OPERATOR_NAMES: Record<MobileOperator, string> = {
  AIRTEL_MONEY: 'Airtel Money',
  TNM_MPAMBA: 'TNM Mpamba',
};

/**
 * Detect which mobile operator a phone number belongs to.
 */
export function detectOperator(phone: string): MobileOperator | null {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  for (const [operator, pattern] of Object.entries(OPERATOR_PATTERNS)) {
    if (pattern.test(cleaned)) {
      return operator as MobileOperator;
    }
  }
  return null;
}

/**
 * Validate a phone number for a specific operator.
 */
export function validatePhone(phone: string, operator?: MobileOperator): PhoneValidationResult {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  if (!cleaned) {
    return { valid: false, operator: null, formatted: phone, error: 'Phone number is required' };
  }

  // If operator is specified, validate against that operator's pattern
  if (operator) {
    const pattern = OPERATOR_PATTERNS[operator];
    if (pattern.test(cleaned)) {
      return { valid: true, operator, formatted: formatPhone(phone) };
    }
    return {
      valid: false,
      operator: null,
      formatted: phone,
      error: `Invalid ${OPERATOR_NAMES[operator]} number. Expected format: ${getOperatorFormat(operator)}`,
    };
  }

  // Auto-detect operator
  const detected = detectOperator(phone);
  if (detected) {
    return { valid: true, operator: detected, formatted: formatPhone(phone) };
  }

  return {
    valid: false,
    operator: null,
    formatted: phone,
    error: 'Invalid phone number. Use 099/098 (Airtel) or 088 (TNM) format.',
  };
}

/**
 * Format a phone number for display.
 * e.g. 0991234567 -> 099 123 4567, +265991234567 -> +265 99 123 4567
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('+265')) {
    const rest = cleaned.substring(4);
    if (rest.startsWith('99') || rest.startsWith('98') || rest.startsWith('88')) {
      return `+265 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
    }
    return `+265 ${rest}`;
  }

  if (cleaned.startsWith('0')) {
    const rest = cleaned.substring(1);
    if (rest.startsWith('99') || rest.startsWith('98') || rest.startsWith('88')) {
      return `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
    }
    return cleaned;
  }

  if (cleaned.length === 9 && /^(99|98|88)/.test(cleaned)) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  }

  return phone;
}

/**
 * Get the canonical phone string for API submission.
 * e.g. 099 123 4567 -> 0991234567, +265 99 123 4567 -> +265991234567
 */
export function canonicalPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Get the expected format string for an operator.
 */
export function getOperatorFormat(operator: MobileOperator): string {
  if (operator === 'AIRTEL_MONEY') return '099XXXXXXXX or 098XXXXXXXX';
  return '088XXXXXXXX';
}

/**
 * Get all supported operators.
 */
export function getSupportedOperators(): MobileOperator[] {
  return ['AIRTEL_MONEY', 'TNM_MPAMBA'];
}