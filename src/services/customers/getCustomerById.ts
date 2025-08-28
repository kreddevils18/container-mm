import type { CustomerSearchResult } from "@/app/api/customers/search/route";

/**
 * Client-side service to get customer by ID
 */
export async function getCustomerById(id: string): Promise<CustomerSearchResult | null> {
  try {
    const response = await fetch(`/api/customers/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (_error) {
    return null;
  }
}