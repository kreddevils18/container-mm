import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { logger } from "@/lib/logger";
import { customDrizzleAdapter } from "./adapter";
import { LoginRequestSchema } from "./schemas";

export const authConfig: NextAuthConfig = {
  adapter: customDrizzleAdapter,

  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: {
          label: "Tên đăng nhập",
          type: "text",
        },
        password: {
          label: "Mật khẩu",
          type: "password",
        },
      },
      async authorize(credentials: Record<string, unknown> | undefined) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const validatedFields = LoginRequestSchema.safeParse({
            username: credentials.username as string,
            password: credentials.password as string,
          });

          if (!validatedFields.success) {
            return null;
          }

          const { compare } = await import("bcryptjs");
          const { db, users } = await import("@/drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1);

          if (!user || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          if (user.status !== "active") {
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          };
        } catch (error) {
          logger.error("Authorization error during login", { error });
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
    signOut: "/auth/signout",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user) {
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub as string,
          username: token.username as string,
          role: token.role as "admin" | "driver",
          status: token.status as "active" | "inactive",
          name: token.name as string,
          email: token.email as string,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.name = (user as any).name;
        token.email = user.email;
      }
      return token;
    },
  },

  events: {
    async signOut() { },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET!,
};
