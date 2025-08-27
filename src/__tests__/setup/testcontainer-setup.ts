import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

let globalContainer: StartedPostgreSqlContainer | null = null;
let globalDb: ReturnType<typeof drizzle> | null = null;
let globalSql: ReturnType<typeof postgres> | null = null;

const TEST_DB_CONFIG = {
  database: "testdb",
  username: "testuser", 
  password: "testpass",
  port: 5432,
  image: "postgres:16-alpine",
} as const;

export async function setupTestContainer(): Promise<StartedPostgreSqlContainer> {
  if (globalContainer) {
    return globalContainer;
  }

  console.log("🚀 Starting PostgreSQL testcontainer...");

  const container = await new PostgreSqlContainer(TEST_DB_CONFIG.image)
    .withDatabase(TEST_DB_CONFIG.database)
    .withUsername(TEST_DB_CONFIG.username)
    .withPassword(TEST_DB_CONFIG.password)
    .withExposedPorts(TEST_DB_CONFIG.port)
    .withCommand([
      "postgres",
      "-c", "shared_preload_libraries=pg_trgm",
      "-c", "log_statement=all",
      "-c", "log_destination=stderr",
    ])
    .start();

  globalContainer = container;
  
  console.log(`✅ PostgreSQL container started on port ${container.getMappedPort(TEST_DB_CONFIG.port)}`);
  
  return container;
}

export async function setupDatabase(container: StartedPostgreSqlContainer): Promise<{
  db: ReturnType<typeof drizzle>;
  sql: ReturnType<typeof postgres>;
}> {
  if (globalDb && globalSql) {
    return { db: globalDb, sql: globalSql };
  }

  const connectionString = container.getConnectionUri();
  
  console.log("📊 Initializing database connection...");

  const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(sql);

  console.log("🔄 Running database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;

  // Create GIN indexes for full-text search after migrations
  console.log("🔍 Creating search indexes...");
  await sql`
    CREATE INDEX IF NOT EXISTS vehicles_search_idx ON vehicles 
    USING GIN ((
      setweight(to_tsvector('simple', COALESCE(license_plate, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(driver_name, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(driver_phone, '')), 'C')
    ))
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS customers_search_idx ON customers 
    USING GIN ((
      setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(email, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(address, '')), 'C')
    ))
  `;

  globalDb = db;
  globalSql = sql;

  console.log("✅ Database initialized successfully");

  return { db, sql };
}

export async function cleanupTest(_sql: ReturnType<typeof postgres>): Promise<void> {
}

export async function globalCleanup(): Promise<void> {
  console.log("🧹 Cleaning up test environment...");

  if (globalSql) {
    await globalSql.end();
    globalSql = null;
  }

  if (globalDb) {
    globalDb = null;
  }

  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = null;
    console.log("✅ Container stopped successfully");
  }
}

export function getTestConfig(): {
  container: StartedPostgreSqlContainer | null;
  db: ReturnType<typeof drizzle> | null;
  sql: ReturnType<typeof postgres> | null;
} {
  return {
    container: globalContainer,
    db: globalDb,
    sql: globalSql,
  };
}

export async function healthCheck(): Promise<boolean> {
  try {
    if (!globalDb || !globalSql) {
      return false;
    }

    await globalSql`SELECT 1 as health`;
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
}

export async function resetDatabase(): Promise<void> {
  if (!globalDb || !globalSql) {
    throw new Error("Database not initialized");
  }

  console.log("🔄 Resetting database state...");

  await globalSql`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`;
  
  console.log("✅ Database reset completed");
}