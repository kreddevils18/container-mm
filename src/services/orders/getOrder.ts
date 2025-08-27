import { eq, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import {
  costs,
  costTypes,
  customers,
  orderContainers,
  orderStatusHistory,
  orders,
  users,
  vehicles,
} from "@/drizzle/schema";

export async function getOrder(id: string) {
  noStore();

  const [order] = await db
    .select({
      id: orders.id,
      containerCode: orders.containerCode,
      shippingLine: orders.shippingLine,
      bookingNumber: orders.bookingNumber,
      oilQuantity: orders.oilQuantity,
      customerId: orders.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerEmail: customers.email,
      customerAddress: customers.address,
      emptyPickupVehicleId: orders.emptyPickupVehicleId,
      emptyPickupVehiclePlate: sql<string>`pickup_vehicle.license_plate`,
      emptyPickupDriverName: sql<string>`pickup_vehicle.driver_name`,
      deliveryVehicleId: orders.deliveryVehicleId,
      deliveryVehiclePlate: sql<string>`delivery_vehicle.license_plate`,
      deliveryDriverName: sql<string>`delivery_vehicle.driver_name`,
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
      sql`${vehicles} AS pickup_vehicle`,
      sql`pickup_vehicle.id = ${orders.emptyPickupVehicleId}`
    )
    .leftJoin(
      sql`${vehicles} AS delivery_vehicle`,
      sql`delivery_vehicle.id = ${orders.deliveryVehicleId}`
    )
    .where(eq(orders.id, id));

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  const orderCosts = await db
    .select({
      id: costs.id,
      costTypeId: costs.costTypeId,
      costTypeName: costTypes.name,
      costTypeCategory: sql<"vehicle" | "order">`${costTypes.category}`,
      orderId: costs.orderId,
      vehicleId: costs.vehicleId,
      amount: costs.amount,
      description: costs.description,
      costDate: costs.costDate,
      paymentDate: costs.paymentDate,
      createdAt: costs.createdAt,
      updatedAt: costs.updatedAt,
    })
    .from(costs)
    .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
    .where(eq(costs.orderId, id))
    .orderBy(costs.createdAt);

  const statusHistory = await db
    .select({
      id: orderStatusHistory.id,
      previousStatus: orderStatusHistory.previousStatus,
      newStatus: orderStatusHistory.newStatus,
      changedBy: orderStatusHistory.changedBy,
      changedByName: users.name,
      changedAt: orderStatusHistory.changedAt,
    })
    .from(orderStatusHistory)
    .leftJoin(users, eq(orderStatusHistory.changedBy, users.id))
    .where(eq(orderStatusHistory.orderId, id))
    .orderBy(orderStatusHistory.changedAt);

  // Get container data (skip if table doesn't exist yet)
  let containers: { containerType: "D2" | "D4" | "R2" | "R4"; quantity: number }[] = [];
  try {
    containers = await db
      .select({
        containerType: orderContainers.containerType,
        quantity: orderContainers.quantity,
      })
      .from(orderContainers)
      .where(eq(orderContainers.orderId, id))
      .orderBy(orderContainers.containerType);
  } catch (_error) {
    // Container data query failed - table may not exist, continuing without container data
  }

  return {
    ...order,
    costs: orderCosts,
    statusHistory,
    containers,
  };
}
