import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";
import { UserRole } from "./common";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      phone?: string;
      locale: string;
      institutionId?: string;
      studentId?: string;
      instructorId?: string;
      emailVerified?: Date;
      avatar?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    phone?: string;
    locale: string;
    institutionId?: string;
    studentId?: string;
    instructorId?: string;
    emailVerified?: Date;
    avatar?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    role: UserRole;
    phone?: string;
    locale: string;
    institutionId?: string;
    studentId?: string;
    instructorId?: string;
    emailVerified?: Date;
    avatar?: string;
  }
}
