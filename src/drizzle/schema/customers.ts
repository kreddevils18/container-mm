import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customerStatusEnum } from "./enums";

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 254 }),
  address: varchar("address", { length: 500 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  taxId: varchar("tax_id", { length: 50 }),
  status: customerStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  // Full-text search index with Vietnamese support
  searchVectorIdx: index("customers_search_vector_idx").using(
    "gin",
    sql`(
      setweight(to_tsvector('simple', COALESCE(${table.name}, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(${table.email}, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(${table.address}, '')), 'C')
    )`
  ),
}));