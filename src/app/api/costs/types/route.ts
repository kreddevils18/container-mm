import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCostTypes, createCostType } from "@/services/cost-types";
import { CreateCostTypeRequestSchema } from "@/schemas/cost-type";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const data = await getCostTypes(params);

    return NextResponse.json({
      success: true,
      data: data.rows,
      pagination: data.pagination,
    });
  } catch (_error) {
    // API Error - GET /api/costs/types logged for debugging

    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách loại chi phí" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = CreateCostTypeRequestSchema.parse(body);

    const result = await createCostType(validatedData);

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
    }, { status: 201 });

  } catch (error) {
    // API Error - POST /api/costs/types logged for debugging

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
      { success: false, message: "Lỗi khi tạo loại chi phí" },
      { status: 500 }
    );
  }
}