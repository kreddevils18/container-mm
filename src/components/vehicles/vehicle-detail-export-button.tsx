"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { ExportExcelButton } from "@/components/ui/export-excel-button";

interface VehicleDetailExportButtonProps {
  vehicleId: string;
  className?: string;
}

export function VehicleDetailExportButton({
  vehicleId,
  className,
}: VehicleDetailExportButtonProps): ReactElement {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (): Promise<void> => {
    if (!vehicleId) {
      toast.error("Không tìm thấy ID phương tiện");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/export`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      
      let filename = "chi-tiet-phuong-tien.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Xuất dữ liệu phương tiện thành công!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi xuất dữ liệu";
      toast.error(`Lỗi xuất dữ liệu: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ExportExcelButton
      onExport={handleExport}
      isExporting={isExporting}
      exportText="Xuất phương tiện"
      exportingText="Đang xuất..."
      className={className}
      size="sm"
      variant="outline"
    />
  );
}