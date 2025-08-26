"use client";

import { Download } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportExcelButtonProps {
  onExport: () => void;
  isExporting?: boolean;
  hasActiveFilters?: boolean;
  exportText?: string;
  exportTextWithFilters?: string;
  exportingText?: string;
  size?: "sm" | "default" | "lg";
  variant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
  className?: string;
  disabled?: boolean;
}

export function ExportExcelButton({
  onExport,
  isExporting = false,
  hasActiveFilters = false,
  exportText = "Xuất Excel",
  exportTextWithFilters = "Xuất Excel (có lọc)",
  exportingText = "Đang xuất...",
  size = "sm",
  variant = "outline",
  className,
  disabled = false,
}: ExportExcelButtonProps): ReactElement {
  const buttonText = isExporting
    ? exportingText
    : hasActiveFilters
      ? exportTextWithFilters
      : exportText;

  const tooltipText = hasActiveFilters
    ? "Xuất Excel với bộ lọc hiện tại"
    : "Xuất tất cả dữ liệu Excel";

  return (
    <Button
      onClick={onExport}
      size={size}
      variant={variant}
      disabled={isExporting || disabled}
      className={cn("gap-2", className)}
      title={tooltipText}
      aria-label={buttonText}
    >
      <Download className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
}
