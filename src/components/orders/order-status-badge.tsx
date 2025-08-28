import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/schemas";

interface OrderStatusBadgeProps {
  status: keyof typeof ORDER_STATUS_LABELS;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps): ReactElement {
  const getVariant = (status: keyof typeof ORDER_STATUS_LABELS) => {
    switch (status) {
      case "created":
        return "secondary";
      case "pending":
        return "outline";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Badge variant={getVariant(status)}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}