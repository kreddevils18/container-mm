import type { 
  IExcelDriver, 
  IWorkbookWriter, 
  ISheetWriter, 
  WorkbookSpec, 
  ExcelMode,
  ExcelEvent,
  CellValue 
} from "../types";

export class FakeDriver implements IExcelDriver {
  public readonly events: ExcelEvent[] = [];

  async createWorkbook(meta: WorkbookSpec, mode: ExcelMode): Promise<IWorkbookWriter> {
    this.events.push({ type: "createWorkbook", meta, mode });
    return new FakeWorkbookWriter(this.events);
  }

  clear(): void {
    this.events.length = 0;
  }
}

export class FakeWorkbookWriter implements IWorkbookWriter {
  constructor(private events: ExcelEvent[]) {}

  async addSheet(spec: {
    name: string;
    columns: Array<{
      header: string;
      width?: number;
      style?: unknown;
      headerStyle?: unknown;
    }>;
  }): Promise<ISheetWriter> {
    this.events.push({ type: "addSheet", name: spec.name, columns: spec.columns });
    return new FakeSheetWriter(this.events);
  }

  async finalize(): Promise<void> {
    this.events.push({ type: "finalize" });
  }

  async toBuffer(): Promise<Buffer> {
    return Buffer.from("fake-excel-data");
  }
}

export class FakeSheetWriter implements ISheetWriter {
  constructor(private events: ExcelEvent[]) {}

  async writeHeader(): Promise<void> {
    this.events.push({ type: "writeHeader" });
  }

  async writeRow(values: CellValue[], cellStyles?: Array<string | Record<string, unknown>>): Promise<void> {
    const convertedValues = values.map(v => {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null || v === undefined) {
        return String(v);
      }
      if (v instanceof Date) {
        return v.toISOString();
      }
      return typeof v === 'object' ? v : String(v);
    });
    this.events.push({ type: "writeRow", values: convertedValues, styles: cellStyles ? [...cellStyles] : undefined });
  }

  async writeFooter(values: CellValue[], style?: string | Record<string, unknown>): Promise<void> {
    const convertedValues = values.map(v => {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null || v === undefined) {
        return String(v);
      }
      if (v instanceof Date) {
        return v.toISOString();
      }
      return typeof v === 'object' ? v : String(v);
    });
    this.events.push({ type: "writeFooter", values: convertedValues, style });
  }

  async enableAutoFilter(): Promise<void> {
    this.events.push({ type: "enableAutoFilter" });
  }

  async freeze(row?: number, col?: number): Promise<void> {
    this.events.push({ type: "freeze", row: row ?? undefined, col: col ?? undefined });
  }

  async commit(): Promise<void> {
    this.events.push({ type: "commit" });
  }
}