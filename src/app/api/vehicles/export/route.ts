import { type NextRequest, NextResponse } from "next/server";
import {
  type ColumnDef,
  createExcelService,
  defaultFormatters,
  defaultStyles,
  ExcelJSDriver,
  FormatterRegistry,
  StyleRegistry,
} from "@/lib/excel";
import { logger } from "@/lib/logger";
import { getVehiclesToExport } from "@/services/vehicles/getVehiclesToExport";
import type { VehicleExportData } from "@/types/export";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);
    const data = await getVehiclesToExport(params);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu để xuất" },
        { status: 404 }
      );
    }

    const exportData: VehicleExportData[] = data.map((item) => ({
      "Biển số xe": item.licensePlate,
      "Tên tài xế": item.driverName,
      "Số điện thoại": item.driverPhone || "",
      "CMND/CCCD": item.driverIdCard || "",
      "Trạng thái":
        item.status === "available"
          ? "Có sẵn"
          : item.status === "unavailable"
            ? "Không có sẵn"
            : "Bảo trì",
      "Ngày tạo": new Date(item.createdAt).toLocaleDateString("vi-VN"),
      "Ngày cập nhật": new Date(item.updatedAt).toLocaleDateString("vi-VN"),
    }));

    // Define columns for Excel export
    const columns: ColumnDef<(typeof exportData)[0]>[] = [
      {
        key: "Biển số xe",
        header: "Biển số xe",
        accessor: (row) => row["Biển số xe"],
        width: 20,
      },
      {
        key: "Tên tài xế",
        header: "Tên tài xế",
        accessor: (row) => row["Tên tài xế"],
        width: 25,
      },
      {
        key: "Số điện thoại",
        header: "Số điện thoại",
        accessor: (row) => row["Số điện thoại"],
        width: 18,
      },
      {
        key: "CMND/CCCD",
        header: "CMND/CCCD",
        accessor: (row) => row["CMND/CCCD"],
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
        width: 18,
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
        filename: `danh-sach-phuong-tien-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: "Danh sách phương tiện",
            columns,
            autoFilter: true,
            freeze: { row: 1 },
          },
          rows: exportData,
        },
      ],
      "memory"
    );

    // Create Vietnamese filename
    if (!buffer) {
      return NextResponse.json(
        { error: "Không thể tạo file Excel" },
        { status: 500 }
      );
    }

    const filename = `danh-sach-phuong-tien-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    // Return Excel file with proper headers
    return new Response(buffer as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logger.error("Vehicle export error", { error });

    return NextResponse.json(
      {
        error: "Có lỗi xảy ra khi xuất dữ liệu phương tiện",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
