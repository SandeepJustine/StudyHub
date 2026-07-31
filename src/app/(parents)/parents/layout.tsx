'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Phone, Lock, ArrowLeft, Eye, User } from 'lucide-react';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/parent/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, []);

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setIsAuthenticated(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/parent/session', { method: 'DELETE' });
      setIsAuthenticated(false);
      setStep('phone');
      setPhone('');
      setOtp('');
      router.refresh();
    } catch {
      // ignore
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-grey-light flex flex-col items-center justify-center p-4">
        <Logo size="lg" className="mb-8" />

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Parent Portal</CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'Enter your phone number to sign in'
                : 'Enter the verification code sent to your phone'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red">
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <div className="space-y-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+265 888 000 000"
                  leftIcon={<Phone size={18} className="text-grey-medium" />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleSendOTP}
                  loading={isLoading}
                >
                  Send Verification Code
                </Button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full text-sm text-grey-medium hover:text-navy flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} />
                  Back to main login
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-sm text-grey-dark mb-4">
                  We sent a 6-digit code to <strong>{phone}</strong>
                </div>
                <Input
                  label="Verification Code"
                  placeholder="000000"
                  leftIcon={<Lock size={18} className="text-grey-medium" />}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleVerifyOTP}
                  loading={isLoading}
                >
                  Verify & Sign In
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => setStep('phone')}
                    className="text-sm text-grey-medium hover:text-navy"
                  >
                    Use different number
                  </button>
                  <span className="mx-2 text-grey-medium">•</span>
                  <button
                    onClick={handleSendOTP}
                    className="text-sm text-red hover:text-red-700"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-light">
      <header className="bg-navy text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="white" size="sm" />
          <Button variant="ghost" className="text-white" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
