import { inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { type NextRequest, NextResponse } from "next/server";
import { db, orderContainers } from "@/drizzle/schema";
import {
  getOrderCostTypes,
  getOrdersToExportWithCosts,
} from "@/services/orders/getOrdersToExportWithCosts";

interface OrderExportData {
  id: string;
  shippingLine: string | null;
  customerName: string;
  containerCode: string | null;
  bookingNumber: string | null;
  emptyPickupStart: string | null;
  emptyPickupDate: Date | null;
  emptyPickupDriverName: string | null;
  emptyPickupVehiclePlate: string | null;
  containers: { D2: number; D4: number; R2: number; R4: number };
  emptyPickupEnd: string | null;
  deliveryDate: Date | null;
  deliveryDriverName: string | null;
  deliveryVehiclePlate: string | null;
  deliveryEnd: string | null;
  price: string;
  oilQuantity: string | null;
  costs: Record<string, string>;
  totalCosts: number;
  profit: number;
  description: string | null;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams);

    // Get order cost types for dynamic columns
    const orderCostTypes = await getOrderCostTypes();

    // Get orders with cost data
    const ordersData = await getOrdersToExportWithCosts(params);

    if (!ordersData || ordersData.length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu để xuất" },
        { status: 404 }
      );
    }

    // Get all order IDs for container data
    const orderIds = ordersData.map((order) => order.id);

    // Get container data for all orders (skip if table doesn't exist yet)
    let containerData: {
      orderId: string;
      containerType: "D2" | "D4" | "R2" | "R4";
      quantity: number;
    }[] = [];
    try {
      containerData = await db
        .select()
        .from(orderContainers)
        .where(inArray(orderContainers.orderId, orderIds));
    } catch (_error) {
      // Container data query failed - table may not exist, continuing without container data
      // Continue without container data if table doesn't exist
    }

    // Process data for export
    const exportData: OrderExportData[] = ordersData.map((order) => {
      // Get container quantities
      const orderContainerData = containerData.filter(
        (c) => c.orderId === order.id
      );
      const containers = {
        D2:
          orderContainerData.find((c) => c.containerType === "D2")?.quantity ||
          0,
        D4:
          orderContainerData.find((c) => c.containerType === "D4")?.quantity ||
          0,
        R2:
          orderContainerData.find((c) => c.containerType === "R2")?.quantity ||
          0,
        R4:
          orderContainerData.find((c) => c.containerType === "R4")?.quantity ||
          0,
      };

      // Calculate total costs and profit
      let totalOrderCosts = 0;
      Object.values(order.costs).forEach((cost) => {
        if (cost && cost !== "0") {
          totalOrderCosts += parseFloat(cost);
        }
      });

      const orderPrice = parseFloat(order.price);
      const profit = orderPrice - totalOrderCosts;

      return {
        id: order.id,
        shippingLine: order.shippingLine,
        customerName: order.customerName,
        containerCode: order.containerCode,
        bookingNumber: order.bookingNumber,
        emptyPickupStart: order.emptyPickupStart,
        emptyPickupDate: order.emptyPickupDate
          ? new Date(order.emptyPickupDate)
          : null,
        emptyPickupDriverName: order.emptyPickupDriverName,
        emptyPickupVehiclePlate: order.emptyPickupVehiclePlate,
        containers,
        emptyPickupEnd: order.emptyPickupEnd,
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
        deliveryDriverName: order.deliveryDriverName,
        deliveryVehiclePlate: order.deliveryVehiclePlate,
        deliveryEnd: order.deliveryEnd,
        price: order.price,
        oilQuantity: order.oilQuantity,
        costs: order.costs,
        totalCosts: totalOrderCosts,
        profit,
        description: order.description,
      };
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách đơn hàng");

    // Define column structure
    const baseColumns = [
      { key: "shippingLine", header: "Hãng tàu" },
      { key: "customerName", header: "Khách hàng" },
      { key: "containerCode", header: "Số cont" },
      { key: "bookingNumber", header: "Số Booking" },
      { key: "emptyPickupStart", header: "Địa điểm lấy rỗng" },
      { key: "emptyPickupDate", header: "Ngày lấy rỗng" },
      { key: "emptyPickupDriverName", header: "Tài xế kéo về" },
      { key: "emptyPickupVehiclePlate", header: "Số xe" },
    ];

    const containerColumns = [
      { key: "D2", header: "D2" },
      { key: "D4", header: "D4" },
      { key: "R2", header: "R2" },
      { key: "R4", header: "R4" },
    ];

    const transportColumns = [
      { key: "emptyPickupEnd", header: "Gác kho" },
      { key: "deliveryDate", header: "Ngày kéo hàng đi hạ cảng" },
      { key: "deliveryDriverName", header: "Tài xế kéo đi" },
      { key: "deliveryVehiclePlate", header: "Số xe" },
      { key: "deliveryEnd", header: "Hạ Cảng" },
      { key: "price", header: "Giá cước" },
      { key: "oilQuantity", header: "Dầu(lít)" },
    ];

    const costColumns = orderCostTypes.map((costType) => ({
      key: `cost_${costType.name}`,
      header: costType.name,
    }));

    const finalColumns = [
      { key: "totalCosts", header: "Tổng chi phí" },
      { key: "profit", header: "Lợi nhuận" },
      { key: "description", header: "Ghi chú" },
    ];

    const allColumns = [
      ...baseColumns,
      ...containerColumns,
      ...transportColumns,
      ...costColumns,
      ...finalColumns,
    ];

    // Set up columns
    worksheet.columns = allColumns.map((col) => ({ key: col.key, width: 15 }));

    // Add empty first row and title row
    worksheet.addRow([]);
    const titleRow = worksheet.addRow(["DANH SÁCH ĐƠN HÀNG"]);

    // Merge title row across all columns
    worksheet.mergeCells(2, 1, 2, allColumns.length);
    titleRow.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.height = 30;

    // Create header rows
    const headerRow1 = worksheet.addRow([]);
    const headerRow2 = worksheet.addRow([]);

    // Row 1 - Merged headers
    let colIndex = 1;

    // Basic info (no merge for now - individual headers)
    baseColumns.forEach(() => {
      headerRow1.getCell(colIndex).value = "";
      colIndex++;
    });

    // LOẠI CONT header (merge across D2, D4, R2, R4)
    const containerStartCol = colIndex;
    headerRow1.getCell(colIndex).value = "LOẠI CONT";
    worksheet.mergeCells(
      3,
      containerStartCol,
      3,
      containerStartCol + containerColumns.length - 1
    );

    // Style LOẠI CONT header with yellow background
    for (
      let i = containerStartCol;
      i < containerStartCol + containerColumns.length;
      i++
    ) {
      const cell = headerRow1.getCell(i);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }, // Yellow
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    colIndex += containerColumns.length;

    // Transport info (no merge for now)
    transportColumns.forEach(() => {
      headerRow1.getCell(colIndex).value = "";
      colIndex++;
    });

    // CHI PHÍ header (merge across cost columns)
    if (costColumns.length > 0) {
      const costStartCol = colIndex;
      headerRow1.getCell(colIndex).value = "CHI PHÍ";
      worksheet.mergeCells(
        3,
        costStartCol,
        3,
        costStartCol + costColumns.length - 1
      );

      // Style CHI PHÍ header
      for (let i = costStartCol; i < costStartCol + costColumns.length; i++) {
        const cell = headerRow1.getCell(i);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" }, // Yellow
        };
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      colIndex += costColumns.length;
    }

    // Final columns (no merge)
    finalColumns.forEach(() => {
      headerRow1.getCell(colIndex).value = "";
      colIndex++;
    });

    // Row 2 - Individual column headers
    colIndex = 1;
    allColumns.forEach((col) => {
      const cell = headerRow2.getCell(colIndex);
      cell.value = col.header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Set background color based on column type
      if (
        colIndex >= containerStartCol &&
        colIndex < containerStartCol + containerColumns.length
      ) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" }, // Yellow for container columns
        };
      }

      colIndex++;
    });

    // Add data rows
    exportData.forEach((order) => {
      const rowData: any[] = [];

      // Basic columns
      rowData.push(
        order.shippingLine || "",
        order.customerName,
        order.containerCode || "",
        order.bookingNumber || "",
        order.emptyPickupStart || "",
        order.emptyPickupDate
          ? order.emptyPickupDate.toLocaleDateString("vi-VN")
          : "",
        order.emptyPickupDriverName || "",
        order.emptyPickupVehiclePlate || ""
      );

      // Container quantities
      rowData.push(
        order.containers.D2 || 0,
        order.containers.D4 || 0,
        order.containers.R2 || 0,
        order.containers.R4 || 0
      );

      // Transport columns
      rowData.push(
        order.emptyPickupEnd || "",
        order.deliveryDate
          ? order.deliveryDate.toLocaleDateString("vi-VN")
          : "",
        order.deliveryDriverName || "",
        order.deliveryVehiclePlate || "",
        order.deliveryEnd || "",
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(parseFloat(order.price)),
        order.oilQuantity || ""
      );

      // Cost columns
      orderCostTypes.forEach((costType) => {
        const costValue = order.costs[costType.name] || null;
        if (costValue && costValue !== "0") {
          rowData.push(
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(parseFloat(costValue))
          );
        } else {
          rowData.push("");
        }
      });

      // Final columns
      rowData.push(
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(order.totalCosts),
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(order.profit),
        order.description || ""
      );

      worksheet.addRow(rowData);
    });

    // Set row heights
    headerRow1.height = 25;
    headerRow2.height = 25;

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.key === "description") {
        column.width = 30;
      } else if (
        column.key === "emptyPickupStart" ||
        column.key === "deliveryEnd"
      ) {
        column.width = 25;
      } else {
        column.width = 15;
      }
    });

    // Add borders to all cells in the data table (including headers row 3 and 4, but not title rows 1 and 2)
    const dataStartRow = 3; // Start from header row 1
    const dataEndRow = 4 + exportData.length; // End at last data row
    const dataStartCol = 1;
    const dataEndCol = allColumns.length;

    // Apply border to each individual cell
    for (let row = dataStartRow; row <= dataEndRow; row++) {
      for (let col = dataStartCol; col <= dataEndCol; col++) {
        const cell = worksheet.getCell(row, col);
        
        // Apply thin borders to all sides of each cell
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } },
        };
        
        // Apply thick outer border for the entire table boundary
        if (row === dataStartRow) {
          cell.border = {
            ...cell.border,
            top: { style: "thick", color: { argb: "000000" } },
          };
        }
        if (row === dataEndRow) {
          cell.border = {
            ...cell.border,
            bottom: { style: "thick", color: { argb: "000000" } },
          };
        }
        if (col === dataStartCol) {
          cell.border = {
            ...cell.border,
            left: { style: "thick", color: { argb: "000000" } },
          };
        }
        if (col === dataEndCol) {
          cell.border = {
            ...cell.border,
            right: { style: "thick", color: { argb: "000000" } },
          };
        }
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename
    const filename = `danh-sach-don-hang-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    // Return Excel file
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
    // Export error occurred, returning error response
    return NextResponse.json(
      {
        error: "Có lỗi xảy ra khi xuất dữ liệu đơn hàng",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
