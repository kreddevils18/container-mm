import { z } from "zod";

export const CreateOrderRequestSchema = z.object({
  customerId: z
    .string()
    .uuid("ID khách hàng không hợp lệ")
    .min(1, "Khách hàng là bắt buộc"),
  containerCode: z
    .string()
    .max(50, "Mã container không được vượt quá 50 ký tự")
    .optional()
    .or(z.literal("")),
  shippingLine: z
    .string()
    .max(100, "Hãng tàu không được vượt quá 100 ký tự")
    .optional()
    .or(z.literal("")),
  bookingNumber: z
    .string()
    .max(50, "Số booking không được vượt quá 50 ký tự")
    .optional()
    .or(z.literal("")),
  oilQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Số dầu không hợp lệ")
    .optional()
    .or(z.literal("")),
  // Empty pickup vehicle and details
  emptyPickupVehicleId: z
    .string()
    .uuid("ID xe lấy rỗng không hợp lệ")
    .optional()
    .or(z.literal("")),
  emptyPickupDate: z
    .string()
    .datetime("Ngày lấy rỗng không hợp lệ")
    .optional()
    .or(z.literal("")),
  emptyPickupStart: z
    .string()
    .max(200, "Điểm đầu lấy rỗng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  emptyPickupEnd: z
    .string()
    .max(200, "Điểm cuối lấy rỗng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  deliveryVehicleId: z
    .string()
    .uuid("ID xe hạ hàng không hợp lệ")
    .optional()
    .or(z.literal("")),
  deliveryDate: z
    .string()
    .datetime("Ngày hạ hàng không hợp lệ")
    .optional()
    .or(z.literal("")),
  deliveryStart: z
    .string()
    .max(200, "Điểm đầu hạ hàng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  deliveryEnd: z
    .string()
    .max(200, "Điểm cuối hạ hàng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  status: z.enum(["created", "pending", "in_progress", "completed", "cancelled"]).default("created"),
  price: z
    .string()
    .min(1, "Giá tiền là bắt buộc")
    .regex(/^\d+(\.\d{1,2})?$/, "Giá tiền không hợp lệ")
    .default("0"),
  containers: z.array(z.object({
    containerType: z.enum(["D2", "D4", "R2", "R4"]),
    quantity: z.number().min(0, "Số lượng không được âm").default(0),
  })).optional().default([]),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const UpdateOrderRequestSchema = z.object({
  customerId: z
    .string()
    .uuid("ID khách hàng không hợp lệ")
    .min(1, "Khách hàng là bắt buộc")
    .optional(),
  containerCode: z
    .string()
    .max(50, "Mã container không được vượt quá 50 ký tự")
    .optional()
    .or(z.literal("")),
  shippingLine: z
    .string()
    .max(100, "Hãng tàu không được vượt quá 100 ký tự")
    .optional()
    .or(z.literal("")),
  bookingNumber: z
    .string()
    .max(50, "Số booking không được vượt quá 50 ký tự")
    .optional()
    .or(z.literal("")),
  oilQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Số dầu không hợp lệ")
    .optional()
    .or(z.literal("")),
  // Empty pickup vehicle and details
  emptyPickupVehicleId: z
    .string()
    .uuid("ID xe lấy rỗng không hợp lệ")
    .optional()
    .or(z.literal("")),
  emptyPickupDate: z
    .string()
    .datetime("Ngày lấy rỗng không hợp lệ")
    .optional()
    .or(z.literal("")),
  emptyPickupStart: z
    .string()
    .max(200, "Điểm đầu lấy rỗng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  emptyPickupEnd: z
    .string()
    .max(200, "Điểm cuối lấy rỗng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  deliveryVehicleId: z
    .string()
    .uuid("ID xe hạ hàng không hợp lệ")
    .optional()
    .or(z.literal("")),
  deliveryDate: z
    .string()
    .datetime("Ngày hạ hàng không hợp lệ")
    .optional()
    .or(z.literal("")),
  deliveryStart: z
    .string()
    .max(200, "Điểm đầu hạ hàng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  deliveryEnd: z
    .string()
    .max(200, "Điểm cuối hạ hàng không được vượt quá 200 ký tự")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  status: z.enum(["created", "pending", "in_progress", "completed", "cancelled"]).optional(),
  price: z
    .string()
    .min(1, "Giá tiền là bắt buộc")
    .regex(/^\d+(\.\d{1,2})?$/, "Giá tiền không hợp lệ")
    .optional(),
  containers: z.array(z.object({
    containerType: z.enum(["D2", "D4", "R2", "R4"]),
    quantity: z.number().min(0, "Số lượng không được âm").default(0),
  })).optional(),
});

export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

export const ORDER_STATUS_LABELS = {
  created: "Mới tạo",
  pending: "Chờ xử lý",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
} as const;

export const CONTAINER_TYPE_LABELS = {
  D2: "20' Cainer",
  D4: "40' Container", 
  R2: "40' High Cube",
  R4: "45' High Cube",
} as const;

export const CONTAINER_TYPE_DIMENSIONS = {
  D2: "20 x 8 x 8 ft",
  D4: "40 x 8 x 8 ft",
  R2: "40 x 8 x 9.5 ft", 
  R4: "45 x 8 x 9.5 ft",
} as const;
