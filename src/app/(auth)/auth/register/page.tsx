'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Recaptcha, RecaptchaHandle, isRecaptchaClientEnabled } from '@/components/ui/recaptcha';
import { Mail, Lock, User, Phone, GraduationCap, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { getSession } from 'next-auth/react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const USE_RECAPTCHA = isRecaptchaClientEnabled();

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: <GraduationCap size={24} />, description: 'Learn and prepare for exams' },
  { value: 'INSTRUCTOR', label: 'Instructor', icon: <User size={24} />, description: 'Create and sell courses' },
  { value: 'SCHOOL_ADMIN', label: 'School Admin', icon: <Building2 size={24} />, description: 'Manage your institution' },
  { value: 'CORPORATE_CLIENT', label: 'Corporate Client', icon: <Briefcase size={24} />, description: 'Training & recruitment' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaHandle>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    institutionName: '',
    institutionSlug: '',
    institutionMaxStudents: '200',
    companyName: '',
    industry: '',
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

    if (USE_RECAPTCHA) {
      if (!recaptchaToken) {
        setError('Please complete the reCAPTCHA');
        setIsLoading(false);
        return;
      }

      const verifyRes = await fetch('/api/auth/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'reCAPTCHA verification failed');
        if (recaptchaRef.current) recaptchaRef.current.reset();
        setRecaptchaToken(null);
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: selectedRole,
        recaptchaToken: USE_RECAPTCHA ? recaptchaToken : undefined,
      };

      if (selectedRole === 'SCHOOL_ADMIN') {
        if (!formData.institutionName.trim()) {
          setError('Institution name is required');
          setIsLoading(false);
          return;
        }
        payload.institution = {
          name: formData.institutionName.trim(),
          slug: formData.institutionSlug.trim() || formData.institutionName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          maxStudents: parseInt(formData.institutionMaxStudents) || 200,
        };
      }

      if (selectedRole === 'CORPORATE_CLIENT') {
        if (!formData.companyName.trim()) {
          setError('Company name is required');
          setIsLoading(false);
          return;
        }
        payload.corporate = {
          companyName: formData.companyName.trim(),
          industry: formData.industry.trim() || undefined,
        };
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/auth/login?registered=true');
      } else {
        const session = await getSession();
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
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken(null);
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
                  <button type="button" onClick={() => setStep(1)} className="text-grey-medium hover:text-navy">
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

                {selectedRole === 'SCHOOL_ADMIN' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-navy">Institution Details</p>
                    <Input
                      label="Institution Name"
                      placeholder="e.g., Lilongwe Secondary School"
                      value={formData.institutionName}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          institutionName: e.target.value,
                          institutionSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        });
                      }}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      label="Institution Slug (auto-generated)"
                      placeholder="lilongwe-secondary-school"
                      value={formData.institutionSlug}
                      onChange={(e) => setFormData({ ...formData, institutionSlug: e.target.value })}
                      disabled={isLoading}
                      helperText="Used in URLs. Leave empty to auto-generate from name."
                    />
                    <Input
                      label="Maximum Students"
                      type="number"
                      placeholder="200"
                      value={formData.institutionMaxStudents}
                      onChange={(e) => setFormData({ ...formData, institutionMaxStudents: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {selectedRole === 'CORPORATE_CLIENT' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-navy">Company Details</p>
                    <Input
                      label="Company Name"
                      placeholder="e.g., ABC Corporation Ltd"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      label="Industry (Optional)"
                      placeholder="e.g., Finance, Technology, Healthcare"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                )}

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

                 {/* reCAPTCHA */}
                 {USE_RECAPTCHA && RECAPTCHA_SITE_KEY && (
                   <div className="flex justify-center py-2">
                     <Recaptcha
                       ref={recaptchaRef}
                       siteKey={RECAPTCHA_SITE_KEY}
                       onVerify={setRecaptchaToken}
                       onExpired={() => setRecaptchaToken(null)}
                       theme="light"
                     />
                   </div>
                 )}

                 <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                   Create Account
                 </Button>
               </form>
            )}
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-grey-dark">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-red hover:text-red-700 font-medium">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
