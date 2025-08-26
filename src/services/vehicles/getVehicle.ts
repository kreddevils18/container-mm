import { z } from "zod";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";

export const vehicleIdSchema = z.string().uuid();

export type VehicleId = z.infer<typeof vehicleIdSchema>;

export const getVehicle = unstable_cache(
  async (id: string) => {
    const parsed = vehicleIdSchema.safeParse(id);
    if (!parsed.success) {
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, parsed.data))
      .limit(1);

    if (!vehicle || vehicle.length === 0) {
      throw new Error("Vehicle not found");
    }

    return vehicle[0];
  },
  ["vehicle-detail"],
  {
    tags: ["vehicles"],
    revalidate: 300, // 5 minutes
  }
);

export async function revalidateVehicle(vehicleId: string): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`vehicle-${vehicleId}`);
  revalidateTag("vehicles");
}