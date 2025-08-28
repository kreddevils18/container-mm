import {
  createExcelService,
  ExcelJSDriver,
  StyleRegistry,
  FormatterRegistry,
  defaultStyles,
  defaultFormatters,
  type ColumnDef,
} from "@/lib/excel";
import { logger } from "@/lib/logger";

export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  fileName: string,
  sheetName: string = "Dữ liệu"
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const firstRow = data[0];
  if (!firstRow) {
    throw new Error("No data to export");
  }

  const columns: ColumnDef<T>[] = Object.keys(firstRow).map((key) => ({
    key: key,
    header: key,
    accessor: (row: T) => row[key],
    width: getColumnWidth(key),
  }));

  const styleRegistry = new StyleRegistry();
  defaultStyles(styleRegistry);

  const formatterRegistry = new FormatterRegistry();
  defaultFormatters(formatterRegistry);

  const excelService = createExcelService({
    driver: new ExcelJSDriver(),
    styles: styleRegistry,
    formatters: formatterRegistry,
  });

  try {
    const buffer = await excelService.generate(
      {
        filename: fileName,
        creator: "Container Management System",
      },
      [
        {
          spec: {
            name: sheetName,
            columns,
            autoFilter: true,
            freeze: { row: 1 },
          },
          rows: data,
        },
      ],
      "memory"
    );

    if (!buffer) {
      throw new Error("Failed to generate Excel buffer");
    }

    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    logger.error("Excel export error", { error, fileName, sheetName, dataCount: data.length });
    throw new Error("Failed to generate Excel file");
  }
}

function getColumnWidth(columnName: string): number {
  const lowerName = columnName.toLowerCase();

  if (lowerName.includes("tên") || lowerName.includes("name")) return 25;
  if (lowerName.includes("địa chỉ") || lowerName.includes("address")) return 40;
  if (lowerName.includes("email")) return 30;
  if (lowerName.includes("điện thoại") || lowerName.includes("phone")) return 15;
  if (lowerName.includes("mã số") || lowerName.includes("tax")) return 15;
  if (lowerName.includes("trạng thái") || lowerName.includes("status")) return 15;
  if (lowerName.includes("ngày") || lowerName.includes("date")) return 15;
  if (lowerName.includes("mô tả") || lowerName.includes("description")) return 35;

  return 20;
}
