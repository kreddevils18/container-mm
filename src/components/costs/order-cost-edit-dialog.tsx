"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UpdateCostRequest } from "@/schemas/cost";
import { CostForm } from "./cost-form";

interface CostType {
  id: string;
  name: string;
  category: "vehicle" | "order";
  status: "active" | "inactive";
}

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

interface OrderCostEditDialogProps {
  cost: Cost | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  costTypes: CostType[];
  onSuccess?: () => void;
}

export function OrderCostEditDialog({
  cost,
  isOpen,
  onOpenChange,
  costTypes,
  onSuccess,
}: OrderCostEditDialogProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdateCostRequest): Promise<void> => {
    if (!cost) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/costs/${cost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Đã xảy ra lỗi khi cập nhật chi phí đơn hàng"
        );
      }

      // Success - close dialog and notify parent
      toast.success("Chi phí đơn hàng đã được cập nhật thành công");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error already handled through user feedback
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cập nhật chi phí đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Filter cost types to only show order-related ones
  const orderCostTypes = (costTypes || []).filter(
    (type) => type.category === "order" && type.status === "active"
  );

  if (!cost) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sửa chi phí đơn hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi phí cho đơn hàng này. Vui lòng điền đầy đủ
            thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>

        <CostForm
          existingCost={{
            id: cost.id,
            costTypeId: cost.costTypeId,
            amount: cost.amount,
            costDate: cost.costDate,
            paymentDate: cost.paymentDate,
            description: cost.description,
          }}
          costTypes={orderCostTypes}
          mode="edit"
          submitText="Cập nhật chi phí"
          submitLoadingText="Đang cập nhật..."
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
