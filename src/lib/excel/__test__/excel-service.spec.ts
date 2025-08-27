import { describe, it, expect, beforeEach, vi } from "vitest";
import { createExcelService } from "../core/excel-service";
import { StyleRegistry, defaultStyles } from "../core/style-registry";
import { FormatterRegistry, defaultFormatters } from "../core/formatter-registry";
import { FakeDriver } from "../drivers/fake-driver";
import type { SheetData, WorkbookSpec, ExcelPlugin } from "../types";

describe("ExcelService", () => {
  let driver: FakeDriver;
  let styles: StyleRegistry;
  let formatters: FormatterRegistry;

  beforeEach(() => {
    driver = new FakeDriver();
    styles = new StyleRegistry();
    formatters = new FormatterRegistry();
    
    defaultStyles(styles);
    defaultFormatters(formatters);
  });

  describe("basic functionality", () => {
    it("should generate excel with correct event sequence", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const workbook: WorkbookSpec = { filename: "test.xlsx" };
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { key: "name", header: "Name", path: "name" },
            { key: "amount", header: "Amount", path: "amount", style: "money" }
          ]
        },
        rows: [{ name: "Test", amount: 100 }]
      }];

      await service.generate(workbook, sheets, "memory");

      expect(driver.events).toHaveLength(6);
      expect(driver.events[0]).toEqual({ type: "createWorkbook", meta: workbook, mode: "memory" });
      expect(driver.events[1].type).toBe("addSheet");
      expect(driver.events[2].type).toBe("writeHeader");
      expect(driver.events[3].type).toBe("writeRow");
      expect(driver.events[4].type).toBe("commit");
      expect(driver.events[5].type).toBe("finalize");
    });

    it("should apply formatters to column values", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { key: "amount", header: "Amount", path: "amount", formatter: "currency" },
            { key: "date", header: "Date", path: "date", formatter: "isoDate" }
          ]
        },
        rows: [{ amount: "12.5", date: "2024-01-02" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const writeRowEvent = driver.events.find(e => e.type === "writeRow") as any;
      expect(writeRowEvent.values[0]).toBe(12.5);
      expect(writeRowEvent.values[1]).toBeInstanceOf(Date);
    });

    it("should apply styles to columns", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { key: "amount", header: "Amount", path: "amount", style: "money", numFmt: "#,##0.00" }
          ]
        },
        rows: [{ amount: 100 }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const writeRowEvent = driver.events.find(e => e.type === "writeRow") as any;
      expect(writeRowEvent.styles[0]).toMatchObject({
        numFmt: "#,##0.00",
        alignment: { horizontal: "right" }
      });
    });

    it("should support accessor functions", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { 
              key: "fullName", 
              header: "Full Name", 
              accessor: (row: any) => `${row.firstName} ${row.lastName}` 
            }
          ]
        },
        rows: [{ firstName: "John", lastName: "Doe" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const writeRowEvent = driver.events.find(e => e.type === "writeRow") as any;
      expect(writeRowEvent.values[0]).toBe("John Doe");
    });
  });

  describe("features", () => {
    it("should handle autoFilter", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [{ key: "name", header: "Name", path: "name" }],
          autoFilter: true
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      expect(driver.events.some(e => e.type === "enableAutoFilter")).toBe(true);
    });

    it("should handle freeze panes", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [{ key: "name", header: "Name", path: "name" }],
          freeze: { row: 1, col: 0 }
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const freezeEvent = driver.events.find(e => e.type === "freeze") as any;
      expect(freezeEvent).toEqual({ type: "freeze", row: 1, col: 0 });
    });

    it("should handle footer", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [{ key: "name", header: "Name", path: "name" }],
          footer: { label: "Total", style: "header" }
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const footerEvent = driver.events.find(e => e.type === "writeFooter") as any;
      expect(footerEvent.values[0]).toBe("Total");
      expect(footerEvent.style).toBeDefined();
    });
  });

  describe("hooks", () => {
    it("should call beforeWriteRow hook", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      const beforeWriteRowMock = vi.fn((row: any) => ({ ...row, processed: true }));
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { key: "name", header: "Name", path: "name" },
            { key: "processed", header: "Processed", path: "processed" }
          ],
          beforeWriteRow: beforeWriteRowMock
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      expect(beforeWriteRowMock).toHaveBeenCalledWith({ name: "Test" });
      
      const writeRowEvent = driver.events.find(e => e.type === "writeRow") as any;
      expect(writeRowEvent.values).toEqual(["Test", true]);
    });

    it("should call afterWriteRow hook", async () => {
      const afterWriteRowMock = vi.fn();
      const service = createExcelService({ driver, styles, formatters });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [{ key: "name", header: "Name", path: "name" }],
          afterWriteRow: afterWriteRowMock
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      expect(afterWriteRowMock).toHaveBeenCalledWith({ rowIndex: 0 });
    });
  });

  describe("plugins", () => {
    it("should call plugin hooks in correct order", async () => {
      const hookCalls: string[] = [];
      
      const plugin: ExcelPlugin = {
        beforeWorkbook: async () => { hookCalls.push("beforeWorkbook"); },
        beforeSheet: async () => { hookCalls.push("beforeSheet"); },
        afterSheet: async () => { hookCalls.push("afterSheet"); },
        afterWorkbook: async () => { hookCalls.push("afterWorkbook"); }
      };

      const service = createExcelService({ driver, styles, formatters, plugins: [plugin] });
      
      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [{ key: "name", header: "Name", path: "name" }]
        },
        rows: [{ name: "Test" }]
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      expect(hookCalls).toEqual([
        "beforeWorkbook",
        "beforeSheet", 
        "afterSheet",
        "afterWorkbook"
      ]);
    });
  });

  describe("async iterables", () => {
    it("should handle AsyncIterable data source", async () => {
      const service = createExcelService({ driver, styles, formatters });
      
      async function* generateRows() {
        yield { name: "Row1", value: 1 };
        yield { name: "Row2", value: 2 };
        yield { name: "Row3", value: 3 };
      }

      const sheets: SheetData<any>[] = [{
        spec: {
          name: "Sheet1",
          columns: [
            { key: "name", header: "Name", path: "name" },
            { key: "value", header: "Value", path: "value" }
          ]
        },
        rows: generateRows()
      }];

      await service.generate({ filename: "test.xlsx" }, sheets);

      const writeRowEvents = driver.events.filter(e => e.type === "writeRow");
      expect(writeRowEvents).toHaveLength(3);
      expect((writeRowEvents[0] as any).values).toEqual(["Row1", 1]);
      expect((writeRowEvents[1] as any).values).toEqual(["Row2", 2]);
      expect((writeRowEvents[2] as any).values).toEqual(["Row3", 3]);
    });
  });
});