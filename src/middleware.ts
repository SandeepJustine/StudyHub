// src/middleware.ts - RBAC enforcement at API layer
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from '@/types/common';

// Define role-based access control mappings to their dashboards
const roleAccess: Record<UserRole, string[]> = {
  STUDENT: ['/student'],
  SCHOOL_ADMIN: ['/school-admin'],
  INSTRUCTOR: ['/instructor'],
  CORPORATE_CLIENT: ['/corporate'],
  PLATFORM_ADMIN: ['/admin'],
  PARENT: ['/parent'],
};

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Skip middleware for API routes - they handle their own auth
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // If user is logged in, redirect from auth pages to their dashboard
    if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      const dashboardPath = roleAccess[token.role as UserRole]?.[0] || '/student/dashboard';
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }

    // Role-based access control for protected routes
    if (token) {
      const userRole = token.role as UserRole;
      const allowedPaths = roleAccess[userRole];

      // PLATFORM_ADMIN can access everything
      if (userRole === 'PLATFORM_ADMIN') {
        return NextResponse.next();
      }

      if (allowedPaths) {
        const isAuthorized = allowedPaths.some((path) => pathname.startsWith(path));
        if (!isAuthorized) {
          // Redirect to their primary dashboard
          return NextResponse.redirect(new URL(allowedPaths[0], req.url));
        }
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // API routes are always allowed (they handle their own auth)
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Public paths that don't require authentication
        const isPublic =
          pathname === '/' ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/pricing') ||
          pathname.startsWith('/privacy') ||
          pathname.startsWith('/terms') ||
          pathname.startsWith('/auth/login') ||
          pathname.startsWith('/auth/register') ||
          pathname.startsWith('/auth/error') ||
          pathname.startsWith('/auth/forgot-password') ||
          pathname.startsWith('/auth/reset-password') ||
          pathname.startsWith('/auth/verify-email') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/webhooks');

        return isPublic || !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|icons/|fonts/|locales/).*)',
  ],
};