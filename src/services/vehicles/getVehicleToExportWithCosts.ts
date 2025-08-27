import { unstable_noStore as noStore } from "next/cache";
import { and, eq, sum } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";
import { costs } from "@/drizzle/schema/costs";
import { costTypes } from "@/drizzle/schema/costs";
import { logger } from "@/lib/logger";

export interface CostTypeForExport {
  id: string;
  name: string;
  category: string;
}

export interface VehicleCostAggregation {
  vehicleId: string;
  costTypeName: string;
  totalAmount: string;
}

export interface VehicleExportData {
  id: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  driverIdCard: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  costs: Record<string, string>;
  totalCosts: string;
}

export async function getVehicleCostTypes(): Promise<CostTypeForExport[]> {
  noStore();
  
  const vehicleCostTypes = await db
    .select({
      id: costTypes.id,
      name: costTypes.name,
      category: costTypes.category,
    })
    .from(costTypes)
    .where(
      and(
        eq(costTypes.category, "vehicle"),
        eq(costTypes.status, "active")
      )
    )
    .orderBy(costTypes.name);

  return vehicleCostTypes;
}

export async function getVehicleToExportWithCosts(vehicleId: string): Promise<VehicleExportData | null> {
  noStore();

  if (!vehicleId) {
    logger.error("Vehicle export with costs: vehicleId is required");
    throw new Error("Vehicle ID is required for export");
  }

  const vehicleRows = await db
    .select({
      id: vehicles.id,
      licensePlate: vehicles.licensePlate,
      driverName: vehicles.driverName,
      driverPhone: vehicles.driverPhone,
      driverIdCard: vehicles.driverIdCard,
      status: vehicles.status,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
    })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  if (vehicleRows.length === 0) {
    logger.warn("Vehicle not found for export", { vehicleId });
    return null;
  }

  const vehicle = vehicleRows[0];

  const costAggregations = await db
    .select({
      vehicleId: costs.vehicleId,
      costTypeName: costTypes.name,
      totalAmount: sum(costs.amount),
    })
    .from(costs)
    .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
    .where(
      and(
        eq(costs.vehicleId, vehicleId),
        eq(costTypes.category, "vehicle"),
        eq(costTypes.status, "active")
      )
    )
    .groupBy(costs.vehicleId, costTypes.name);

  const costsMap: Record<string, string> = {};
  let totalCostsNum = 0;
  
  for (const cost of costAggregations) {
    if (!cost.costTypeName || !cost.totalAmount) continue;
    
    costsMap[cost.costTypeName] = cost.totalAmount;
    totalCostsNum += parseFloat(cost.totalAmount);
  }

  if (!vehicle) {
    return null;
  }

  const vehicleWithCosts: VehicleExportData = {
    id: vehicle.id,
    licensePlate: vehicle.licensePlate,
    driverName: vehicle.driverName,
    driverPhone: vehicle.driverPhone,
    driverIdCard: vehicle.driverIdCard,
    status: vehicle.status,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    costs: costsMap,
    totalCosts: totalCostsNum.toFixed(2),
  };

  return vehicleWithCosts;
}