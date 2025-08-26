import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCostType, updateCostType, deleteCostType } from "@/services/cost-types";
import { UpdateCostTypeRequestSchema } from "@/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID loại chi phí là bắt buộc" },
        { status: 400 }
      );
    }

    const costType = await getCostType(id);
    
    return NextResponse.json({
      success: true,
      data: costType,
    });
    
  } catch (_error) {
    // API Error - GET /api/costs/types/[id] logged for debugging
    
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy thông tin loại chi phí" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID loại chi phí là bắt buộc" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = UpdateCostTypeRequestSchema.parse(body);
    
    // Update cost type using service
    const result = await updateCostType(id, validatedData);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
    
  } catch (error) {
    // API Error - PUT /api/costs/types/[id] logged for debugging
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Dữ liệu không hợp lệ", 
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Lỗi khi cập nhật loại chi phí" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID loại chi phí là bắt buộc" },
        { status: 400 }
      );
    }

    // Delete cost type using service
    const result = await deleteCostType(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
    
  } catch (_error) {
    // API Error - DELETE /api/costs/types/[id] logged for debugging
    
    return NextResponse.json(
      { success: false, message: "Lỗi khi xóa loại chi phí" },
      { status: 500 }
    );
  }
}