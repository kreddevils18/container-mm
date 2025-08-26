"use client";

import { AlertCircle, Calendar, DollarSign } from "lucide-react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCostAmount, formatCostDate } from "@/schemas/cost";
import { VehicleCostActions } from "./vehicle-cost-actions";

interface CostWithDetails {
  id: string;
  costTypeId: string;
  costTypeName: string;
  costTypeCategory: "vehicle" | "order";
  vehicleId: string | null;
  orderId: string | null;
  amount: string;
  costDate: string;
  paymentDate?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VehicleCostsTableProps {
  vehicleId: string;
  refreshTrigger?: number;
  onEdit?: (cost: CostWithDetails) => void;
  showActions?: boolean;
}

export function VehicleCostsTable({
  vehicleId,
  refreshTrigger = 0,
  onEdit,
  showActions = false,
}: VehicleCostsTableProps): ReactElement {
  const [costs, setCosts] = useState<CostWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCosts = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/vehicles/${vehicleId}/costs`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Đã xảy ra lỗi khi tải danh sách chi phí"
        );
      }

      setCosts(result.data || []);
    } catch (err) {
      // Error is displayed to user via UI
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định"
      );
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  const handleCostDeleted = (): void => {
    // Refresh the costs list after deletion
    fetchCosts();
  };

  const calculateTotal = (): string => {
    const total = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    return formatCostAmount(total);
  };

  useEffect(() => {
    if (vehicleId) {
      fetchCosts();
    }
  }, [vehicleId, fetchCosts]);

  // Separate effect for refresh trigger
  useEffect(() => {
    if (vehicleId && refreshTrigger > 0) {
      fetchCosts();
    }
  }, [refreshTrigger, vehicleId, fetchCosts]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <div key={key} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={fetchCosts}
            className="text-sm text-primary underline mt-2"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!costs.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có chi phí nào cho phương tiện này
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sử dụng nút "Thêm chi phí" để tạo chi phí mới
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại chi phí</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Ngày phát sinh</TableHead>
              <TableHead>Ngày thanh toán</TableHead>
              <TableHead>Mô tả</TableHead>
              {showActions && (
                <TableHead className="w-[100px]">Thao tác</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{cost.costTypeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cost.costTypeCategory === "vehicle"
                        ? "Phương tiện"
                        : "Đơn hàng"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCostAmount(cost.amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {formatCostDate(cost.costDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {cost.paymentDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {formatCostDate(cost.paymentDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {cost.description || "—"}
                  </p>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <VehicleCostActions
                      cost={cost}
                      onEdit={onEdit}
                      onCostDeleted={handleCostDeleted}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total summary */}
      {costs.length > 1 && (
        <div className="flex justify-end">
          <div className="bg-muted px-4 py-2 rounded-md">
            <p className="text-sm font-medium">
              Tổng cộng:{" "}
              <span className="text-primary">{calculateTotal()}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
