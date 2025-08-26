import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";
import type { Vehicle } from "@/drizzle/schema";

export async function updateVehicle(
  id: string,
  data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Vehicle> {
  noStore();
  
  const [updatedVehicle] = await db
    .update(vehicles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
    .returning();

  if (!updatedVehicle) {
    throw new Error("Failed to update vehicle or vehicle not found");
  }

  return updatedVehicle;
}