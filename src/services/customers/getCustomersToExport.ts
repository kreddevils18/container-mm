import { and, asc, desc, gte, ilike, inArray, lte } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";
import { customerFilterSchema } from "../customers/getCustomers";
import { logger } from "@/lib/logger";

export async function getCustomersToExport(params: Record<string, unknown>) {
  noStore();

  const parsed = customerFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Customer export filter validation failed", {
      issues: parsed.error.issues,
      params
    });
    throw new Error("Invalid customer export filters");
  }
  const f = parsed.data;

  const where = and(
    f.q ? ilike(customers.name, `%${f.q}%`) : undefined,
    f.status?.length ? inArray(customers.status, f.status) : undefined,
    f.from ? gte(customers.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(customers.createdAt, new Date(f.to)) : undefined
  );

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      address: customers.address,
      phone: customers.phone,
      taxId: customers.taxId,
      status: customers.status,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(where)
    .orderBy(
      f.sort === "createdAt.desc"
        ? desc(customers.createdAt)
        : f.sort === "createdAt.asc"
          ? asc(customers.createdAt)
          : f.sort === "name.asc"
            ? asc(customers.name)
            : desc(customers.name)
    );

  return rows;
}
