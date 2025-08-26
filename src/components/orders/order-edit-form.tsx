"use client";

import type { ReactElement } from "react";
import { useActionState } from "react";

import { OrderForm } from "./order-form";
import type { Order } from "@/drizzle/schema";
import type { CreateOrderRequest } from "@/schemas/order";
import {
  type UpdateOrderActionState,
  updateOrderAction,
} from "@/app/(protected)/orders/updateOrderAction";

interface OrderEditFormProps {
  order: Order;
  orderId: string;
}

export function OrderEditForm({
  order,
  orderId,
}: OrderEditFormProps): ReactElement {
  const initialState: UpdateOrderActionState = {};
  const [state, formAction] = useActionState(
    updateOrderAction.bind(null, { orderId }),
    initialState
  );

  const defaultValues: CreateOrderRequest = {
    customerId: order.customerId,
    containerCode: order.containerCode || "",
    emptyPickupVehicleId: order.emptyPickupVehicleId || "",
    emptyPickupDate: order.emptyPickupDate
      ? order.emptyPickupDate.toISOString()
      : "",
    emptyPickupStart: order.emptyPickupStart || "",
    emptyPickupEnd: order.emptyPickupEnd || "",
    deliveryVehicleId: order.deliveryVehicleId || "",
    deliveryDate: order.deliveryDate
      ? order.deliveryDate.toISOString()
      : "",
    deliveryStart: order.deliveryStart || "",
    deliveryEnd: order.deliveryEnd || "",
    description: order.description || "",
    status: order.status,
    price: order.price,
  };

  return (
    <OrderForm
      defaultValues={defaultValues}
      action={formAction}
      state={state}
      submitText="Cập nhật"
      submitLoadingText="Đang cập nhật..."
    />
  );
}