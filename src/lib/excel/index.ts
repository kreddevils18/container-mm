export { createExcelService } from "./core/excel-service";

export { StyleRegistry, defaultStyles } from "./core/style-registry";
export { FormatterRegistry, defaultFormatters } from "./core/formatter-registry";

export { ExcelJSDriver } from "./drivers/exceljs-driver";
export { FakeDriver } from "./drivers/fake-driver";

export type {
  ExcelMode,
  CellValue,
  RichTextValue,
  ColumnDef,
  SheetSpec,
  WorkbookSpec,
  SheetData,
  IExcelDriver,
  IWorkbookWriter,
  ISheetWriter,
  ExcelPlugin,
  ExcelServiceDependencies,
  IExcelService,
  StyleRegistry as IStyleRegistry,
  FormatterRegistry as IFormatterRegistry,
  Formatter,
  ExcelEvent
} from "./types";