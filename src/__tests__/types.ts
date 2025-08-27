import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { customers } from "@/drizzle/schema/customers";
import type { vehicles } from "@/drizzle/schema/vehicles";

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

export type Vehicle = InferSelectModel<typeof vehicles>;
export type NewVehicle = InferInsertModel<typeof vehicles>;