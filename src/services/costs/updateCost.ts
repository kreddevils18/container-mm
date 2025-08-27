import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { costs, db } from "@/drizzle/schema";
import type { UpdateCostRequest } from "@/schemas/cost";

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
