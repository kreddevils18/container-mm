import { z } from "zod";

export const LoginRequestSchema = z.object({
    username: z
        .string()
        .min(1, "Tên đăng nhập là bắt buộc")
        .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
        .max(50, "Tên đăng nhập không được vượt quá 50 ký tự"),
    password: z
        .string()
        .min(1, "Mật khẩu là bắt buộc")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .max(100, "Mật khẩu không được vượt quá 100 ký tự"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z
    .object({
        username: z
            .string()
            .min(1, "Tên đăng nhập là bắt buộc")
            .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
            .max(50, "Tên đăng nhập không được vượt quá 50 ký tự")
            .regex(/^[a-zA-Z0-9_]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới"),
        email: z
            .string()
            .min(1, "Email là bắt buộc")
            .email("Định dạng email không hợp lệ")
            .max(100, "Email không được vượt quá 100 ký tự"),
        name: z
            .string()
            .min(2, "Tên phải có ít nhất 2 ký tự")
            .max(100, "Tên không được vượt quá 100 ký tự"),
        password: z
            .string()
            .min(1, "Mật khẩu là bắt buộc")
            .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
            .max(100, "Mật khẩu không được vượt quá 100 ký tự")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                "Mật khẩu phải chứa ít nhất: 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
            )
    })

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const ChangePasswordRequestSchema = z
    .object({
        current_password: z
            .string()
            .min(1, "Mật khẩu hiện tại là bắt buộc"),
        new_password: z
            .string()
            .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
            .max(100, "Mật khẩu không được vượt quá 100 ký tự")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                "Mật khẩu phải chứa ít nhất: 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
            ),
        confirm_password: z
            .string()
            .min(1, "Xác nhận mật khẩu là bắt buộc"),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirm_password"],
    })
    .refine((data) => data.current_password !== data.new_password, {
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
        path: ["new_password"],
    });

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;