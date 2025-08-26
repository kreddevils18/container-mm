"use client";

import type { ReactElement, ReactNode } from "react";
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

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: ReactNode;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  cancelText?: string;
  confirmText?: string;
  loadingText?: string;
  destructive?: boolean;
  className?: string;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title = "Xác nhận xóa",
  description,
  itemName,
  onConfirm,
  isLoading = false,
  cancelText = "Hủy bỏ",
  confirmText = "Xóa",
  loadingText = "Đang xóa...",
  destructive = true,
  className,
}: DeleteConfirmDialogProps): ReactElement => {
  const handleConfirm = async (): Promise<void> => {
    try {
      await onConfirm();
    } catch (_error) {}
  };

  const handleCancel = (): void => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {description}
              <br />
              <br />
              <span className="text-destructive font-medium">
                Hành động này không thể hoàn tác.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            aria-label={itemName ? `${confirmText} ${itemName}` : confirmText}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
