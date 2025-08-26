import { unstable_noStore as noStore } from "next/cache";
import { db, costs } from "@/drizzle/schema";
import type { CreateCostRequest } from "@/schemas/cost";

/**
 * Creates a new cost entry for an order or vehicle.
 * 
 * @param costData - The cost data to create (must include either orderId or vehicleId)
 * @returns Promise resolving to the created cost
 * @throws Error if creation fails
 * 
 * @example
 * ```typescript
 * // For order cost
 * const orderCost = await createCost({
 *   orderId: "123e4567-e89b-12d3-a456-426614174000",
 *   costTypeId: "456e7890-e89b-12d3-a456-426614174000",
 *   amount: "150000.50",
 *   costDate: "2024-01-15",
 *   description: "Fuel cost for delivery"
 * });
 * 
 * // For vehicle cost
 * const vehicleCost = await createCost({
 *   vehicleId: "123e4567-e89b-12d3-a456-426614174000",
 *   costTypeId: "456e7890-e89b-12d3-a456-426614174000",
 *   amount: "250000.00",
 *   costDate: "2024-01-15",
 *   description: "Vehicle maintenance"
 * });
 * ```
 */
export async function createCost(costData: CreateCostRequest) {
  noStore();

  try {
    const [newCost] = await db
      .insert(costs)
      .values({
        orderId: costData.orderId || null,
        vehicleId: costData.vehicleId || null,
        costTypeId: costData.costTypeId,
        amount: costData.amount,
        costDate: costData.costDate,
        paymentDate: costData.paymentDate || null,
        description: costData.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: costs.id,
        orderId: costs.orderId,
        vehicleId: costs.vehicleId,
        costTypeId: costs.costTypeId,
        amount: costs.amount,
        costDate: costs.costDate,
        paymentDate: costs.paymentDate,
        description: costs.description,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
      });

    if (!newCost) {
      throw new Error("Không thể tạo chi phí mới");
    }

    return newCost;
  } catch (error) {
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Đã xảy ra lỗi khi tạo chi phí"
    );
  }
}