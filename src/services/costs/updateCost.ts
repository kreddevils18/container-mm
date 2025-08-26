import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db, costs } from "@/drizzle/schema";
import type { UpdateCostRequest } from "@/schemas/cost";

/**
 * Updates an existing cost entry.
 * 
 * @param costId - The UUID of the cost to update
 * @param costData - The updated cost data
 * @returns Promise resolving to the updated cost
 * @throws Error if cost not found or update fails
 * 
 * @example
 * ```typescript
 * const updatedCost = await updateCost("123e4567-e89b-12d3-a456-426614174000", {
 *   amount: "175000.00",
 *   description: "Updated fuel cost"
 * });
 * ```
 */
export async function updateCost(costId: string, costData: UpdateCostRequest) {
  noStore();

  if (!costId || typeof costId !== "string") {
    throw new Error("ID chi phí không hợp lệ");
  }

  try {
    // Check if cost exists
    const existingCost = await db
      .select({ id: costs.id })
      .from(costs)
      .where(eq(costs.id, costId))
      .limit(1);

    if (!existingCost || existingCost.length === 0) {
      throw new Error("Không tìm thấy chi phí");
    }

    // Update the cost
    const [updatedCost] = await db
      .update(costs)
      .set({
        ...costData,
        costDate: costData.costDate,
        paymentDate: costData.paymentDate || null,
        updatedAt: new Date(),
      })
      .where(eq(costs.id, costId))
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

    if (!updatedCost) {
      throw new Error("Không thể cập nhật chi phí");
    }

    return updatedCost;
  } catch (error) {
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Đã xảy ra lỗi khi cập nhật chi phí"
    );
  }
}