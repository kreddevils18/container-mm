import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";
import type { NewVehicle } from "@/drizzle/schema";

export async function createVehicle(
  data: Omit<NewVehicle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NewVehicle> {
  noStore();
  
  const [newVehicle] = await db
    .insert(vehicles)
    .values({
      licensePlate: data.licensePlate,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      driverIdCard: data.driverIdCard,
      status: data.status || "available",
    })
    .returning();

  if (!newVehicle) {
    throw new Error("Failed to create vehicle");
  }

  return newVehicle;
}