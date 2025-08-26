"use client";

import { useState, type ReactElement } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CustomersExportButtonProps {
  size?: "sm" | "default" | "lg";
  variant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
  className?: string;
}

export function CustomersExportButton({
  size = "sm",
  variant = "outline",
  className,
}: CustomersExportButtonProps): ReactElement {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (): Promise<void> => {
    try {
      setIsExporting(true);

      // Get current search parameters to maintain filtering
      const searchParams = new URLSearchParams(window.location.search);
      const apiUrl = `/api/customers/export?${searchParams.toString()}`;

      // Make API call to server-side export endpoint
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Có lỗi xảy ra khi xuất dữ liệu";
        
        if (response.status === 404) {
          toast.warning("Không có dữ liệu để xuất");
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Get the Excel file as blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      const fileNameMatch = contentDisposition?.match(/filename\*?=['"]?([^'";]+)['"]?/);
      const fileName = fileNameMatch?.[1] || `danh-sach-khach-hang-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`;
      
      link.download = decodeURIComponent(fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Đã xuất dữ liệu khách hàng thành công");
    } catch (error) {
      // Export error logged for debugging
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi xuất dữ liệu");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  );
}
