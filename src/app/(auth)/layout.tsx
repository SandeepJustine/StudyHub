import { AuthLayout } from '@/components/layouts/auth/auth-layout';

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}