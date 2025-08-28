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

interface VehicleCostDialogProps {
  vehicleId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  costTypes: CostType[];
  onSuccess?: () => void;
}

export function VehicleCostDialog({
  vehicleId,
  isOpen,
  onOpenChange,
  costTypes,
  onSuccess,
}: VehicleCostDialogProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCostRequest | UpdateCostRequest): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/costs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          vehicleId,
          orderId: undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Đã xảy ra lỗi khi tạo chi phí phương tiện"
        );
      }

      toast.success("Chi phí phương tiện đã được tạo thành công");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tạo chi phí phương tiện. Vui lòng thử lại."
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

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  const vehicleCostTypes = (costTypes || []).filter(
    (type) => type.category === "vehicle" && type.status === "active"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tạo chi phí phương tiện</DialogTitle>
          <DialogDescription>
            Thêm chi phí cho phương tiện này. Vui lòng điền đầy đủ thông tin bên
            dưới.
          </DialogDescription>
        </DialogHeader>

        <CostForm
          orderId=""
          costTypes={vehicleCostTypes}
          mode="create"
          submitText="Tạo chi phí"
          submitLoadingText="Đang tạo..."
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          defaultValues={{
            vehicleId,
            orderId: undefined,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
