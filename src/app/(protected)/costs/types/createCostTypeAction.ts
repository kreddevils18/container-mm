"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { CreateCostTypeRequestSchema } from "@/schemas/cost-type";
import { env } from "@/lib/env";

export type CreateCostTypeActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    category?: string[];
    status?: string[];
  };
};

export async function createCostTypeAction(
  _prevState: CreateCostTypeActionState,
  formData: FormData
): Promise<CreateCostTypeActionState> {

  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status"),
  };

  const validatedFields = CreateCostTypeRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin loại chi phí không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let result: { success: boolean; message?: string } | undefined;

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/costs/types`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        category: validatedFields.data.category,
        status: validatedFields.data.status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi tạo loại chi phí" };
    }

    result = await response.json();
  } catch {
    return { success: false, error: "Đã xảy ra lỗi khi tạo loại chi phí. Vui lòng thử lại." };
  }

  if (result?.success) {
    revalidateTag("cost-types");
    redirect("/costs/types");
  }

  return { success: false, error: result?.message || "Tạo loại chi phí thất bại" };
}