import type { 
  ExcelServiceDependencies,
  IExcelService,
  IWorkbookWriter,
  ISheetWriter,
  WorkbookSpec,
  SheetData,
  SheetSpec,
  ExcelMode,
  ColumnDef,
  CellValue,
  ExcelPlugin
} from "../types";

export class ExcelService implements IExcelService {
  constructor(private deps: ExcelServiceDependencies) {}

  async generate<TRow>(
    workbook: WorkbookSpec,
    sheets: Array<SheetData<TRow>>,
    mode: ExcelMode = "memory"
  ): Promise<Buffer | null> {
    await this.runPluginHooks("beforeWorkbook", workbook);

    const writer = await this.deps.driver.createWorkbook(workbook, mode);

    for (const sheetData of sheets) {
      await this.runPluginHooks("beforeSheet", sheetData.spec);
      await this.processSheet(writer, sheetData.spec, sheetData.rows);
      await this.runPluginHooks("afterSheet", sheetData.spec);
    }

    await writer.finalize();
    await this.runPluginHooks("afterWorkbook", workbook);

    return mode === "memory" && writer.toBuffer ? await writer.toBuffer() : null;
  }

  private async processSheet<TRow>(writer: IWorkbookWriter, spec: SheetSpec<TRow>, rows: Iterable<TRow> | AsyncIterable<TRow>): Promise<void> {
    const columns = spec.columns.map((col) => ({
      header: col.header,
      width: col.width,
      style: this.resolveStyle(col.style),
      headerStyle: this.resolveStyle(col.headerStyle)
    }));

    const sheet = await writer.addSheet({ name: spec.name, columns });
    
    await sheet.writeHeader();

    if (spec.autoFilter) {
      await sheet.enableAutoFilter?.();
    }

    if (spec.freeze) {
      await sheet.freeze?.(spec.freeze.row, spec.freeze.col);
    }

    let rowIndex = 0;
    const isAsync = this.isAsyncIterable(rows);

    if (isAsync) {
      for await (const row of rows as AsyncIterable<TRow>) {
        await this.processRow(sheet, spec, row, rowIndex);
        rowIndex++;
      }
    } else {
      for (const row of rows as Iterable<TRow>) {
        await this.processRow(sheet, spec, row, rowIndex);
        rowIndex++;
      }
    }

    if (spec.footer) {
      const footerValues = this.createFooterValues<TRow>(spec.columns, spec.footer.label);
      const footerStyle = this.resolveStyle(spec.footer.style);
      await sheet.writeFooter?.(footerValues, footerStyle);
    }

    await sheet.commit();
  }

  private async processRow<TRow>(sheet: ISheetWriter, spec: SheetSpec<TRow>, row: TRow, rowIndex: number): Promise<void> {
    let processedRow = row;

    if (spec.beforeWriteRow) {
      const result = await spec.beforeWriteRow(row);
      if (result !== undefined) {
        processedRow = result;
      }
    }

    const values = this.extractRowValues<TRow>(spec.columns, processedRow);
    const styles = this.extractRowStyles<TRow>(spec.columns, processedRow);

    await sheet.writeRow(values, styles.filter((s) => s !== undefined));

    if (spec.afterWriteRow) {
      await spec.afterWriteRow({ rowIndex });
    }
  }

  private extractRowValues<TRow>(columns: ColumnDef<TRow>[], row: TRow): CellValue[] {
    return columns.map(col => {
      let value: unknown;

      if (col.accessor) {
        value = col.accessor(row);
      } else if (col.path) {
        value = (row as any)[col.path];
      } else {
        value = null;
      }

      if (col.formatter && this.deps.formatters) {
        value = this.deps.formatters.apply(col.formatter, value);
      }

      return value as CellValue;
    });
  }

  private extractRowStyles<TRow>(columns: ColumnDef<TRow>[], _row: TRow): Array<string | Record<string, unknown> | undefined> {
    return columns.map(col => {
      const style = this.resolveStyle(col.style);
      if (col.numFmt && style) {
        return { ...style, numFmt: col.numFmt };
      }
      return style;
    });
  }

  private createFooterValues<TRow>(columns: ColumnDef<TRow>[], label?: string): CellValue[] {
    const values = new Array(columns.length).fill("");
    if (label && columns.length > 0) {
      values[0] = label;
    }
    return values as CellValue[];
  }

  private resolveStyle(style?: string | Record<string, unknown>): Record<string, unknown> | undefined {
    if (!this.deps.styles) return typeof style === 'object' ? style : undefined;
    return this.deps.styles.resolve(style) as Record<string, unknown> | undefined;
  }

  private isAsyncIterable<T>(obj: unknown): obj is AsyncIterable<T> {
    return obj != null && typeof (obj as any)[Symbol.asyncIterator] === "function";
  }

  private async runPluginHooks(hookName: keyof ExcelPlugin, ...args: unknown[]): Promise<void> {
    if (!this.deps.plugins) return;

    for (const plugin of this.deps.plugins) {
      const hook = plugin[hookName] as (...args: unknown[]) => Promise<void> | void;
      if (hook) {
        await hook(...args);
      }
    }
  }
}

export function createExcelService(deps: ExcelServiceDependencies): IExcelService {
  return new ExcelService(deps);
}