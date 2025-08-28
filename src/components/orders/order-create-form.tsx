"use client";

import type { ReactElement } from "react";

import { OrderForm } from "./order-form";
import type { CreateOrderRequest } from "@/schemas/order";

const DEFAULT_ORDER_CREATE_DATA: CreateOrderRequest = {
  customerId: "",
  containerCode: "",
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
};

interface OrderCreateFormProps {
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
}

export const OrderCreateForm = ({
  action,
  state,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrderCreateFormProps): ReactElement => {
  return (
    <OrderForm
      defaultValues={DEFAULT_ORDER_CREATE_DATA}
      action={action}
      state={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitText="Tạo đơn hàng"
      submitLoadingText="Đang tạo..."
    />
  );
};