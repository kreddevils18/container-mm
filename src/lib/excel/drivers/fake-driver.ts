import type { 
  IExcelDriver, 
  IWorkbookWriter, 
  ISheetWriter, 
  WorkbookSpec, 
  ExcelMode,
  ExcelEvent 
} from "../types.js";

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

  async writeRow(values: Array<unknown>, cellStyles?: Array<unknown>): Promise<void> {
    this.events.push({ type: "writeRow", values: [...values], styles: cellStyles ? [...cellStyles] : undefined });
  }

  async writeFooter(values: Array<unknown>, style?: unknown): Promise<void> {
    this.events.push({ type: "writeFooter", values: [...values], style });
  }

  async enableAutoFilter(): Promise<void> {
    this.events.push({ type: "enableAutoFilter" });
  }

  async freeze(row?: number, col?: number): Promise<void> {
    this.events.push({ type: "freeze", row, col });
  }

  async commit(): Promise<void> {
    this.events.push({ type: "commit" });
  }
}