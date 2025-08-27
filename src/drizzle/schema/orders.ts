import { sql } from "drizzle-orm";
import {
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { customers } from "./customers";
import { orderStatusEnum } from "./enums";
import { vehicles } from "./vehicles";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    containerCode: varchar("container_code", { length: 50 }),
    emptyPickupVehicleId: uuid("empty_pickup_vehicle_id").references(
      () => vehicles.id
    ),
    emptyPickupDate: timestamp("empty_pickup_date", { withTimezone: true }),
    emptyPickupStart: varchar("empty_pickup_start", { length: 200 }),
    emptyPickupEnd: varchar("empty_pickup_end", { length: 200 }),
    deliveryVehicleId: uuid("delivery_vehicle_id").references(
      () => vehicles.id
    ),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }),
    deliveryStart: varchar("delivery_start", { length: 200 }),
    deliveryEnd: varchar("delivery_end", { length: 200 }),
    description: text("description"),
    status: orderStatusEnum("status").default("created").notNull(),
    price: decimal("price", { precision: 15, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    searchVectorIdx: index("orders_search_vector_idx").using(
      "gin",
      sql`(
          setweight(to_tsvector('simple', COALESCE(${table.containerCode}, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(${table.description}, '')), 'B')
        )`
    ),
  })
);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  previousStatus: orderStatusEnum("previous_status"),
  newStatus: orderStatusEnum("new_status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
