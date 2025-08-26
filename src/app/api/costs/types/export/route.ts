import { type NextRequest, NextResponse } from "next/server";
import { getCostTypesToExport } from "@/services/cost-types/getCostTypesToExport";
import {
  createExcelService,
  ExcelJSDriver,
  StyleRegistry,
  FormatterRegistry,
  defaultStyles,
  defaultFormatters,
  type ColumnDef,
} from "@/lib/excel";

/**
 * GET /api/costs/types/export
 * Export cost types to Excel file with server-side processing
 * Supports all the same filters as the cost types list page
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);

    // Fetch export data using the same filters as the list page
    const data = await getCostTypesToExport(params);
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu để xuất" }, 
        { status: 404 }
      );
    }

    // Transform data for export with Vietnamese headers
    const exportData = data.map((item) => ({
      "Tên loại chi phí": item.name,
      "Mô tả": item.description || "",
      "Danh mục": item.category === "vehicle" ? "Chi phí xe" : "Chi phí đơn hàng",
      "Trạng thái": item.status === "active" ? "Hoạt động" : "Không hoạt động",
      "Ngày tạo": new Date(item.createdAt).toLocaleDateString("vi-VN"),
      "Ngày cập nhật": new Date(item.updatedAt).toLocaleDateString("vi-VN"),
    }));

    // Define columns for Excel export
    const columns: ColumnDef<typeof exportData[0]>[] = [
      {
        key: "Tên loại chi phí",
        header: "Tên loại chi phí",
        accessor: (row) => row["Tên loại chi phí"],
        width: 30,
      },
      {
        key: "Mô tả",
        header: "Mô tả",
        accessor: (row) => row["Mô tả"],
        width: 40,
      },
      {
        key: "Danh mục",
        header: "Danh mục",
        accessor: (row) => row["Danh mục"],
        width: 20,
      },
      {
        key: "Trạng thái",
        header: "Trạng thái",
        accessor: (row) => row["Trạng thái"],
        width: 15,
      },
      {
        key: "Ngày tạo",
        header: "Ngày tạo",
        accessor: (row) => row["Ngày tạo"],
        width: 15,
      },
      {
        key: "Ngày cập nhật",
        header: "Ngày cập nhật",
        accessor: (row) => row["Ngày cập nhật"],
        width: 15,
      },
    ];

    // Create style and formatter registries
    const styleRegistry = new StyleRegistry();
    defaultStyles(styleRegistry);
    
    const formatterRegistry = new FormatterRegistry();
    defaultFormatters(formatterRegistry);

    // Create Excel service
    const excelService = createExcelService({
      driver: new ExcelJSDriver(),
      styles: styleRegistry as any,
      formatters: formatterRegistry as any,
    });

    // Generate Excel buffer
    const buffer = await excelService.generate(
      {
        filename: `danh-sach-loai-chi-phi-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: "Danh sách loại chi phí",
            columns,
            autoFilter: true,
            freeze: { row: 1 },
          },
          rows: exportData,
        },
      ],
      "memory"
    );

    if (!buffer) {
      return NextResponse.json(
        { error: "Không thể tạo file Excel" },
        { status: 500 }
      );
    }

    // Create Vietnamese filename
    const filename = `danh-sach-loai-chi-phi-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    // Return Excel file with proper headers
    return new Response(buffer as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    // Export error logged for debugging
    
    return NextResponse.json(
      { 
        error: "Có lỗi xảy ra khi xuất dữ liệu loại chi phí",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}