import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";
import type { NewCustomer } from "@/drizzle/schema";

export async function createCustomer(
  data: Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NewCustomer> {
  noStore();
  
  const [newCustomer] = await db
    .insert(customers)
    .values({
      name: data.name,
      email: data.email || null,
      address: data.address,
      phone: data.phone || null,
      taxId: data.taxId || null,
      status: data.status || "active",
    })
    .returning();

  if (!newCustomer) {
    throw new Error("Failed to create customer");
  }

  return newCustomer;
}