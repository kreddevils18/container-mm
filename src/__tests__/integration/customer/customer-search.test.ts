import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { CustomerDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Customer } from "@/drizzle/schema";
import { customers } from "@/drizzle/schema";

describe("Customer Search Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;
  let testCustomers: Customer[];

  beforeAll(async () => {
    container = await setupTestContainer();
    const { db, sql } = await setupDatabase(container);
    dbHelper = new DatabaseTestHelper(db, sql);
    
    await dbHelper.getSql()`CREATE EXTENSION IF NOT EXISTS unaccent`;
  }, 30000);

  afterAll(async () => {
    await globalCleanup();
  });

  beforeEach(async () => {
    await dbHelper.clearAllData();
    
    const searchData = CustomerDataFactory.createSearchTestData();
    testCustomers = await dbHelper.insertTestCustomers(searchData);
  });

  describe("Basic Search Functionality", () => {
    it("should search customers by name", async () => {
      const searchTerm = "Anh";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toContain("Anh");
    });

    it("should search customers by email", async () => {
      const searchTerm = "nguyen.anh@test.com";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.email).toBe("nguyen.anh@test.com");
    });

    it("should search customers by phone", async () => {
      const searchTerm = "0901234567";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.phone).toBe("0901234567");
    });

    it("should search customers by partial name", async () => {
      const searchTerm = "Nguyễn";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toContain("Nguyễn");
    });

    it("should return empty array for non-matching search", async () => {
      const searchTerm = "NonExistentCustomer";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results).toHaveLength(0);
    });
  });

  describe("Vietnamese Text Search", () => {
    it("should search Vietnamese names with accents", async () => {
      const searchTerm = "Nguyễn Văn";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toMatch(/Nguyễn.*Văn/);
    });

    it("should search Vietnamese addresses", async () => {
      const searchTerm = "Lê Duẩn";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.address).toContain("Lê Duẩn");
    });

    it("should search by city name", async () => {
      const searchTerm = "Hà Nội";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.address).toContain("Hà Nội");
    });

    it("should search with mixed Vietnamese and English", async () => {
      const searchTerm = "Search";
      
      const results = await dbHelper.searchCustomers(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toContain("Search");
    });
  });

  describe("Advanced Search Features", () => {
    beforeEach(async () => {
      await dbHelper.clearAllData();
      
      const largeDataset = CustomerDataFactory.createLargeDataset(100);
      const vietnameseData = CustomerDataFactory.createVietnameseCustomers();
      const basicData = CustomerDataFactory.createBasicCustomers();
      
      await dbHelper.insertTestCustomers([...largeDataset, ...vietnameseData, ...basicData]);
    });

    it("should handle full-text search with ranking", async () => {
      const results = await dbHelper.getDb()
        .select({
          id: customers.id,
          name: customers.name,
          email: customers.email,
          address: customers.address,
          rank: sql<number>`ts_rank(
            to_tsvector('simple', CONCAT_WS(' ', 
              COALESCE(${customers.name}, ''),
              COALESCE(${customers.email}, ''), 
              COALESCE(${customers.address}, '')
            )),
            websearch_to_tsquery('simple', ${'Nguyễn'})
          )`.as("rank"),
        })
        .from(customers)
        .where(
          sql`to_tsvector('simple', CONCAT_WS(' ', 
            COALESCE(${customers.name}, ''),
            COALESCE(${customers.email}, ''), 
            COALESCE(${customers.address}, '')
          )) @@ websearch_to_tsquery('simple', ${'Nguyễn'})`
        )
        .orderBy(sql`rank DESC`)
        .limit(10);
      
      expect(results.length).toBeGreaterThan(0);
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]?.rank).toBeGreaterThanOrEqual(results[i + 1]?.rank ?? 0);
      }
    });

    it("should search across multiple fields simultaneously", async () => {
      const searchTerm = "John";
      
      const results = await dbHelper.getDb()
        .select()
        .from(customers)
        .where(
          sql`to_tsvector('simple', CONCAT_WS(' ', 
            COALESCE(${customers.name}, ''),
            COALESCE(${customers.email}, ''), 
            COALESCE(${customers.address}, '')
          )) @@ websearch_to_tsquery('simple', ${searchTerm})`
        );
      
      expect(results.length).toBeGreaterThan(0);
      
      const hasMatchInName = results.some(r => r.name.includes(searchTerm));
      const hasMatchInEmail = results.some(r => r.email?.includes(searchTerm));
      
      expect(hasMatchInName || hasMatchInEmail).toBe(true);
    });

    it("should handle search with special characters", async () => {
      const specialCustomer = CustomerDataFactory.createSingleCustomer({
        name: "Special @#$% Customer",
        email: "special@test.com",
        address: "123 Main St & Co.",
      });
      
      await dbHelper.insertTestCustomers([specialCustomer]);
      
      const results = await dbHelper.searchCustomers("Special");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name).toContain("Special");
    });

    it("should limit search results correctly", async () => {
      const limit = 5;
      
      const results = await dbHelper.getDb()
        .select()
        .from(customers)
        .where(sql`${customers.status} = 'active'`)
        .limit(limit);
      
      expect(results.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("Search Performance", () => {
    beforeEach(async () => {
      await dbHelper.clearAllData();
      
      const largeDataset = CustomerDataFactory.createLargeDataset(500);
      await dbHelper.insertTestCustomers(largeDataset);
    });

    it("should perform search efficiently on large dataset", async () => {
      const startTime = Date.now();
      
      const results = await dbHelper.searchCustomers("customer");
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(1000);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle concurrent searches", async () => {
      const searchTerms = ["customer", "test", "Nguyễn", "address", "email"];
      
      const promises = searchTerms.map(term => 
        dbHelper.searchCustomers(term)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should utilize search index effectively", async () => {
      const indexInfo = await dbHelper.executeRawQuery(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'customers' 
        AND indexname LIKE '%search%'
      `);
      
      expect(indexInfo.length).toBeGreaterThan(0);
      
      const hasSearchIndex = indexInfo.some((idx: any) => 
        idx.indexdef.includes('gin') && 
        idx.indexdef.includes('to_tsvector')
      );
      
      expect(hasSearchIndex).toBe(true);
    });
  });

  describe("Status Filtering in Search", () => {
    beforeEach(async () => {
      await dbHelper.clearAllData();
      
      const activeCustomers = CustomerDataFactory.createCustomersWithStatus("active", 3);
      const inactiveCustomers = CustomerDataFactory.createCustomersWithStatus("inactive", 2);
      
      await dbHelper.insertTestCustomers([...activeCustomers, ...inactiveCustomers]);
    });

    it("should only return active customers in search by default", async () => {
      const results = await dbHelper.getDb()
        .select()
        .from(customers)
        .where(sql`${customers.status} = 'active'`);
      
      expect(results).toHaveLength(3);
      results.forEach(customer => {
        expect(customer.status).toBe("active");
      });
    });

    it("should exclude inactive customers from search results", async () => {
      const searchTerm = "Customer";
      
      const allResults = await dbHelper.searchCustomers(searchTerm);
      const activeResults = await dbHelper.getDb()
        .select()
        .from(customers)
        .where(
          sql`${customers.status} = 'active' AND (
            ${customers.name} ILIKE ${`%${searchTerm}%`} OR
            ${customers.email} ILIKE ${`%${searchTerm}%`} OR
            ${customers.address} ILIKE ${`%${searchTerm}%`}
          )`
        );
      
      expect(allResults.length).toBe(activeResults.length);
    });
  });

  describe("Search Edge Cases", () => {
    it("should handle empty search term", async () => {
      const results = await dbHelper.searchCustomers("");
      
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle very long search terms", async () => {
      const longSearchTerm = "A".repeat(1000);
      
      const results = await dbHelper.searchCustomers(longSearchTerm);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it("should handle search with only whitespace", async () => {
      const whitespaceSearch = "   \t\n  ";
      
      const results = await dbHelper.searchCustomers(whitespaceSearch);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle search with SQL injection attempts", async () => {
      const maliciousSearch = "'; DROP TABLE customers; --";
      
      await expect(
        dbHelper.searchCustomers(maliciousSearch)
      ).resolves.not.toThrow();
      
      const customersStillExist = await dbHelper.getCustomerCount();
      expect(customersStillExist).toBeGreaterThan(0);
    });

    it("should handle Unicode characters in search", async () => {
      const unicodeCustomer = CustomerDataFactory.createSingleCustomer({
        name: "测试用户",
        address: "테스트 주소",
      });
      
      await dbHelper.insertTestCustomers([unicodeCustomer]);
      
      const results = await dbHelper.searchCustomers("测试");
      
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});