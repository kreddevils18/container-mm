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
import { CreateVehicleRequestSchema, type CreateVehicleRequest } from "@/schemas/vehicle";

const VEHICLE_STATUS_LABELS = {
  available: "Có sẵn",
  unavailable: "Không khả dụng",
  maintenance: "Bảo trì",
} as const;

const _DEFAULT_VEHICLE_FORM_DATA: CreateVehicleRequest = {
  licensePlate: "",
  driverName: "",
  driverPhone: "",
  driverIdCard: "",
  status: "available",
};

interface VehicleFormProps {
  /** Initial form data */
  defaultValues: CreateVehicleRequest;
  /** Server action for form submission */
  action?: (formData: FormData) => void;
  /** Server state from form action */
  state?: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  /** Client-side submit handler */
  onSubmit?: (data: CreateVehicleRequest) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Submit button text */
  submitText: string;
  /** Submit button loading text */
  submitLoadingText: string;
}

export const VehicleForm = ({
  defaultValues,
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  submitLoadingText,
}: VehicleFormProps): ReactElement => {
  const licensePlateId = useId();
  const driverNameId = useId();
  const driverPhoneId = useId();
  const driverIdCardId = useId();
  const statusId = useId();

  const form = useForm<CreateVehicleRequest>({
    resolver: zodResolver(CreateVehicleRequestSchema),
    defaultValues,
    mode: "onBlur" as const,
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  const handleSubmit = async (data: CreateVehicleRequest): Promise<void> => {
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
          <div className="text-sm text-destructive font-medium">{serverError}</div>
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
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={licensePlateId}>
                  Biển số xe <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={licensePlateId}
                    name="licensePlate"
                    placeholder="Nhập biển số xe (ví dụ: 30A-12345)"
                    disabled={isLoading}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                    }}
                    value={field.value.toUpperCase()}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.licensePlate && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.licensePlate.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={driverNameId}>
                  Tên tài xế <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={driverNameId}
                    name="driverName"
                    placeholder="Nhập tên tài xế"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.driverName && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.driverName.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={driverPhoneId}>
                  Số điện thoại <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={driverPhoneId}
                    name="driverPhone"
                    placeholder="Nhập số điện thoại (ví dụ: 0901234567)"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.driverPhone && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.driverPhone.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverIdCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="driverIdCard">
                  Số chứng minh thư <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={driverIdCardId}
                    name="driverIdCard"
                    placeholder="Nhập số chứng minh thư (9-12 số)"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.driverIdCard && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.driverIdCard.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="status">Trạng thái</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "available"}
                disabled={isLoading}
                name="status"
              >
                <FormControl>
                  <SelectTrigger id={statusId}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">
                    {VEHICLE_STATUS_LABELS.available}
                  </SelectItem>
                  <SelectItem value="unavailable">
                    {VEHICLE_STATUS_LABELS.unavailable}
                  </SelectItem>
                  <SelectItem value="maintenance">
                    {VEHICLE_STATUS_LABELS.maintenance}
                  </SelectItem>
                </SelectContent>
              </Select>
              {action && (
                <input
                  type="hidden"
                  name="status"
                  value={field.value || "available"}
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