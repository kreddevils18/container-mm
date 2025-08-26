"use client";

import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { type ReactElement, useState, useActionState } from "react";
import { startTransition } from "react";
import Link from "next/link";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderRow } from "./order-columns";
import { deleteOrderAction } from "@/app/(protected)/orders/deleteOrderAction";

interface OrderActionsProps {
  order: OrderRow;
}

export const OrderActions = ({ order }: OrderActionsProps): ReactElement => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Create bound action for this specific order
  const boundDeleteAction = deleteOrderAction.bind(null, { orderId: order.id });
  const [deleteState, deleteFormAction, isPending] = useActionState(boundDeleteAction, { success: false });

  const handleDelete = (): void => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async (): Promise<void> => {
    startTransition(() => {
      const formData = new FormData();
      deleteFormAction(formData);
    });
    setShowDeleteDialog(false);
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
          <DropdownMenuLabel>Thao tác đơn hàng</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa đơn hàng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xác nhận xóa đơn hàng"
        description={
          <>
            Bạn có chắc chắn muốn xóa đơn hàng{" "}
            <span className="font-semibold">{order.containerCode || order.id.slice(-8)}</span> không?
            {deleteState.error && (
              <div className="mt-2 text-sm text-destructive">
                {deleteState.error}
              </div>
            )}
          </>
        }
        itemName={order.containerCode || order.id.slice(-8)}
        onConfirm={confirmDelete}
        isLoading={isPending}
        confirmText="Xóa đơn hàng"
      />
    </>
  );
};