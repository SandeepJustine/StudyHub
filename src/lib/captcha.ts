import { AppError } from '@/lib/utils/errors';

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challengeTs?: string;
  error?: string;
}

export function isRecaptchaEnabled(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptcha(
  token: string
): Promise<RecaptchaVerificationResult> {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    throw new AppError(
      'reCAPTCHA is not configured on the server',
      'RECAPTCHA_NOT_CONFIGURED',
      503
    );
  }

  if (!token) {
    throw new AppError('reCAPTCHA token is missing', 'RECAPTCHA_INVALID', 400);
  }

  const params = new URLSearchParams();
  params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
  params.append('response', token);

  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    }
  );

  if (!response.ok) {
    throw new AppError(
      'reCAPTCHA verification service unavailable',
      'RECAPTCHA_SERVICE_ERROR',
      503
    );
  }

  const result: RecaptchaVerificationResult = await response.json();

  if (!result.success) {
    throw new AppError(
      'reCAPTCHA verification failed. Please try again.',
      'RECAPTCHA_VERIFICATION_FAILED',
      403
    );
  }

  return result;
}
