import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";

export interface DeletedCustomerData {
  id: string;
  name: string;
}

export async function deleteCustomer(id: string): Promise<DeletedCustomerData> {
  noStore();

  const existingCustomer = await db
    .select({
      id: customers.id,
      name: customers.name
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!existingCustomer || existingCustomer.length === 0) {
    throw new Error("Customer not found");
  }

  const customerToDelete = existingCustomer[0];
  if (!customerToDelete) {
    throw new Error("Customer data not found");
  }

  await db
    .delete(customers)
    .where(eq(customers.id, id));

  return {
    id: customerToDelete.id,
    name: customerToDelete.name,
  };
}