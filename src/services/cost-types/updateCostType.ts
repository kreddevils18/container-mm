import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { costTypes } from "@/drizzle/schema/costs";
import type { UpdateCostTypeRequest } from "@/schemas/cost-type";
import { logger } from "@/lib/logger";

export async function updateCostType(id: string, data: UpdateCostTypeRequest) {
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

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, string | Date | null> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedCostType] = await db
      .update(costTypes)
      .set(updateData)
      .where(eq(costTypes.id, id))
      .returning();

    return {
      success: true,
      data: updatedCostType,
      message: "Cập nhật loại chi phí thành công",
    };
  } catch (error) {
    logger.logError(error, "Failed to update cost type", "updateCostType");
    
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
      message: "Đã xảy ra lỗi khi cập nhật loại chi phí",
    };
  }
}