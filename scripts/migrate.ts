#!/usr/bin/env tsx
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { db } from "../src/drizzle/client";
import { env } from "../src/lib/env";
import { migrationLogger } from "../src/lib/logger";
import type { MigrationRecord } from "../src/types/database";

type CountRow = { count: number };

async function runMigrations(): Promise<void> {
  migrationLogger.info("Starting database migrations...");

  try {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    migrationLogger.info(
      `Connecting to database: ${env.DATABASE_URL.split("@")[1]?.split("/")[0] || "hidden"
      }`
    );

    await migrate(db, {
      migrationsFolder: "./drizzle",
      migrationsTable: "drizzle_migrations",
    });

    migrationLogger.success("All migrations completed successfully!");

    const migrationClient = postgres(env.DATABASE_URL, {
    });

    try {
      const [exists] = await migrationClient<CountRow[]>`
  SELECT CAST(COUNT(*) AS INT) AS count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'drizzle_migrations'
`;

      if ((exists?.count ?? 0) > 0) {
        const migrations = await migrationClient<MigrationRecord[]>`
    SELECT hash, created_at
    FROM drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 5
  `;

        migrationLogger.info("Latest migrations:");
        migrations.forEach((migration) => {
          migrationLogger.info(`  - ${migration.hash}: ${migration.created_at}`);
        });
      } else {
        migrationLogger.warn("drizzle_migrations table not found after migration run.");
      }
    } catch (error) {
      migrationLogger.warn("Could not verify migration status", {
        error: String(error),
      });
    } finally {
      await migrationClient.end();
    }
  } catch (error) {
    migrationLogger.logError(error, "Migration failed");
    process.exit(1);
  }

  migrationLogger.success("Migration process completed!");
}

process.on("SIGINT", async (): Promise<void> => {
  migrationLogger.info("Migration interrupted");
  process.exit(0);
});

process.on("SIGTERM", async (): Promise<void> => {
  migrationLogger.info("Migration terminated");
  process.exit(0);
});

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      migrationLogger.logError(error, "Unhandled error");
      process.exit(1);
    });
}
