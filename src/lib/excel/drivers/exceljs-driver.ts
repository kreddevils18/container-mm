import Excel from "exceljs";
import type { 
  IExcelDriver, 
  IWorkbookWriter, 
  ISheetWriter, 
  WorkbookSpec, 
  ExcelMode 
} from "../types";
import type { Readable } from "node:stream";

export class ExcelJSDriver implements IExcelDriver {
  constructor(private stream?: NodeJS.WritableStream) {}

  async createWorkbook(meta: WorkbookSpec, mode: ExcelMode): Promise<IWorkbookWriter> {
    if (mode === "memory") {
      return new MemoryWorkbookWriter(meta);
    } else {
      return new StreamingWorkbookWriter(meta, this.stream);
    }
  }
}

class MemoryWorkbookWriter implements IWorkbookWriter {
  private workbook: Excel.Workbook;

  constructor(meta: WorkbookSpec) {
    this.workbook = new Excel.Workbook();
    this.workbook.creator = meta.creator || "ExcelService";
    this.workbook.created = meta.created || new Date();
    this.workbook.modified = meta.modified || new Date();
  }

  async addSheet(spec: {
    name: string;
    columns: Array<{
      header: string;
      width?: number;
      style?: Partial<Excel.Style>;
      headerStyle?: Partial<Excel.Style>;
    }>;
  }): Promise<ISheetWriter> {
    const worksheet = this.workbook.addWorksheet(spec.name);
    
    worksheet.columns = spec.columns.map(col => ({
      header: col.header,
      key: col.header.toLowerCase().replace(/\s+/g, '_'),
      width: col.width || 15
    }));

    return new MemorySheetWriter(worksheet, spec.columns);
  }

  async finalize(): Promise<void> {
    // Nothing to do for memory mode
  }

  async toBuffer(): Promise<Buffer> {
    const buffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }
}

class MemorySheetWriter implements ISheetWriter {
  constructor(
    private worksheet: Excel.Worksheet,
    private columns: Array<{ header: string; headerStyle?: Partial<Excel.Style> }>
  ) {}

  async writeHeader(): Promise<void> {
    const headerRow = this.worksheet.getRow(1);
    
    this.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      if (col.headerStyle) {
        Object.assign(cell, col.headerStyle);
      }
    });
    
    headerRow.commit();
  }

  async writeRow(values: Excel.CellValue[], cellStyles?: Array<Partial<Excel.Style>>): Promise<void> {
    const row = this.worksheet.addRow(values);
    
    if (cellStyles) {
      cellStyles.forEach((style, index) => {
        if (style) {
          const cell = row.getCell(index + 1);
          Object.assign(cell, style);
        }
      });
    }
    
    row.commit();
  }

  async writeFooter(values: Excel.CellValue[], style?: Partial<Excel.Style>): Promise<void> {
    const row = this.worksheet.addRow(values);
    
    if (style) {
      values.forEach((_, index) => {
        const cell = row.getCell(index + 1);
        Object.assign(cell, style);
      });
    }
    
    row.commit();
  }

  async enableAutoFilter(): Promise<void> {
    const lastCol = this.worksheet.columnCount;
    this.worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: lastCol }
    };
  }

  async freeze(row?: number, col?: number): Promise<void> {
    this.worksheet.views = [{
      state: "frozen",
      xSplit: col || 0,
      ySplit: row || 1
    }];
  }

  async commit(): Promise<void> {
    // Nothing to do for memory mode
  }
}

class StreamingWorkbookWriter implements IWorkbookWriter {
  private workbook: Excel.stream.xlsx.WorkbookWriter;

  constructor(meta: WorkbookSpec, stream?: NodeJS.WritableStream) {
    const options: Partial<Excel.stream.xlsx.WorkbookStreamWriterOptions> = {
      useStyles: true,
      useSharedStrings: true
    };
    
    if (stream) {
      options.stream = stream as any;
    }

    this.workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    this.workbook.creator = meta.creator || "ExcelService";
    this.workbook.created = meta.created || new Date();
    this.workbook.modified = meta.modified || new Date();
  }

  async addSheet(spec: {
    name: string;
    columns: Array<{
      header: string;
      width?: number;
      style?: Partial<Excel.Style>;
      headerStyle?: Partial<Excel.Style>;
    }>;
  }): Promise<ISheetWriter> {
    const worksheet = this.workbook.addWorksheet(spec.name);
    
    worksheet.columns = spec.columns.map(col => ({
      header: col.header,
      key: col.header.toLowerCase().replace(/\s+/g, '_'),
      width: col.width || 15
    }));

    return new StreamingSheetWriter(worksheet, spec.columns);
  }

  async finalize(): Promise<void> {
    await this.workbook.commit();
  }

  async getStream(): Promise<Readable> {
    // ExcelJS WorkbookWriter doesn't expose a stream property directly
    // For streaming workbooks, we need to pipe to a stream
    throw new Error("getStream not implemented for streaming workbook writer");
  }
}

class StreamingSheetWriter implements ISheetWriter {
  constructor(
    private worksheet: Excel.Worksheet,
    private columns: Array<{ header: string; headerStyle?: Partial<Excel.Style> }>
  ) {}

  async writeHeader(): Promise<void> {
    const headers = this.columns.map(col => col.header);
    const headerRow = this.worksheet.addRow(headers);
    
    this.columns.forEach((col, index) => {
      if (col.headerStyle) {
        const cell = headerRow.getCell(index + 1);
        Object.assign(cell, col.headerStyle);
      }
    });
    
    headerRow.commit();
  }

  async writeRow(values: Excel.CellValue[], cellStyles?: Array<Partial<Excel.Style>>): Promise<void> {
    const row = this.worksheet.addRow(values);
    
    if (cellStyles) {
      cellStyles.forEach((style, index) => {
        if (style) {
          const cell = row.getCell(index + 1);
          Object.assign(cell, style);
        }
      });
    }
    
    row.commit();
  }

  async writeFooter(values: Excel.CellValue[], style?: Partial<Excel.Style>): Promise<void> {
    const row = this.worksheet.addRow(values);
    
    if (style) {
      values.forEach((_, index) => {
        const cell = row.getCell(index + 1);
        Object.assign(cell, style);
      });
    }
    
    row.commit();
  }

  async enableAutoFilter(): Promise<void> {
    const lastCol = this.worksheet.columnCount;
    this.worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: lastCol }
    };
  }

  async freeze(row?: number, col?: number): Promise<void> {
    this.worksheet.views = [{
      state: "frozen",
      xSplit: col || 0,
      ySplit: row || 1
    }];
  }

  async commit(): Promise<void> {
    this.worksheet.commit();
  }
}