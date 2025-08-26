import { db } from "@/drizzle/client";
import { costTypes } from "@/drizzle/schema/costs";
import type { CreateCostTypeRequest } from "@/schemas/cost-type";
import { logger } from "@/lib/logger";

export async function createCostType(data: CreateCostTypeRequest) {
  try {
    const [newCostType] = await db
      .insert(costTypes)
      .values({
        name: data.name,
        description: data.description || null,
        category: data.category,
        status: data.status || "active",
      })
      .returning();

    return {
      success: true,
      data: newCostType,
      message: "Tạo loại chi phí thành công",
    };
  } catch (error) {
    logger.logError(error, "Failed to create cost type", "createCostType");
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key") || error.message.includes("unique")) {
        return {
          success: false,
          message: "Tên loại chi phí đã tồn tại",
        };
      }
    }

    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo loại chi phí",
    };
  }
}