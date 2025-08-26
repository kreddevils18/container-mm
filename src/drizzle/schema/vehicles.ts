import {
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { vehicleStatusEnum } from "./enums";

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  licensePlate: varchar("license_plate", { length: 20 }).unique().notNull(),
  driverName: varchar("driver_name", { length: 100 }).notNull(),
  driverPhone: varchar("driver_phone", { length: 20 }).notNull(),
  driverIdCard: varchar("driver_id_card", { length: 20 }).notNull(),
  status: vehicleStatusEnum("status").default("available").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});