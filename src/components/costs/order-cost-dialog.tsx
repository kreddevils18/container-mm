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
import type { CreateCostRequest, UpdateCostRequest } from "@/schemas/cost";
import type { CostType } from "@/drizzle/schema";
import { CostForm } from "./cost-form";

interface OrderCostDialogProps {
  orderId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  costTypes: CostType[];
  onSuccess?: () => void;
}

export function OrderCostDialog({
  orderId,
  isOpen,
  onOpenChange,
  costTypes,
  onSuccess,
}: OrderCostDialogProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCostRequest | UpdateCostRequest): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/costs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          orderId, // Ensure orderId is set
          vehicleId: undefined, // This is for order costs only
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Đã xảy ra lỗi khi tạo chi phí đơn hàng"
        );
      }

      // Success - close dialog and notify parent
      toast.success("Chi phí đơn hàng đã được tạo thành công");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is already displayed to user via toast
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tạo chi phí đơn hàng. Vui lòng thử lại."
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tạo chi phí đơn hàng</DialogTitle>
          <DialogDescription>
            Thêm chi phí cho đơn hàng này. Vui lòng điền đầy đủ thông tin bên
            dưới.
          </DialogDescription>
        </DialogHeader>

        <CostForm
          orderId={orderId}
          costTypes={orderCostTypes}
          mode="create"
          submitText="Tạo chi phí"
          submitLoadingText="Đang tạo..."
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
