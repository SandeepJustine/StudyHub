import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "./auth-options";
import { UserRole } from "@/types/common";
import prisma from "@/lib/utils/prisma";

/**
 * Get the current authenticated user session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Check if user has required role(s)
 */
export function hasRole(
  userRole: UserRole | undefined,
  requiredRoles: UserRole | UserRole[]
): boolean {
  if (!userRole) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

/**
 * Middleware to protect API routes by role
 */
export function withRoleAuth(requiredRoles: UserRole | UserRole[]) {
  return async function (
    req: NextRequest,
    context: any
  ): Promise<NextResponse | void> {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!hasRole(session.role as UserRole, requiredRoles)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Add user to context for downstream handlers
    context.user = session;
    return;
  };
}

/**
 * Higher-order function for API route protection
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options?: {
    requiredRoles?: UserRole | UserRole[];
    requireSubscription?: boolean;
  }
) {
  return async function (
    req: NextRequest,
    context: any = {}
  ): Promise<NextResponse> {
    try {
      const session = await getCurrentUser();

      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Check roles
      if (options?.requiredRoles) {
        if (!hasRole(session.role as UserRole, options.requiredRoles)) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Check subscription
      if (options?.requireSubscription) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: session.id,
            status: "active",
          },
        });

        if (!subscription) {
          return NextResponse.json(
            { error: "Active subscription required" },
            { status: 402 }
          );
        }
      }

      // Add user to context
      context.user = session;

      return handler(req, context);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Get user from request (for use in server components)
 */
export async function getUserFromRequest(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return null;

  // Fetch full user data with role-specific profile
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      student: true,
      schoolAdmin: { include: { institution: true } },
      instructor: true,
      corporateClient: true,
      parent: true,
      subscriptions: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return user;
}