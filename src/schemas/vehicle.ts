import { z } from "zod";
import type { NewVehicle } from "@/drizzle/schema";

export const CreateVehicleRequestSchema = z.object({
    licensePlate: z
        .string()
        .min(1, "Biển số xe là bắt buộc")
        .max(20, "Biển số xe không được vượt quá 20 ký tự")
        .regex(
            /^[A-Z0-9\-.]+$/,
            "Biển số xe chỉ được chứa chữ cái in hoa, số, dấu gạch ngang và dấu chấm"
        ),
    driverName: z
        .string()
        .min(1, "Tên tài xế là bắt buộc")
        .max(100, "Tên tài xế không được vượt quá 100 ký tự"),
    driverPhone: z
        .string()
        .min(1, "Số điện thoại là bắt buộc")
        .max(20, "Số điện thoại không được vượt quá 20 ký tự")
        .regex(
            /^0[3-9][0-9]{8,9}$/,
            "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10-11 số)"
        ),
    driverIdCard: z
        .string()
        .min(1, "Số chứng minh thư là bắt buộc")
        .max(20, "Số chứng minh thư không được vượt quá 20 ký tự")
        .regex(
            /^[0-9]{9,12}$/,
            "Số chứng minh thư không hợp lệ (chỉ được chứa 9-12 số)"
        ),
    status: z.enum(["available", "unavailable", "maintenance"]).default("available").optional(),
}) satisfies z.ZodType<Omit<NewVehicle, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateVehicleRequest = z.infer<typeof CreateVehicleRequestSchema>;

export const UpdateVehicleRequestSchema = z.object({
    licensePlate: z
        .string()
        .min(1, "Biển số xe là bắt buộc")
        .max(20, "Biển số xe không được vượt quá 20 ký tự")
        .regex(
            /^[A-Z0-9\-.]+$/,
            "Biển số xe chỉ được chứa chữ cái in hoa, số, dấu gạch ngang và dấu chấm"
        )
        .optional(),
    driverName: z
        .string()
        .min(1, "Tên tài xế là bắt buộc")
        .max(100, "Tên tài xế không được vượt quá 100 ký tự")
        .optional(),
    driverPhone: z
        .string()
        .min(1, "Số điện thoại là bắt buộc")
        .max(20, "Số điện thoại không được vượt quá 20 ký tự")
        .regex(
            /^0[3-9][0-9]{8,9}$/,
            "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10-11 số)"
        )
        .optional(),
    driverIdCard: z
        .string()
        .min(1, "Số chứng minh thư là bắt buộc")
        .max(20, "Số chứng minh thư không được vượt quá 20 ký tự")
        .regex(
            /^[0-9]{9,12}$/,
            "Số chứng minh thư không hợp lệ (chỉ được chứa 9-12 số)"
        )
        .optional(),
    status: z.enum(["available", "unavailable", "maintenance"]).optional(),
});

export type UpdateVehicleRequest = z.infer<typeof UpdateVehicleRequestSchema>;
