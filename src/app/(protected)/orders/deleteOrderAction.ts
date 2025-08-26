"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";

export type DeleteOrderActionState = {
  success?: boolean;
  error?: string;
};

export async function deleteOrderAction(
  boundData: { orderId: string },
  _prevState: DeleteOrderActionState,
  _formData: FormData
): Promise<DeleteOrderActionState> {
  // Delete order action started

  const { orderId } = boundData;
  if (!orderId) {
    return { success: false, error: "ID đơn hàng không hợp lệ" };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    // Making API call to delete order
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // API Response status logged for debugging purposes

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // API Error response logged for debugging purposes

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi xóa đơn hàng" };
    }

    result = await response.json();
    // API Success response logged for debugging purposes
  } catch (_err) {
    // Delete order action error logged for debugging purposes
    return { success: false, error: "Đã xảy ra lỗi khi xóa đơn hàng. Vui lòng thử lại." };
  }

  if (result?.success) {
    // Order deleted successfully, revalidating cache and redirecting to /orders
    // Revalidate cache tags
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    redirect("/orders");
  }

  return { success: false, error: result?.message || "Xóa đơn hàng thất bại" };
}