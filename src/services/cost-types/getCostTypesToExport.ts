import { unstable_noStore as noStore } from "next/cache";
import { and, ilike, inArray, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { costTypes } from "@/drizzle/schema/costs";
import { costTypeFilterSchema } from "./getCostTypes";
import { logger } from "@/lib/logger";

export async function getCostTypesToExport(params: Record<string, unknown>) {
  noStore();

  const parsed = costTypeFilterSchema.safeParse(params);
  if (!parsed.success) {
    logger.error("Cost type export filter validation failed", {
      issues: parsed.error.issues,
      params
    });
    throw new Error("Invalid cost type export filters");
  }
  const f = parsed.data;

  const where = and(
    f.q ? ilike(costTypes.name, `%${f.q}%`) : undefined,
    f.category?.length ? inArray(costTypes.category, f.category) : undefined,
    f.status?.length ? inArray(costTypes.status, f.status) : undefined,
    f.from ? gte(costTypes.createdAt, new Date(f.from)) : undefined,
    f.to ? lte(costTypes.createdAt, new Date(f.to)) : undefined,
  );

  // Get all matching records for export (no pagination)
  const rows = await db
    .select({
      id: costTypes.id,
      name: costTypes.name,
      description: costTypes.description,
      category: costTypes.category,
      status: costTypes.status,
      createdAt: costTypes.createdAt,
      updatedAt: costTypes.updatedAt,
    })
    .from(costTypes)
    .where(where)
    .orderBy(
      f.sort === "createdAt.desc" ? desc(costTypes.createdAt)
    : f.sort === "createdAt.asc"  ? asc(costTypes.createdAt)
    : f.sort === "name.asc"       ? asc(costTypes.name)
    : f.sort === "name.desc"      ? desc(costTypes.name)
    : f.sort === "category.asc"   ? asc(costTypes.category)
    : f.sort === "category.desc"  ? desc(costTypes.category)
    :                               desc(costTypes.createdAt)
    );

  return rows;
}