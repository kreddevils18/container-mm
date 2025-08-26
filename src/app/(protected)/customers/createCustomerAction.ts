"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { CreateCustomerRequestSchema } from "@/schemas/customer";

export type CreateCustomerActionState = {
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

export async function createCustomerAction(
  _prevState: CreateCustomerActionState,
  formData: FormData
): Promise<CreateCustomerActionState> {
  const rawFormData = {
    name: formData.get("name"),
    email: formData.get("email"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    taxId: formData.get("taxId"),
    status: formData.get("status"),
  };

  const validatedFields = CreateCustomerRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin khách hàng không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/customers`, {
      method: "POST",
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

    // API Response status logged for debugging purposes

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // API Error response logged for debugging purposes

      return {
        success: false,
        error: errorData.message || "Đã xảy ra lỗi khi tạo khách hàng",
      };
    }

    result = await response.json();
    // API Success response logged for debugging purposes
  } catch (_err) {
    // Create customer action error logged for debugging purposes
    return {
      success: false,
      error: "Đã xảy ra lỗi khi tạo khách hàng. Vui lòng thử lại.",
    };
  }

  if (result?.success) {
    // Customer created successfully, revalidating cache and redirecting to /customers
    revalidateTag("customers");
    redirect("/customers");
  }

  return {
    success: false,
    error: result?.message || "Tạo khách hàng thất bại",
  };
}
