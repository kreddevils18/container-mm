"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import type { CostType } from "@/drizzle/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateCostRequest } from "@/schemas/cost";
import { CostForm } from "./cost-form";

/**
 * Unified dialog component for creating new costs for both orders and vehicles
 * 
 * Provides a modal interface with form validation and error handling.
 * Automatically closes on successful submission and shows appropriate feedback.
 * Filters cost types by entity category.
 * 
 * @component
 * @example
 * ```tsx
 * <CostCreateDialog
 *   open={isCreateDialogOpen}
 *   onOpenChange={setIsCreateDialogOpen}
 *   entityId="order-123"
 *   entityType="order"
 *   costTypes={costTypes}
 *   onSuccess={handleCostCreated}
 * />
 * ```
 */
interface CostCreateDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Handler for dialog open/close state changes */
  onOpenChange: (open: boolean) => void;
  
  /** ID of the entity (order or vehicle) */
  entityId: string;
  
  /** Type of entity the cost belongs to */
  entityType: "order" | "vehicle";
  
  /** Available cost types for selection */
  costTypes: CostType[];
  
  /** Success callback after cost creation */
  onSuccess?: () => void;
}

export function CostCreateDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  costTypes,
  onSuccess,
}: CostCreateDialogProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCostRequest | import("@/schemas/cost").UpdateCostRequest): Promise<void> => {
    setIsLoading(true);
    
    try {
      const apiEndpoint = entityType === "order" 
        ? `/api/orders/${entityId}/costs`
        : `/api/vehicles/${entityId}/costs`;

      const requestData = {
        ...data,
        ...(entityType === "order" 
          ? { orderId: entityId, vehicleId: undefined }
          : { vehicleId: entityId, orderId: undefined }
        ),
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Đã xảy ra lỗi khi tạo chi phí ${entityType === "order" ? "đơn hàng" : "phương tiện"}`);
      }

      // Success - close dialog and notify parent
      toast.success(`Chi phí ${entityType === "order" ? "đơn hàng" : "phương tiện"} đã được tạo thành công`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : `Đã xảy ra lỗi khi tạo chi phí ${entityType === "order" ? "đơn hàng" : "phương tiện"}. Vui lòng thử lại.`
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

  // Filter cost types to only show relevant ones for the entity type
  const filteredCostTypes = (costTypes || []).filter(
    (type) => type.category === entityType && type.status === "active"
  );

  const dialogTitle = entityType === "order" ? "Tạo chi phí đơn hàng" : "Tạo chi phí phương tiện";
  const dialogDescription = `Thêm chi phí cho ${entityType === "order" ? "đơn hàng" : "phương tiện"} này. Vui lòng điền đầy đủ thông tin bên dưới.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <CostForm
          orderId={entityType === "order" ? entityId : ""}
          costTypes={filteredCostTypes}
          mode="create"
          submitText="Tạo chi phí"
          submitLoadingText="Đang tạo..."
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          defaultValues={{
            ...(entityType === "order" 
              ? { orderId: entityId, vehicleId: undefined }
              : { vehicleId: entityId, orderId: undefined }
            ),
          }}
        />
      </DialogContent>
    </Dialog>
  );
}