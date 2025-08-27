export { db } from "../client";
export {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "./auth";
export {
  orderStatusEnum,
  vehicleStatusEnum,
  userRoleEnum,
  userStatusEnum,
  customerStatusEnum,
  costCategoryEnum,
  costTypeStatusEnum,
  containerTypeEnum,
} from "./enums";
export { customers } from "./customers";
export { vehicles } from "./vehicles";
export { orders, orderStatusHistory, orderContainers } from "./orders";
export { costs, costTypes } from "./costs";

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { customers } from "./customers";
import type { vehicles } from "./vehicles";
import type { orders, orderStatusHistory, orderContainers } from "./orders";
import type { costs, costTypes } from "./costs";
import type { users } from "./auth";

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type Vehicle = InferSelectModel<typeof vehicles>;
export type NewVehicle = InferInsertModel<typeof vehicles>;
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type OrderStatusHistory = InferSelectModel<typeof orderStatusHistory>;
export type NewOrderStatusHistory = InferInsertModel<typeof orderStatusHistory>;
export type OrderContainer = InferSelectModel<typeof orderContainers>;
export type NewOrderContainer = InferInsertModel<typeof orderContainers>;
export type Cost = InferSelectModel<typeof costs>;
export type NewCost = InferInsertModel<typeof costs>;
export type CostType = InferSelectModel<typeof costTypes>;
export type NewCostType = InferInsertModel<typeof costTypes>;
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;