import { and, asc, desc, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";
import { logger } from "@/lib/logger";

export const vehicleFilterSchema = z.object({
  q: z.string().optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val))
        return val.filter(
          (v): v is "available" | "unavailable" | "maintenance" =>
            ["available", "unavailable", "maintenance"].includes(v)
        );
      return [val].filter(
        (v): v is "available" | "unavailable" | "maintenance" =>
          ["available", "unavailable", "maintenance"].includes(v)
      );
    }),
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

export type VehicleFilters = z.infer<typeof vehicleFilterSchema>;

export async function getVehicles(params: Record<string, unknown>) {
  noStore();

  const parsed = vehicleFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Vehicle filter validation failed", {
      issues: parsed.error.issues,
      params,
    });
    throw new Error("Invalid vehicle filters");
  }
  const f = parsed.data;

  const where = and(
    f.q
      ? or(
        ilike(vehicles.driverName, `%${f.q}%`),
        ilike(vehicles.licensePlate, `%${f.q}%`),
        ilike(vehicles.driverPhone, `%${f.q}%`)
      )
      : undefined,
    f.status?.length ? inArray(vehicles.status, f.status) : undefined,
    f.from ? gte(vehicles.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(vehicles.createdAt, new Date(f.to)) : undefined
  );

  const [rows, countRow] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(where)
      .orderBy(
        f.sort === "createdAt.desc"
          ? desc(vehicles.createdAt)
          : f.sort === "createdAt.asc"
            ? asc(vehicles.createdAt)
            : f.sort === "driverName.asc"
              ? asc(vehicles.driverName)
              : f.sort === "driverName.desc"
                ? desc(vehicles.driverName)
                : f.sort === "licensePlate.asc"
                  ? asc(vehicles.licensePlate)
                  : f.sort === "licensePlate.desc"
                    ? desc(vehicles.licensePlate)
                    : f.sort === "status.asc"
                      ? asc(vehicles.status)
                      : f.sort === "status.desc"
                        ? desc(vehicles.status)
                        : desc(vehicles.createdAt)
      )
      .limit(f.per_page)
      .offset((f.page - 1) * f.per_page),
    db.select({ count: sql<number>`count(*)` }).from(vehicles).where(where),
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
