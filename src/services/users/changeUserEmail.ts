import { unstable_noStore as noStore } from "next/cache";
import { eq, and } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db } from "@/drizzle/client";
import { users } from "@/drizzle/schema/auth";
import type { UserId, ChangeEmailRequest } from "@/schemas/user";

/**
 * Change user email address with password verification
 * Resets email verification status when email changes
 */
export async function changeUserEmail(
  userId: UserId,
  data: ChangeEmailRequest
): Promise<{ success: boolean; error?: string }> {
  noStore();
  
  // Get current user
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    return { success: false, error: "Không tìm thấy người dùng" };
  }

  // Verify current password
  const isPasswordValid = await compare(data.password, currentUser.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Mật khẩu không đúng" };
  }

  // Check if new email is already in use by another user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.email, data.newEmail),
      eq(users.id, userId) // Not the current user
    ))
    .limit(1);

  if (existingUser) {
    return { success: false, error: "Email này đã được sử dụng bởi tài khoản khác" };
  }

  try {
    // Update email and reset verification status
    await db
      .update(users)
      .set({
        email: data.newEmail,
        emailVerified: null,
        emailVerifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (_error) {
    return { success: false, error: "Đã xảy ra lỗi khi thay đổi email" };
  }
}