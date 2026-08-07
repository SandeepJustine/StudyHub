import { UserRole } from '@/types/common';

type Permission = string;
type Role = UserRole;

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  STUDENT: [
    'course:view',
    'course:enroll',
    'exam:take',
    'certificate:view',
    'profile:edit',
    'community:post',
    'job:apply',
    'event:register',
    'past_paper:view',
  ],
  SCHOOL_ADMIN: [
    'institution:manage',
    'student:manage',
    'teacher:manage',
    'student:view_progress',
    'course:assign',
    'report:view',
    'branding:manage',
    'community:moderate',
    'past_paper:upload',
    'past_paper:view',
  ],
  INSTRUCTOR: [
    'course:create',
    'course:edit',
    'course:delete',
    'earning:view',
    'student:view',
    'exam:create',
    'quiz:grade',
    'analytics:view',
    'live:class:create',
    'past_paper:upload',
  ],
  CORPORATE_CLIENT: [
    'job:post',
    'job:manage',
    'contract:create',
    'contract:manage',
    'training:purchase',
    'application:review',
    'report:view',
  ],
  PLATFORM_ADMIN: [
    'admin:full',
    'user:manage',
    'payment:manage',
    'content:manage',
    'analytics:full',
    'pricing:manage',
    'payout:manage',
    'sponsorship:manage',
    'audit:view',
    'system:config',
  ],
  PARENT: [
    'student:view_progress',
    'student:view_grades',
    'payment:view',
    'event:view',
  ],
};

export class RBACService {
  /**
   * Check if user has permission
   */
  hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(role, p));
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(role, p));
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Enforce permission (throws if not authorized)
   */
  enforce(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Permission denied: ${permission} required`);
    }
  }

  /**
   * Get roles that have a specific permission
   */
  getRolesWithPermission(permission: Permission): Role[] {
    return Object.entries(ROLE_PERMISSIONS)
      .filter(([_, perms]) => perms.includes(permission))
      .map(([role]) => role as Role);
  }
}