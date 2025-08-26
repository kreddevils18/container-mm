import { z } from "zod";

// Create branded types for user IDs to ensure type safety
export const UserIdSchema = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

// Profile update validation schema
export const UpdateUserProfileRequestSchema = z.object({
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên không được vượt quá 100 ký tự")
    .optional(),
  email: z
    .string()
    .email("Định dạng email không hợp lệ")
    .max(255, "Email không được vượt quá 255 ký tự")
    .optional(),
  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không được vượt quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới")
    .optional(),
  image: z
    .string()
    .url("URL hình ảnh không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>;

// User profile response schema for type safety
export const UserProfileSchema = z.object({
  id: UserIdSchema,
  name: z.string().nullable(),
  username: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.enum(["admin", "driver"]),
  status: z.enum(["active", "inactive"]),
  emailVerified: z.date().nullable(),
  lastLoginAt: z.date().nullable(),
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Notification preferences schema
export const NotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  orderUpdates: z.boolean().default(true),
  systemNotifications: z.boolean().default(true),
  maintenanceAlerts: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// Update notification preferences request schema
export const UpdateNotificationPreferencesRequestSchema = NotificationPreferencesSchema.partial();

export type UpdateNotificationPreferencesRequest = z.infer<typeof UpdateNotificationPreferencesRequestSchema>;

// User session data schema for type safety
export const UserSessionSchema = z.object({
  id: UserIdSchema,
  name: z.string().nullable(),
  username: z.string(),
  email: z.string(),
  role: z.enum(["admin", "driver"]),
  status: z.enum(["active", "inactive"]),
  image: z.string().nullable(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

// Email change request schema (requires verification)
export const ChangeEmailRequestSchema = z.object({
  newEmail: z
    .string()
    .min(1, "Email mới là bắt buộc")
    .email("Định dạng email không hợp lệ")
    .max(255, "Email không được vượt quá 255 ký tự"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc để xác nhận thay đổi email"),
});

export type ChangeEmailRequest = z.infer<typeof ChangeEmailRequestSchema>;

// Username change request schema
export const ChangeUsernameRequestSchema = z.object({
  newUsername: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(50, "Tên đăng nhập không được vượt quá 50 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc để xác nhận thay đổi tên đăng nhập"),
});

export type ChangeUsernameRequest = z.infer<typeof ChangeUsernameRequestSchema>;