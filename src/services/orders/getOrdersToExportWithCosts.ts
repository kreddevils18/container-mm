import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sum,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { costs, costTypes } from "@/drizzle/schema/costs";
import { customers } from "@/drizzle/schema/customers";
import { orders } from "@/drizzle/schema/orders";
import { vehicles } from "@/drizzle/schema/vehicles";
import { logger } from "@/lib/logger";
import { orderFilterSchema } from "./getOrders";

export interface CostTypeForExport {
  id: string;
  name: string;
  category: string;
}

export interface OrderCostAggregation {
  orderId: string;
  costTypeName: string;
  totalAmount: string; // decimal as string
}

export interface OrderExportData {
  id: string;
  containerCode: string | null;
  shippingLine: string | null;
  bookingNumber: string | null;
  oilQuantity: string | null;
  customerName: string;
  emptyPickupVehiclePlate: string | null;
  emptyPickupDriverName: string | null;
  deliveryVehiclePlate: string | null;
  deliveryDriverName: string | null;
  emptyPickupDate: Date | null;
  emptyPickupStart: string | null;
  emptyPickupEnd: string | null;
  deliveryDate: Date | null;
  deliveryStart: string | null;
  deliveryEnd: string | null;
  status: string;
  price: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  costs: Record<string, string>; // cost type name -> total amount
}

/**
 * Get all active order cost types for dynamic column generation
 */
export async function getOrderCostTypes(): Promise<CostTypeForExport[]> {
  noStore();

  const orderCostTypes = await db
    .select({
      id: costTypes.id,
      name: costTypes.name,
      category: costTypes.category,
    })
    .from(costTypes)
    .where(and(eq(costTypes.category, "order"), eq(costTypes.status, "active")))
    .orderBy(asc(costTypes.name));

  return orderCostTypes;
}

/**
 * Get orders with aggregated cost data for export
 * This service includes cost information aggregated by cost type
 */
export async function getOrdersToExportWithCosts(
  params: Record<string, unknown>
) {
  noStore();

  const parsed = orderFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Order export with costs filter validation failed", {
      issues: parsed.error.issues,
      params,
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

  // Get all matching orders for export (no pagination)
  const orderRows = await db
    .select({
      id: orders.id,
      containerCode: orders.containerCode,
      shippingLine: orders.shippingLine,
      bookingNumber: orders.bookingNumber,
      oilQuantity: orders.oilQuantity,
      customerName: customers.name,
      emptyPickupVehiclePlate: emptyPickupVehicle.licensePlate,
      emptyPickupDriverName: emptyPickupVehicle.driverName,
      deliveryVehiclePlate: deliveryVehicle.licensePlate,
      deliveryDriverName: deliveryVehicle.driverName,
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
    .leftJoin(
      emptyPickupVehicle,
      eq(orders.emptyPickupVehicleId, emptyPickupVehicle.id)
    )
    .leftJoin(deliveryVehicle, eq(orders.deliveryVehicleId, deliveryVehicle.id))
    .where(where)
    .orderBy(
      f.sort === "createdAt.desc"
        ? desc(orders.createdAt)
        : f.sort === "createdAt.asc"
          ? asc(orders.createdAt)
          : f.sort === "containerCode.asc"
            ? asc(orders.containerCode)
            : f.sort === "containerCode.desc"
              ? desc(orders.containerCode)
              : f.sort === "price.asc"
                ? asc(orders.price)
                : f.sort === "price.desc"
                  ? desc(orders.price)
                  : desc(orders.createdAt)
    );

  if (orderRows.length === 0) {
    return [];
  }

  // Get order IDs for cost aggregation
  const orderIds = orderRows.map((order) => order.id);

  // Get aggregated costs for all orders, grouped by order and cost type
  const costAggregations = await db
    .select({
      orderId: costs.orderId,
      costTypeName: costTypes.name,
      totalAmount: sum(costs.amount),
    })
    .from(costs)
    .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
    .where(
      and(
        inArray(costs.orderId, orderIds),
        eq(costTypes.category, "order"),
        eq(costTypes.status, "active")
      )
    )
    .groupBy(costs.orderId, costTypes.name);

  // Create a map for quick cost lookup
  const costMap = new Map<string, Record<string, string>>();

  for (const cost of costAggregations) {
    if (!cost.orderId || !cost.costTypeName || !cost.totalAmount) continue;

    if (!costMap.has(cost.orderId)) {
      costMap.set(cost.orderId, {});
    }

    const orderCosts = costMap.get(cost.orderId);
    if (!orderCosts) {
      continue;
    }
    orderCosts[cost.costTypeName] = cost.totalAmount;
  }

  // Combine order data with cost data
  const ordersWithCosts: OrderExportData[] = orderRows.map((order) => ({
    ...order,
    costs: costMap.get(order.id) || {},
  }));

  return ordersWithCosts;
}
