import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { customers, db } from "@/drizzle/schema";
import { CreateCustomerRequestSchema } from "@/schemas";

export async function GET(): Promise<NextResponse> {
  try {
    const allCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        address: customers.address,
        phone: customers.phone,
        taxId: customers.taxId,
        status: customers.status,
      })
      .from(customers)
      .where(sql`${customers.status} = 'active'`)
      .orderBy(customers.name);

    return NextResponse.json(
      {
        success: true,
        data: allCustomers,
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy danh sách khách hàng",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedFields = CreateCustomerRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin khách hàng không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, address, phone, taxId, status } = validatedFields.data;

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name,
        email: email || null,
        address,
        phone: phone || null,
        taxId: taxId || null,
        status,
      })
      .returning({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        address: customers.address,
        phone: customers.phone,
        taxId: customers.taxId,
        status: customers.status,
        createdAt: customers.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Khách hàng đã được tạo thành công",
        data: {
          customer: newCustomer,
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    // Customer creation error logged for debugging
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo khách hàng. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
