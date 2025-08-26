import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { CreateCostRequestSchema } from "@/schemas/cost";
import { createCost, getCostsByOrderId } from "@/services/costs";

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

    const costs = await getCostsByOrderId(id);
    logger.info(`Costs: ${costs}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          costs,
          total: costs.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Failed to fetch order costs", "GET_ORDER_COSTS");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy danh sách chi phí. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]/costs
 *
 * Creates a new cost entry for the specified order.
 * Validates cost data and ensures order exists.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: orderId } = await params;

    // Validate order ID
    const idValidation = OrderIdSchema.safeParse(orderId);
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

    // Validate request body
    const validatedFields = CreateCostRequestSchema.safeParse({
      ...body,
      orderId, // Ensure orderId matches route parameter
    });

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Thông tin chi phí không hợp lệ",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Create the cost
    const newCost = await createCost(validatedFields.data);

    return NextResponse.json(
      {
        success: true,
        message: "Chi phí đã được tạo thành công",
        data: {
          cost: newCost,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.logError(error, "Failed to create cost", "CREATE_COST");

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("không tìm thấy")) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes("không hợp lệ")) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo chi phí. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}
