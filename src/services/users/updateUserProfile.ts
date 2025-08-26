import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { users } from "@/drizzle/schema/auth";
import type {
  UpdateUserProfileRequest,
  UserId,
  UserProfile,
} from "@/schemas/user";

export async function updateUserProfile(
  userId: UserId,
  data: UpdateUserProfileRequest
): Promise<UserProfile | null> {
  noStore();

  // Prepare update data - only include fields that have values
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name || null;
  }

  if (data.email !== undefined) {
    updateData.email = data.email;
    // Reset email verification when email changes
    updateData.emailVerified = null;
    updateData.emailVerifiedAt = null;
  }

  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  if (data.image !== undefined) {
    updateData.image = data.image || null;
  }

  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      image: users.image,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      lastLoginAt: users.lastLoginAt,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  if (!updatedUser) {
    throw new Error("Failed to update user profile");
  }

  // Validate and cast the ID to the branded type
  return {
    ...updatedUser,
    id: updatedUser.id as UserId,
  };
}
