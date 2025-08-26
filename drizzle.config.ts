import { defineConfig } from "drizzle-kit";

const getDefaultConnectionString = (): string => {
  return "postgresql://postgres:password@localhost:5432/container_mm_dev";
};

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/drizzle/schema/enums.ts",
    "./src/drizzle/schema/auth.ts",
    "./src/drizzle/schema/customers.ts",
    "./src/drizzle/schema/vehicles.ts",
    "./src/drizzle/schema/orders.ts",
    "./src/drizzle/schema/costs.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || getDefaultConnectionString(),
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
  },
  casing: "snake_case",
  verbose: process.env.NODE_ENV === "development",
  strict: true,
  migrations: {
    prefix: "timestamp",
    schema: "public",
  },
  breakpoints: true
});