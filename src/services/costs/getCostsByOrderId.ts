import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { costs, costTypes, db } from "@/drizzle/schema";
import { logger } from "@/lib/logger";

export async function getCostsByOrderId(orderId: string) {
  noStore();

  if (!orderId || typeof orderId !== "string") {
    throw new Error("ID đơn hàng không hợp lệ");
  }

  try {
    const orderCosts = await db
      .select({
        id: costs.id,
        costTypeId: costs.costTypeId,
        costTypeName: costTypes.name,
        costTypeCategory: costTypes.category,
        orderId: costs.orderId,
        amount: costs.amount,
        costDate: costs.costDate,
        paymentDate: costs.paymentDate,
        description: costs.description,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
      })
      .from(costs)
      .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
      .where(eq(costs.orderId, orderId))
      .orderBy(costs.costDate, costs.createdAt);

    return orderCosts;
  } catch (error) {
    logger.logError(error, "Error fetching costs for order:", orderId);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi lấy danh sách chi phí"
    );
  }
}
