"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { UpdateCostTypeRequestSchema } from "@/schemas";
import { env } from "@/lib/env";
import { dbLogger as logger } from "@/lib/logger";

export type UpdateCostTypeActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    category?: string[];
    status?: string[];
  };
};

export async function updateCostTypeAction(
  id: string,
  _prevState: UpdateCostTypeActionState,
  formData: FormData
): Promise<UpdateCostTypeActionState> {
  logger.info("Update cost type action started", { id });

  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status"),
  };
  logger.debug("Processing form data", { rawFormData });

  const validatedFields = UpdateCostTypeRequestSchema.safeParse(rawFormData);
  logger.debug("Form validation completed", { success: validatedFields.success });

  if (!validatedFields.success) {
    logger.warn("Form validation failed", { errors: validatedFields.error.flatten().fieldErrors });
    return {
      success: false,
      error: "Thông tin loại chi phí không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    logger.info("Making API request", { endpoint: `/api/costs/types/${id}` });
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/costs/types/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedFields.data),
    });

    logger.debug("API response received", { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("API request failed", { errorData });

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi cập nhật loại chi phí" };
    }

    result = await response.json();
    logger.info("Cost type updated successfully", { result });
  } catch (err) {
    logger.error("Update cost type action failed", { error: err });
    return { success: false, error: "Đã xảy ra lỗi khi cập nhật loại chi phí. Vui lòng thử lại." };
  }

  if (result?.success) {
    logger.info("Revalidating cache and redirecting", { path: "/costs/types" });
    revalidateTag("cost-types");
    redirect("/costs/types");
  }

  return { success: false, error: result?.message || "Cập nhật loại chi phí thất bại" };
}