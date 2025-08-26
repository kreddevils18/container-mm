"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { ChangeUsernameRequestSchema } from "@/schemas/user";
import { changeUserUsername } from "@/services/users";

export type ChangeUsernameActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    newUsername?: string[];
    password?: string[];
  };
};

export async function changeUsernameAction(
  _prevState: ChangeUsernameActionState,
  formData: FormData
): Promise<ChangeUsernameActionState> {
  // Get current session
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Không được phép truy cập",
    };
  }

  const rawFormData = {
    newUsername: formData.get("newUsername"),
    password: formData.get("password"),
  };

  const validatedFields = ChangeUsernameRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await changeUserUsername(
      session.user.id as import("@/schemas/user").UserId,
      validatedFields.data
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Không thể thay đổi username. Vui lòng thử lại",
      };
    }

    // Revalidate any cached user data
    revalidateTag("user-profile");

    return {
      success: true,
    };
  } catch (error) {
    logger.logError(error, "Change username action error:");
    return {
      success: false,
      error: "Đã xảy ra lỗi khi thay đổi tên đăng nhập. Vui lòng thử lại.",
    };
  }
}
