"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type CreateCostRequest,
  CreateCostRequestSchema,
  type UpdateCostRequest,
  UpdateCostRequestSchema,
} from "@/schemas/cost";

interface CostType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

interface CostFormProps {
  orderId?: string;
  defaultValues?: Partial<CreateCostRequest>;
  existingCost?: {
    id: string;
    costTypeId: string;
    amount: string;
    costDate: Date;
    description: string | null;
  };
  costTypes: CostType[];
  action?: (formData: FormData) => void;
  state?: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  onSubmit?: (data: CreateCostRequest | UpdateCostRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText: string;
  submitLoadingText: string;
  mode: "create" | "edit";
}

export const CostForm = ({
  orderId,
  defaultValues,
  existingCost,
  costTypes,
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  submitLoadingText,
  mode,
}: CostFormProps): ReactElement => {
  const costTypeId = useId();
  const amountId = useId();
  const descriptionId = useId();

  const schema =
    mode === "create" ? CreateCostRequestSchema : UpdateCostRequestSchema;

  const initialValues =
    mode === "edit" && existingCost
      ? {
        costTypeId: existingCost.costTypeId,
        amount: existingCost.amount,
        costDate: existingCost.costDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
        paymentDate: existingCost.paymentDate ? existingCost.paymentDate.toISOString().split("T")[0] : "",
        description: existingCost.description || "",
      }
      : {
        orderId: orderId || undefined,
        vehicleId: undefined,
        costTypeId: "",
        amount: "",
        costDate: new Date().toISOString().split("T")[0],
        paymentDate: "",
        description: "",
        ...defaultValues,
      };

  const form = useForm<CreateCostRequest | UpdateCostRequest>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    mode: "onBlur" as const,
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  const handleSubmit = async (
    data: CreateCostRequest | UpdateCostRequest
  ): Promise<void> => {
    if (onSubmit) {
      try {
        await onSubmit(data);
      } catch (_error) {
        // Error handling is done in the parent component
      }
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
        {action && mode === "create" && orderId && (
          <input type="hidden" name="orderId" value={orderId} />
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="costTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="costTypeId">
                  Loại chi phí <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                  name="costTypeId"
                >
                  <FormControl>
                    <SelectTrigger id={costTypeId} className="w-full">
                      <SelectValue placeholder="Chọn loại chi phí" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {costTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {action && (
                  <input type="hidden" name="costTypeId" value={field.value} />
                )}
                <FormMessage />
                {serverFieldErrors?.costTypeId && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.costTypeId.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={amountId}>
                  Số tiền (VND) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={amountId}
                    name="amount"
                    type="text"
                    placeholder="150000.50"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.amount && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.amount.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Ngày phát sinh <span className="text-destructive">*</span>
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(new Date(field.value), "dd MMMM yyyy", {
                            locale: vi,
                          })
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                        field.onChange(dateStr);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
                {action && (
                  <input type="hidden" name="costDate" value={field.value || ""} />
                )}
                <FormMessage />
                {serverFieldErrors?.costDate && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.costDate.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Ngày thanh toán (tùy chọn)
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(new Date(field.value), "dd MMMM yyyy", {
                            locale: vi,
                          })
                        ) : (
                          <span>Chọn ngày thanh toán</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                        field.onChange(dateStr);
                      }}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
                {action && (
                  <input type="hidden" name="paymentDate" value={field.value || ""} />
                )}
                <FormMessage />
                {serverFieldErrors?.paymentDate && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.paymentDate.join(", ")}
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
                  name="description"
                  placeholder="Nhập mô tả chi tiết về chi phí này"
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
