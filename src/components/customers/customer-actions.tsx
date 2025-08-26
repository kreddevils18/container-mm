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
import type { Customer } from "@/drizzle/schema";
import { deleteCustomerAction } from "@/app/(protected)/customers/actions";

interface CustomerActionsProps {
  customer: Customer;
}

export const CustomerActions = ({ customer }: CustomerActionsProps): ReactElement => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Create bound action for this specific customer
  const boundDeleteAction = deleteCustomerAction.bind(null, { customerId: customer.id });
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
          <DropdownMenuLabel>Thao tác khách hàng</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/customers/${customer.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/customers/${customer.id}/edit`}>
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
            Xóa khách hàng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xác nhận xóa khách hàng"
        description={
          <>
            Bạn có chắc chắn muốn xóa khách hàng{" "}
            <span className="font-semibold">{customer.name}</span> không?
            {deleteState.error && (
              <div className="mt-2 text-sm text-destructive">
                {deleteState.error}
              </div>
            )}
          </>
        }
        itemName={customer.name}
        onConfirm={confirmDelete}
        isLoading={isPending}
        confirmText="Xóa khách hàng"
      />
    </>
  );
};
