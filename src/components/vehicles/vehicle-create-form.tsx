"use client";

import type { ReactElement } from "react";

import { VehicleForm } from "./vehicle-form";
import type { CreateVehicleRequest } from "@/schemas/vehicle";

const DEFAULT_VEHICLE_CREATE_DATA: CreateVehicleRequest = {
  licensePlate: "",
  driverName: "",
  driverPhone: "",
  driverIdCard: "",
  status: "available",
};

interface VehicleCreateFormProps {
  /** Server action for form submission */
  action: (formData: FormData) => void;
  /** Server state from form action */
  state: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  /** Client-side submit handler */
  onSubmit?: (data: CreateVehicleRequest) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

export const VehicleCreateForm = ({
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
}: VehicleCreateFormProps): ReactElement => {
  return (
    <VehicleForm
      defaultValues={DEFAULT_VEHICLE_CREATE_DATA}
      action={action}
      state={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitText="Tạo phương tiện"
      submitLoadingText="Đang tạo..."
    />
  );
};