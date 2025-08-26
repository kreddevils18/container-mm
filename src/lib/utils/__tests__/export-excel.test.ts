/**
 * @fileoverview Tests for export-excel utility
 * @module lib/utils/__tests__/export-excel.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToExcel } from "../export-excel";

// Mock the Excel service
vi.mock("@/lib/excel", () => ({
  createExcelService: vi.fn(() => ({
    generate: vi.fn(),
  })),
  ExcelJSDriver: vi.fn(),
  defaultStyles: {},
  defaultFormatters: {},
}));

// Mock DOM APIs
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

/**
 * Test suite for exportToExcel utility function
 * 
 * Tests Excel export functionality including Vietnamese support,
 * file download, and error handling.
 */
describe("exportToExcel", () => {
  const mockData = [
    {
      "Tên khách hàng": "Công ty ABC",
      "Email": "contact@abc.com",
      "Địa chỉ": "123 Nguyễn Văn A, Quận 1, TP.HCM",
      "Trạng thái": "Hoạt động",
    },
    {
      "Tên khách hàng": "Công ty XYZ", 
      "Email": "info@xyz.com",
      "Địa chỉ": "456 Lê Văn B, Quận 2, TP.HCM",
      "Trạng thái": "Không hoạt động",
    },
  ];

  beforeEach(() => {
    // Setup DOM mocks
    Object.defineProperty(global, 'document', {
      value: {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
      },
      writable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        URL: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
      },
      writable: true,
    });

    // Setup mock element
    const mockElement = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockElement);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    // Mock successful Excel generation
    const { createExcelService } = require("@/lib/excel");
    createExcelService.mockReturnValue({
      generate: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test successful export with Vietnamese data
   */
  it("should export Vietnamese data successfully", async () => {
    const fileName = "test-export";
    const sheetName = "Dữ liệu test";

    await exportToExcel(mockData, fileName, sheetName);

    // Verify Excel service was called
    const { createExcelService } = require("@/lib/excel");
    expect(createExcelService).toHaveBeenCalledOnce();

    // Verify download was triggered
    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockAppendChild).toHaveBeenCalledOnce();
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRemoveChild).toHaveBeenCalledOnce();
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  /**
   * Test with default sheet name
   */
  it("should use default sheet name when not provided", async () => {
    await exportToExcel(mockData, "test-export");

    const { createExcelService } = require("@/lib/excel");
    const mockService = createExcelService();
    
    expect(mockService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "test-export",
        creator: "Container Management System",
      }),
      expect.arrayContaining([
        expect.objectContaining({
          spec: expect.objectContaining({
            name: "Dữ liệu",
          }),
        }),
      ]),
      "memory"
    );
  });

  /**
   * Test Vietnamese column width calculation
   */
  it("should calculate correct column widths for Vietnamese headers", async () => {
    await exportToExcel(mockData, "test-export");

    const { createExcelService } = require("@/lib/excel");
    const mockService = createExcelService();
    
    // Get the columns that were passed to the Excel service
    const generateCall = mockService.generate.mock.calls[0];
    const sheetSpec = generateCall[1][0].spec;
    const columns = sheetSpec.columns;

    // Check that Vietnamese columns have appropriate widths
    const nameColumn = columns.find((col: any) => col.key === "Tên khách hàng");
    const addressColumn = columns.find((col: any) => col.key === "Địa chỉ");
    const emailColumn = columns.find((col: any) => col.key === "Email");

    expect(nameColumn?.width).toBe(25); // Name columns should be 25
    expect(addressColumn?.width).toBe(40); // Address columns should be 40
    expect(emailColumn?.width).toBe(30); // Email columns should be 30
  });

  /**
   * Test error handling for empty data
   */
  it("should throw error for empty data", async () => {
    await expect(exportToExcel([], "test-export")).rejects.toThrow("No data to export");
  });

  /**
   * Test error handling for null/undefined data
   */
  it("should throw error for null data", async () => {
    await expect(exportToExcel(null as any, "test-export")).rejects.toThrow("No data to export");
  });

  /**
   * Test Excel service error handling
   */
  it("should handle Excel service errors", async () => {
    const { createExcelService } = require("@/lib/excel");
    createExcelService.mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("Excel generation failed")),
    });

    await expect(exportToExcel(mockData, "test-export")).rejects.toThrow("Failed to generate Excel file");
  });

  /**
   * Test correct file extension is added
   */
  it("should add .xlsx extension to download filename", async () => {
    const fileName = "test-export";
    
    await exportToExcel(mockData, fileName);

    const mockElement = mockCreateElement.mock.results[0].value;
    expect(mockElement.download).toBe(`${fileName}.xlsx`);
  });

  /**
   * Test blob creation with correct MIME type
   */
  it("should create blob with correct MIME type", async () => {
    await exportToExcel(mockData, "test-export");

    // Verify that createObjectURL was called
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
  });
});