'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setIsSent(true);
    } catch (error) {
      // Always show success to prevent email enumeration
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <CardHeader className="text-center">
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          {!isSent 
            ? "Enter your email and we'll send you a reset link"
            : 'Check your email for the reset link'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail size={18} className="text-grey-medium" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="text-center py-4">
            <CheckCircle size={48} className="mx-auto text-green mb-4" />
            <p className="text-grey-dark mb-4">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <p className="text-sm text-grey-medium">
              Didn't receive the email? Check your spam folder or{' '}
              <button onClick={() => setIsSent(false)} className="text-red hover:text-red-700">
                try again
              </button>
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center">
        <Link href="/login" className="text-sm text-grey-dark hover:text-navy flex items-center justify-center gap-1">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}