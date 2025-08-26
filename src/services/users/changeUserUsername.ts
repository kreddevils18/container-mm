import { compare } from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { users } from "@/drizzle/schema/auth";
import { logger } from "@/lib/logger";
import type { ChangeUsernameRequest, UserId } from "@/schemas/user";

export async function changeUserUsername(
  userId: UserId,
  data: ChangeUsernameRequest
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
  const isPasswordValid = await compare(
    data.password,
    currentUser.passwordHash
  );
  if (!isPasswordValid) {
    return { success: false, error: "Mật khẩu không đúng" };
  }

  // Check if new username is already in use by another user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.username, data.newUsername),
        ne(users.id, userId) // Not the current user
      )
    )
    .limit(1);

  if (existingUser) {
    return { success: false, error: "Tên đăng nhập này đã được sử dụng" };
  }

  try {
    // Update username
    await db
      .update(users)
      .set({
        username: data.newUsername,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (err) {
    logger.error("Change username error:", { error: err });
    return {
      success: false,
      error: "Đã xảy ra lỗi khi thay đổi tên đăng nhập",
    };
  }
}
