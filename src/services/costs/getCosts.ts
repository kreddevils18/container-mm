import { desc, eq, and, inArray, gte, lte, count } from "drizzle-orm";
import { db, costs, costTypes } from "@/drizzle/schema";
import type { Cost } from "@/drizzle/schema";

export interface GetCostsFilters {
  /** Filter by order IDs */
  orderIds?: string[];
  
  /** Filter by vehicle IDs */
  vehicleIds?: string[];
  
  /** Filter by cost type IDs */
  costTypeIds?: string[];
  
  /** Filter by cost type categories */
  categories?: ("order" | "vehicle")[];
  
  /** Date range filter - from date (inclusive) */
  fromDate?: Date;
  
  /** Date range filter - to date (inclusive) */
  toDate?: Date;
  
  /** Pagination - page number (1-based) */
  page?: number;
  
  /** Pagination - items per page */
  per_page?: number;
}

export interface GetCostsResponse {
  costs: Array<Cost & {
    costTypeName: string;
    costTypeCategory: "vehicle" | "order";
  }>;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Get costs with optional filtering and pagination.
 * 
 * Supports filtering by order IDs, vehicle IDs, cost types, categories,
 * and date ranges. Results are ordered by cost date (newest first).
 * 
 * @param filters - Optional filters to apply
 * @returns Promise resolving to paginated costs with metadata
 * 
 * @example
 * ```typescript
 * // Get all costs for specific orders
 * const orderCosts = await getCosts({
 *   orderIds: ["order-1", "order-2"],
 *   categories: ["order"]
 * });
 * 
 * // Get costs with pagination
 * const paginatedCosts = await getCosts({
 *   page: 1,
 *   per_page: 20,
 *   fromDate: new Date("2024-01-01"),
 *   toDate: new Date("2024-12-31")
 * });
 * ```
 */
export async function getCosts(filters: GetCostsFilters = {}): Promise<GetCostsResponse> {
  const {
    orderIds,
    vehicleIds,
    costTypeIds,
    categories,
    fromDate,
    toDate,
    page = 1,
    per_page = 50
  } = filters;

  // Validate pagination parameters
  if (page < 1) throw new Error("Page must be at least 1");
  if (per_page < 1 || per_page > 100) throw new Error("Per page must be between 1 and 100");

  // Build where conditions
  const whereConditions = [];

  if (orderIds && orderIds.length > 0) {
    whereConditions.push(inArray(costs.orderId, orderIds));
  }

  if (vehicleIds && vehicleIds.length > 0) {
    whereConditions.push(inArray(costs.vehicleId, vehicleIds));
  }

  if (costTypeIds && costTypeIds.length > 0) {
    whereConditions.push(inArray(costs.costTypeId, costTypeIds));
  }

  if (categories && categories.length > 0) {
    whereConditions.push(inArray(costTypes.category, categories));
  }

  if (fromDate) {
    const fromDateStr = fromDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    whereConditions.push(gte(costs.costDate, fromDateStr));
  }

  if (toDate) {
    const toDateStr = toDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    whereConditions.push(lte(costs.costDate, toDateStr));
  }

  // Build the where clause
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Calculate offset
  const offset = (page - 1) * per_page;

  try {
    // Get costs with cost type information
    const costsWithTypes = await db
      .select({
        id: costs.id,
        costTypeId: costs.costTypeId,
        orderId: costs.orderId,
        vehicleId: costs.vehicleId,
        amount: costs.amount,
        costDate: costs.costDate,
        paymentDate: costs.paymentDate,
        description: costs.description,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
        costTypeName: costTypes.name,
        costTypeCategory: costTypes.category as "vehicle" | "order",
      })
      .from(costs)
      .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
      .where(whereClause)
      .orderBy(desc(costs.costDate), desc(costs.createdAt))
      .limit(per_page)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ total: count(costs.id) })
      .from(costs)
      .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
      .where(whereClause);
    
    const total = totalResult[0]?.total ?? 0;
    const total_pages = Math.ceil(total / per_page);

    return {
      costs: costsWithTypes,
      total,
      page,
      per_page,
      total_pages,
    };
  } catch (_error) {
    
    throw new Error("Failed to retrieve costs");
  }
}