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
import { getCustomersToExport } from "@/services/customers/getCustomersToExport";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);
    const data = await getCustomersToExport(params);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu để xuất" },
        { status: 404 }
      );
    }

    const exportData = data.map((item) => ({
      "Tên khách hàng": item.name,
      Email: item.email || "",
      "Địa chỉ": item.address,
      "Số điện thoại": item.phone || "",
      "Mã số thuế": item.taxId || "",
      "Trạng thái": item.status === "active" ? "Hoạt động" : "Không hoạt động",
      "Ngày tạo": new Date(item.createdAt).toLocaleDateString("vi-VN"),
      "Ngày cập nhật": new Date(item.updatedAt).toLocaleDateString("vi-VN"),
    }));

    const columns: ColumnDef<(typeof exportData)[0]>[] = [
      {
        key: "Tên khách hàng",
        header: "Tên khách hàng",
        accessor: (row) => row["Tên khách hàng"],
        width: 25,
      },
      {
        key: "Email",
        header: "Email",
        accessor: (row) => row.Email,
        width: 30,
      },
      {
        key: "Địa chỉ",
        header: "Địa chỉ",
        accessor: (row) => row["Địa chỉ"],
        width: 40,
      },
      {
        key: "Số điện thoại",
        header: "Số điện thoại",
        accessor: (row) => row["Số điện thoại"],
        width: 15,
      },
      {
        key: "Mã số thuế",
        header: "Mã số thuế",
        accessor: (row) => row["Mã số thuế"],
        width: 15,
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
    const styleRegistry = new StyleRegistry();
    defaultStyles(styleRegistry);

    const formatterRegistry = new FormatterRegistry();
    defaultFormatters(formatterRegistry);
    const excelService = createExcelService({
      driver: new ExcelJSDriver(),
      styles: styleRegistry as any,
      formatters: formatterRegistry as any,
    });
    const buffer = await excelService.generate(
      {
        filename: `danh-sach-khach-hang-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: "Danh sách khách hàng",
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

    const filename = `danh-sach-khach-hang-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);
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
    logger.error("Customer export error", { error });

    return NextResponse.json(
      {
        error: "Có lỗi xảy ra khi xuất dữ liệu khách hàng",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
