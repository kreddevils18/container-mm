import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

const connectionString = env.DATABASE_URL;
const pool = postgres(connectionString, {
  max:
    env.NODE_ENV === "development" ? 10 : env.NODE_ENV === "production" ? 2 : 5,
  idle_timeout: env.NODE_ENV === "development" ? 60 : 20,
  max_lifetime: env.NODE_ENV === "development" ? 60 * 60 : 60 * 30,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  connect_timeout: env.NODE_ENV === "development" ? 30 : 10,
  prepare: false,
  transform: {
    undefined: null,
  },
});

export const db = drizzle(pool, {
  logger: env.NODE_ENV === "development",
});

export const closeDatabase = async (): Promise<void> => {
  await pool.end();
};
