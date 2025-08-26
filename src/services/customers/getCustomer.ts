import "server-only";
import { z } from "zod";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";

export const customerIdSchema = z.string().uuid();

export type CustomerId = z.infer<typeof customerIdSchema>;

export const getCustomer = unstable_cache(
  async (id: string) => {
    const parsed = customerIdSchema.safeParse(id);
    if (!parsed.success) {
      throw new Error("Invalid customer ID");
    }

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parsed.data))
      .limit(1);

    if (!customer || customer.length === 0) {
      throw new Error("Customer not found");
    }

    return customer[0];
  },
  ["customer-detail"],
  {
    tags: ["customers"],
    revalidate: 300, // 5 minutes
  }
);

export async function revalidateCustomer(customerId: string): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`customer-${customerId}`);
  revalidateTag("customers");
}