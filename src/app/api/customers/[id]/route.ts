import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customers, db } from "@/drizzle/schema";
import { UpdateCustomerRequestSchema } from "@/schemas";

const CustomerIdSchema = z.string().uuid();

// Response schema matching CustomerSearchResult
const CustomerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  address: z.string(),
  phone: z.string().nullable(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate customer ID
    const idValidation = CustomerIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "ID khách hàng không hợp lệ" },
        { status: 400 }
      );
    }

    // Get customer
    const [customer] = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        address: customers.address,
        phone: customers.phone,
      })
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Không tìm thấy khách hàng" },
        { status: 404 }
      );
    }

    const validatedCustomer = CustomerResponseSchema.parse(customer);
    return NextResponse.json(validatedCustomer);
  } catch (_error) {
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lấy thông tin khách hàng" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate customer ID
    const idValidation = CustomerIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID khách hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedFields = UpdateCustomerRequestSchema.safeParse(body);

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

    const { name, address, phone, taxId, status } = validatedFields.data;

    // Check if customer exists
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer || existingCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy khách hàng",
        },
        { status: 404 }
      );
    }

    // Update customer - only update fields that are provided
    const updateData: Record<string, string | Date | null> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone || null;
    if (taxId !== undefined) updateData.taxId = taxId || null;
    if (status !== undefined) updateData.status = status;

    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning({
        id: customers.id,
        name: customers.name,
        address: customers.address,
        phone: customers.phone,
        taxId: customers.taxId,
        status: customers.status,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Khách hàng đã được cập nhật thành công",
        data: {
          customer: updatedCustomer,
        },
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật khách hàng. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate customer ID
    const idValidation = CustomerIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID khách hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer || existingCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy khách hàng",
        },
        { status: 404 }
      );
    }

    const customerToDelete = existingCustomer[0];
    if (!customerToDelete) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy thông tin khách hàng",
        },
        { status: 404 }
      );
    }

    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json(
      {
        success: true,
        message: "Khách hàng đã được xóa thành công",
        data: {
          deletedCustomer: {
            id: customerToDelete.id,
            name: customerToDelete.name,
          },
        },
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xóa khách hàng. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
