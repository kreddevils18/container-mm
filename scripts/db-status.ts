#!/usr/bin/env tsx

import postgres from "postgres";
import { env } from "../src/lib/env";
import { dbLogger } from "../src/lib/logger";
import type { MigrationRecord, TableRecord } from "../src/types/database";

type ConnectionRow = { current_time: Date; version: string };

async function checkDatabaseStatus(): Promise<void> {
  dbLogger.info("Checking database status...");

  let client: postgres.Sql | null = null;

  try {
    // Validate environment
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    dbLogger.info(
      `Connecting to: ${env.DATABASE_URL.split("@")[1]?.split("/")[0] || "hidden"
      }`
    );

    // Create connection
    client = postgres(env.DATABASE_URL, {
      max: 1,
      connect_timeout: 10,
      ssl:
        env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    // Test basic connectivity
    dbLogger.info("Testing database connection...");
    const [connectionTest] = await client<ConnectionRow[]>`
      SELECT NOW() as current_time, version()
    `;
    dbLogger.success(
      `Connected! Current time: ${connectionTest?.current_time}`
    );
    dbLogger.info(
      `Database version: ${connectionTest?.version?.split(" ")[0]
      } ${connectionTest?.version?.split(" ")[1]}`
    );

    // Check database structure
    dbLogger.info("Checking database structure...");

    const tables = await client<TableRecord[]>`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      dbLogger.warn("No tables found - database may need migration");
    } else {
      dbLogger.success(`Found ${tables.length} tables:`);
      tables.forEach((table) => {
        dbLogger.info(`  - ${table.table_name} (${table.table_type})`);
      });
    }

    // Check migrations
    dbLogger.info("Checking migration status...");
    try {
      const migrations = await client<MigrationRecord[]>`
        SELECT hash, created_at 
        FROM drizzle_migrations 
        ORDER BY created_at DESC 
        LIMIT 10
      `;

      if (migrations.length === 0) {
        dbLogger.warn("No migrations found");
      } else {
        dbLogger.success(
          `Found ${migrations.length} applied migrations (showing last 10):`
        );
        migrations.forEach((migration) => {
          dbLogger.info(`  - ${migration.hash}: ${migration.created_at}`);
        });
      }
    } catch (_error) {
      dbLogger.warn(
        "Migration table not found - may need to run initial migration"
      );
    }

    // Performance check
    dbLogger.info("Running performance check...");
    const start = Date.now();
    await client`SELECT COUNT(*) FROM information_schema.tables`;
    const duration = Date.now() - start;
    dbLogger.success(`Query executed in ${duration}ms`);

    if (duration > 1000) {
      dbLogger.warn(
        "Slow query detected - consider connection pooling optimization"
      );
    }

    dbLogger.success("Database status check completed!");
  } catch (error) {
    dbLogger.logError(error, "Database status check failed");

    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        dbLogger.info("Tip: Check your DATABASE_URL and network connectivity");
      } else if (error.message.includes("authentication")) {
        dbLogger.info("Tip: Check your database credentials");
      } else if (error.message.includes("SSL")) {
        dbLogger.info(
          "Tip: Try adding ?sslmode=require to your DATABASE_URL"
        );
      }
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Handle process signals
process.on("SIGINT", async (): Promise<void> => {
  dbLogger.info("Status check interrupted");
  process.exit(0);
});

// Run status check
if (require.main === module) {
  checkDatabaseStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      dbLogger.logError(error, "Unhandled error");
      process.exit(1);
    });
}
