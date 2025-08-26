import { type NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/drizzle/schema";
import { CreateOrderRequestSchema } from "@/schemas/order";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedFields = CreateOrderRequestSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin đơn hàng không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      customerId,
      containerCode,
      emptyPickupVehicleId,
      emptyPickupDate,
      emptyPickupStart,
      emptyPickupEnd,
      deliveryVehicleId,
      deliveryDate,
      deliveryStart,
      deliveryEnd,
      description,
      status,
      price,
    } = validatedFields.data;

    const [newOrder] = await db
      .insert(orders)
      .values({
        customerId,
        containerCode: containerCode || null,
        emptyPickupVehicleId: emptyPickupVehicleId || null,
        emptyPickupDate: emptyPickupDate ? new Date(emptyPickupDate) : null,
        emptyPickupStart: emptyPickupStart || null,
        emptyPickupEnd: emptyPickupEnd || null,
        deliveryVehicleId: deliveryVehicleId || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryStart: deliveryStart || null,
        deliveryEnd: deliveryEnd || null,
        description: description || null,
        status,
        price,
      })
      .returning({
        id: orders.id,
        customerId: orders.customerId,
        containerCode: orders.containerCode,
        emptyPickupVehicleId: orders.emptyPickupVehicleId,
        emptyPickupDate: orders.emptyPickupDate,
        emptyPickupStart: orders.emptyPickupStart,
        emptyPickupEnd: orders.emptyPickupEnd,
        deliveryVehicleId: orders.deliveryVehicleId,
        deliveryDate: orders.deliveryDate,
        deliveryStart: orders.deliveryStart,
        deliveryEnd: orders.deliveryEnd,
        description: orders.description,
        status: orders.status,
        price: orders.price,
        createdAt: orders.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Đơn hàng đã được tạo thành công",
        data: {
          order: newOrder,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.logError(error, "Order creation failed", "CREATE_ORDER");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}