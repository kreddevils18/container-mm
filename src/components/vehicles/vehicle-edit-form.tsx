"use client";

import type { ReactElement } from "react";
import { useActionState } from "react";

import { VehicleForm } from "./vehicle-form";
import type { Vehicle } from "@/drizzle/schema";
import type { CreateVehicleRequest } from "@/schemas/vehicle";
import {
  type UpdateVehicleActionState,
  updateVehicleAction,
} from "@/app/(protected)/vehicles/updateVehicleAction";

interface VehicleEditFormProps {
  vehicle: Vehicle;
  vehicleId: string;
}

export function VehicleEditForm({
  vehicle,
  vehicleId,
}: VehicleEditFormProps): ReactElement {
  const initialState: UpdateVehicleActionState = {};
  const [state, formAction] = useActionState(
    updateVehicleAction.bind(null, { vehicleId }),
    initialState
  );

  const defaultValues: CreateVehicleRequest = {
    licensePlate: vehicle.licensePlate,
    driverName: vehicle.driverName,
    driverPhone: vehicle.driverPhone,
    driverIdCard: vehicle.driverIdCard,
    status: vehicle.status,
  };

  return (
    <VehicleForm
      defaultValues={defaultValues}
      action={formAction}
      state={state}
      submitText="Cập nhật xe"
      submitLoadingText="Đang cập nhật..."
    />
  );
}