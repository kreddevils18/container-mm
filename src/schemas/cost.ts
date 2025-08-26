import { z } from "zod";

/**
 * Schema for creating a new cost entry for an order or vehicle.
 * 
 * Validates cost data including type, amount, date, and optional description.
 * Costs can be associated with either an order or a vehicle (but not both).
 */
export const CreateCostRequestSchema = z.object({
  /** UUID of the cost type (e.g., fuel, toll, maintenance) */
  costTypeId: z
    .string()
    .uuid("ID loại chi phí không hợp lệ")
    .min(1, "Loại chi phí là bắt buộc"),

  /** UUID of the order this cost belongs to (optional if vehicleId is provided) */
  orderId: z
    .string()
    .uuid("ID đơn hàng không hợp lệ")
    .optional(),

  /** UUID of the vehicle this cost belongs to (optional if orderId is provided) */
  vehicleId: z
    .string()
    .uuid("ID phương tiện không hợp lệ")
    .optional(),

  /** Cost amount as decimal string (e.g., "150000.50") */
  amount: z
    .string()
    .min(1, "Số tiền là bắt buộc")
    .regex(/^\d+(\.\d{1,2})?$/, "Số tiền không hợp lệ (tối đa 2 chữ số thập phân)")
    .refine(
      (val) => {
        const num = Number(val);
        return num > 0 && num <= 999999999.99;
      },
      "Số tiền phải lớn hơn 0 và không vượt quá 999,999,999.99 VND"
    ),

  /** Date when the cost occurred (ISO date string) */
  costDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày chi phí không hợp lệ (định dạng YYYY-MM-DD)")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
      },
      "Ngày chi phí không được trong tương lai"
    ),

  /** Optional payment date (ISO date string) */
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày thanh toán không hợp lệ (định dạng YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  /** Optional description of the cost (max 500 characters) */
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => !!(data.orderId || data.vehicleId),
  {
    message: "Phải có ít nhất một trong số orderId hoặc vehicleId",
    path: ["orderId"],
  }
).refine(
  (data) => !(data.orderId && data.vehicleId),
  {
    message: "Không thể có cả orderId và vehicleId cùng lúc",
    path: ["vehicleId"],
  }
);

export type CreateCostRequest = z.infer<typeof CreateCostRequestSchema>;

/**
 * Schema for updating an existing cost entry.
 * All fields are optional except amount validation rules remain the same.
 */
export const UpdateCostRequestSchema = z.object({
  /** UUID of the cost type */
  costTypeId: z
    .string()
    .uuid("ID loại chi phí không hợp lệ")
    .optional(),

  /** Cost amount as decimal string */
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Số tiền không hợp lệ (tối đa 2 chữ số thập phân)")
    .refine(
      (val) => {
        const num = Number(val);
        return num > 0 && num <= 999999999.99;
      },
      "Số tiền phải lớn hơn 0 và không vượt quá 999,999,999.99 VND"
    )
    .optional(),

  /** Date when the cost occurred */
  costDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày chi phí không hợp lệ (định dạng YYYY-MM-DD)")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
      },
      "Ngày chi phí không được trong tương lai"
    )
    .optional(),

  /** Optional payment date */
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày thanh toán không hợp lệ (định dạng YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  /** Optional description of the cost */
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
});

export type UpdateCostRequest = z.infer<typeof UpdateCostRequestSchema>;

/**
 * Cost data structure returned by API calls.
 * Includes cost details with related cost type information.
 */
export interface CostWithDetails {
  id: string;
  costTypeId: string;
  costTypeName: string;
  costTypeCategory: "vehicle" | "order";
  orderId: string | null;
  vehicleId: string | null;
  amount: string;
  costDate: Date;
  paymentDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Utility function to format cost amounts for display
 */
export function formatCostAmount(amount: string | number): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(num)) return `${amount} ₫`;
  
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Utility function to format dates for cost display
 */
export function formatCostDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Schema for filtering costs in list/search operations
 */
export const costFilterSchema = z.object({
  q: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  costTypeId: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional().transform((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    return [val];
  }),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.string().optional().default("costDate.desc"),
  page: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val) return 1;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return Number.isNaN(num) || num < 1 ? 1 : num;
  }),
  per_page: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val) return 10;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return Number.isNaN(num) || num < 1 || num > 100 ? 10 : num;
  }),
});

export type CostFilters = z.infer<typeof costFilterSchema>;