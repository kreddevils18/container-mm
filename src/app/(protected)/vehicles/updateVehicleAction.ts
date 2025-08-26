"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { UpdateVehicleRequestSchema } from "@/schemas";

export type UpdateVehicleActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    licensePlate?: string[];
    driverName?: string[];
    driverPhone?: string[];
    driverIdCard?: string[];
    status?: string[];
  };
};

export async function updateVehicleAction(
  boundData: { vehicleId: string },
  _prevState: UpdateVehicleActionState,
  formData: FormData
): Promise<UpdateVehicleActionState> {
  const { vehicleId } = boundData;
  if (!vehicleId) {
    return { success: false, error: "ID phương tiện không hợp lệ" };
  }

  const rawFormData = {
    licensePlate: formData.get("licensePlate"),
    driverName: formData.get("driverName"),
    driverPhone: formData.get("driverPhone"),
    driverIdCard: formData.get("driverIdCard"),
    status: formData.get("status"),
  };
  const validatedFields = UpdateVehicleRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin phương tiện không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_APP_URL}/api/vehicles/${vehicleId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          licensePlate: validatedFields.data.licensePlate,
          driverName: validatedFields.data.driverName,
          driverPhone: validatedFields.data.driverPhone,
          driverIdCard: validatedFields.data.driverIdCard,
          status: validatedFields.data.status,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return {
        success: false,
        error: errorData.message || "Đã xảy ra lỗi khi cập nhật phương tiện",
      };
    }

    result = await response.json();
  } catch (_err) {
    return {
      success: false,
      error: "Đã xảy ra lỗi khi cập nhật phương tiện. Vui lòng thử lại.",
    };
  }

  if (result?.success) {
    revalidateTag("vehicles");
    revalidateTag(`vehicle-${vehicleId}`);
    redirect(`/vehicles/${vehicleId}`);
  }

  return {
    success: false,
    error: result?.message || "Cập nhật phương tiện thất bại",
  };
}
