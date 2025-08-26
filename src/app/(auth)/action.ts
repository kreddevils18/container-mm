"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { RegisterRequestSchema as BaseRegisterRequestSchema } from "@/schemas";

const RegisterRequestSchema = BaseRegisterRequestSchema.extend({
  confirm_password: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
})
  .refine((data) => data.password === data.confirm_password, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirm_password"],
  });

export type RegisterActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    username?: string[];
    email?: string[];
    name?: string[];
    password?: string[];
    confirm_password?: string[];
  };
};

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  // Extract form data
  const rawFormData = {
    username: formData.get("username"),
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };

  const validatedFields = RegisterRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin đăng ký không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  let result: { success: boolean; message?: string } | undefined;

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: validatedFields.data.username,
        email: validatedFields.data.email,
        name: validatedFields.data.name,
        password: validatedFields.data.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Đã xảy ra lỗi khi tạo tài khoản" };
    }

    result = await response.json();
  } catch {
    return { success: false, error: "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại." };
  }

  if (result?.success) {
    redirect("/login");
  }

  return { success: false, error: result?.message || "Đăng ký thất bại" };
}