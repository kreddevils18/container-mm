"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { UpdateCustomerRequestSchema } from "@/schemas";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type UpdateCustomerActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    address?: string[];
    phone?: string[];
    taxId?: string[];
    status?: string[];
  };
};

export async function updateCustomerAction(
  boundData: { customerId: string },
  _prevState: UpdateCustomerActionState,
  formData: FormData
): Promise<UpdateCustomerActionState> {
  logger.info("Update customer action started", { customerId: boundData.customerId });

  const { customerId } = boundData;
  if (!customerId) {
    return { success: false, error: "ID khách hàng không hợp lệ" };
  }

  const rawFormData = {
    name: formData.get("name"),
    email: formData.get("email"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    taxId: formData.get("taxId"),
    status: formData.get("status"),
  };
  logger.debug("Processing form data", { rawFormData });

  const validatedFields = UpdateCustomerRequestSchema.safeParse(rawFormData);
  logger.debug("Form validation completed", { success: validatedFields.success });

  if (!validatedFields.success) {
    logger.warn("Form validation failed", { errors: validatedFields.error.flatten().fieldErrors });
    return {
      success: false,
      error: "Thông tin khách hàng không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    logger.info("Making API request", { endpoint: `/api/customers/${customerId}` });
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/customers/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        address: validatedFields.data.address,
        phone: validatedFields.data.phone,
        taxId: validatedFields.data.taxId,
        status: validatedFields.data.status,
      }),
    });

    logger.debug("API response received", { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("API request failed", { errorData });

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi cập nhật khách hàng" };
    }

    result = await response.json();
    logger.info("Customer updated successfully", { result });
  } catch (err) {
    logger.error("Update customer action failed", { error: err });
    return { success: false, error: "Đã xảy ra lỗi khi cập nhật khách hàng. Vui lòng thử lại." };
  }

  if (result?.success) {
    logger.info("Revalidating cache and redirecting", { customerId, path: `/customers/${customerId}` });
    // Revalidate cache tags
    revalidateTag("customers");
    revalidateTag(`customer-${customerId}`);
    redirect(`/customers/${customerId}`);
  }

  return { success: false, error: result?.message || "Cập nhật khách hàng thất bại" };
}