import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, users } from "@/drizzle/schema";
import { RegisterRequestSchema } from "@/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedFields = RegisterRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin đăng ký không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, name, password } = validatedFields.data;

    const existingUserByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUserByUsername.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tên đăng nhập đã tồn tại",
        },
        { status: 409 }
      );
    }

    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email đã được sử dụng",
        },
        { status: 409 }
      );
    }
    const hashedPassword = await hash(password, 12);
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        name,
        passwordHash: hashedPassword,
        role: "admin",
        status: "active",
        emailVerified: new Date(),
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Tài khoản đã được tạo thành công",
        data: {
          user: newUser,
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    // Registration error logged for debugging
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
