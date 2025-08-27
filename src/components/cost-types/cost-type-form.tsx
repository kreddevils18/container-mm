"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type CreateCostTypeRequest,
  CreateCostTypeRequestSchema,
} from "@/schemas/cost-type";

const COST_TYPE_STATUS_LABELS = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
} as const;

const COST_TYPE_CATEGORY_LABELS = {
  vehicle: "Phương tiện",
  order: "Đơn hàng",
} as const;

interface CostTypeFormProps {
  defaultValues: CreateCostTypeRequest;
  action?: (formData: FormData) => void;
  state?: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  onSubmit?: (data: CreateCostTypeRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText: string;
  submitLoadingText: string;
}

export const CostTypeForm = ({
  defaultValues,
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  submitLoadingText,
}: CostTypeFormProps): ReactElement => {
  const nameId = useId();
  const categoryId = useId();
  const descriptionId = useId();
  const statusId = useId();

  const form = useForm<CreateCostTypeRequest>({
    resolver: zodResolver(CreateCostTypeRequestSchema),
    defaultValues,
    mode: "onBlur" as const,
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  const handleSubmit = async (data: CreateCostTypeRequest): Promise<void> => {
    if (onSubmit) {
      try {
        await onSubmit(data);
      } catch (_error) { }
    }
  };

  const handleCancel = (): void => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy?"
      );
      if (!confirmLeave) {
        return;
      }
    }
    onCancel?.();
  };

  const serverError = state?.error;
  const serverFieldErrors = state?.fieldErrors;

  return (
    <Form {...form}>
      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 mb-4">
          <div className="text-sm text-destructive font-medium">
            {serverError}
          </div>
        </div>
      )}

      <form
        onSubmit={action ? undefined : form.handleSubmit(handleSubmit)}
        action={action}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={nameId}>
                  Tên loại chi phí <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={nameId}
                    placeholder="Nhập tên loại chi phí"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.name && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.name.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="category">
                  Danh mục <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "vehicle"}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger id={categoryId} className="w-full">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vehicle">
                      {COST_TYPE_CATEGORY_LABELS.vehicle}
                    </SelectItem>
                    <SelectItem value="order">
                      {COST_TYPE_CATEGORY_LABELS.order}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {action && (
                  <input
                    type="hidden"
                    name="category"
                    value={field.value || "vehicle"}
                  />
                )}
                <FormMessage />
                {serverFieldErrors?.category && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.category.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={descriptionId}>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  id={descriptionId}
                  placeholder="Nhập mô tả chi tiết về loại chi phí"
                  disabled={isLoading}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
              {serverFieldErrors?.description && (
                <div className="text-sm text-destructive">
                  {serverFieldErrors.description.join(", ")}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="status">Trạng thái</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "active"}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger id={statusId}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">
                    {COST_TYPE_STATUS_LABELS.active}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {COST_TYPE_STATUS_LABELS.inactive}
                  </SelectItem>
                </SelectContent>
              </Select>
              {action && (
                <input
                  type="hidden"
                  name="status"
                  value={field.value || "active"}
                />
              )}
              <FormMessage />
              {serverFieldErrors?.status && (
                <div className="text-sm text-destructive">
                  {serverFieldErrors.status.join(", ")}
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? submitLoadingText : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
