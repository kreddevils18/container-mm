#!/usr/bin/env tsx

import { env } from "../src/lib/env";
import { dbLogger } from "../src/lib/logger";

async function seedDatabase(): Promise<void> {
  dbLogger.info("Starting database seeding...");

  try {
    // Validate environment
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    dbLogger.info(
      `Connected to database: ${env.DATABASE_URL.split("@")[1]?.split("/")[0] || "hidden"}`
    );

    if (env.NODE_ENV === "production" && !process.env.FORCE_SEED) {
      dbLogger.warn(
        "Skipping seed in production (use FORCE_SEED=true to override)"
      );
      return;
    }

    dbLogger.info("Creating default admin user...");

    const bcrypt = await import("bcryptjs");
    const { db, users } = await import("../src/drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin) {
      dbLogger.info("Admin user already exists, skipping creation");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const [newUser] = await db
        .insert(users)
        .values({
          name: "Administrator",
          username: "admin",
          email: "admin@container-mm.com",
          passwordHash: hashedPassword,
          role: "admin",
          status: "active",
        })
        .returning({ id: users.id, username: users.username });

      dbLogger.success(`Admin user created: ${newUser?.username} (ID: ${newUser?.id})`);
    }

    dbLogger.success("Database seeding completed successfully!");
  } catch (error) {
    dbLogger.logError(error, "Seeding failed");
    process.exit(1);
  }

  dbLogger.success("Seeding process completed!");
}

// Handle process signals
process.on("SIGINT", async (): Promise<void> => {
  dbLogger.info("Seeding interrupted");
  process.exit(0);
});

process.on("SIGTERM", async (): Promise<void> => {
  dbLogger.info("Seeding terminated");
  process.exit(0);
});

// Run seeding
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      dbLogger.logError(error, "Unhandled error");
      process.exit(1);
    });
}
