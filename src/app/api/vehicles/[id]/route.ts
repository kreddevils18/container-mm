import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, vehicles } from "@/drizzle/schema";
import { UpdateVehicleRequestSchema } from "@/schemas";

const VehicleIdSchema = z.string().uuid();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const idValidation = VehicleIdSchema.safeParse(id);

    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID phương tiện không hợp lệ",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedFields = UpdateVehicleRequestSchema.safeParse(body);

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

    const { licensePlate, driverName, driverPhone, driverIdCard, status } =
      validatedFields.data;

    // Check if vehicle exists
    const existingVehicle = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!existingVehicle || existingVehicle.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy phương tiện",
        },
        { status: 404 }
      );
    }

    // Update vehicle - only update fields that are provided
    const updateData: Record<string, string | Date> = { updatedAt: new Date() };
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate;
    if (driverName !== undefined) updateData.driverName = driverName;
    if (driverPhone !== undefined) updateData.driverPhone = driverPhone;
    if (driverIdCard !== undefined) updateData.driverIdCard = driverIdCard;
    if (status !== undefined) updateData.status = status;

    const [updatedVehicle] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
        driverIdCard: vehicles.driverIdCard,
        status: vehicles.status,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Phương tiện đã được cập nhật thành công",
        data: {
          vehicle: updatedVehicle,
        },
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật phương tiện. Vui lòng thử lại.",
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
    const idValidation = VehicleIdSchema.safeParse(id);

    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID phương tiện không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Check if vehicle exists
    const existingVehicle = await db
      .select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        driverName: vehicles.driverName,
      })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!existingVehicle || existingVehicle.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy phương tiện",
        },
        { status: 404 }
      );
    }

    const vehicleToDelete = existingVehicle[0];
    if (!vehicleToDelete) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy thông tin phương tiện",
        },
        { status: 404 }
      );
    }

    // Delete vehicle
    await db.delete(vehicles).where(eq(vehicles.id, id));

    return NextResponse.json(
      {
        success: true,
        message: "Phương tiện đã được xóa thành công",
        data: {
          deletedVehicle: {
            id: vehicleToDelete.id,
            licensePlate: vehicleToDelete.licensePlate,
            driverName: vehicleToDelete.driverName,
          },
        },
      },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xóa phương tiện. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
