import { eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { costTypes, costs } from "@/drizzle/schema/costs";
import { logger } from "@/lib/logger";

export async function deleteCostType(id: string) {
  try {
    // Check if cost type exists
    const [existingCostType] = await db
      .select()
      .from(costTypes)
      .where(eq(costTypes.id, id))
      .limit(1);

    if (!existingCostType) {
      return {
        success: false,
        message: "Loại chi phí không tồn tại",
      };
    }

    // Check if cost type is being used in any costs
    const [costUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(costs)
      .where(eq(costs.costTypeId, id));

    if (costUsage.count > 0) {
      return {
        success: false,
        message: "Không thể xóa loại chi phí đang được sử dụng",
      };
    }

    // Delete the cost type
    await db
      .delete(costTypes)
      .where(eq(costTypes.id, id));

    return {
      success: true,
      message: "Xóa loại chi phí thành công",
    };
  } catch (error) {
    logger.logError(error, "Failed to delete cost type", "deleteCostType");
    
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xóa loại chi phí",
    };
  }
}