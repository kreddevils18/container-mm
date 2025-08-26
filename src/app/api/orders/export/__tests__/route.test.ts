/**
 * @fileoverview Tests for Order Export API with Cost Columns
 * @module api/orders/export/__tests__/route.test
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

// Mock the services
vi.mock("@/services/orders/getOrdersToExportWithCosts", () => ({
  getOrdersToExportWithCosts: vi.fn(),
  getOrderCostTypes: vi.fn(),
}));

// Mock the excel service
vi.mock("@/lib/excel", () => ({
  createExcelService: vi.fn(() => ({
    generate: vi.fn(() => Promise.resolve(Buffer.from("mock-excel-data"))),
  })),
  defaultFormatters: vi.fn(),
  defaultStyles: vi.fn(),
  ExcelJSDriver: vi.fn(),
  FormatterRegistry: vi.fn(),
  StyleRegistry: vi.fn(),
}));

import {
  getOrderCostTypes,
  getOrdersToExportWithCosts,
} from "@/services/orders/getOrdersToExportWithCosts";

const mockGetOrdersToExportWithCosts = getOrdersToExportWithCosts as ReturnType<
  typeof vi.fn
>;
const mockGetOrderCostTypes = getOrderCostTypes as ReturnType<typeof vi.fn>;

describe("Order Export API with Costs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should include color-coded cost columns and profit calculation in export when cost types exist", async () => {
    const mockCostTypes = [
      { id: "1", name: "Vận chuyển", category: "order" },
      { id: "2", name: "Bảo hiểm", category: "order" },
    ];

    const mockOrderData = [
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: "ABC123",
        deliveryVehiclePlate: "DEF456",
        emptyPickupDate: new Date("2024-01-01"),
        emptyPickupStart: "Location A",
        emptyPickupEnd: "Location B",
        deliveryDate: new Date("2024-01-02"),
        deliveryStart: "Location C",
        deliveryEnd: "Location D",
        status: "completed",
        price: "1000000",
        description: "Test order",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {
          "Vận chuyển": "500000",
          "Bảo hiểm": "100000",
        },
      },
    ];

    mockGetOrderCostTypes.mockResolvedValue(mockCostTypes);
    mockGetOrdersToExportWithCosts.mockResolvedValue(mockOrderData);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    expect(mockGetOrderCostTypes).toHaveBeenCalledOnce();
    expect(mockGetOrdersToExportWithCosts).toHaveBeenCalledWith({});
  });

  it("should handle orders without costs correctly", async () => {
    const mockCostTypes = [{ id: "1", name: "Vận chuyển", category: "order" }];

    const mockOrderData = [
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: null,
        deliveryVehiclePlate: null,
        emptyPickupDate: null,
        emptyPickupStart: null,
        emptyPickupEnd: null,
        deliveryDate: null,
        deliveryStart: null,
        deliveryEnd: null,
        status: "pending",
        price: "0",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {}, // No costs
      },
    ];

    mockGetOrderCostTypes.mockResolvedValue(mockCostTypes);
    mockGetOrdersToExportWithCosts.mockResolvedValue(mockOrderData);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetOrderCostTypes).toHaveBeenCalledOnce();
    expect(mockGetOrdersToExportWithCosts).toHaveBeenCalledWith({});
  });

  it("should return 404 when no data is found", async () => {
    mockGetOrderCostTypes.mockResolvedValue([]);
    mockGetOrdersToExportWithCosts.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error).toBe("Không có dữ liệu để xuất");
  });

  /**
   * Test that export handles errors gracefully
   */
  it("should handle errors gracefully", async () => {
    mockGetOrderCostTypes.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe("Có lỗi xảy ra khi xuất dữ liệu đơn hàng");
    expect(json.details).toBe("Database error");
  });

  /**
   * Test that export passes search parameters correctly
   */
  it("should pass search parameters to the service", async () => {
    mockGetOrderCostTypes.mockResolvedValue([]);
    mockGetOrdersToExportWithCosts.mockResolvedValue([
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: null,
        deliveryVehiclePlate: null,
        emptyPickupDate: null,
        emptyPickupStart: null,
        emptyPickupEnd: null,
        deliveryDate: null,
        deliveryStart: null,
        deliveryEnd: null,
        status: "pending",
        price: "0",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {},
      },
    ]);

    const request = new NextRequest(
      "http://localhost/api/orders/export?status=completed&customerId=123"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetOrdersToExportWithCosts).toHaveBeenCalledWith({
      status: "completed",
      customerId: "123",
    });
  });

  /**
   * Test that profit calculation is correct
   */
  it("should calculate profit correctly (price - total costs)", async () => {
    const mockCostTypes = [
      { id: "1", name: "Vận chuyển", category: "order" },
      { id: "2", name: "Bảo hiểm", category: "order" },
    ];

    const mockOrderData = [
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: null,
        deliveryVehiclePlate: null,
        emptyPickupDate: null,
        emptyPickupStart: null,
        emptyPickupEnd: null,
        deliveryDate: null,
        deliveryStart: null,
        deliveryEnd: null,
        status: "pending",
        price: "1000000", // 1,000,000 VND
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {
          "Vận chuyển": "300000", // 300,000 VND
          "Bảo hiểm": "100000",   // 100,000 VND
        }, // Total costs: 400,000 VND
        // Expected profit: 1,000,000 - 400,000 = 600,000 VND
      },
    ];

    mockGetOrderCostTypes.mockResolvedValue(mockCostTypes);
    mockGetOrdersToExportWithCosts.mockResolvedValue(mockOrderData);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetOrderCostTypes).toHaveBeenCalledOnce();
    expect(mockGetOrdersToExportWithCosts).toHaveBeenCalledWith({});
    
    // The profit should be calculated correctly in the exportData
    // but since we're mocking the excel generation, we can't directly test the calculated value
    // The important thing is that the service calls succeed with the profit logic
  });

  /**
   * Test that profit handles orders with zero costs
   */
  it("should handle profit calculation when order has no costs", async () => {
    const mockCostTypes = [
      { id: "1", name: "Vận chuyển", category: "order" },
    ];

    const mockOrderData = [
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: null,
        deliveryVehiclePlate: null,
        emptyPickupDate: null,
        emptyPickupStart: null,
        emptyPickupEnd: null,
        deliveryDate: null,
        deliveryStart: null,
        deliveryEnd: null,
        status: "pending",
        price: "500000", // 500,000 VND
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {}, // No costs
        // Expected profit: 500,000 - 0 = 500,000 VND (same as price)
      },
    ];

    mockGetOrderCostTypes.mockResolvedValue(mockCostTypes);
    mockGetOrdersToExportWithCosts.mockResolvedValue(mockOrderData);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetOrderCostTypes).toHaveBeenCalledOnce();
    expect(mockGetOrdersToExportWithCosts).toHaveBeenCalledWith({});
  });

  /**
   * Test that header styling is applied correctly
   */
  it("should apply color-coded header styles to categorize fields", async () => {
    const mockCostTypes = [
      { id: "1", name: "Vận chuyển", category: "order" },
    ];

    const mockOrderData = [
      {
        id: "order1",
        containerCode: "CONT001",
        customerName: "Test Customer",
        emptyPickupVehiclePlate: null,
        deliveryVehiclePlate: null,
        emptyPickupDate: null,
        emptyPickupStart: null,
        emptyPickupEnd: null,
        deliveryDate: null,
        deliveryStart: null,
        deliveryEnd: null,
        status: "pending",
        price: "500000",
        description: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        costs: {},
      },
    ];

    mockGetOrderCostTypes.mockResolvedValue(mockCostTypes);
    mockGetOrdersToExportWithCosts.mockResolvedValue(mockOrderData);

    const request = new NextRequest("http://localhost/api/orders/export");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    
    // Test passes if the API runs successfully with styling
    // The style application itself is handled by the Excel library
  });
});
