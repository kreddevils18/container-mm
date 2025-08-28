import { type NextRequest, NextResponse } from "next/server";
import { db, orders, orderContainers } from "@/drizzle/schema";
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
      shippingLine,
      bookingNumber,
      oilQuantity,
      emptyPickupVehicleId,
      emptyPickupDate,
      emptyPickupStart,
      emptyPickupEnd,
      deliveryVehicleId,
      deliveryDate,
      deliveryEnd,
      description,
      status,
      price,
      containers,
    } = validatedFields.data;

    const [newOrder] = await db
      .insert(orders)
      .values({
        customerId,
        containerCode: containerCode || null,
        shippingLine: shippingLine || null,
        bookingNumber: bookingNumber || null,
        oilQuantity: oilQuantity || null,
        emptyPickupVehicleId: emptyPickupVehicleId || null,
        emptyPickupDate: emptyPickupDate ? new Date(emptyPickupDate) : null,
        emptyPickupStart: emptyPickupStart || null,
        emptyPickupEnd: emptyPickupEnd || null,
        deliveryVehicleId: deliveryVehicleId || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryEnd: deliveryEnd || null,
        description: description || null,
        status,
        price,
      })
      .returning({
        id: orders.id,
        customerId: orders.customerId,
        containerCode: orders.containerCode,
        shippingLine: orders.shippingLine,
        bookingNumber: orders.bookingNumber,
        oilQuantity: orders.oilQuantity,
        emptyPickupVehicleId: orders.emptyPickupVehicleId,
        emptyPickupDate: orders.emptyPickupDate,
        emptyPickupStart: orders.emptyPickupStart,
        emptyPickupEnd: orders.emptyPickupEnd,
        deliveryVehicleId: orders.deliveryVehicleId,
        deliveryDate: orders.deliveryDate,
        deliveryEnd: orders.deliveryEnd,
        description: orders.description,
        status: orders.status,
        price: orders.price,
        createdAt: orders.createdAt,
      });

    // Insert container data if provided (skip if table doesn't exist yet)
    if (containers && containers.length > 0) {
      try {
        const containerInserts = containers
          .filter((container: { containerType: "D2" | "D4" | "R2" | "R4"; quantity: number }) => container.quantity > 0)
          .map((container: { containerType: "D2" | "D4" | "R2" | "R4"; quantity: number }) => ({
            orderId: newOrder.id,
            containerType: container.containerType,
            quantity: container.quantity,
          }));

        if (containerInserts.length > 0) {
          await db.insert(orderContainers).values(containerInserts);
        }
      } catch (_error) {
        // Container data insertion failed - table may not exist, continuing without container data
        // Continue without container data if table doesn't exist
      }
    }

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