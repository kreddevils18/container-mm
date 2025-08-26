import { z } from "zod";

export interface MigrationRecord {
  hash: string;
  created_at: string;
  applied_at?: string;
}

export interface ExtendedMigrationRecord extends MigrationRecord {
  name?: string;
  filepath?: string;
  pending: boolean;
  size?: number;
}

export interface TableRecord {
  table_name: string;
  table_type: string;
  table_schema?: string;
  table_comment?: string;
}

export interface ColumnRecord {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  ordinal_position: number;
}

export interface DatabaseStatus {
  connected: boolean;
  version?: string;
  current_time?: string;
  table_count: number;
  migration_count: number;
  response_time_ms: number;
  error?: string;
}

export interface QueryMetrics {
  query: string;
  duration_ms: number;
  row_count: number;
  executed_at: Date;
  success: boolean;
  error?: string;
}

export interface ConstraintRecord {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  column_names: string[];
  referenced_table?: string;
  referenced_columns?: string[];
}

export interface IndexRecord {
  index_name: string;
  table_name: string;
  column_names: string[];
  is_unique: boolean;
  index_type: string;
  size_bytes?: number;
}

export interface BackupRecord {
  backup_id: string;
  created_at: Date;
  size_bytes: number;
  backup_type: "full" | "incremental" | "differential";
  location: string;
  compressed: boolean;
  checksum?: string;
}

export const migrationRecordSchema = z.object({
  hash: z.string().min(1),
  created_at: z.string().datetime(),
  applied_at: z.string().datetime().optional(),
});

export const tableRecordSchema = z.object({
  table_name: z.string().min(1),
  table_type: z.string().min(1),
  table_schema: z.string().optional(),
  table_comment: z.string().optional(),
});

export const databaseStatusSchema = z.object({
  connected: z.boolean(),
  version: z.string().optional(),
  current_time: z.string().optional(),
  table_count: z.number().min(0),
  migration_count: z.number().min(0),
  response_time_ms: z.number().min(0),
  error: z.string().optional(),
});

export type ValidatedMigrationRecord = z.infer<typeof migrationRecordSchema>;

export type ValidatedTableRecord = z.infer<typeof tableRecordSchema>;

export type ValidatedDatabaseStatus = z.infer<typeof databaseStatusSchema>;

export interface DatabaseQueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    duration_ms: number;
    row_count: number;
    executed_at: Date;
  };
}

export interface DatabaseConfig {
  url: string;
  max_connections?: number;
  connect_timeout?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
  options?: Record<string, unknown>;
}

export interface MigrationOptions {
  migrations_folder: string;
  migrations_table?: string;
  use_transaction?: boolean;
  max_concurrent?: number;
  validate_checksums?: boolean;
}

export interface SeedingOptions {
  force?: boolean;
  environment: "development" | "test" | "production";
  seed_files?: string[];
  truncate_first?: boolean;
}

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    connection: boolean;
    migrations: boolean;
    tables: boolean;
    performance: boolean;
  };
  details: {
    connection?: {
      latency_ms: number;
      version: string;
    };
    migrations?: {
      pending_count: number;
      last_migration: string;
    };
    tables?: {
      total_count: number;
      missing_tables: string[];
    };
    performance?: {
      avg_query_time_ms: number;
      slow_queries: number;
    };
  };
  checked_at: Date;
}
