import {
  date,
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { costTypeStatusEnum, costCategoryEnum } from "./enums";
import { orders } from "./orders";
import { vehicles } from "./vehicles";

export const costTypes = pgTable("cost_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: costCategoryEnum("category").default("vehicle").notNull(),
  status: costTypeStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const costs = pgTable("costs", {
  id: uuid("id").defaultRandom().primaryKey(),
  costTypeId: uuid("cost_type_id")
    .references(() => costTypes.id)
    .notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  orderId: uuid("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  costDate: date("cost_date").notNull(),
  paymentDate: date("payment_date"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
