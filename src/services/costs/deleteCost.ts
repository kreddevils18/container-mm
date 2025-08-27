import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { costs, db } from "@/drizzle/schema";

export async function deleteCost(costId: string) {
  noStore();

  if (!costId || typeof costId !== "string") {
    throw new Error("ID chi phí không hợp lệ");
  }

  try {
    // Check if cost exists
    const existingCost = await db
      .select({
        id: costs.id,
        orderId: costs.orderId,
        vehicleId: costs.vehicleId,
      })
      .from(costs)
      .where(eq(costs.id, costId))
      .limit(1);

    if (!existingCost || existingCost.length === 0) {
      throw new Error("Không tìm thấy chi phí");
    }

    // Delete the cost
    await db.delete(costs).where(eq(costs.id, costId));

    return {
      id: costId,
      message: "Chi phí đã được xóa thành công",
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa chi phí"
    );
  }
}
