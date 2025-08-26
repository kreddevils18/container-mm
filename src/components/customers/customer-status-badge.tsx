"use client";

import { CheckCircle, XCircle } from "lucide-react";
import type { ReactElement } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export type CustomerStatus = "active" | "inactive";

export interface StatusOption {
  label: string;
  value: CustomerStatus;
  icon: typeof CheckCircle;
}

export const CUSTOMER_STATUS_OPTIONS: StatusOption[] = [
  {
    label: "Hoạt động",
    value: "active",
    icon: CheckCircle,
  },
  {
    label: "Không hoạt động",
    value: "inactive",
    icon: XCircle,
  },
];

export const CustomerStatusBadge = ({ status }: { status: CustomerStatus }): ReactElement => {
  const label = getStatusLabel(status);

  return (
    <StatusBadge
      status={status}
      label={label}
      showIndicator={true}
    />
  );
};

export const getStatusLabel = (status: CustomerStatus): string => {
  const option = CUSTOMER_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
};