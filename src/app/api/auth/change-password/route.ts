import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/drizzle/schema";
import { ChangePasswordRequestSchema } from "@/schemas/auth";

export const POST = auth(async function POST(req) {
  // Check if user is authenticated
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
    const validatedFields = ChangePasswordRequestSchema.safeParse(body);

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

    const { current_password, new_password } = validatedFields.data;

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.auth.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy người dùng",
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(current_password, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Mật khẩu hiện tại không đúng",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hash(new_password, 12);

    // Update password in database
    await db
      .update(users)
      .set({
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.auth.user.id));

    return NextResponse.json(
      {
        success: true,
        message: "Mật khẩu đã được thay đổi thành công",
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi thay đổi mật khẩu. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
});