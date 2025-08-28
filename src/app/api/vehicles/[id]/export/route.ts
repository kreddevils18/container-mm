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
import {
  getVehicleCostTypes,
  getVehicleToExportWithCosts,
} from "@/services/vehicles/getVehicleToExportWithCosts";

const VEHICLE_STATUS_LABELS = {
  available: "Có sẵn",
  unavailable: "Không khả dụng",
  maintenance: "Bảo trì",
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: vehicleId } = await params;

    if (!vehicleId) {
      return NextResponse.json(
        { error: "ID phương tiện không hợp lệ" },
        { status: 400 }
      );
    }

    const vehicleCostTypes = await getVehicleCostTypes();
    const vehicleData = await getVehicleToExportWithCosts(vehicleId);

    if (!vehicleData) {
      return NextResponse.json(
        { error: "Không tìm thấy phương tiện" },
        { status: 404 }
      );
    }

    const exportData = [{
      "Biển số xe": vehicleData.licensePlate,
      "Tên tài xế": vehicleData.driverName,
      "Số điện thoại": vehicleData.driverPhone,
      "CMND/CCCD": vehicleData.driverIdCard,
      "Trạng thái": VEHICLE_STATUS_LABELS[vehicleData.status as keyof typeof VEHICLE_STATUS_LABELS],
      "Ngày tạo": new Date(vehicleData.createdAt).toLocaleDateString("vi-VN"),
      "Ngày cập nhật": new Date(vehicleData.updatedAt).toLocaleDateString("vi-VN"),
      
      ...Object.fromEntries(
        vehicleCostTypes.map(costType => {
          const costAmount = vehicleData.costs[costType.name];
          const columnKey = `Chi phí ${costType.name}`;
          
          if (costAmount && costAmount !== "0") {
            const costValue = parseFloat(costAmount);
            return [columnKey, new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(costValue)];
          }
          return [columnKey, ""];
        })
      ),
      
      "Tổng chi phí": vehicleData.totalCosts && vehicleData.totalCosts !== "0.00"
        ? new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(parseFloat(vehicleData.totalCosts))
        : "",
    }];

    const baseColumns: ColumnDef<(typeof exportData)[0]>[] = [
      {
        key: "Biển số xe",
        header: "Biển số xe",
        accessor: (row) => row["Biển số xe"],
        width: 15,
        headerStyle: "header-general",
      },
      {
        key: "Tên tài xế",
        header: "Tên tài xế",
        accessor: (row) => row["Tên tài xế"],
        width: 25,
        headerStyle: "header-general",
      },
      {
        key: "Số điện thoại",
        header: "Số điện thoại",
        accessor: (row) => row["Số điện thoại"],
        width: 15,
        headerStyle: "header-general",
      },
      {
        key: "CMND/CCCD",
        header: "CMND/CCCD",
        accessor: (row) => row["CMND/CCCD"],
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
    ];

    const costColumns: ColumnDef<Record<string, unknown>>[] = vehicleCostTypes.map((costType) => {
      const columnKey = `Chi phí ${costType.name}`;
      return {
        key: columnKey,
        header: columnKey,
        accessor: (row: Record<string, unknown>) => (row[columnKey] as string) || "",
        width: Math.max(20, costType.name.length + 10),
        headerStyle: "header-cost",
      };
    });

    const totalColumn: ColumnDef<Record<string, unknown>> = {
      key: "Tổng chi phí",
      header: "Tổng chi phí",
      accessor: (row: Record<string, unknown>) => (row["Tổng chi phí"] as string) || "",
      width: 20,
      headerStyle: "header-total",
    };

    const columns = [...baseColumns, ...costColumns, totalColumn];

    const styleRegistry = new StyleRegistry();
    defaultStyles(styleRegistry);

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
        fgColor: { argb: "FFD6E3F0" }
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
        fgColor: { argb: "FFFDE7E7" }
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

    styleRegistry.register("header-total", {
      font: {
        bold: true,
        size: 11,
        name: "Calibri",
        color: { argb: "FF000000" }
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF2CC" }
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

    const excelService = createExcelService({
      driver: new ExcelJSDriver(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styles: styleRegistry as any,
      formatters: formatterRegistry,
    });

    const buffer = await excelService.generate(
      {
        filename: `chi-tiet-phuong-tien-${vehicleData.licensePlate}-${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: "Chi tiết phương tiện",
            columns,
            autoFilter: true,
            freeze: { row: 1 },
          },
          rows: exportData,
        },
      ],
      "memory"
    );

    const filename = `chi-tiet-phuong-tien-${vehicleData.licensePlate}-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    if (!buffer) {
      return NextResponse.json(
        { error: "Không thể tạo file Excel" },
        { status: 500 }
      );
    }

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
        error: "Có lỗi xảy ra khi xuất dữ liệu phương tiện",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}