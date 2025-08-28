import type { DefaultSession } from "next-auth";

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

  interface User {
    username: string;
    role: "admin" | "driver";
    status: "active" | "inactive";
    name: string | null | undefined;
    passwordHash?: string | null;
  }
}

// Note: JWT interface augmentation removed temporarily for compilation
// TODO: Fix next-auth v5 module augmentation path