"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export type DeleteVehicleActionState = {
  success?: boolean;
  error?: string;
};

export async function deleteVehicleAction(
  boundData: { vehicleId: string },
  _prevState: DeleteVehicleActionState,
  _formData: FormData
): Promise<DeleteVehicleActionState> {
  const { vehicleId } = boundData;
  if (!vehicleId) {
    return { success: false, error: "ID phương tiện không hợp lệ" };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_APP_URL}/api/vehicles/${vehicleId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return {
        success: false,
        error: errorData.message || "Đã xảy ra lỗi khi xóa phương tiện",
      };
    }

    result = await response.json();
  } catch (_err) {
    return {
      success: false,
      error: "Đã xảy ra lỗi khi xóa phương tiện. Vui lòng thử lại.",
    };
  }

  if (result?.success) {
    // Vehicle deleted successfully, revalidating cache and redirecting to /vehicles
    revalidateTag("vehicles");
    revalidateTag(`vehicle-${vehicleId}`);
    redirect("/vehicles");
  }

  return {
    success: false,
    error: result?.message || "Xóa phương tiện thất bại",
  };
}
