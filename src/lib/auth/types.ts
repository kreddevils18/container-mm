import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: "admin" | "driver";
      status: "active" | "inactive";
      email: string;
      name: string | null | undefined;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: "admin" | "driver";
    status: "active" | "inactive";
    name: string | null | undefined;
    passwordHash: string | null | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "driver";
    status?: "active" | "inactive";
  }
}