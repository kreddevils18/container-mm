import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { costTypes } from "@/drizzle/schema/costs";
import { notFound } from "next/navigation";
import { logger } from "@/lib/logger";

export async function getCostType(id: string) {
  noStore();

  if (!id) {
    notFound();
  }

  try {
    const [costType] = await db
      .select()
      .from(costTypes)
      .where(eq(costTypes.id, id))
      .limit(1);

    if (!costType) {
      notFound();
    }

    return costType;
  } catch (error) {
    logger.logError(error, "Failed to fetch cost type", "getCostType");
    throw new Error("Failed to fetch cost type");
  }
}