import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { users } from "@/drizzle/schema/auth";
import { serviceLogger } from "@/lib/logger";
import type { UserId, UserProfile } from "@/schemas/user";

export async function getUserProfile(
  userId: UserId
): Promise<UserProfile | null> {
  noStore();

  const logger = serviceLogger.withPrefix("getUserProfile");
  logger.debug("Function called", { userId });

  try {
    const [user] = await db
      .select({
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
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    logger.debug("Database query completed", {
      userFound: !!user,
      userId,
      hasName: !!user?.name,
      username: user?.username,
    });

    if (!user) {
      logger.warn("No user found in database", { userId });
      return null;
    }

    // Validate and cast the ID to the branded type
    return {
      ...user,
      id: user.id as UserId,
    };
  } catch (error) {
    logger.logError(error, "Database error in getUserProfile");
    throw error;
  }
}
