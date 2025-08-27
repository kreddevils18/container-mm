"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { CreateOrderRequestSchema } from "@/schemas/order";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type CreateOrderActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    customerId?: string[];
    containerCode?: string[];
    shippingLine?: string[];
    bookingNumber?: string[];
    oilQuantity?: string[];
    emptyPickupVehicleId?: string[];
    emptyPickupDate?: string[];
    emptyPickupStart?: string[];
    emptyPickupEnd?: string[];
    deliveryVehicleId?: string[];
    deliveryDate?: string[];
    deliveryStart?: string[];
    deliveryEnd?: string[];
    description?: string[];
    status?: string[];
    price?: string[];
    containers?: string[];
  };
};

export async function createOrderAction(
  _prevState: CreateOrderActionState,
  formData: FormData
): Promise<CreateOrderActionState> {
  logger.info("Create order action started");

  const containersData = formData.get("containers");
  let containers = [];
  
  if (containersData) {
    try {
      containers = JSON.parse(containersData as string);
    } catch {
      containers = [];
    }
  }

  const rawFormData = {
    customerId: formData.get("customerId"),
    containerCode: formData.get("containerCode"),
    shippingLine: formData.get("shippingLine"),
    bookingNumber: formData.get("bookingNumber"),
    oilQuantity: formData.get("oilQuantity"),
    emptyPickupVehicleId: formData.get("emptyPickupVehicleId"),
    emptyPickupDate: formData.get("emptyPickupDate"),
    emptyPickupStart: formData.get("emptyPickupStart"),
    emptyPickupEnd: formData.get("emptyPickupEnd"),
    deliveryVehicleId: formData.get("deliveryVehicleId"),
    deliveryDate: formData.get("deliveryDate"),
    deliveryStart: formData.get("deliveryStart"),
    deliveryEnd: formData.get("deliveryEnd"),
    description: formData.get("description"),
    status: formData.get("status"),
    price: formData.get("price"),
    containers,
  };
  logger.debug("Processing form data", { rawFormData });

  const validatedFields = CreateOrderRequestSchema.safeParse(rawFormData);
  logger.debug("Form validation completed", { success: validatedFields.success });

  if (!validatedFields.success) {
    logger.warn("Form validation failed", { errors: validatedFields.error.flatten().fieldErrors });
    return {
      success: false,
      error: "Thông tin đơn hàng không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    logger.info("Making API request", { endpoint: "/api/orders" });
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: validatedFields.data.customerId,
        containerCode: validatedFields.data.containerCode,
        shippingLine: validatedFields.data.shippingLine,
        bookingNumber: validatedFields.data.bookingNumber,
        oilQuantity: validatedFields.data.oilQuantity,
        emptyPickupVehicleId: validatedFields.data.emptyPickupVehicleId,
        emptyPickupDate: validatedFields.data.emptyPickupDate,
        emptyPickupStart: validatedFields.data.emptyPickupStart,
        emptyPickupEnd: validatedFields.data.emptyPickupEnd,
        deliveryVehicleId: validatedFields.data.deliveryVehicleId,
        deliveryDate: validatedFields.data.deliveryDate,
        deliveryStart: validatedFields.data.deliveryStart,
        deliveryEnd: validatedFields.data.deliveryEnd,
        description: validatedFields.data.description,
        status: validatedFields.data.status,
        price: validatedFields.data.price,
        containers: validatedFields.data.containers,
      }),
    });

    logger.debug("API response received", { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("API request failed", { errorData });

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi tạo đơn hàng" };
    }

    result = await response.json();
    logger.info("Order created successfully", { result });
  } catch (err) {
    logger.error("Create order action failed", { error: err });
    return { success: false, error: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại." };
  }

  if (result?.success) {
    logger.info("Revalidating cache and redirecting", { path: "/orders" });
    revalidateTag("orders");
    redirect("/orders");
  }

  return { success: false, error: result?.message || "Tạo đơn hàng thất bại" };
}