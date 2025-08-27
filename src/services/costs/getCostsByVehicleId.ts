import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { costs, costTypes, db } from "@/drizzle/schema";

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
