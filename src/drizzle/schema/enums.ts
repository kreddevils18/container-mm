import { pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "created",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "inactive",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "unavailable",
  "maintenance",
]);

export const userRoleEnum = pgEnum("user_role", ["admin", "driver"]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
]);

export const costCategoryEnum = pgEnum("cost_category", [
  "vehicle",
  "order",
]);

export const costTypeStatusEnum = pgEnum("cost_type_status", [
  "active",
  "inactive",
]);

export const containerTypeEnum = pgEnum("container_type", [
  "D2",
  "D4",
  "R2",
  "R4",
]);