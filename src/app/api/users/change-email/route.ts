import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { ChangeEmailRequestSchema } from "@/schemas/user";
import { changeUserEmail } from "@/services/users";

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
    const validatedFields = ChangeEmailRequestSchema.safeParse(body);

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

    const result = await changeUserEmail(
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
        message:
          "Email đã được thay đổi thành công. Vui lòng xác minh email mới.",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Change email error:");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi thay đổi email. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
});
