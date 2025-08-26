import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";
import type { Customer } from "@/drizzle/schema";

export interface UpdateCustomerData {
  name: string;
  address: string;
  phone?: string | null;
  taxId?: string | null;
  status: "active" | "inactive";
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerData
): Promise<Customer> {
  noStore();

  // Check if customer exists
  const existingCustomer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!existingCustomer || existingCustomer.length === 0) {
    throw new Error("Customer not found");
  }

  // Update customer
  const [updatedCustomer] = await db
    .update(customers)
    .set({
      name: data.name,
      address: data.address,
      phone: data.phone || null,
      taxId: data.taxId || null,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning();

  if (!updatedCustomer) {
    throw new Error("Failed to update customer");
  }

  return updatedCustomer;
}