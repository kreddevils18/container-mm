import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { and, gte, lte, ilike, inArray, asc, desc, type SQL } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { CustomerDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Customer } from "../../types";
import { customers } from "@/drizzle/schema/customers";

interface ExportFilters {
  q?: string;
  status?: string[];
  from?: string;
  to?: string;
  sort?: string;
}

describe("Customer Export Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;
  let testCustomers: Customer[];

  beforeAll(async () => {
    container = await setupTestContainer();
    const { db, sql } = await setupDatabase(container);
    dbHelper = new DatabaseTestHelper(db, sql);
  }, 30000);

  afterAll(async () => {
    await globalCleanup();
  });

  beforeEach(async () => {
    await dbHelper.clearAllData();
    
    const basicData = CustomerDataFactory.createBasicCustomers();
    const vietnameseData = CustomerDataFactory.createVietnameseCustomers();
    const activeCustomers = CustomerDataFactory.createCustomersWithStatus("active", 5);
    const inactiveCustomers = CustomerDataFactory.createCustomersWithStatus("inactive", 3);
    
    testCustomers = await dbHelper.insertTestCustomers([
      ...basicData, 
      ...vietnameseData, 
      ...activeCustomers, 
      ...inactiveCustomers
    ]);
  });

  async function getCustomersForExport(filters: ExportFilters = {}): Promise<Customer[]> {
    const where = and(
      filters.q ? ilike(customers.name, `%${filters.q}%`) : undefined,
      filters.status?.length ? inArray(customers.status, filters.status as ("active" | "inactive")[]) : undefined,
      filters.from ? gte(customers.createdAt, new Date(filters.from)) : undefined,
      filters.to ? lte(customers.createdAt, new Date(filters.to)) : undefined
    );

    const sortOrder = filters.sort || "createdAt.desc";
    let orderBy: SQL;
    
    switch (sortOrder) {
      case "createdAt.asc":
        orderBy = asc(customers.createdAt);
        break;
      case "name.asc":
        orderBy = asc(customers.name);
        break;
      case "name.desc":
        orderBy = desc(customers.name);
        break;
      default:
        orderBy = desc(customers.createdAt);
    }

    return dbHelper.getDb()
      .select()
      .from(customers)
      .where(where)
      .orderBy(orderBy);
  }

  function transformDataForExport(data: Customer[]): Record<string, any>[] {
    return data.map((item) => ({
      "Tên khách hàng": item.name,
      Email: item.email || "",
      "Địa chỉ": item.address,
      "Số điện thoại": item.phone || "",
      "Mã số thuế": item.taxId || "",
      "Trạng thái": item.status === "active" ? "Hoạt động" : "Không hoạt động",
      "Ngày tạo": new Date(item.createdAt).toLocaleDateString("vi-VN"),
      "Ngày cập nhật": new Date(item.updatedAt).toLocaleDateString("vi-VN"),
    }));
  }

  describe("Basic Export Functionality", () => {
    it("should export all customers without filters", async () => {
      const results = await getCustomersForExport();
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBe(testCustomers.length);
    });

    it("should transform customer data for export correctly", async () => {
      const customers = await getCustomersForExport();
      const exportData = transformDataForExport(customers.slice(0, 1));
      
      expect(exportData[0]).toHaveProperty("Tên khách hàng");
      expect(exportData[0]).toHaveProperty("Email");
      expect(exportData[0]).toHaveProperty("Địa chỉ");
      expect(exportData[0]).toHaveProperty("Số điện thoại");
      expect(exportData[0]).toHaveProperty("Mã số thuế");
      expect(exportData[0]).toHaveProperty("Trạng thái");
      expect(exportData[0]).toHaveProperty("Ngày tạo");
      expect(exportData[0]).toHaveProperty("Ngày cập nhật");
    });

    it("should handle empty result set", async () => {
      await dbHelper.clearAllData();
      
      const results = await getCustomersForExport();
      
      expect(results).toHaveLength(0);
    });

    it("should preserve Vietnamese characters in export", async () => {
      const vietnameseCustomer = testCustomers.find(c => c.name.includes("Nguyễn"));
      expect(vietnameseCustomer).toBeDefined();
      
      const results = await getCustomersForExport({ q: "Nguyễn" });
      const exportData = transformDataForExport(results);
      
      expect(exportData[0]?.["Tên khách hàng"]).toContain("Nguyễn");
    });
  });

  describe("Filtered Export", () => {
    it("should export customers filtered by name", async () => {
      const nameFilter = "John";
      
      const results = await getCustomersForExport({ q: nameFilter });
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(customer => {
        expect(customer.name.toLowerCase()).toContain(nameFilter.toLowerCase());
      });
    });

    it("should export customers filtered by status", async () => {
      const results = await getCustomersForExport({ status: ["active"] });
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(customer => {
        expect(customer.status).toBe("active");
      });
    });

    it("should export customers filtered by multiple statuses", async () => {
      const results = await getCustomersForExport({ 
        status: ["active", "inactive"] 
      });
      
      expect(results.length).toBe(testCustomers.length);
    });

    it("should export customers filtered by date range", async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const results = await getCustomersForExport({
        from: oneHourAgo.toISOString(),
        to: now.toISOString()
      });
      
      expect(results.length).toBe(testCustomers.length);
      results.forEach(customer => {
        expect(new Date(customer.createdAt).getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(new Date(customer.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it("should export customers with combined filters", async () => {
      const results = await getCustomersForExport({
        status: ["active"],
        q: "Customer"
      });
      
      results.forEach(customer => {
        expect(customer.status).toBe("active");
        expect(customer.name.toLowerCase()).toContain("customer");
      });
    });

    it("should handle filters with no matching results", async () => {
      const results = await getCustomersForExport({
        q: "NonExistentCustomer"
      });
      
      expect(results).toHaveLength(0);
    });
  });

  describe("Export Sorting", () => {
    it("should sort customers by creation date descending (default)", async () => {
      const results = await getCustomersForExport();
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(new Date(results[i]!.createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(results[i + 1]!.createdAt).getTime());
      }
    });

    it("should sort customers by creation date ascending", async () => {
      const results = await getCustomersForExport({ sort: "createdAt.asc" });
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(new Date(results[i]!.createdAt).getTime())
          .toBeLessThanOrEqual(new Date(results[i + 1]!.createdAt).getTime());
      }
    });

    it("should sort customers by name ascending", async () => {
      const results = await getCustomersForExport({ sort: "name.asc" });
      
      // Verify that names are actually sorted (database sort, not JavaScript localeCompare)
      expect(results.length).toBeGreaterThan(1);
      
      // Extract names and verify they're sorted
      const names = results.map(r => r.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it("should sort customers by name descending", async () => {
      const results = await getCustomersForExport({ sort: "name.desc" });
      
      // Verify that names are sorted in descending order (database sort)
      expect(results.length).toBeGreaterThan(1);
      
      // Extract names and verify they're sorted in descending order
      const names = results.map(r => r.name);
      const sortedNames = [...names].sort().reverse();
      expect(names).toEqual(sortedNames);
    });

    it("should handle invalid sort parameter gracefully", async () => {
      const results = await getCustomersForExport({ sort: "invalid.sort" });
      
      expect(results.length).toBe(testCustomers.length);
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(new Date(results[i]!.createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(results[i + 1]!.createdAt).getTime());
      }
    });
  });

  describe("Export Data Transformation", () => {
    it("should transform status values to Vietnamese", async () => {
      const results = await getCustomersForExport();
      const exportData = transformDataForExport(results);
      
      const activeCustomer = exportData.find(item => 
        item["Trạng thái"] === "Hoạt động"
      );
      const inactiveCustomer = exportData.find(item => 
        item["Trạng thái"] === "Không hoạt động"
      );
      
      expect(activeCustomer).toBeDefined();
      expect(inactiveCustomer).toBeDefined();
    });

    it("should format dates in Vietnamese locale", async () => {
      const results = await getCustomersForExport();
      const exportData = transformDataForExport(results.slice(0, 1));
      
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      
      expect(exportData[0]?.["Ngày tạo"]).toMatch(dateRegex);
      expect(exportData[0]?.["Ngày cập nhật"]).toMatch(dateRegex);
    });

    it("should handle null/empty values correctly", async () => {
      const customerWithNulls = CustomerDataFactory.createSingleCustomer({
        name: "Null Test Customer",
        address: "Test Address",
        email: undefined,
        phone: undefined,
        taxId: undefined,
      });
      
      await dbHelper.insertTestCustomers([customerWithNulls]);
      
      const results = await getCustomersForExport({ q: "Null Test" });
      const exportData = transformDataForExport(results);
      
      expect(exportData[0]?.Email).toBe("");
      expect(exportData[0]?.["Số điện thoại"]).toBe("");
      expect(exportData[0]?.["Mã số thuế"]).toBe("");
    });

    it("should handle special characters in data", async () => {
      const specialCustomer = CustomerDataFactory.createSingleCustomer({
        name: "Special & <characters> \"test\"",
        address: "Address with @#$% symbols",
        email: "special+test@example.com",
      });
      
      await dbHelper.insertTestCustomers([specialCustomer]);
      
      const results = await getCustomersForExport({ q: "Special" });
      const exportData = transformDataForExport(results);
      
      expect(exportData[0]?.["Tên khách hàng"]).toContain("Special");
      expect(exportData[0]?.["Địa chỉ"]).toContain("@#$%");
      expect(exportData[0]?.Email).toContain("+");
    });
  });

  describe("Export Performance", () => {
    beforeEach(async () => {
      await dbHelper.clearAllData();
      
      const largeDataset = CustomerDataFactory.createLargeDataset(1000);
      await dbHelper.insertTestCustomers(largeDataset);
    });

    it("should handle large dataset export efficiently", async () => {
      const startTime = Date.now();
      
      const results = await getCustomersForExport();
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(5000);
      expect(results.length).toBe(1000);
    });

    it("should handle filtered export on large dataset", async () => {
      const startTime = Date.now();
      
      const results = await getCustomersForExport({
        status: ["active"],
        sort: "name.asc"
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(3000);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(customer => {
        expect(customer.status).toBe("active");
      });
    });

    it("should transform large dataset efficiently", async () => {
      const results = await getCustomersForExport();
      
      const startTime = Date.now();
      const exportData = transformDataForExport(results);
      const endTime = Date.now();
      
      const transformTime = endTime - startTime;
      
      expect(transformTime).toBeLessThan(2000);
      expect(exportData.length).toBe(results.length);
    });

    it("should handle memory efficiently during export", async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const results = await getCustomersForExport();
      const exportData = transformDataForExport(results);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      expect(exportData.length).toBe(1000);
    });
  });

  describe("Export Edge Cases", () => {
    it("should handle export with invalid date filters", async () => {
      await expect(
        getCustomersForExport({
          from: "invalid-date",
          to: "2024-01-01"
        })
      ).rejects.toThrow();
    });

    it("should handle export with future date filter", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const results = await getCustomersForExport({
        from: futureDate.toISOString()
      });
      
      expect(results).toHaveLength(0);
    });

    it("should handle concurrent export requests", async () => {
      const promises = Array.from({ length: 5 }, () =>
        getCustomersForExport({ status: ["active"] })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        result.forEach(customer => {
          expect(customer.status).toBe("active");
        });
      });
    });

    it("should maintain data consistency during export", async () => {
      const firstExport = await getCustomersForExport();
      const secondExport = await getCustomersForExport();
      
      expect(firstExport.length).toBe(secondExport.length);
      expect(firstExport[0]?.id).toBe(secondExport[0]?.id);
    });

    it("should handle export during data modifications", async () => {
      const newCustomer = CustomerDataFactory.createSingleCustomer();
      
      const exportPromise = getCustomersForExport();
      const insertPromise = dbHelper.insertTestCustomers([newCustomer]);
      
      const [exportResult] = await Promise.all([exportPromise, insertPromise]);
      
      expect(exportResult.length).toBe(testCustomers.length);
    });
  });
});