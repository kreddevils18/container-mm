import { z } from "zod";
import { unstable_noStore as noStore } from "next/cache";
import { and, inArray, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { costTypes } from "@/drizzle/schema/costs";
import { logger } from "@/lib/logger";

export const costTypeFilterSchema = z.object({
  q: z.string().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter((v): v is "vehicle" | "order" => ["vehicle", "order"].includes(v));
    return [val].filter((v): v is "vehicle" | "order" => ["vehicle", "order"].includes(v));
  }),
  status: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter((v): v is "active" | "inactive" => ["active", "inactive"].includes(v));
    return [val].filter((v): v is "active" | "inactive" => ["active", "inactive"].includes(v));
  }),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.string().optional().default("createdAt.desc"),
  page: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val) return 1;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return Number.isNaN(num) || num < 1 ? 1 : num;
  }),
  per_page: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val) return 10;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return Number.isNaN(num) || num < 1 || num > 100 ? 10 : num;
  }),
});

export type CostTypeFilters = z.infer<typeof costTypeFilterSchema>;

export async function getCostTypes(params: Record<string, unknown>) {
  noStore();

  const parsed = costTypeFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Cost type filter validation failed", {
      issues: parsed.error.issues,
      params
    });
    throw new Error("Invalid cost type filters");
  }
  const f = parsed.data;

  const where = and(
    f.q
      ? sql`(
        -- Use new cost types FTS index for fast search
        (
          setweight(to_tsvector('simple', COALESCE(${costTypes.name}, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(${costTypes.description}, '')), 'B')
        ) @@ plainto_tsquery('simple', ${f.q})
      )`
      : undefined,
    f.category?.length ? inArray(costTypes.category, f.category) : undefined,
    f.status?.length ? inArray(costTypes.status, f.status) : undefined,
    f.from ? gte(costTypes.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(costTypes.createdAt, new Date(f.to)) : undefined,
  );

  const [rows, countResult] = await Promise.all([
    db.select().from(costTypes)
      .where(where)
      .orderBy(
        f.sort === "createdAt.desc" ? desc(costTypes.createdAt)
      : f.sort === "createdAt.asc"  ? asc(costTypes.createdAt)
      : f.sort === "name.asc"       ? asc(costTypes.name)
      : f.sort === "name.desc"      ? desc(costTypes.name)
      : f.sort === "category.asc"   ? asc(costTypes.category)
      : f.sort === "category.desc"  ? desc(costTypes.category)
      :                               desc(costTypes.createdAt)
      )
      .limit(f.per_page)
      .offset((f.page - 1) * f.per_page),
    db.select({ count: sql<number>`count(*)` }).from(costTypes).where(where),
  ]);

  const count = countResult[0]?.count ?? 0;

  return {
    rows,
    pagination: {
      page: f.page,
      perPage: f.per_page,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / f.per_page)),
    },
    filters: f,
  };
}