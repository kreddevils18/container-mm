import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, orderStatusHistory, orders, orderContainers } from "@/drizzle/schema";
import { logger } from "@/lib/logger";
import { UpdateOrderRequestSchema } from "@/schemas";

const OrderIdSchema = z.string().uuid();

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

    // Validate order ID
    const idValidation = OrderIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID đơn hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy đơn hàng",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          order,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Order retrieval failed", "GET_ORDER");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy thông tin đơn hàng. Vui lòng thử lại.",
      },
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

    // Validate order ID
    const idValidation = OrderIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID đơn hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedFields = UpdateOrderRequestSchema.safeParse(body);

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
      deliveryStart,
      deliveryEnd,
      description,
      status,
      price,
      containers,
    } = validatedFields.data;

    const existingOrder = await db
      .select({
        id: orders.id,
        currentStatus: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy đơn hàng",
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | Date | null> = {
      updatedAt: new Date(),
    };
    if (customerId !== undefined) updateData.customerId = customerId;
    if (containerCode !== undefined)
      updateData.containerCode = containerCode || null;
    if (shippingLine !== undefined)
      updateData.shippingLine = shippingLine || null;
    if (bookingNumber !== undefined)
      updateData.bookingNumber = bookingNumber || null;
    if (oilQuantity !== undefined)
      updateData.oilQuantity = oilQuantity || null;
    if (emptyPickupVehicleId !== undefined)
      updateData.emptyPickupVehicleId = emptyPickupVehicleId || null;
    if (emptyPickupDate !== undefined)
      updateData.emptyPickupDate = emptyPickupDate
        ? new Date(emptyPickupDate)
        : null;
    if (emptyPickupStart !== undefined)
      updateData.emptyPickupStart = emptyPickupStart || null;
    if (emptyPickupEnd !== undefined)
      updateData.emptyPickupEnd = emptyPickupEnd || null;
    if (deliveryVehicleId !== undefined)
      updateData.deliveryVehicleId = deliveryVehicleId || null;
    if (deliveryDate !== undefined)
      updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    if (deliveryStart !== undefined)
      updateData.deliveryStart = deliveryStart || null;
    if (deliveryEnd !== undefined) updateData.deliveryEnd = deliveryEnd || null;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = price;

    const currentOrder = existingOrder[0];
    const statusIsChanging =
      status !== undefined &&
      currentOrder &&
      status !== currentOrder.currentStatus;

    const result = await db.transaction(async (tx) => {
      const [updatedOrder] = await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
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
          deliveryStart: orders.deliveryStart,
          deliveryEnd: orders.deliveryEnd,
          description: orders.description,
          status: orders.status,
          price: orders.price,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        });

      // Update container data if provided (skip if table doesn't exist yet)
      if (containers !== undefined) {
        try {
          // Delete existing containers for this order
          await tx.delete(orderContainers).where(eq(orderContainers.orderId, id));

          // Insert new container data
          if (containers && containers.length > 0) {
            const containerInserts = containers
              .filter((container: { containerType: "D2" | "D4" | "R2" | "R4"; quantity: number }) => container.quantity > 0)
              .map((container: { containerType: "D2" | "D4" | "R2" | "R4"; quantity: number }) => ({
                orderId: id,
                containerType: container.containerType,
                quantity: container.quantity,
              }));

            if (containerInserts.length > 0) {
              await tx.insert(orderContainers).values(containerInserts);
            }
          }
        } catch (_error) {
          // Container data update failed - table may not exist, continuing without container data
          // Continue without container data if table doesn't exist
        }
      }

      // Create status history entry if status changed
      if (statusIsChanging && currentOrder && status) {
        await tx.insert(orderStatusHistory).values({
          orderId: id,
          previousStatus: currentOrder.currentStatus,
          newStatus: status,
          changedBy: null,
          changedAt: new Date(),
        });
      }

      return updatedOrder;
    });

    const updatedOrder = result;

    return NextResponse.json(
      {
        success: true,
        message: "Đơn hàng đã được cập nhật thành công",
        data: {
          order: updatedOrder,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Order update failed", "UPDATE_ORDER");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật đơn hàng. Vui lòng thử lại.",
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

    // Validate order ID
    const idValidation = OrderIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID đơn hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy đơn hàng",
        },
        { status: 404 }
      );
    }

    const orderToDelete = existingOrder[0];
    if (!orderToDelete) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy thông tin đơn hàng",
        },
        { status: 404 }
      );
    }

    await db.delete(orders).where(eq(orders.id, id));

    return NextResponse.json(
      {
        success: true,
        message: "Đơn hàng đã được xóa thành công",
        data: {
          deletedOrder: {
            id: orderToDelete.id,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Order deletion failed", "DELETE_ORDER");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xóa đơn hàng. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
