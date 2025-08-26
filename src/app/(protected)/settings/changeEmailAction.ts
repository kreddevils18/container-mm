"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { ChangeEmailRequestSchema } from "@/schemas/user";
import { changeUserEmail } from "@/services/users";

export type ChangeEmailActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    newEmail?: string[];
    password?: string[];
  };
};

export async function changeEmailAction(
  _prevState: ChangeEmailActionState,
  formData: FormData
): Promise<ChangeEmailActionState> {
  // Get current session
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Không được phép truy cập",
    };
  }

  const rawFormData = {
    newEmail: formData.get("newEmail"),
    password: formData.get("password"),
  };

  const validatedFields = ChangeEmailRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await changeUserEmail(
      session.user.id as import("@/schemas/user").UserId,
      validatedFields.data
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Không thể thay đổi email. Vui lòng thử lại.",
      };
    }

    revalidateTag("user-profile");

    return {
      success: true,
    };
  } catch (err) {
    logger.error("Change email action error:", { error: err });

    return {
      success: false,
      error: "Đã xảy ra lỗi khi thay đổi email. Vui lòng thử lại.",
    };
  }
}
