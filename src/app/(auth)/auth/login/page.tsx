'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { getSession } from 'next-auth/react';  // ← Import getSession
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' 
          ? 'Invalid email or password' 
          : result.error
        );
        setIsLoading(false);
        return;
      }

      // Get the session to know the user's role
      const session = await getSession();
      
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        STUDENT: '/student/dashboard',
        INSTRUCTOR: '/instructor/dashboard',
        SCHOOL_ADMIN: '/school-admin/dashboard',
        CORPORATE_CLIENT: '/corporate/dashboard',
        PLATFORM_ADMIN: '/admin/dashboard',
        PARENT: '/parents/dashboard',
      };
      
      const dashboardPath = roleRoutes[session?.user?.role || ''] || '/';
      router.push(dashboardPath);
      router.refresh();
      
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden">


      {/* Decorative Gradient Orbs 
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-navy/[0.04] blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red/[0.04] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-navy/[0.02] blur-3xl" />
      */}
      {/* Logo - Outside the card */}
      <div className="relative z-10 mb-8">
        <Link href="/">
          <Logo variant="full-color" size="lg" />
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <Card className="shadow-xl border-0 overflow-hidden">

          <CardHeader className="space-y-1 text-center pb-4 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-navy">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to continue your learning journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-grey-dark">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-medium" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 h-11 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-grey-dark">
                    Password
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-red hover:text-red-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-medium" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey-medium hover:text-grey-dark transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-grey-light text-navy focus:ring-navy focus:ring-offset-0"
                />
                <label htmlFor="remember" className="text-sm text-grey-dark cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-grey-light" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-grey-medium text-xs uppercase tracking-wider font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => signIn('google')} 
                disabled={isLoading}
                className="h-11"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="h-11"
              >
                <svg className="w-5 h-5 mr-2 text-green" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                Phone
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col pb-8 px-8">
            <div className="text-sm text-center text-grey-dark">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/register" 
                className="text-red font-semibold hover:text-red-700 transition-colors"
              >
                Create free account
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-grey-medium">
            By signing in, you agree to our{' '}
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