"use client";

import { AlertCircle, Calendar, DollarSign } from "lucide-react";
import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Cost, CostType } from "@/drizzle/schema";
import { formatCostAmount, formatCostDate } from "@/schemas/cost";
import { Button } from "../ui/button";
import { CostActions } from "./cost-actions";

interface CostTableProps {
  costs: Cost[];
  costTypes: CostType[];
  entityId: string;
  entityType: "order" | "vehicle";
  isLoading?: boolean;
  error?: string | null;
  showActions?: boolean;
  onEdit?: (cost: Cost) => void;
  onDelete?: () => void;
  onRetry?: () => void;
}

export function CostTable({
  costs,
  costTypes,
  entityId,
  entityType,
  isLoading = false,
  error = null,
  showActions = false,
  onEdit,
  onDelete,
  onRetry,
}: CostTableProps): ReactElement {
  const calculateTotal = (): string => {
    const total = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    return formatCostAmount(total);
  };

  const calculatePaidAmount = (): string => {
    const paid = costs
      .filter((cost) => cost.paymentDate)
      .reduce((sum, cost) => sum + Number(cost.amount), 0);
    return formatCostAmount(paid);
  };

  const calculateUnpaidAmount = (): string => {
    const unpaid = costs
      .filter((cost) => !cost.paymentDate)
      .reduce((sum, cost) => sum + Number(cost.amount), 0);
    return formatCostAmount(unpaid);
  };

  const getCostTypeName = (costTypeId: string): string => {
    const costType = costTypes.find((ct) => ct.id === costTypeId);
    return costType?.name || "Không xác định";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <div key={key} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            {showActions && <Skeleton className="h-4 w-20" />}
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
          <p className="text-sm text-destructive mb-2">{error}</p>
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="text-sm text-primary underline"
            >
              Thử lại
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (costs.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          Chưa có chi phí nào được ghi nhận
        </p>
      </div>
    );
  }

  const paidCosts = costs.filter((cost) => cost.paymentDate);
  const unpaidCosts = costs.filter((cost) => !cost.paymentDate);

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
                    <p className="font-medium">
                      {getCostTypeName(cost.costTypeId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entityType === "order" ? "Đơn hàng" : "Phương tiện"}
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
                      <Calendar className="h-3 w-3 text-green-600" />
                      <span className="text-sm text-green-600">
                        {formatCostDate(cost.paymentDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium">
                      Chưa thanh toán
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {cost.description || "—"}
                  </p>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <CostActions
                      cost={cost}
                      entityId={entityId}
                      entityType={entityType}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {costs.length > 0 && (
        <div className="space-y-2">
          {paidCosts.length > 0 && unpaidCosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-md">
                <p className="text-sm">
                  <span className="text-green-700 font-medium">
                    Đã thanh toán ({paidCosts.length}):
                  </span>{" "}
                  <span className="text-green-800 font-semibold">
                    {calculatePaidAmount()}
                  </span>
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
                <p className="text-sm">
                  <span className="text-amber-700 font-medium">
                    Chưa thanh toán ({unpaidCosts.length}):
                  </span>{" "}
                  <span className="text-amber-800 font-semibold">
                    {calculateUnpaidAmount()}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-md">
              <p className="text-sm">
                <span className="font-medium text-primary/80">
                  Tổng cộng ({costs.length} chi phí):
                </span>{" "}
                <span className="text-primary font-bold text-base">
                  {calculateTotal()}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
