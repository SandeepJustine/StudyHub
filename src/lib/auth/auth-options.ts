import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/utils/prisma";
import { UserRole } from "@/types/common";
import { verifyRecaptcha, isRecaptchaEnabled } from "@/lib/captcha";
import { verifyImpersonationJWT } from "@/lib/auth/impersonation";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const recaptchaToken = (credentials as Record<string, string>)?.recaptchaToken;

        if (isRecaptchaEnabled()) {
          if (!recaptchaToken) {
            throw new Error("reCAPTCHA verification is required");
          }

          try {
            await verifyRecaptcha(recaptchaToken);
          } catch (error: any) {
            throw new Error(error.message || "reCAPTCHA verification failed");
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            student: true,
            schoolAdmin: {
              include: { institution: true },
            },
            instructor: true,
            corporateClient: true,
            parent: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 60000
          );
          throw new Error(
            `Account is locked. Please try again in ${minutesLeft} minutes`
          );
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          // Increment failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const maxAttempts = 5;

          if (failedAttempts >= maxAttempts) {
            // Lock account for 30 minutes
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
              },
            });
            throw new Error(
              "Account locked due to too many failed attempts. Please try again in 30 minutes"
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: failedAttempts },
          });

          throw new Error("Invalid email or password");
        }

        // Reset failed attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          phone: user.phone ?? undefined,
          locale: user.locale,
          emailVerified: user.emailVerified ?? undefined,
          institutionId: user.schoolAdmin?.institutionId ?? undefined,
          studentId: user.student?.id ?? undefined,
          instructorId: user.instructor?.id ?? undefined,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          role: 'STUDENT', // Default role for social login
          emailVerified: new Date(),
          avatar: profile.picture,
          locale: profile.locale || "en",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role as UserRole;
        token.phone = (user as any).phone ?? undefined;
        token.locale = (user as any).locale || "en";
        token.institutionId = (user as any).institutionId ?? undefined;
        token.studentId = (user as any).studentId ?? undefined;
        token.instructorId = (user as any).instructorId ?? undefined;
        token.emailVerified = (user as any).emailVerified ?? undefined;
        token.avatar = (user as any).avatar ?? (user as any).image ?? undefined;
      } else if (!token.userId) {
        const cookieStore = await import("next/headers").then(m => m.cookies());
        const impersonationToken = cookieStore.get("x-impersonation-token")?.value;
        if (impersonationToken) {
          const payload = verifyImpersonationJWT(impersonationToken);
          if (payload) {
            token.userId = payload.userId;
            token.sub = payload.sub;
            token.email = payload.email;
            token.name = payload.name;
            token.role = payload.role as UserRole;
            token.phone = payload.phone;
            token.locale = payload.locale || "en";
            token.avatar = payload.avatar;
            token.emailVerified = payload.emailVerified;
            token.institutionId = payload.institutionId;
            token.studentId = payload.studentId;
            token.instructorId = payload.instructorId;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone;
        session.user.locale = token.locale;
        session.user.institutionId = token.institutionId;
        session.user.studentId = token.studentId;
        session.user.instructorId = token.instructorId;
        session.user.emailVerified = token.emailVerified;
        session.user.avatar = token.avatar;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser?.emailBounced || existingUser?.unsubscribedAt) {
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/complete-profile",
  },
  events: {
    async signIn({ user }) {
      // Log successful sign in
      await prisma.activityLog.create({
        data: {
          userId: user.id!,
          action: "SIGN_IN",
          resource: "auth",
          timestamp: new Date(),
        },
      });
    },
    async signOut({ token }) {
      if (token?.userId) {
        await prisma.activityLog.create({
          data: {
            userId: token.userId as string,
            action: "SIGN_OUT",
            resource: "auth",
            timestamp: new Date(),
          },
        });
      }
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};