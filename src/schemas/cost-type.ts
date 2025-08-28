import { z } from "zod";
import type { NewCostType } from "@/drizzle/schema";

export const CreateCostTypeRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Tên loại chi phí là bắt buộc")
    .max(100, "Tên không được vượt quá 100 ký tự"),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .default("")
    .optional(),
  category: z.enum(["vehicle", "order"], {
    message: "Danh mục phải là 'vehicle' hoặc 'order'",
  }),
  status: z.enum(["active", "inactive"]).default("active").optional(),
}) satisfies z.ZodType<Omit<NewCostType, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateCostTypeRequest = z.infer<typeof CreateCostTypeRequestSchema>;

export const UpdateCostTypeRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Tên loại chi phí là bắt buộc")
    .max(100, "Tên không được vượt quá 100 ký tự")
    .optional(),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  category: z.enum(["vehicle", "order"], {
    message: "Danh mục phải là 'vehicle' hoặc 'order'",
  }).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateCostTypeRequest = z.infer<typeof UpdateCostTypeRequestSchema>;