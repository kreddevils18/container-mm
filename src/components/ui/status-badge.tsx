import { cva, type VariantProps } from "class-variance-authority";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

const STATUS_CONFIG = {
  active: {
    variant: "default" as const,
    dotColor: "bg-green-400",
    ariaLabel: "Trạng thái hoạt động",
  },
  inactive: {
    variant: "secondary" as const,
    dotColor: "bg-gray-400",
    ariaLabel: "Trạng thái không hoạt động",
  },
  created: {
    variant: "secondary" as const,
    dotColor: "bg-gray-400",
    ariaLabel: "Đã tạo",
  },
  pending: {
    variant: "outline" as const,
    dotColor: "bg-yellow-400",
    ariaLabel: "Chờ xử lý",
  },
  in_progress: {
    variant: "default" as const,
    dotColor: "bg-blue-400",
    ariaLabel: "Đang thực hiện",
  },
  completed: {
    variant: "default" as const,
    dotColor: "bg-green-400",
    ariaLabel: "Hoàn thành",
  },
  cancelled: {
    variant: "destructive" as const,
    dotColor: "bg-red-400",
    ariaLabel: "Đã hủy",
  },

  available: {
    variant: "default" as const,
    dotColor: "bg-green-400",
    ariaLabel: "Có sẵn",
  },
  unavailable: {
    variant: "secondary" as const,
    dotColor: "bg-gray-400",
    ariaLabel: "Không có sẵn",
  },
  maintenance: {
    variant: "outline" as const,
    dotColor: "bg-yellow-400",
    ariaLabel: "Bảo trì",
  },
} as const;

export type StatusType = keyof typeof STATUS_CONFIG;

const statusBadgeVariants = cva("flex items-center gap-1.5", {
  variants: {
    size: {
      default: "text-xs",
      sm: "text-xs",
      lg: "text-sm",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: StatusType | string;
  label: string;
  className?: string;
  showIndicator?: boolean;
  ariaLabel?: string;
}

export function StatusBadge({
  status,
  label,
  className,
  size = "default",
  showIndicator = true,
  ariaLabel,
}: StatusBadgeProps): ReactElement {
  const config = STATUS_CONFIG[status as StatusType] || STATUS_CONFIG.inactive;
  const accessibilityLabel = ariaLabel || config.ariaLabel;

  return (
    <Badge
      variant={config.variant}
      className={cn(statusBadgeVariants({ size }), className)}
      aria-label={accessibilityLabel}
    >
      {showIndicator && (
        <span
          className={cn("h-2 w-2 rounded-full", config.dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </Badge>
  );
}

export function getStatusConfig(status: StatusType) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
}

export function isValidStatus(value: string): value is StatusType {
  return value in STATUS_CONFIG;
}

export { statusBadgeVariants };
