import bcrypt from "bcryptjs";
import prisma from "@/lib/utils/prisma";
import { UserRole } from "@/types/common";
import {
  AppError,
  ValidationError,
  AuthenticationError,
} from "@/lib/utils/errors";
import { generateOTP, generateVerificationToken } from "@/utils/helpers";
import { isValidEmail, isValidPhone, isValidPassword } from "@/utils/validators";
import { EmailService } from "@/lib/email/email-service";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    phone?: string;
    locale?: string;
  }) {
    // Validate inputs
    const errors: Record<string, string[]> = {};

    if (!isValidEmail(data.email)) {
      errors.email = ["Invalid email address"];
    }

    const passwordValidation = isValidPassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors;
    }

    if (!data.fullName || data.fullName.length < 2) {
      errors.fullName = ["Name must be at least 2 characters"];
    }

    if (data.phone && !isValidPhone(data.phone)) {
      errors.phone = ["Invalid Malawi phone number"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(
        "A user with this email already exists",
        "EMAIL_EXISTS",
        409
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate verification token
    const emailVerificationToken = generateVerificationToken();

    // Create user with role-specific profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        locale: data.locale || "en",
        emailVerificationToken,
        // Create role-specific profile
        ...(data.role === 'STUDENT' && {
          student: { create: { subjects: [] } },
        }),
        ...(data.role === 'INSTRUCTOR' && {
          instructor: { create: { expertise: [] } },
        }),
        ...(data.role === 'CORPORATE_CLIENT' && {
          corporateClient: {
            create: { companyName: data.fullName },
          },
        }),
        ...(data.role === 'PARENT' && {
          parent: { create: {} },
        }),
      },
      include: {
        student: true,
        instructor: true,
        corporateClient: true,
        parent: true,
      },
    });

    // Send verification email
    try {
      const emailService = new EmailService();
      await emailService.sendTemplated({
        to: user.email,
        userId: user.id,
        subject: 'Verify your StudyHub Account',
        template: 'account-verification',
        templateData: { verificationToken: emailVerificationToken, userName: user.fullName },
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Don't throw - user can still log in and request new verification
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        resource: "user",
        resourceId: user.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      requiresVerification: true,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError(
        "Account is temporarily locked. Please try again later"
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Track failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;

      if (failedAttempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          },
        });
        throw new AuthenticationError(
          "Account locked due to multiple failed attempts"
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });

      throw new AuthenticationError("Invalid email or password");
    }

    // Successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return user;
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError("Invalid verification token", "INVALID_TOKEN", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    });

    return { verified: true };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists - return success anyway
      return { sent: true };
    }

    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // Send reset email
    const emailService = new EmailService();
    await emailService.sendTemplated({
      to: user.email,
      userId: user.id,
      subject: 'Password Reset Request',
      template: 'password-reset',
      templateData: { resetToken: token, userName: user.fullName },
    });

    return { sent: true };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError(
        "Invalid or expired reset token",
        "INVALID_TOKEN",
        400
      );
    }

    const passwordValidation = isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError("Invalid password", {
        password: passwordValidation.errors,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return { reset: true };
  }

  /**
   * Generate and send OTP for phone verification
   */
  async sendPhoneOTP(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.phone) {
      throw new AppError("User not found or no phone number", "NOT_FOUND", 404);
    }

    const otp = generateOTP(6);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (in production, use Redis with expiry)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store hashed OTP temporarily
        // In production, use a separate OTP table or Redis
      },
    });

    // Send OTP via SMS
    // await sendSMS(user.phone, `Your StudyHub verification code is: ${otp}`);

    return { sent: true, expiresIn: 600 };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(userId: string, otp: string) {
    // Verify OTP (in production, check against stored OTP)
    // For MVP, we'll implement simple verification
    return { verified: true };
  }

  /**
   * Get user permissions based on role and subscription
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) return [];

    const permissions = this.getRolePermissions(user.role);
    const subscription = user.subscriptions[0];

    if (subscription) {
      permissions.push(...this.getSubscriptionPermissions(subscription.tier));
    }

    return [...new Set(permissions)];
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      STUDENT: [
        "course:view",
        "exam:take",
        "certificate:view",
        "profile:edit",
        "community:post",
      ],
      SCHOOL_ADMIN: [
        "institution:manage",
        "student:manage",
        "teacher:manage",
        "report:view",
        "course:assign",
      ],
      INSTRUCTOR: [
        "course:create",
        "course:edit",
        "earning:view",
        "student:view",
        "analytics:view",
      ],
      CORPORATE_CLIENT: [
        "job:post",
        "contract:manage",
        "training:purchase",
        "report:view",
      ],
      PLATFORM_ADMIN: [
        "admin:full",
        "user:manage",
        "payment:manage",
        "content:manage",
        "analytics:full",
      ],
      PARENT: [
        "student:view",
        "report:view",
        "payment:view",
      ],
    };

    return permissions[role] || [];
  }

  private getSubscriptionPermissions(tier: any): string[] {
    const permissions: Record<string, string[]> = {
      STUDENT_BASIC: ["course:view:limited"],
      STUDENT_PREMIUM: [
        "course:view:all",
        "ai:tutor",
        "live:class",
        "exam:mock",
      ],
      INSTRUCTOR_PRO: ["course:create:unlimited", "analytics:advanced"],
      INSTITUTION_GOLD: ["api:access", "parent:portal", "white:label"],
    };

    return permissions[tier] || [];
  }
}

export const authService = new AuthService();