"use client";

import { CheckCircle, XCircle, Wrench } from "lucide-react";
import type { ReactElement } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export type VehicleStatus = "available" | "unavailable" | "maintenance";

export interface StatusOption {
  label: string;
  value: VehicleStatus;
  icon: typeof CheckCircle;
}

export const VEHICLE_STATUS_OPTIONS: StatusOption[] = [
  {
    label: "Có sẵn",
    value: "available",
    icon: CheckCircle,
  },
  {
    label: "Không khả dụng",
    value: "unavailable",
    icon: XCircle,
  },
  {
    label: "Bảo trì",
    value: "maintenance",
    icon: Wrench,
  },
];

export const VehicleStatusBadge = ({ status }: { status: VehicleStatus }): ReactElement => {
  const label = getStatusLabel(status);

  return (
    <StatusBadge
      status={status}
      label={label}
      showIndicator={true}
    />
  );
};

export const getStatusLabel = (status: VehicleStatus): string => {
  const option = VEHICLE_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
};