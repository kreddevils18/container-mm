import { and, ilike, inArray, gte, lte, desc, asc, type SQL } from "drizzle-orm";
import { customers } from "@/drizzle/schema/customers";
import type { CustomerFilters } from "./getCustomers";

export function toWhere(filters: CustomerFilters): SQL<unknown> | undefined {
  const conditions: (SQL<unknown> | undefined)[] = [];

  if (filters.q) {
    conditions.push(ilike(customers.name, `%${filters.q}%`));
  }

  if (filters.status?.length) {
    conditions.push(inArray(customers.status, filters.status));
  }

  if (filters.from) {
    try {
      const fromDate = new Date(filters.from);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(gte(customers.createdAt, fromDate));
      }
    } catch {
      // Invalid date, skip condition
    }
  }

  if (filters.to) {
    try {
      const toDate = new Date(filters.to);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(lte(customers.createdAt, toDate));
      }
    } catch {
      // Invalid date, skip condition
    }
  }

  const validConditions = conditions.filter(Boolean) as SQL<unknown>[];
  
  if (validConditions.length === 0) {
    return undefined;
  }

  return and(...validConditions);
}

export function toOrderBy(sortKey?: string): SQL<unknown> {
  switch (sortKey) {
    case "createdAt.desc":
      return desc(customers.createdAt);
    case "createdAt.asc":
      return asc(customers.createdAt);
    case "name.asc":
      return asc(customers.name);
    case "name.desc":
      return desc(customers.name);
    default:
      return desc(customers.createdAt);
  }
}
