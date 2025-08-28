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
import type { CostType } from "@/drizzle/schema";
import { CostForm } from "./cost-form";

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

interface VehicleCostEditDialogProps {
  cost: CostWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  costTypes: CostType[];
  onSuccess?: () => void;
}

export function VehicleCostEditDialog({
  cost,
  isOpen,
  onOpenChange,
  costTypes,
  onSuccess,
}: VehicleCostEditDialogProps): ReactElement | null {
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
          result.message || "Đã xảy ra lỗi khi cập nhật chi phí phương tiện"
        );
      }

      // Success - close dialog and notify parent
      toast.success("Chi phí phương tiện đã được cập nhật thành công");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is already displayed to user via toast/UI
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi cập nhật chi phí phương tiện. Vui lòng thử lại."
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

  // Filter cost types to only show vehicle-related ones
  const vehicleCostTypes = (costTypes || []).filter(
    (type) => type.category === "vehicle" && type.status === "active"
  );

  if (!cost) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sửa chi phí phương tiện</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi phí cho phương tiện này. Vui lòng điền đầy đủ
            thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>

        <CostForm
          existingCost={{
            id: cost.id,
            costTypeId: cost.costTypeId,
            amount: cost.amount,
            costDate: new Date(cost.costDate),
            paymentDate: cost.paymentDate
              ? new Date(cost.paymentDate)
              : null,
            description: cost.description,
          }}
          costTypes={vehicleCostTypes}
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
