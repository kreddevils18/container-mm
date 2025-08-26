"use client";

import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCostAmount } from "@/schemas/cost";

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

interface OrderCostActionsProps {
  cost: Cost;
  onEdit?: (cost: Cost) => void;
  onCostDeleted?: () => void;
}

export function OrderCostActions({
  cost,
  onEdit,
  onCostDeleted,
}: OrderCostActionsProps): ReactElement {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCostId, setDeletingCostId] = useState<string | null>(null);

  const handleEdit = (): void => {
    onEdit?.(cost);
  };

  const handleDelete = (): void => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async (): Promise<void> => {
    setDeletingCostId(cost.id);
    setShowDeleteDialog(false);

    try {
      const response = await fetch(`/api/costs/${cost.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đã xảy ra lỗi khi xóa chi phí");
      }

      toast.success("Chi phí đã được xóa thành công");
      onCostDeleted?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi xóa chi phí. Vui lòng thử lại."
      );
    } finally {
      setDeletingCostId(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Mở menu thao tác</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Thao tác chi phí</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onEdit && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled={deletingCostId === cost.id}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deletingCostId === cost.id ? "Đang xóa..." : "Xóa chi phí"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa chi phí</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chi phí "
              {cost.costTypeName}" với số tiền{" "}
              {formatCostAmount(cost.amount)}? Thao tác này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingCostId === cost.id ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}