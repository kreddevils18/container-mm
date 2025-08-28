"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { CustomerCombobox } from "@/components/customers/customer-combobox";
import { VehicleCombobox } from "@/components/vehicles/vehicle-combobox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ContainerSelector } from "./container-selector";
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
  type CreateOrderRequest,
  CreateOrderRequestSchema,
  ORDER_STATUS_LABELS,
} from "@/schemas/order";

const _DEFAULT_ORDER_FORM_DATA: CreateOrderRequest = {
  customerId: "",
  containerCode: "",
  shippingLine: "",
  bookingNumber: "",
  oilQuantity: "",
  emptyPickupVehicleId: "",
  emptyPickupDate: "",
  emptyPickupStart: "",
  emptyPickupEnd: "",
  deliveryVehicleId: "",
  deliveryDate: "",
  deliveryEnd: "",
  description: "",
  status: "created",
  price: "0",
  containers: [],
};

interface OrderFormProps {
  /** Initial form data */
  defaultValues: CreateOrderRequest;
  /** Server action for form submission */
  action?: (formData: FormData) => void;
  /** Server state from form action */
  state?: {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  };
  /** Client-side submit handler */
  onSubmit?: (data: CreateOrderRequest) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Submit button text */
  submitText: string;
  /** Submit button loading text */
  submitLoadingText: string;
}

export const OrderForm = ({
  defaultValues,
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText,
  submitLoadingText,
}: OrderFormProps): ReactElement => {
  const containerCodeId = useId();
  const shippingLineId = useId();
  const bookingNumberId = useId();
  const oilQuantityId = useId();
  const priceId = useId();
  const emptyPickupStartId = useId();
  const emptyPickupEndId = useId();
  const deliveryEndId = useId();
  const descriptionId = useId();
  const statusId = useId();
  
  const form = useForm<CreateOrderRequest>({
    resolver: zodResolver(CreateOrderRequestSchema),
    defaultValues,
    mode: "onBlur" as const,
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  const handleSubmit = async (data: CreateOrderRequest): Promise<void> => {
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
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="customerId">
                  Khách hàng <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <CustomerCombobox
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Chọn khách hàng..."
                    disabled={isLoading}
                    width="100%"
                  />
                </FormControl>
                {action && (
                  <Input
                    type="hidden"
                    name="customerId"
                    value={field.value || ""}
                  />
                )}
                <FormMessage />
                {serverFieldErrors?.customerId && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.customerId.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

        </div>

        {/* Container Code, Shipping Line, Booking Number */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="containerCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={containerCodeId}>Mã container</FormLabel>
                <FormControl>
                  <Input
                    id={containerCodeId}
                    name="containerCode"
                    placeholder="Nhập mã container"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.containerCode && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.containerCode.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={shippingLineId}>Hãng tàu</FormLabel>
                <FormControl>
                  <Input
                    id={shippingLineId}
                    name="shippingLine"
                    placeholder="Nhập hãng tàu"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.shippingLine && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.shippingLine.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bookingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={bookingNumberId}>Số booking</FormLabel>
                <FormControl>
                  <Input
                    id={bookingNumberId}
                    name="bookingNumber"
                    placeholder="Nhập số booking"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.bookingNumber && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.bookingNumber.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Oil Quantity and Price */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="oilQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={oilQuantityId}>Số dầu (lít)</FormLabel>
                <FormControl>
                  <Input
                    id={oilQuantityId}
                    name="oilQuantity"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.oilQuantity && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.oilQuantity.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={priceId}>
                  Giá tiền <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id={priceId}
                    name="price"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.price && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.price.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Container Management */}
        <FormField
          control={form.control}
          name="containers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Container</FormLabel>
              <FormControl>
                <ContainerSelector
                  value={field.value || []}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              {action && (
                <Input
                  type="hidden"
                  name="containers"
                  value={JSON.stringify(field.value || [])}
                />
              )}
              <FormMessage />
              {serverFieldErrors?.containers && (
                <div className="text-sm text-destructive">
                  {serverFieldErrors.containers.join(", ")}
                </div>
              )}
            </FormItem>
          )}
        />

        {/* Empty Pickup Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium">Thông tin lấy rỗng</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="emptyPickupVehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="emptyPickupVehicleId">
                    Xe lấy rỗng
                  </FormLabel>
                  <FormControl>
                    <VehicleCombobox
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn xe lấy rỗng..."
                      disabled={isLoading}
                      width="100%"
                    />
                  </FormControl>
                  {action && (
                    <Input
                      type="hidden"
                      name="emptyPickupVehicleId"
                      value={field.value || ""}
                    />
                  )}
                  <FormMessage />
                  {serverFieldErrors?.emptyPickupVehicleId && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.emptyPickupVehicleId.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emptyPickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày lấy rỗng</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Chọn ngày lấy rỗng..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  {action && (
                    <Input
                      type="hidden"
                      name="emptyPickupDate"
                      value={field.value || ""}
                    />
                  )}
                  <FormMessage />
                  {serverFieldErrors?.emptyPickupDate && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.emptyPickupDate.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="emptyPickupStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={emptyPickupStartId}>
                    Điểm đầu lấy rỗng
                  </FormLabel>
                  <FormControl>
                    <Input
                      id={emptyPickupStartId}
                      name="emptyPickupStart"
                      placeholder="Nhập điểm đầu"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {serverFieldErrors?.emptyPickupStart && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.emptyPickupStart.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emptyPickupEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={emptyPickupEndId}>
                    Điểm cuối lấy rỗng
                  </FormLabel>
                  <FormControl>
                    <Input
                      id={emptyPickupEndId}
                      name="emptyPickupEnd"
                      placeholder="Nhập điểm cuối"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {serverFieldErrors?.emptyPickupEnd && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.emptyPickupEnd.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Delivery Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium">Thông tin hạ hàng</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="deliveryVehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="deliveryVehicleId">Xe hạ hàng</FormLabel>
                  <FormControl>
                    <VehicleCombobox
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Chọn xe hạ hàng..."
                      disabled={isLoading}
                      width="100%"
                    />
                  </FormControl>
                  {action && (
                    <Input
                      type="hidden"
                      name="deliveryVehicleId"
                      value={field.value || ""}
                    />
                  )}
                  <FormMessage />
                  {serverFieldErrors?.deliveryVehicleId && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.deliveryVehicleId.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày hạ hàng</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Chọn ngày hạ hàng..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  {action && (
                    <Input
                      type="hidden"
                      name="deliveryDate"
                      value={field.value || ""}
                    />
                  )}
                  <FormMessage />
                  {serverFieldErrors?.deliveryDate && (
                    <div className="text-sm text-destructive">
                      {serverFieldErrors.deliveryDate.join(", ")}
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="deliveryEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={deliveryEndId}>Điểm hạ hàng</FormLabel>
                <FormControl>
                  <Input
                    id={deliveryEndId}
                    name="deliveryEnd"
                    placeholder="Nhập điểm hạ hàng"
                    disabled={isLoading}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
                {serverFieldErrors?.deliveryEnd && (
                  <div className="text-sm text-destructive">
                    {serverFieldErrors.deliveryEnd.join(", ")}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Description and Status */}
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
                  placeholder="Nhập mô tả chi tiết..."
                  rows={4}
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
              <FormLabel htmlFor={statusId}>Trạng thái</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "created"}
                disabled={isLoading}
                name="status"
              >
                <FormControl>
                  <SelectTrigger id={statusId}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {action && (
                <Input
                  type="hidden"
                  name="status"
                  value={field.value || "created"}
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
