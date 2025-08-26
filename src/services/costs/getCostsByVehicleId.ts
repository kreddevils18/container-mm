import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db, costs, costTypes } from "@/drizzle/schema";

/**
 * Retrieves all costs for a specific vehicle with cost type details.
 * 
 * @param vehicleId - The UUID of the vehicle
 * @returns Promise resolving to array of costs with cost type information
 * @throws Error if vehicleId is invalid or query fails
 * 
 * @example
 * ```typescript
 * const vehicleCosts = await getCostsByVehicleId("123e4567-e89b-12d3-a456-426614174000");
 * console.log(vehicleCosts[0].costTypeName); // "Maintenance"
 * ```
 */
export async function getCostsByVehicleId(vehicleId: string) {
  noStore();

  if (!vehicleId || typeof vehicleId !== "string") {
    throw new Error("ID phương tiện không hợp lệ");
  }

  try {
    const vehicleCosts = await db
      .select({
        id: costs.id,
        costTypeId: costs.costTypeId,
        costTypeName: costTypes.name,
        costTypeCategory: costTypes.category,
        vehicleId: costs.vehicleId,
        amount: costs.amount,
        costDate: costs.costDate,
        paymentDate: costs.paymentDate,
        description: costs.description,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
      })
      .from(costs)
      .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
      .where(eq(costs.vehicleId, vehicleId))
      .orderBy(costs.costDate, costs.createdAt);

    return vehicleCosts;
  } catch (error) {
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Đã xảy ra lỗi khi lấy danh sách chi phí phương tiện"
    );
  }
}