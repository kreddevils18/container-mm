import { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole, UserStatus } from "@/features/auth/schemas/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      status: UserStatus;
      name: string;
      email: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    name: string;
    email: string;
    passwordHash?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    name: string;
    email: string;
  }
}
