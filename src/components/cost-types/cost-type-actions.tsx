"use client";

import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";
import { toast } from "sonner";
import { deleteCostTypeAction } from "@/app/(protected)/costs/types/actions";
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
import type { CostType } from "@/drizzle/schema";

interface CostTypeActionsProps {
  costType: CostType;
}

export const CostTypeActions = ({
  costType,
}: CostTypeActionsProps): ReactElement => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = (): void => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const result = await deleteCostTypeAction(costType.id);
      if (result.success) {
        toast.success("Đã xóa loại chi phí thành công");
        router.push("/costs/types");
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi xóa loại chi phí");
      }
    } catch (_error) {
      toast.error("Có lỗi xảy ra khi xóa loại chi phí");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
          <DropdownMenuLabel>Thao tác loại chi phí</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/costs/types/${costType.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/costs/types/${costType.id}/edit`}>
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
            Xóa loại chi phí
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Xác nhận xóa loại chi phí"
        description={
          <>
            Bạn có chắc chắn muốn xóa loại chi phí{" "}
            <span className="font-semibold">{costType.name}</span> không?
          </>
        }
        itemName={costType.name}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmText="Xóa loại chi phí"
      />
    </>
  );
};
