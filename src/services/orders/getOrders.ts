import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { db } from "@/drizzle/client";
import { customers, orders, vehicles } from "@/drizzle/schema";
import { logger } from "@/lib/logger";

export const orderFilterSchema = z.object({
  q: z.string().optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val))
        return val.filter(
          (
            v
          ): v is
            | "created"
            | "pending"
            | "in_progress"
            | "completed"
            | "cancelled" =>
            [
              "created",
              "pending",
              "in_progress",
              "completed",
              "cancelled",
            ].includes(v)
        );
      return [val].filter(
        (
          v
        ): v is
          | "created"
          | "pending"
          | "in_progress"
          | "completed"
          | "cancelled" =>
          [
            "created",
            "pending",
            "in_progress",
            "completed",
            "cancelled",
          ].includes(v)
      );
    }),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.string().optional().default("createdAt.desc"),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 ? 1 : num;
    }),
  per_page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isNaN(num) || num < 1 || num > 100 ? 10 : num;
    }),
});

export type OrderFilters = z.infer<typeof orderFilterSchema>;

export async function getOrders(params: Record<string, unknown>) {
  noStore();

  const parsed = orderFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Order filter validation failed", {
      issues: parsed.error.issues,
      params,
    });
    throw new Error("Invalid order filters");
  }
  const f = parsed.data;

  const where = and(
    f.q
      ? sql`(
      unaccent(${orders.containerCode}) ilike unaccent(${`%${f.q}%`}) OR
      unaccent(${customers.name}) ilike unaccent(${`%${f.q}%`}) OR
      unaccent(${orders.description}) ilike unaccent(${`%${f.q}%`})
    )`
      : undefined,
    f.status?.length ? inArray(orders.status, f.status) : undefined,
    f.customerId ? eq(orders.customerId, f.customerId) : undefined,
    f.vehicleId
      ? sql`(${orders.emptyPickupVehicleId} = ${f.vehicleId} OR ${orders.deliveryVehicleId} = ${f.vehicleId})`
      : undefined,
    f.from ? gte(orders.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(orders.createdAt, new Date(f.to)) : undefined
  );

  const [rows, countRow] = await Promise.all([
    db
      .select({
        id: orders.id,
        containerCode: orders.containerCode,
        customerId: orders.customerId,
        customerName: customers.name,
        emptyPickupVehicleId: orders.emptyPickupVehicleId,
        emptyPickupVehiclePlate: sql<string>`pickup_vehicle.license_plate`,
        deliveryVehicleId: orders.deliveryVehicleId,
        deliveryVehiclePlate: sql<string>`delivery_vehicle.license_plate`,
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
                : f.sort === "status.asc"
                  ? asc(orders.status)
                  : f.sort === "status.desc"
                    ? desc(orders.status)
                    : desc(orders.createdAt)
      )
      .limit(f.per_page)
      .offset((f.page - 1) * f.per_page),

    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(where),
  ]);

  const total = countRow[0]?.count ?? 0;

  return {
    rows,
    pagination: {
      page: f.page,
      perPage: f.per_page,
      total: total,
      totalPages: Math.max(1, Math.ceil(total / f.per_page)),
    },
    filters: f,
  };
}
