"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import type { Cost, CostType } from "@/drizzle/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UpdateCostRequest } from "@/schemas/cost";
import { CostForm } from "./cost-form";

/**
 * Unified dialog component for editing existing costs for both orders and vehicles
 * 
 * Provides a modal interface with form validation and error handling.
 * Automatically closes on successful submission and shows appropriate feedback.
 * Works with the unified cost API.
 * 
 * @component
 * @example
 * ```tsx
 * <CostEditDialog
 *   open={isEditDialogOpen}
 *   onOpenChange={setIsEditDialogOpen}
 *   cost={selectedCost}
 *   costTypes={costTypes}
 *   onSuccess={handleCostUpdated}
 * />
 * ```
 */
interface CostEditDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Handler for dialog open/close state changes */
  onOpenChange: (open: boolean) => void;
  
  /** The cost to edit */
  cost: Cost;
  
  /** Available cost types for selection */
  costTypes: CostType[];
  
  /** Success callback after cost update */
  onSuccess?: () => void;
}

export function CostEditDialog({
  open,
  onOpenChange,
  cost,
  costTypes,
  onSuccess,
}: CostEditDialogProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdateCostRequest): Promise<void> => {
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
        throw new Error(result.message || "Đã xảy ra lỗi khi cập nhật chi phí");
      }

      // Success - close dialog and notify parent
      const entityType = cost.orderId ? "đơn hàng" : "phương tiện";
      toast.success(`Chi phí ${entityType} đã được cập nhật thành công`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Đã xảy ra lỗi khi cập nhật chi phí. Vui lòng thử lại."
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
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);

  // Determine entity type for filtering cost types
  const entityType = cost.orderId ? "order" : "vehicle";
  const filteredCostTypes = (costTypes || []).filter(
    (type) => type.category === entityType && type.status === "active"
  );

  const dialogTitle = entityType === "order" ? "Sửa chi phí đơn hàng" : "Sửa chi phí phương tiện";
  const dialogDescription = `Cập nhật thông tin chi phí cho ${entityType === "order" ? "đơn hàng" : "phương tiện"} này. Vui lòng điền đầy đủ thông tin bên dưới.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <CostForm
          existingCost={{
            id: cost.id,
            costTypeId: cost.costTypeId,
            amount: cost.amount,
            costDate: new Date(cost.costDate),
            paymentDate: cost.paymentDate ? new Date(cost.paymentDate) : undefined,
            description: cost.description,
          }}
          costTypes={filteredCostTypes}
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