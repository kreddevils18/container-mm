import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { UpdateUserProfileRequestSchema } from "@/schemas/user";
import { getUserProfile, updateUserProfile } from "@/services/users";

export const GET = auth(async function GET(req) {
  if (!req.auth?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Không được phép truy cập",
      },
      { status: 401 }
    );
  }

  try {
    const userProfile = await getUserProfile(
      req.auth.user.id as import("@/schemas/user").UserId
    );

    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy thông tin người dùng",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Get user profile error:");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy thông tin người dùng",
      },
      { status: 500 }
    );
  }
});

export const PUT = auth(async function PUT(req) {
  if (!req.auth?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Không được phép truy cập",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const validatedFields = UpdateUserProfileRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedProfile = await updateUserProfile(
      req.auth.user.id as import("@/schemas/user").UserId,
      validatedFields.data
    );

    if (!updatedProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Không thể cập nhật thông tin người dùng",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thông tin người dùng đã được cập nhật thành công",
        data: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Update user profile error:");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng",
      },
      { status: 500 }
    );
  }
});
