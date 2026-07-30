'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Mail, Lock, User, Phone, GraduationCap, AlertCircle } from 'lucide-react';
import { getSession } from 'next-auth/react';

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: <GraduationCap size={24} />, description: 'Learn and prepare for exams' },
  { value: 'INSTRUCTOR', label: 'Instructor', icon: <User size={24} />, description: 'Create and sell courses' },
  { value: 'SCHOOL_ADMIN', label: 'School Admin', icon: <User size={24} />, description: 'Manage your institution' },
  { value: 'CORPORATE_CLIENT', label: 'Corporate Client', icon: <User size={24} />, description: 'Training & recruitment' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

    // Auto-login after registration
const signInResult = await signIn('credentials', {
  email: formData.email,
  password: formData.password,
  redirect: false,
});

if (signInResult?.error) {
  // Auto-login failed, redirect to login page
  router.push('/auth/login?registered=true');
  } else {
    // Get session to determine role
    const session = await getSession();
    
    // Role-based dashboard routes
    const roleRoutes: Record<string, string> = {
      STUDENT: '/student/dashboard',
      INSTRUCTOR: '/instructor/dashboard',
      SCHOOL_ADMIN: '/school-admin/dashboard',
      CORPORATE_CLIENT: '/corporate/dashboard',
      PLATFORM_ADMIN: '/admin/dashboard',
      PARENT: '/parents/dashboard',
    };
    
    const dashboardPath = roleRoutes[session?.user?.role || ''] || '/';
    window.location.href = dashboardPath;
  }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      
      <div className="relative z-10 mb-8">
        <Link href="/">
          <Logo variant="full-color" size="lg" />
        </Link>
      </div>
          {/* Main Card */}
          <div className="relative z-10 w-full max-w-md">
            <Card padding="lg">
              <CardHeader className="text-center">
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  {step === 1 ? 'Choose your role to get started' : 'Fill in your details'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {step === 1 ? (
                  <div className="space-y-3">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => {
                          setSelectedRole(role.value);
                          setStep(2);
                        }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedRole === role.value
                            ? 'border-navy bg-navy/5'
                            : 'border-grey-light hover:border-navy/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-navy">{role.icon}</div>
                          <div>
                            <p className="font-semibold text-navy">{role.label}</p>
                            <p className="text-sm text-grey-medium">{role.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => setStep(1)} className="text-grey-medium hover:text-navy">
                        ← Back
                      </button>
                      <span className="text-sm text-grey-medium">
                        Registering as <strong className="text-navy">{ROLES.find(r => r.value === selectedRole)?.label}</strong>
                      </span>
                    </div>

                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      leftIcon={<User size={18} className="text-grey-medium" />}
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      disabled={isLoading}
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="your@email.com"
                      leftIcon={<Mail size={18} className="text-grey-medium" />}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isLoading}
                    />

                    <Input
                      label="Phone (Optional)"
                      type="tel"
                      placeholder="+265 888 000 000"
                      leftIcon={<Phone size={18} className="text-grey-medium" />}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isLoading}
                    />

                    <Input
                      label="Password"
                      type="password"
                      placeholder="Min. 8 characters"
                      leftIcon={<Lock size={18} className="text-grey-medium" />}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter your password"
                      leftIcon={<Lock size={18} className="text-grey-medium" />}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      disabled={isLoading}
                    />

                    <label className="flex items-start gap-2 text-sm text-grey-dark">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="mt-1 rounded border-grey-light"
                      />
                      <span>
                        I agree to the{' '}
                        <Link href="/terms" className="text-red hover:text-red-700">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-red hover:text-red-700">Privacy Policy</Link>
                      </span>
                    </label>

                    <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                      Create Account
                    </Button>
                  </form>
                )}
              </CardContent>

              <CardFooter className="text-center">
                <p className="text-sm text-grey-dark">
                  Already have an account?{' '}
                  <Link href="/login" className="text-red hover:text-red-700 font-medium">
                    Log in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
    </div>
  );
}
