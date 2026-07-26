import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requiredRole?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // No session, redirect to login
      router.push('/login');
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      // User doesn't have the required role, redirect to unauthorized page
      router.push('/unauthorized');
      return;
    }
  }, [session, status, requiredRole, router]);

  return { session, status };
}

export function useRequireAuth() {
  return useAuth();
}

export function useRequireAdmin() {
  return useAuth('PLATFORM_ADMIN');
}

export function useRequireInstructor() {
  return useAuth('INSTRUCTOR');
}

export function useRequireSchoolAdmin() {
  return useAuth('SCHOOL_ADMIN');
}
