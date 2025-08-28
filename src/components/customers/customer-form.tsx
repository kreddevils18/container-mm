"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { logger } from "@/lib/logger";
import {
  type CreateCustomerRequest,
  CreateCustomerRequestSchema,
} from "@/schemas";

type FormValues = z.infer<typeof CreateCustomerRequestSchema>;

const CUSTOMER_STATUS_LABELS = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
} as const;

interface CustomerFormProps {
  defaultValues: CreateCustomerRequest;
  action: (formData: FormData) => void;
  state: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  onSubmit?: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText: string;
  submitLoadingText: string;
}

export const CustomerForm = ({
  defaultValues,
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  submitLoadingText,
}: CustomerFormProps): ReactElement => {
  const taxId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();
  const statusId = useId();
  const form = useForm({
    resolver: zodResolver(CreateCustomerRequestSchema),
    defaultValues: {
      ...defaultValues,
    },
    mode: "onBlur" as const,
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  const handleSubmit = async (data: FormValues): Promise<void> => {
    if (!onSubmit) return;
    try {
      const parsed = CreateCustomerRequestSchema.parse(data);
      await onSubmit(parsed);
    } catch (error) {
      logger.logError(error, "Không thể tạo khách hàng. Vui lòng kiểm tra lại");
      toast.error("Không thể tạo khách hàng. Vui lòng kiểm tra lại");
    }
  };

  const handleCancel = (): void => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy?"
      );
      if (!confirmLeave) return;
    }
    onCancel?.();
  };

  const serverError = state?.error;
  const serverFieldErrors = state?.fieldErrors;

  return (
    <Form {...form}>
      {serverError && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3">
          <div className="text-sm font-medium text-destructive">
            {serverError}
          </div>
        </div>
      )}

      <form
        onSubmit={!action ? form.handleSubmit(handleSubmit) : undefined}
        action={action}
        className="space-y-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="name">
                  Tên khách hàng <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={nameId}
                    placeholder="Nhập tên khách hàng"
                    autoComplete="name"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id={emailId}
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                    value={(field.value as string) ?? ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.email && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.email.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="phone">Số điện thoại</FormLabel>
                <FormControl>
                  <Input
                    id={phoneId}
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    autoComplete="tel"
                    disabled={isLoading}
                    {...field}
                    value={(field.value as string) ?? ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.phone && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.phone.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="taxId">Mã số thuế</FormLabel>
                <FormControl>
                  <Input
                    id={taxId}
                    placeholder="Nhập mã số thuế"
                    disabled={isLoading}
                    {...field}
                    value={(field.value as string) ?? ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.taxId && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.taxId.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="address">
                Địa chỉ <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  id={addressId}
                  placeholder="Nhập địa chỉ chi tiết"
                  disabled={isLoading}
                  {...field}
                  value={(field.value as string) ?? ""}
                />
              </FormControl>
              <FormMessage />
              {serverFieldErrors?.address && (
                <div className="text-sm text-destructive">
                  {serverFieldErrors.address.join(", ")}
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
              <FormLabel htmlFor={statusId}>Trạng thái</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string) ?? "active"}
                disabled={isLoading}
                name="status"
              >
                <FormControl>
                  <SelectTrigger id={statusId}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">
                    {CUSTOMER_STATUS_LABELS.active}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {CUSTOMER_STATUS_LABELS.inactive}
                  </SelectItem>
                </SelectContent>
              </Select>

              {!!action && (
                <Input
                  type="hidden"
                  name="status"
                  value={(field.value as string) ?? "active"}
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
