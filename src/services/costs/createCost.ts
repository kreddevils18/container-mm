import { unstable_noStore as noStore } from "next/cache";
import { costs, db } from "@/drizzle/schema";
import type { CreateCostRequest } from "@/schemas/cost";

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
      error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo chi phí"
    );
  }
}
