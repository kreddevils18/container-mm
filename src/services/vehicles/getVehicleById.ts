import type { VehicleSearchResult } from "@/app/api/vehicles/search/route";

/**
 * Client-side service to get vehicle by ID
 */
export async function getVehicleById(id: string): Promise<VehicleSearchResult | null> {
  try {
    const response = await fetch(`/api/vehicles/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}