import { unstable_noStore as noStore } from "next/cache";
import { and, ilike, inArray, gte, lte, desc, asc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/drizzle/client";
import { orders } from "@/drizzle/schema/orders";
import { customers } from "@/drizzle/schema/customers";
import { vehicles } from "@/drizzle/schema/vehicles";
import { orderFilterSchema } from "./getOrders";
import { logger } from "@/lib/logger";

/**
 * Get orders data for export without pagination
 * This service reuses the same filtering logic as getOrders but removes pagination
 * to export all matching records
 */
export async function getOrdersToExport(params: Record<string, unknown>) {
  noStore();

  const parsed = orderFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Order export filter validation failed", {
      issues: parsed.error.issues,
      params
    });
    throw new Error("Invalid order export filters");
  }
  const f = parsed.data;

  // Create aliases for vehicles to join both pickup and delivery vehicles
  const emptyPickupVehicle = alias(vehicles, "emptyPickupVehicle");
  const deliveryVehicle = alias(vehicles, "deliveryVehicle");

  const where = and(
    f.q
      ? or(
          ilike(orders.containerCode, `%${f.q}%`),
          ilike(customers.name, `%${f.q}%`)
        )
      : undefined,
    f.status?.length ? inArray(orders.status, f.status) : undefined,
    f.customerId ? eq(orders.customerId, f.customerId) : undefined,
    f.vehicleId 
      ? or(
          eq(orders.emptyPickupVehicleId, f.vehicleId),
          eq(orders.deliveryVehicleId, f.vehicleId)
        )
      : undefined,
    f.from ? gte(orders.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(orders.createdAt, new Date(f.to)) : undefined
  );

  // Get all matching records for export (no pagination)
  const rows = await db
    .select({
      id: orders.id,
      containerCode: orders.containerCode,
      customerName: customers.name,
      emptyPickupVehiclePlate: emptyPickupVehicle.licensePlate,
      deliveryVehiclePlate: deliveryVehicle.licensePlate,
      emptyPickupDate: orders.emptyPickupDate,
      emptyPickupStart: orders.emptyPickupStart,
      emptyPickupEnd: orders.emptyPickupEnd,
      deliveryDate: orders.deliveryDate,
      deliveryStart: orders.deliveryStart,
      deliveryEnd: orders.deliveryEnd,
      status: orders.status,
      price: orders.price,
      description: orders.description,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(emptyPickupVehicle, eq(orders.emptyPickupVehicleId, emptyPickupVehicle.id))
    .leftJoin(deliveryVehicle, eq(orders.deliveryVehicleId, deliveryVehicle.id))
    .where(where)
    .orderBy(
      f.sort === "createdAt.desc" ? desc(orders.createdAt)
    : f.sort === "createdAt.asc"  ? asc(orders.createdAt)
    : f.sort === "containerCode.asc" ? asc(orders.containerCode)
    : f.sort === "containerCode.desc" ? desc(orders.containerCode)
    : f.sort === "price.asc" ? asc(orders.price)
    : f.sort === "price.desc" ? desc(orders.price)
    :                           desc(orders.createdAt)
    );

  return rows;
}