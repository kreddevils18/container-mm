import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, vehicles } from "@/drizzle/schema";
import { CreateVehicleRequestSchema } from "@/schemas";

export async function GET(): Promise<NextResponse> {
  try {
    const allVehicles = await db
      .select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
        driverIdCard: vehicles.driverIdCard,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(sql`${vehicles.status} = 'available'`)
      .orderBy(vehicles.licensePlate);

    return NextResponse.json(
      {
        success: true,
        data: allVehicles,
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy danh sách xe",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedFields = CreateVehicleRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin phương tiện không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { licensePlate, driverName, driverPhone, driverIdCard, status } = validatedFields.data;

    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        licensePlate,
        driverName,
        driverPhone,
        driverIdCard,
        status,
      })
      .returning({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
        driverIdCard: vehicles.driverIdCard,
        status: vehicles.status,
        createdAt: vehicles.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Phương tiện đã được tạo thành công",
        data: {
          vehicle: newVehicle,
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo phương tiện. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}