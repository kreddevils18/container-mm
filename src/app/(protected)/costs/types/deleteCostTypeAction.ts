"use server";

import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import { dbLogger as logger } from "@/lib/logger";

export type DeleteCostTypeActionState = {
  success?: boolean;
  error?: string;
};

export async function deleteCostTypeAction(
  id: string
): Promise<DeleteCostTypeActionState> {
  logger.info("Delete cost type action started", { id });

  if (!id) {
    return {
      success: false,
      error: "ID loại chi phí là bắt buộc",
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    logger.info("Making API request", { endpoint: `/api/costs/types/${id}` });
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/costs/types/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    logger.debug("API response received", { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("API request failed", { errorData });

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi xóa loại chi phí" };
    }

    result = await response.json();
    logger.info("Cost type deleted successfully", { result });
  } catch (err) {
    logger.error("Delete cost type action failed", { error: err });
    return { success: false, error: "Đã xảy ra lỗi khi xóa loại chi phí. Vui lòng thử lại." };
  }

  if (result?.success) {
    logger.info("Revalidating cache after successful deletion", { id });
    revalidateTag("cost-types");
    return { success: true };
  }

  return { success: false, error: result?.message || "Xóa loại chi phí thất bại" };
}