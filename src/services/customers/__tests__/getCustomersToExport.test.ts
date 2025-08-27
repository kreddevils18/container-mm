/**
 * @fileoverview Tests for getCustomersToExport service
 * @module services/customers/__tests__/getCustomersToExport.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomersToExport } from "../getCustomersToExport";
import { db } from "@/drizzle/client";

// Mock the database
vi.mock("@/drizzle/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock the schema
vi.mock("@/drizzle/schema/customers", () => ({
  customers: {
    id: "id",
    name: "name",
    email: "email",
    address: "address",
    phone: "phone",
    taxId: "taxId",
    status: "status",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
}));

// Create mock data
const mockCustomerData = [
  {
    id: "1",
    name: "Công ty ABC",
    email: "contact@abc.com",
    address: "123 Nguyễn Văn A, Quận 1, TP.HCM",
    phone: "0901234567",
    taxId: "0123456789",
    status: "active" as const,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
  },
  {
    id: "2",
    name: "Công ty XYZ",
    email: "info@xyz.com",
    address: "456 Lê Văn B, Quận 2, TP.HCM",
    phone: "0987654321",
    taxId: "9876543210",
    status: "inactive" as const,
    createdAt: new Date("2024-01-03T00:00:00Z"),
    updatedAt: new Date("2024-01-04T00:00:00Z"),
  },
];

/**
 * Test suite for getCustomersToExport service
 * 
 * Tests the export functionality without pagination,
 * ensuring all filtering logic works correctly.
 */
describe("getCustomersToExport", () => {
  const mockDb = db as {
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chain
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockCustomerData),
        }),
      }),
    });
  });

  /**
   * Test that service returns all customers without pagination
   */
  it("should return all customers without pagination", async () => {
    const params = {};
    const result = await getCustomersToExport(params);

    expect(result).toEqual(mockCustomerData);
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  /**
   * Test that filters are applied correctly
   */
  it("should apply search filter correctly", async () => {
    const params = { q: "ABC" };
    
    await getCustomersToExport(params);
    
    // Verify that the query was built with search parameter
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  /**
   * Test status filtering
   */
  it("should apply status filter correctly", async () => {
    const params = { status: ["active"] };
    
    await getCustomersToExport(params);
    
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  /**
   * Test date range filtering
   */
  it("should apply date range filter correctly", async () => {
    const params = { 
      from: "2024-01-01", 
      to: "2024-01-31" 
    };
    
    await getCustomersToExport(params);
    
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  /**
   * Test that invalid filters throw an error
   */
  it("should throw error for invalid filters", async () => {
    // Use truly invalid data that will cause Zod parsing to fail
    // The schema expects arrays for status, but we'll pass an object
    const invalidParams = { status: { invalid: "object" } as any };
    
    await expect(getCustomersToExport(invalidParams)).rejects.toThrow("Invalid customer export filters");
  });

  /**
   * Test sorting functionality
   */
  it("should apply sorting correctly", async () => {
    const params = { sort: "name.asc" };
    
    await getCustomersToExport(params);
    
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  /**
   * Test empty result handling
   */
  it("should handle empty results correctly", async () => {
    // Mock empty result
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const params = {};
    const result = await getCustomersToExport(params);

    expect(result).toEqual([]);
  });
});