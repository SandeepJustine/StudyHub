import { LoginForm } from '@/components/forms/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-grey-light p-4">
      <LoginForm />
    </div>
  );
}