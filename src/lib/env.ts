import { z } from "zod";

const AuthSecretSchema = z
  .string()
  .min(32, {
    message: "NEXTAUTH_SECRET phải có ít nhất 32 ký tự để đảm bảo bảo mật",
  })
  .brand<"AuthSecret">();
const DatabaseUrlSchema = z.string().url().brand<"DatabaseUrl">();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  NEXT_PUBLIC_APP_URL: z.string().url({
    message:
      "NEXT_PUBLIC_APP_URL phải là URL hợp lệ (ví dụ: http://localhost:3000)",
  }),
  NEXT_PUBLIC_API_URL: z.string().url({
    message:
      "NEXT_PUBLIC_API_URL phải là URL hợp lệ (ví dụ: http://localhost:3000)",
  }),

  NEXTAUTH_URL: z.string().url({
    message: "NEXTAUTH_URL phải là URL hợp lệ (ví dụ: http://localhost:3000)",
  }),
  NEXTAUTH_SECRET: AuthSecretSchema,

  DATABASE_URL: DatabaseUrlSchema,

  ANALYZE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
export type AuthSecret = z.infer<typeof AuthSecretSchema>;
export type DatabaseUrl = z.infer<typeof DatabaseUrlSchema>;

export function validateEnvironment(): Env {
  if (typeof window !== "undefined") {
    return {
      NODE_ENV: (process.env.NODE_ENV || "development") as
        | "development"
        | "test"
        | "production",
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
      NEXTAUTH_SECRET: "client-side-placeholder" as AuthSecret,
      DATABASE_URL: "client-side-placeholder" as DatabaseUrl,
    };
  }

  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    const result = envSchema.safeParse(process.env);

    if (result.success) {
      return result.data;
    }

    return {
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:3000",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET:
        "test-secret-key-minimum-32-characters-long" as AuthSecret,
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/container_mm_test" as DatabaseUrl,
    };
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    result.error.issues.forEach((issue) => {
      const fieldName = issue.path.join(".");
      const errorMessage = issue.message;

      if (issue.code === "invalid_type") {
        missingFields.push(`- ${fieldName}: ${errorMessage}`);
      } else {
        invalidFields.push(`- ${fieldName}: ${errorMessage}`);
      }
    });

    if (missingFields.length > 0) {
      missingFields.forEach((_error) => {});
    }

    if (invalidFields.length > 0) {
      invalidFields.forEach((_error) => {});
    }

    if (process.env.NODE_ENV !== "development") {
      process.exit(1);
    }
  }

  return result.data as Env;
}

export const env = validateEnvironment();

export { envSchema, AuthSecretSchema, DatabaseUrlSchema };
