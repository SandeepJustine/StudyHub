import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { UserRole } from '@prisma/client';
import { AppError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { AuditLogger } from '@/lib/security/audit-logger';

const auditLogger = new AuditLogger();

/**
 * GET /api/admin/users
 * List all users with filtering and pagination (Admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify admin access
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      query: searchParams.get('query') || undefined,
      role: searchParams.get('role') as UserRole | undefined,
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Build where clause
    const where: any = {};
    
    if (params.query) {
      where.OR = [
        { fullName: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
        { phone: { contains: params.query } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.status === 'active') {
      where.lockedUntil = null;
    } else if (params.status === 'locked') {
      where.lockedUntil = { not: null };
    } else if (params.status === 'unverified') {
      where.emailVerified = null;
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          avatar: true,
          locale: true,
          emailVerified: true,
          lastLoginAt: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              subscriptions: true,
              transactions: true,
              notifications: true,
            },
          },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      locale: user.locale,
      isVerified: !!user.emailVerified,
      isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      stats: {
        subscriptions: user._count.subscriptions,
        transactions: user._count.transactions,
        notifications: user._count.notifications,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users
 * Update user details (role, status, etc.)
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    let updatedUser;

    switch (action) {
      case 'update_role':
        if (!data?.role || !Object.values(UserRole).includes(data.role)) {
          throw new ValidationError('Invalid role', {
            role: ['Must be a valid user role'],
          });
        }

        // Prevent changing own role
        if (userId === session.user.id) {
          throw new AppError('Cannot change your own role', 'SELF_MODIFICATION', 400);
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { role: data.role },
        });

        // Create role-specific profile if needed
        if (data.role === 'STUDENT' && !user.student) {
          await prisma.student.create({
            data: { userId, subjects: [] },
          });
        } else if (data.role === 'INSTRUCTOR' && !user.instructor) {
          await prisma.instructor.create({
            data: { userId, expertise: [] },
          });
        }

        // Log audit
        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'UPDATE_USER_ROLE',
          entity: 'USER',
          entityId: userId,
          changes: { from: user.role, to: data.role },
        });
        break;

      case 'toggle_lock':
        const isCurrentlyLocked = user.lockedUntil && user.lockedUntil > new Date();
        
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            lockedUntil: isCurrentlyLocked 
              ? null 
              : new Date(Date.now() + 24 * 60 * 60 * 1000), // Lock for 24 hours
            failedLoginAttempts: isCurrentlyLocked ? 0 : undefined,
          },
        });

        await auditLogger.logAction({
          adminId: session.user.id,
          action: isCurrentlyLocked ? 'UNLOCK_USER' : 'LOCK_USER',
          entity: 'USER',
          entityId: userId,
        });
        break;

      case 'verify_email':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { emailVerified: new Date() },
        });

        await auditLogger.logAction({
          adminId: session.user.id,
          action: 'VERIFY_USER_EMAIL',
          entity: 'USER',
          entityId: userId,
        });
        break;

      case 'update_profile':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fullName: data.fullName,
            phone: data.phone,
            locale: data.locale,
          },
        });
        break;

      default:
        throw new ValidationError('Invalid action', {
          action: [`Action "${action}" is not supported`],
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        locale: updatedUser.locale,
        emailVerified: updatedUser.emailVerified,
        lockedUntil: updatedUser.lockedUntil,
      },
      message: `User ${action.replace(/_/g, ' ')} successful`,
    });

  } catch (error: any) {
    console.error('Admin user update error:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}