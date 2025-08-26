import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, costs, costTypes } from "@/drizzle/schema";
import { UpdateCostRequestSchema } from "@/schemas/cost";
import { updateCost, deleteCost } from "@/services/costs";
import { logger } from "@/lib/logger";

const CostIdSchema = z.string().uuid();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/costs/[id]
 * 
 * Retrieves a specific cost entry with cost type information.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate cost ID
    const idValidation = CostIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID chi phí không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Get cost with cost type details
    const [cost] = await db
      .select({
        id: costs.id,
        costTypeId: costs.costTypeId,
        costTypeName: costTypes.name,
        costTypeCategory: costTypes.category,
        orderId: costs.orderId,
        amount: costs.amount,
        costDate: costs.costDate,
        description: costs.description,
        createdAt: costs.createdAt,
        updatedAt: costs.updatedAt,
      })
      .from(costs)
      .innerJoin(costTypes, eq(costs.costTypeId, costTypes.id))
      .where(eq(costs.id, id))
      .limit(1);

    if (!cost) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy chi phí",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          cost,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Failed to fetch cost", "GET_COST");
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi lấy thông tin chi phí. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/costs/[id]
 * 
 * Updates a specific cost entry.
 * Validates update data and ensures cost exists.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate cost ID
    const idValidation = CostIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID chi phí không hợp lệ",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedFields = UpdateCostRequestSchema.safeParse(body);

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

    // Update the cost
    const updatedCost = await updateCost(id, validatedFields.data);

    return NextResponse.json(
      {
        success: true,
        message: "Chi phí đã được cập nhật thành công",
        data: {
          cost: updatedCost,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Failed to update cost", "UPDATE_COST");
    
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
        message: "Đã xảy ra lỗi khi cập nhật chi phí. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/costs/[id]
 * 
 * Deletes a specific cost entry.
 * Ensures cost exists before deletion.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate cost ID
    const idValidation = CostIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ID chi phí không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Delete the cost
    const deletedCost = await deleteCost(id);

    return NextResponse.json(
      {
        success: true,
        message: deletedCost.message,
        data: {
          deletedCost: {
            id: deletedCost.id,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.logError(error, "Failed to delete cost", "DELETE_COST");
    
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
    }

    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xóa chi phí. Vui lòng thử lại.",
      },
      { status: 500 }
    );
  }
}