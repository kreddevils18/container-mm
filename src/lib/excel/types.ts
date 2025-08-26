import type { Readable } from "node:stream";

export type ExcelMode = "memory" | "streaming";

export type CellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | RichTextValue;

export interface RichTextValue {
  richText: Array<{
    text: string;
    bold?: boolean;
    color?: string;
    font?: {
      name?: string;
      size?: number;
      italic?: boolean;
      underline?: boolean;
    };
  }>;
}

export interface ColumnDef<TRow> {
  key: string;
  header: string;
  accessor?: (row: TRow) => CellValue;
  path?: keyof TRow;
  width?: number;
  style?: string | Record<string, unknown>;
  numFmt?: string;
  formatter?: string;
  headerStyle?: string | Record<string, unknown>;
  totals?: {
    type: "sum" | "count" | "avg" | "max" | "min";
    style?: string;
  };
}

export interface SheetSpec<TRow> {
  name: string;
  columns: ColumnDef<TRow>[];
  freeze?: {
    row?: number;
    col?: number;
  };
  autoFilter?: boolean;
  beforeWriteRow?: (row: TRow) => undefined | TRow | Promise<undefined | TRow>;
  afterWriteRow?: (ctx: { rowIndex: number }) => void | Promise<void>;
  footer?: {
    style?: string | Record<string, unknown>;
    label?: string;
  };
}

export interface WorkbookSpec {
  filename: string;
  creator?: string;
  created?: Date;
  modified?: Date;
}

export interface SheetData<TRow> {
  spec: SheetSpec<TRow>;
  rows: Iterable<TRow> | AsyncIterable<TRow>;
}

export interface IExcelDriver {
  createWorkbook(meta: WorkbookSpec, mode: ExcelMode): Promise<IWorkbookWriter>;
}

export interface IWorkbookWriter {
  addSheet(spec: {
    name: string;
    columns: Array<{
      header: string;
      width?: number;
      style?: string | Record<string, unknown>;
      headerStyle?: string | Record<string, unknown>;
    }>;
  }): Promise<ISheetWriter>;
  finalize(): Promise<void>;
  toBuffer?(): Promise<Buffer>;
  getStream?(): Promise<Readable>;
}

export interface ISheetWriter {
  writeHeader(): Promise<void>;
  writeRow(values: CellValue[], cellStyles?: Array<string | Record<string, unknown>>): Promise<void>;
  writeFooter?(values: CellValue[], style?: string | Record<string, unknown>): Promise<void>;
  enableAutoFilter?(): Promise<void>;
  freeze?(row?: number, col?: number): Promise<void>;
  commit(): Promise<void>;
}

export interface ExcelPlugin {
  beforeWorkbook?(meta: WorkbookSpec): Promise<void> | void;
  beforeSheet?<TRow>(sheet: SheetSpec<TRow>): Promise<void> | void;
  afterSheet?<TRow>(sheet: SheetSpec<TRow>): Promise<void> | void;
  afterWorkbook?(meta: WorkbookSpec): Promise<void> | void;
}

export interface ExcelServiceDependencies {
  driver: IExcelDriver;
  styles?: StyleRegistry;
  formatters?: FormatterRegistry;
  plugins?: ExcelPlugin[];
}

export interface IExcelService {
  generate<TRow>(
    workbook: WorkbookSpec,
    sheets: Array<SheetData<TRow>>,
    mode?: ExcelMode
  ): Promise<Buffer | null>;
}

export interface StyleRegistry {
  register(name: string, style: Record<string, unknown>): void;
  resolve(style?: string | Record<string, unknown>, extra?: Record<string, unknown>): Record<string, unknown> | undefined;
}

export type Formatter = (value: unknown) => unknown;

export interface FormatterRegistry {
  register(name: string, fn: Formatter): void;
  apply(name: string, value: unknown): unknown;
}

export type ExcelEvent =
  | { type: "createWorkbook"; meta: WorkbookSpec; mode: ExcelMode }
  | { type: "addSheet"; name: string; columns: Array<Record<string, unknown>> }
  | { type: "writeHeader" }
  | { type: "writeRow"; values: CellValue[]; styles?: Array<string | Record<string, unknown>> }
  | { type: "writeFooter"; values: CellValue[]; style?: string | Record<string, unknown> }
  | { type: "enableAutoFilter" }
  | { type: "freeze"; row?: number; col?: number }
  | { type: "commit" }
  | { type: "finalize" };
