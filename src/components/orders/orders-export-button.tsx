"use client";

import { type ReactElement, useState } from "react";
import { toast } from "sonner";

import { ExportExcelButton } from "@/components/ui/export-excel-button";

interface OrdersExportButtonProps {
  size?: "sm" | "default" | "lg";
  variant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
  className?: string;
  hasActiveFilters?: boolean;
}

export function OrdersExportButton({
  size = "sm",
  variant = "outline",
  className,
  hasActiveFilters = false,
}: OrdersExportButtonProps): ReactElement {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (): Promise<void> => {
    try {
      setIsExporting(true);

      const searchParams = new URLSearchParams(window.location.search);
      const apiUrl = `/api/orders/export?${searchParams.toString()}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || "Có lỗi xảy ra khi xuất dữ liệu";

        if (response.status === 404) {
          toast.warning("Không có dữ liệu để xuất");
          return;
        }

        throw new Error(errorMessage);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(
        /filename\*?=['"]?([^'";]+)['"]?/
      );
      const fileName =
        fileNameMatch?.[1] ||
        `danh-sach-don-hang-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`;

      link.href = url;
      link.download = decodeURIComponent(fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Đã xuất dữ liệu đơn hàng thành công");
    } catch (_error) {
      toast.error(
        _error instanceof Error
          ? _error.message
          : "Có lỗi xảy ra khi xuất dữ liệu"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportExcelButton
      onExport={handleExport}
      isExporting={isExporting}
      hasActiveFilters={hasActiveFilters}
      exportText="Xuất Excel"
      exportTextWithFilters="Xuất Excel (có lọc)"
      exportingText="Đang xuất..."
      size={size}
      variant={variant}
      {...(className && { className })}
    />
  );
}
