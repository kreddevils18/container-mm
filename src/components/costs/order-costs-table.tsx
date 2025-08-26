"use client";

import { Calendar, DollarSign } from "lucide-react";
import type { ReactElement } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCostAmount, formatCostDate } from "@/schemas/cost";
import { OrderCostActions } from "./order-cost-actions";

interface Cost {
  id: string;
  costTypeId: string;
  costTypeName: string;
  costTypeCategory: "vehicle" | "order";
  orderId: string | null;
  vehicleId: string | null;
  amount: string;
  costDate: Date;
  paymentDate?: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CostListProps {
  costs: Cost[];
  isLoading?: boolean;
  onEdit?: (cost: Cost) => void;
  onCostDeleted?: () => void;
  showActions?: boolean;
}

export function OrderCostsTable({
  costs,
  isLoading = false,
  onEdit,
  onCostDeleted,
  showActions = false,
}: CostListProps): ReactElement {

  const calculateTotal = (): string => {
    const total = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    return formatCostAmount(total);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {["loading-1", "loading-2", "loading-3"].map((key) => (
          <div key={key} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        ))}
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
                      {cost.costTypeCategory === "order"
                        ? "Đơn hàng"
                        : "Phương tiện"}
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
                    <OrderCostActions
                      cost={cost}
                      onEdit={onEdit}
                      onCostDeleted={onCostDeleted}
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
