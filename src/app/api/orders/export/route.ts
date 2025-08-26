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
import { ORDER_STATUS_LABELS } from "@/schemas/order";
import {
  getOrderCostTypes,
  getOrdersToExportWithCosts,
} from "@/services/orders/getOrdersToExportWithCosts";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);

    // Get order cost types for dynamic columns
    const orderCostTypes = await getOrderCostTypes();

    // Get orders with cost data
    const data = await getOrdersToExportWithCosts(params);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu để xuất" },
        { status: 404 }
      );
    }

    const exportData = data.map((order) => {
      // Base order data
      const baseData = {
        "Mã container": order.containerCode || "",
        "Khách hàng": order.customerName,
        "Xe lấy rỗng": order.emptyPickupVehiclePlate || "",
        "Xe hạ hàng": order.deliveryVehiclePlate || "",
        "Ngày lấy rỗng": order.emptyPickupDate
          ? new Date(order.emptyPickupDate).toLocaleDateString("vi-VN")
          : "",
        "Điểm đầu lấy rỗng": order.emptyPickupStart || "",
        "Điểm cuối lấy rỗng": order.emptyPickupEnd || "",
        "Ngày hạ hàng": order.deliveryDate
          ? new Date(order.deliveryDate).toLocaleDateString("vi-VN")
          : "",
        "Điểm đầu hạ hàng": order.deliveryStart || "",
        "Điểm cuối hạ hàng": order.deliveryEnd || "",
        "Trạng thái":
          ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS],
        "Mô tả": order.description || "",
        "Ngày tạo": new Date(order.createdAt).toLocaleDateString("vi-VN"),
        "Ngày cập nhật": new Date(order.updatedAt).toLocaleDateString("vi-VN"),
        "Giá tiền": new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(parseFloat(order.price)),
      };

      // Add dynamic cost columns
      const costData: Record<string, string> = {};
      let totalOrderCosts = 0;

      orderCostTypes.forEach((costType) => {
        const costAmount = order.costs[costType.name] || null;
        const columnKey = `Chi phí ${costType.name}`;

        if (costAmount && costAmount !== "0") {
          const costValue = parseFloat(costAmount);
          totalOrderCosts += costValue;

          costData[columnKey] = new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(costValue);
        } else {
          // Empty string for orders without this cost type (as requested)
          costData[columnKey] = "";
        }
      });

      // Calculate profit: order price minus total costs
      const orderPrice = parseFloat(order.price);
      const profit = orderPrice - totalOrderCosts;

      const profitData = {
        "Lợi nhuận": new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(profit),
      };

      return { ...baseData, ...costData, ...profitData };
    });

    // Define base columns for Excel export with color-coded headers
    const baseColumns: ColumnDef<(typeof exportData)[0]>[] = [
      // General information - Light blue headers
      {
        key: "Khách hàng",
        header: "Khách hàng",
        accessor: (row) => row["Khách hàng"],
        width: 25,
        headerStyle: "header-general",
      },
      {
        key: "Mã container",
        header: "Mã container",
        accessor: (row) => row["Mã container"],
        width: 15,
        headerStyle: "header-general",
      },
      {
        key: "Trạng thái",
        header: "Trạng thái",
        accessor: (row) => row["Trạng thái"],
        width: 15,
        headerStyle: "header-general",
      },
      {
        key: "Mô tả",
        header: "Mô tả",
        accessor: (row) => row["Mô tả"],
        width: 30,
        headerStyle: "header-general",
      },
      {
        key: "Ngày tạo",
        header: "Ngày tạo",
        accessor: (row) => row["Ngày tạo"],
        width: 15,
        headerStyle: "header-general",
      },
      {
        key: "Ngày cập nhật",
        header: "Ngày cập nhật",
        accessor: (row) => row["Ngày cập nhật"],
        width: 15,
        headerStyle: "header-general",
      },

      // Empty pickup information - Light green headers
      {
        key: "Xe lấy rỗng",
        header: "Xe lấy rỗng",
        accessor: (row) => row["Xe lấy rỗng"],
        width: 15,
        headerStyle: "header-pickup",
      },
      {
        key: "Ngày lấy rỗng",
        header: "Ngày lấy rỗng",
        accessor: (row) => row["Ngày lấy rỗng"],
        width: 15,
        headerStyle: "header-pickup",
      },
      {
        key: "Điểm đầu lấy rỗng",
        header: "Điểm đầu lấy rỗng",
        accessor: (row) => row["Điểm đầu lấy rỗng"],
        width: 25,
        headerStyle: "header-pickup",
      },
      {
        key: "Điểm cuối lấy rỗng",
        header: "Điểm cuối lấy rỗng",
        accessor: (row) => row["Điểm cuối lấy rỗng"],
        width: 25,
        headerStyle: "header-pickup",
      },

      // Delivery information - Light orange headers
      {
        key: "Xe hạ hàng",
        header: "Xe hạ hàng",
        accessor: (row) => row["Xe hạ hàng"],
        width: 15,
        headerStyle: "header-delivery",
      },
      {
        key: "Ngày hạ hàng",
        header: "Ngày hạ hàng",
        accessor: (row) => row["Ngày hạ hàng"],
        width: 15,
        headerStyle: "header-delivery",
      },
      {
        key: "Điểm đầu hạ hàng",
        header: "Điểm đầu hạ hàng",
        accessor: (row) => row["Điểm đầu hạ hàng"],
        width: 25,
        headerStyle: "header-delivery",
      },
      {
        key: "Điểm cuối hạ hàng",
        header: "Điểm cuối hạ hàng",
        accessor: (row) => row["Điểm cuối hạ hàng"],
        width: 25,
        headerStyle: "header-delivery",
      },
    ];

    // Financial columns - Price column with cost styling
    const priceColumn: ColumnDef<Record<string, unknown>> = {
      key: "Giá tiền",
      header: "Giá tiền",
      accessor: (row: Record<string, unknown>) => row["Giá tiền"] as string,
      width: 15,
      headerStyle: "header-cost",
    };

    // Generate dynamic cost columns - Light red headers
    const costColumns: ColumnDef<Record<string, unknown>>[] = orderCostTypes.map((costType) => {
      const columnKey = `Chi phí ${costType.name}`;
      return {
        key: columnKey,
        header: columnKey,
        accessor: (row: Record<string, unknown>) => (row[columnKey] as string) || "",
        width: Math.max(20, costType.name.length + 10), // Dynamic width based on cost type name
        headerStyle: "header-cost",
      };
    });

    // Add profit column - Light yellow/gold header
    const profitColumn: ColumnDef<Record<string, unknown>> = {
      key: "Lợi nhuận",
      header: "Lợi nhuận",
      accessor: (row: Record<string, unknown>) => (row["Lợi nhuận"] as string) || "",
      width: 20,
      headerStyle: "header-profit",
    };

    // Combine base columns with financial columns (price, costs, profit)
    const columns = [...baseColumns, priceColumn, ...costColumns, profitColumn];

    // Create style and formatter registries
    const styleRegistry = new StyleRegistry();
    defaultStyles(styleRegistry);

    // Register custom header styles for different categories
    // General info headers - Light blue
    styleRegistry.register("header-general", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD6E3F0" } // Light blue
      },
      alignment: {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    });

    // Empty pickup headers - Light green
    styleRegistry.register("header-pickup", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2F0E2" } // Light green
      },
      alignment: {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    });

    // Delivery headers - Light orange
    styleRegistry.register("header-delivery", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFDE7CC" } // Light orange
      },
      alignment: {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    });

    // Cost headers - Light red
    styleRegistry.register("header-cost", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFDE7E7" } // Light red/pink
      },
      alignment: {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    });

    // Profit header - Light yellow/gold
    styleRegistry.register("header-profit", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF2CC" } // Light yellow/gold
      },
      alignment: {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
      }
    });

    const formatterRegistry = new FormatterRegistry();
    defaultFormatters(formatterRegistry);

    // Create Excel service
    const excelService = createExcelService({
      driver: new ExcelJSDriver(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styles: styleRegistry as any,
      formatters: formatterRegistry,
    });

    // Generate Excel buffer
    const buffer = await excelService.generate(
      {
        filename: `danh-sach-don-hang-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: "Danh sách đơn hàng",
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
    const filename = `danh-sach-don-hang-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    // Handle buffer validation
    if (!buffer) {
      return NextResponse.json(
        { error: "Không thể tạo file Excel" },
        { status: 500 }
      );
    }

    // Return Excel file with proper headers
    return new Response(buffer as BodyInit, {
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
    return NextResponse.json(
      {
        error: "Có lỗi xảy ra khi xuất dữ liệu đơn hàng",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
