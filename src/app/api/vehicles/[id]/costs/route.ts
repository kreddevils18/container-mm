import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCostsByVehicleId, createCost } from "@/services/costs";
import { CreateCostRequestSchema } from "@/schemas/cost";

const vehicleIdSchema = z.object({
  id: z.string().uuid("ID phương tiện không hợp lệ"),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const validatedParams = vehicleIdSchema.safeParse(resolvedParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "ID phương tiện không hợp lệ",
          errors: validatedParams.error.issues 
        },
        { status: 400 }
      );
    }

    const vehicleId = validatedParams.data.id;
    const costs = await getCostsByVehicleId(vehicleId);

    return NextResponse.json({
      success: true,
      data: costs,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : "Đã xảy ra lỗi khi lấy danh sách chi phí phương tiện" 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicles/[id]/costs
 * Creates a new cost for a specific vehicle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const validatedParams = vehicleIdSchema.safeParse(resolvedParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "ID phương tiện không hợp lệ",
          errors: validatedParams.error.issues 
        },
        { status: 400 }
      );
    }

    const vehicleId = validatedParams.data.id;
    const body = await request.json();

    // Validate request body and ensure vehicleId is set
    const costData = {
      ...body,
      vehicleId,
      orderId: undefined, // Vehicle costs don't have orderId
    };

    const validatedData = CreateCostRequestSchema.safeParse(costData);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Dữ liệu không hợp lệ",
          errors: validatedData.error.issues 
        },
        { status: 400 }
      );
    }

    const newCost = await createCost(validatedData.data);

    return NextResponse.json({
      success: true,
      data: newCost,
      message: "Chi phí phương tiện đã được tạo thành công",
    }, { status: 201 });
  } catch (error) {
    // Error already handled through response
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : "Đã xảy ra lỗi khi tạo chi phí phương tiện" 
      },
      { status: 500 }
    );
  }
}