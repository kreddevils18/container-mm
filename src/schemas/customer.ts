import { z } from "zod";
import type { NewCustomer } from "@/drizzle/schema";

export const CreateCustomerRequestSchema = z.object({
    name: z
        .string({ message: "Tên khách hàng là bắt buộc" })
        .min(1, "Tên khách hàng là bắt buộc")
        .max(200, "Tên không được vượt quá 200 ký tự"),
    email: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().email("Email không hợp lệ").max(254, "Email không được vượt quá 254 ký tự").nullable()
        )
        .optional(),
    address: z
        .string({ message: "Địa chỉ là bắt buộc" })
        .min(1, "Địa chỉ là bắt buộc")
        .max(500, "Địa chỉ không được vượt quá 500 ký tự"),
    phone: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().max(15, "Số điện thoại không được vượt quá 15 ký tự").nullable()
        )
        .optional(),
    taxId: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().max(50, "Mã số thuế không được vượt quá 50 ký tự").nullable()
        )
        .optional(),
    status: z.enum(["active", "inactive"]).default("active").optional(),
}) satisfies z.ZodType<Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

export const UpdateCustomerRequestSchema = z.object({
    name: z
        .string()
        .min(1, "Tên khách hàng là bắt buộc")
        .max(200, "Tên không được vượt quá 200 ký tự")
        .optional(),
    email: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().email("Email không hợp lệ").max(254, "Email không được vượt quá 254 ký tự").nullable()
        )
        .optional(),
    address: z
        .string()
        .min(1, "Địa chỉ là bắt buộc")
        .max(500, "Địa chỉ không được vượt quá 500 ký tự")
        .optional(),
    phone: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().max(15, "Số điện thoại không được vượt quá 15 ký tự").nullable()
        )
        .optional(),
    taxId: z
        .preprocess(
            (val) => val === "" ? null : val,
            z.string().max(50, "Mã số thuế không được vượt quá 50 ký tự").nullable()
        )
        .optional(),
    status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
