import { unstable_noStore as noStore } from "next/cache";
import { and, ilike, inArray, gte, lte, desc, asc, or } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";
import { vehicleFilterSchema } from "./getVehicles";
import { logger } from "@/lib/logger";

export async function getVehiclesToExport(params: Record<string, unknown>) {
  noStore();

  const parsed = vehicleFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Vehicle export filter validation failed", {
      issues: parsed.error.issues,
      params
    });
    throw new Error("Invalid vehicle export filters");
  }
  const f = parsed.data;

  const where = and(
    f.q ? or(
      ilike(vehicles.driverName, `%${f.q}%`),
      ilike(vehicles.licensePlate, `%${f.q}%`),
      ilike(vehicles.driverPhone, `%${f.q}%`)
    ) : undefined,
    f.status?.length ? inArray(vehicles.status, f.status) : undefined,
    f.from ? gte(vehicles.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(vehicles.createdAt, new Date(f.to)) : undefined,
  );

  const rows = await db
    .select()
    .from(vehicles)
    .where(where)
    .orderBy(
      f.sort === "createdAt.desc" ? desc(vehicles.createdAt)
      : f.sort === "createdAt.asc" ? asc(vehicles.createdAt)  
      : f.sort === "driverName.asc" ? asc(vehicles.driverName)
      : f.sort === "driverName.desc" ? desc(vehicles.driverName)
      : f.sort === "licensePlate.asc" ? asc(vehicles.licensePlate)
      : f.sort === "licensePlate.desc" ? desc(vehicles.licensePlate)
      : f.sort === "status.asc" ? asc(vehicles.status)
      : f.sort === "status.desc" ? desc(vehicles.status)
      : desc(vehicles.createdAt)
    );

  return rows;
}