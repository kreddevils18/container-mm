"use client";

import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  type ReactElement,
  startTransition,
  useActionState,
  useState,
} from "react";
import { deleteVehicleAction } from "@/app/(protected)/vehicles/actions";
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
import type { Vehicle } from "@/drizzle/schema";

interface VehicleActionsProps {
  vehicle: Vehicle;
}

export const VehicleActions = ({
  vehicle,
}: VehicleActionsProps): ReactElement => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const boundDeleteAction = deleteVehicleAction.bind(null, {
    vehicleId: vehicle.id,
  });
  const [deleteState, deleteFormAction, isPending] = useActionState(
    boundDeleteAction,
    { success: false }
  );

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
          <DropdownMenuLabel>Thao tác phương tiện</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/vehicles/${vehicle.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/vehicles/${vehicle.id}/edit`}>
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
            Xóa phương tiện
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xác nhận xóa phương tiện"
        description={
          <>
            Bạn có chắc chắn muốn xóa phương tiện{" "}
            <span className="font-semibold">{vehicle.licensePlate}</span> không?
            {deleteState.error && (
              <div className="mt-2 text-sm text-destructive">
                {deleteState.error}
              </div>
            )}
          </>
        }
        itemName={`${vehicle.licensePlate}`}
        onConfirm={confirmDelete}
        isLoading={isPending}
        confirmText="Xóa phương tiện"
      />
    </>
  );
};
