import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Truck, Package } from "lucide-react";

interface CostTypeCategoryBadgeProps {
  category: "vehicle" | "order";
}

export const CostTypeCategoryBadge = ({ category }: CostTypeCategoryBadgeProps): ReactElement => {
  const categoryConfig = {
    vehicle: {
      label: "Phương tiện",
      icon: <Truck className="h-3 w-3" />,
      variant: "default" as const,
    },
    order: {
      label: "Đơn hàng",
      icon: <Package className="h-3 w-3" />,
      variant: "secondary" as const,
    },
  };

  const config = categoryConfig[category];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};