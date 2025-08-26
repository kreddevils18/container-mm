import { and, asc, desc, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";
import { logger } from "@/lib/logger";

export const customerFilterSchema = z.object({
  q: z.string().optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val))
        return val.filter((v): v is "active" | "inactive" =>
          ["active", "inactive"].includes(v)
        );
      return [val].filter((v): v is "active" | "inactive" =>
        ["active", "inactive"].includes(v)
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

export type CustomerFilters = z.infer<typeof customerFilterSchema>;

export async function getCustomers(
  params: Record<string, string | string[] | undefined>
) {
  noStore();

  const parsed = customerFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Customer filter validation failed", {
      issues: parsed.error.issues,
      params,
    });
    throw new Error("Invalid customer filters");
  }
  const f = parsed.data;

  const where = and(
    f.q ? ilike(customers.name, `%${f.q}%`) : undefined,
    f.status?.length ? inArray(customers.status, f.status) : undefined,
    f.from ? gte(customers.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(customers.createdAt, new Date(f.to)) : undefined
  );

  const [rows, countRows] = await Promise.all([
    db
      .select()
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
      )
      .limit(f.per_page)
      .offset((f.page - 1) * f.per_page),
    db.select({ count: sql<number>`count(*)` }).from(customers).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;

  return {
    rows,
    pagination: {
      page: f.page,
      perPage: f.per_page,
      total,
      totalPages: Math.max(1, Math.ceil(total / f.per_page)),
    },
    filters: f,
  };
}
