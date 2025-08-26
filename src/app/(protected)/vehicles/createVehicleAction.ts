"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { CreateVehicleRequestSchema } from "@/schemas/vehicle";
import { env } from "@/lib/env";

export type CreateVehicleActionState = {
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

export async function createVehicleAction(
  _prevState: CreateVehicleActionState,
  formData: FormData
): Promise<CreateVehicleActionState> {
  // Create vehicle action started

  const rawFormData = {
    licensePlate: formData.get("licensePlate"),
    driverName: formData.get("driverName"),
    driverPhone: formData.get("driverPhone"),
    driverIdCard: formData.get("driverIdCard"),
    status: formData.get("status"),
  };
  // Raw form data processed

  const validatedFields = CreateVehicleRequestSchema.safeParse(rawFormData);
  // Validation completed

  if (!validatedFields.success) {
    // Validation errors logged for debugging
    return {
      success: false,
      error: "Thông tin phương tiện không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    // Making API call to create vehicle
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/vehicles`, {
      method: "POST",
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
    });

    // API Response status logged for debugging

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // API Error response logged for debugging

      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi tạo phương tiện" };
    }

    result = await response.json();
    // API Success response logged for debugging
  } catch (_err) {
    // Create vehicle action error logged for debugging
    return { success: false, error: "Đã xảy ra lỗi khi tạo phương tiện. Vui lòng thử lại." };
  }

  if (result?.success) {
    // Vehicle created successfully, revalidating cache and redirecting to /vehicles
    revalidateTag("vehicles");
    redirect("/vehicles");
  }

  return { success: false, error: result?.message || "Tạo phương tiện thất bại" };
}