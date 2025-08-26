"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";

export type DeleteCustomerActionState = {
  success?: boolean;
  error?: string;
};

export async function deleteCustomerAction(
  boundData: { customerId: string },
  _prevState: DeleteCustomerActionState,
  _formData: FormData
): Promise<DeleteCustomerActionState> {
  // Delete customer action started

  const { customerId } = boundData;
  if (!customerId) {
    return { success: false, error: "ID khách hàng không hợp lệ" };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    // Making API call to delete customer
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/customers/${customerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // API Response status logged for debugging purposes

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // API Error response logged for debugging purposes

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi xóa khách hàng" };
    }

    result = await response.json();
    // API Success response logged for debugging purposes
  } catch (_err) {
    // Delete customer action error logged for debugging purposes
    return { success: false, error: "Đã xảy ra lỗi khi xóa khách hàng. Vui lòng thử lại." };
  }

  if (result?.success) {
    // Customer deleted successfully, revalidating cache and redirecting to /customers
    // Revalidate cache tags
    revalidateTag("customers");
    revalidateTag(`customer-${customerId}`);
    redirect("/customers");
  }

  return { success: false, error: result?.message || "Xóa khách hàng thất bại" };
}