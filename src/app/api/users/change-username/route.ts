import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { ChangeUsernameRequestSchema } from "@/schemas/user";
import { changeUserUsername } from "@/services/users";

export const POST = auth(async function POST(req) {
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
    const validatedFields = ChangeUsernameRequestSchema.safeParse(body);

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

    const result = await changeUserUsername(
      req.auth.user.id as import("@/schemas/user").UserId,
      validatedFields.data
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tên đăng nhập đã được thay đổi thành công",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Change username error:");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi thay đổi tên đăng nhập. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
});
