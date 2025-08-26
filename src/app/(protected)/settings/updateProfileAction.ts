"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { UpdateUserProfileRequestSchema } from "@/schemas/user";
import { updateUserProfile } from "@/services/users";

export type UpdateProfileActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    username?: string[];
    image?: string[];
  };
};

export async function updateProfileAction(
  _prevState: UpdateProfileActionState,
  formData: FormData
): Promise<UpdateProfileActionState> {
  // Get current session
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Không được phép truy cập",
    };
  }

  const rawFormData = {
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    image: formData.get("image"),
  };

  // Remove empty strings and undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(rawFormData).filter(
      ([_, value]) => value !== "" && value !== null
    )
  );

  const validatedFields = UpdateUserProfileRequestSchema.safeParse(cleanedData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Thông tin không hợp lệ",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const updatedProfile = await updateUserProfile(
      session.user.id as import("@/schemas/user").UserId,
      validatedFields.data
    );

    if (!updatedProfile) {
      return {
        success: false,
        error: "Không thể cập nhật thông tin người dùng",
      };
    }

    // Revalidate any cached user data
    revalidateTag("user-profile");

    return {
      success: true,
    };
  } catch (_error) {
    return {
      success: false,
      error: "Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại.",
    };
  }
}
