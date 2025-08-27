import { describe, it, expect } from "vitest";
import { ExcelJSDriver } from "../drivers/exceljs-driver";
import Excel from "exceljs";

describe("ExcelJSDriver Memory Mode", () => {
  it("should create Excel workbook and generate buffer", async () => {
    const driver = new ExcelJSDriver();
    
    const workbook = await driver.createWorkbook({
      filename: "test.xlsx",
      creator: "Test"
    }, "memory");

    const sheet = await workbook.addSheet({
      name: "TestSheet",
      columns: [
        { header: "Name", width: 20 },
        { header: "Amount", width: 15 }
      ]
    });

    await sheet.writeHeader();
    await sheet.writeRow(["Test Name", 100]);
    await sheet.writeRow(["Another Name", 200]);
    
    await sheet.commit();
    await workbook.finalize();

    const buffer = await workbook.toBuffer?.();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should create workbook with proper metadata", async () => {
    const driver = new ExcelJSDriver();
    const testDate = new Date("2024-01-01");
    
    const workbook = await driver.createWorkbook({
      filename: "test.xlsx",
      creator: "TestCreator",
      created: testDate,
      modified: testDate
    }, "memory");

    await workbook.addSheet({
      name: "Sheet1", 
      columns: [{ header: "Test", width: 10 }]
    });
    
    await workbook.finalize();
    const buffer = await workbook.toBuffer?.();
    
    // Load back the workbook to verify metadata
    const loadedWorkbook = new Excel.Workbook();
    await loadedWorkbook.xlsx.load(buffer);
    
    expect(loadedWorkbook.creator).toBe("TestCreator");
    expect(loadedWorkbook.created).toEqual(testDate);
    expect(loadedWorkbook.modified).toEqual(testDate);
  });

  it("should support auto filter and freeze panes", async () => {
    const driver = new ExcelJSDriver();
    
    const workbook = await driver.createWorkbook({
      filename: "test.xlsx"
    }, "memory");

    const sheet = await workbook.addSheet({
      name: "FilterSheet",
      columns: [
        { header: "Col1", width: 10 },
        { header: "Col2", width: 10 }
      ]
    });

    await sheet.writeHeader();
    await sheet.writeRow(["A", 1]);
    await sheet.writeRow(["B", 2]);
    
    await sheet.enableAutoFilter?.();
    await sheet.freeze?.(1, 0);
    
    await sheet.commit();
    await workbook.finalize();

    const buffer = await workbook.toBuffer?.();
    
    // Load back to verify features
    const loadedWorkbook = new Excel.Workbook();
    await loadedWorkbook.xlsx.load(buffer);
    
    const worksheet = loadedWorkbook.getWorksheet("FilterSheet");
    expect(worksheet.autoFilter).toBeDefined();
    expect(worksheet.views).toBeDefined();
    expect(worksheet.views?.[0].state).toBe("frozen");
  });

  it("should handle styles and number formats", async () => {
    const driver = new ExcelJSDriver();
    
    const workbook = await driver.createWorkbook({
      filename: "styled.xlsx"
    }, "memory");

    const sheet = await workbook.addSheet({
      name: "StyledSheet",
      columns: [
        { header: "Text", width: 15 },
        { header: "Number", width: 15 }
      ]
    });

    await sheet.writeHeader();
    
    const styles = [
      { font: { bold: true } },
      { numFmt: "#,##0.00", alignment: { horizontal: "right" } }
    ];
    
    await sheet.writeRow(["Bold Text", 1234.56], styles);
    
    await sheet.commit();
    await workbook.finalize();

    const buffer = await workbook.toBuffer?.();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    
    // Basic verification that we can load the styled workbook
    const loadedWorkbook = new Excel.Workbook();
    await loadedWorkbook.xlsx.load(buffer);
    
    const worksheet = loadedWorkbook.getWorksheet("StyledSheet");
    expect(worksheet.rowCount).toBe(2); // Header + 1 data row
  });
});