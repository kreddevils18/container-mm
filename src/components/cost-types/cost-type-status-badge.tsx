import type { ReactElement } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

export type CostTypeStatus = "active" | "inactive";

interface CostTypeStatusBadgeProps {
  status: CostTypeStatus;
}

export const CostTypeStatusBadge = ({ status }: CostTypeStatusBadgeProps): ReactElement => {
  const label = getStatusLabel(status);

  return (
    <StatusBadge
      status={status}
      label={label}
      showIndicator={true}
    />
  );
};

export const getStatusLabel = (status: CostTypeStatus): string => {
  const statusLabels: Record<CostTypeStatus, string> = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
  };

  return statusLabels[status] || status;
};