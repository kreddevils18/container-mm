"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { UpdateOrderRequestSchema } from "@/schemas";

export type UpdateOrderActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    customerId?: string[];
    containerCode?: string[];
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
  };
};

export async function updateOrderAction(
  boundData: { orderId: string },
  _prevState: UpdateOrderActionState,
  formData: FormData
): Promise<UpdateOrderActionState> {
  logger.info("Update order action started", { orderId: boundData.orderId });

  const { orderId } = boundData;
  if (!orderId) {
    return { success: false, error: "ID đơn hàng không hợp lệ" };
  }

  const rawFormData = {
    customerId: formData.get("customerId"),
    containerCode: formData.get("containerCode"),
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
  };
  logger.debug("Processing form data", { rawFormData });

  const validatedFields = UpdateOrderRequestSchema.safeParse(rawFormData);
  logger.debug("Form validation completed", {
    success: validatedFields.success,
  });

  if (!validatedFields.success) {
    logger.warn("Form validation failed", {
      errors: validatedFields.error.flatten().fieldErrors,
    });
    return {
      success: false,
      error: "Thông tin đơn hàng không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    logger.info("Making API request", { endpoint: `/api/orders/${orderId}` });
    const response = await fetch(
      `${env.NEXT_PUBLIC_APP_URL}/api/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: validatedFields.data.customerId,
          containerCode: validatedFields.data.containerCode,
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
        }),
      }
    );

    logger.debug("API response received", {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("API request failed", { errorData });

      return {
        success: false,
        error: errorData.message || "Đã xảy ra lỗi khi cập nhật đơn hàng",
      };
    }

    result = await response.json();
    logger.info("Order updated successfully", { result });
  } catch (err) {
    logger.error("Update order action failed", { error: err });
    return {
      success: false,
      error: "Đã xảy ra lỗi khi cập nhật đơn hàng. Vui lòng thử lại.",
    };
  }

  if (result?.success) {
    logger.info("Revalidating cache and redirecting", {
      orderId,
      path: `/orders/${orderId}`,
    });
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    redirect(`/orders/${orderId}`);
  }

  return {
    success: false,
    error: result?.message || "Cập nhật đơn hàng thất bại",
  };
}
