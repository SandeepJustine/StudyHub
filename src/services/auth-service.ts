import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { EmailService } from '@/lib/email/email-service';
import { UserRole } from '@/types/common';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          locale: 'en',
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};

export class AuthService {
  static async verifyEmail(token: string) {
    // Implementation for email verification
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      }
    });

    return user;
  }

  static async sendPasswordResetEmail(email: string) {
    // Implementation for password reset
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send email with reset token
    const emailService = new EmailService();
    await emailService.sendOTP(user.id, resetToken, 'password_reset');

    return { success: true };
  }

  static async resetPassword(token: string, newPassword: string) {
    // Implementation for password reset
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { success: true };
  }
}
