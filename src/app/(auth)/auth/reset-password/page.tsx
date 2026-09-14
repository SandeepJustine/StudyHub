'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Loader2, Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { isValidPassword } from '@/utils/validators';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validatePassword = (password: string) => {
    const validation = isValidPassword(password);
    setPasswordErrors(validation.errors);
    return validation.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
        router.refresh();
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="relative z-10 mb-8">
          <Link href="/">
            <Logo variant="full-color" size="lg" />
          </Link>
        </div>
        <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden" variant="elevated" padding="lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-navy">Invalid Link</CardTitle>
            <CardDescription className="text-base">This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <AlertCircle size={48} className="mx-auto text-red mb-4" />
            <p className="text-grey-dark mb-4">
              The reset token is missing or invalid. Please request a new password reset link.
            </p>
            <Link href="/auth/forgot-password">
              <Button variant="primary" size="lg" fullWidth>
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
          <CardFooter className="text-center">
            <Link href="/auth/login" className="text-sm text-grey-dark hover:text-navy flex items-center justify-center gap-1">
              <ArrowRight size={14} />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="relative z-10 mb-8">
          <Link href="/">
            <Logo variant="full-color" size="lg" />
          </Link>
        </div>
        <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden" variant="elevated" padding="lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-navy">Password Reset Successful</CardTitle>
            <CardDescription className="text-base">Your password has been updated.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <CheckCircle size={48} className="mx-auto text-green mb-4" />
            <p className="text-grey-dark mb-4">
              Your password has been successfully reset. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 mb-8">
        <Link href="/">
          <Logo variant="full-color" size="lg" />
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <Card className="shadow-xl border-0 overflow-hidden" variant="elevated" padding="lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-navy">
              Create New Password
            </CardTitle>
            <CardDescription className="text-base">
              Your new password must be different from previously used passwords.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                leftIcon={<Lock size={18} className="text-grey-medium" />}
                value={newPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPassword(value);
                  if (value.length > 0) validatePassword(value);
                }}
                required
                disabled={isLoading}
                error={passwordErrors.length > 0 && newPassword.length > 0 ? passwordErrors[0] : undefined}
                helperText={newPassword.length === 0 ? undefined : 'Must be at least 8 characters with uppercase, lowercase, and number'}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                leftIcon={<Lock size={18} className="text-grey-medium" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                error={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="h-12 text-base font-semibold"
                rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>

            <div className="text-sm text-grey-medium space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="text-center">
            <Link href="/auth/login" className="text-sm text-grey-dark hover:text-navy flex items-center justify-center gap-1">
              <ArrowRight size={14} />
              Back to Login
            </Link>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-grey-medium">
            By resetting your password, you agree to our{' '}
            <Link href="/terms" className="text-navy hover:underline font-medium">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-navy hover:underline font-medium">Privacy Policy</Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-grey-medium hover:text-navy transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}