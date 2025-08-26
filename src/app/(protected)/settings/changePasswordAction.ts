"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/drizzle/schema";
import { logger } from "@/lib/logger";
import { ChangePasswordRequestSchema } from "@/schemas/auth";

export type ChangePasswordActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    current_password?: string[];
    new_password?: string[];
    confirm_password?: string[];
  };
};

export async function changePasswordAction(
  _prevState: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  // Get current session
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Không được phép truy cập",
    };
  }

  const rawFormData = {
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  };

  const validatedFields = ChangePasswordRequestSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin mật khẩu không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { current_password, new_password } = validatedFields.data;

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Không tìm thấy người dùng",
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      current_password,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "Mật khẩu hiện tại không đúng",
      };
    }

    // Hash new password
    const hashedNewPassword = await hash(new_password, 12);

    // Update password in database
    await db
      .update(users)
      .set({
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return {
      success: true,
    };
  } catch (err) {
    logger.error("Change password error:", { error: err });
    return {
      success: false,
      error: "Đã xảy ra lỗi khi thay đổi mật khẩu. Vui lòng thử lại.",
    };
  }
}
