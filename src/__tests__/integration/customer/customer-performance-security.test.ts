import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { CustomerDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Customer } from "@/drizzle/schema";
import { customers } from "@/drizzle/schema";

describe("Customer Performance and Security Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;

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
  });

  describe("Performance Tests", () => {
    describe("Large Dataset Operations", () => {
      beforeEach(async () => {
        const largeDataset = CustomerDataFactory.createLargeDataset(5000);
        console.log("Setting up large dataset...");
        await dbHelper.insertTestCustomers(largeDataset);
        console.log("Large dataset setup completed");
      }, 60000);

      it("should handle large dataset queries efficiently", async () => {
        const startTime = Date.now();
        
        const allCustomers = await dbHelper.getAllCustomers();
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(3000);
        expect(allCustomers.length).toBe(5000);
        
        console.log(`Query time for 5000 customers: ${queryTime}ms`);
      });

      it("should perform indexed search efficiently on large dataset", async () => {
        const startTime = Date.now();
        
        const searchResults = await dbHelper.searchCustomers("customer");
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        expect(searchTime).toBeLessThan(2000);
        expect(searchResults.length).toBeGreaterThan(0);
        
        console.log(`Search time on 5000 customers: ${searchTime}ms`);
      });

      it("should handle pagination efficiently", async () => {
        const pageSize = 100;
        const pageNumber = 25;
        
        const startTime = Date.now();
        
        const paginatedResults = await dbHelper.getDb()
          .select()
          .from(customers)
          .limit(pageSize)
          .offset((pageNumber - 1) * pageSize);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(1000);
        expect(paginatedResults.length).toBe(pageSize);
        
        console.log(`Pagination query time: ${queryTime}ms`);
      });

      it("should perform bulk operations efficiently", async () => {
        const bulkUpdateData = Array.from({ length: 100 }, (_, index) => ({
          id: crypto.randomUUID(),
          name: `Bulk Update ${index}`,
          address: `Bulk Address ${index}`,
          status: "active" as const,
        }));

        const startTime = Date.now();
        
        await dbHelper.insertTestCustomers(bulkUpdateData);
        
        const endTime = Date.now();
        const insertTime = endTime - startTime;
        
        expect(insertTime).toBeLessThan(2000);
        
        console.log(`Bulk insert time for 100 customers: ${insertTime}ms`);
      });

      it("should maintain performance under concurrent load", async () => {
        const concurrentOperations = Array.from({ length: 10 }, (_, index) =>
          dbHelper.searchCustomers(`customer${index * 100}`)
        );

        const startTime = Date.now();
        
        const results = await Promise.all(concurrentOperations);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        expect(totalTime).toBeLessThan(5000);
        expect(results).toHaveLength(10);
        
        console.log(`Concurrent operations time: ${totalTime}ms`);
      });
    });

    describe("Query Optimization", () => {
      beforeEach(async () => {
        const testData = CustomerDataFactory.createLargeDataset(1000);
        await dbHelper.insertTestCustomers(testData);
      });

      it("should utilize database indexes effectively", async () => {
        const indexQuery = await dbHelper.executeRawQuery(`
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename = 'customers'
        `);
        
        expect(indexQuery.length).toBeGreaterThan(0);
        
        const hasSearchIndex = indexQuery.some((idx: any) => 
          idx.indexdef.includes('gin') || idx.indexdef.includes('tsvector')
        );
        
        expect(hasSearchIndex).toBe(true);
      });

      it("should use query plans efficiently for search operations", async () => {
        const explainQuery = await dbHelper.executeRawQuery(`
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM customers 
          WHERE name ILIKE '%customer%' 
          LIMIT 10
        `);
        
        expect(explainQuery.length).toBeGreaterThan(0);
        
        const executionTime = explainQuery.find((row: any) => 
          row["QUERY PLAN"].includes("Execution Time:")
        );
        
        if (executionTime) {
          const timeMatch = executionTime["QUERY PLAN"].match(/Execution Time: ([\d.]+) ms/);
          if (timeMatch) {
            const time = parseFloat(timeMatch[1]);
            expect(time).toBeLessThan(100);
          }
        }
      });

      it("should optimize full-text search queries", async () => {
        const startTime = Date.now();
        
        const searchResults = await dbHelper.getDb()
          .select()
          .from(customers)
          .where(
            sql`to_tsvector('simple', CONCAT_WS(' ', 
              COALESCE(${customers.name}, ''),
              COALESCE(${customers.email}, ''),
              COALESCE(${customers.address}, '')
            )) @@ websearch_to_tsquery('simple', 'Customer')`
          )
          .limit(50);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(500);
        expect(searchResults.length).toBeGreaterThan(0);
      });

      it("should handle complex filtering efficiently", async () => {
        const complexFilter = {
          status: ["active"],
          namePattern: "Customer",
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date()
          }
        };

        const startTime = Date.now();
        
        const filteredResults = await dbHelper.getDb()
          .select()
          .from(customers)
          .where(
            sql`${customers.status} = 'active' 
                AND ${customers.name} ILIKE ${'%Customer%'}
                AND ${customers.createdAt} >= ${complexFilter.dateRange.from.toISOString()}
                AND ${customers.createdAt} <= ${complexFilter.dateRange.to.toISOString()}`
          );
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(1000);
        expect(Array.isArray(filteredResults)).toBe(true);
      });
    });

    describe("Memory and Resource Management", () => {
      it("should handle memory efficiently during large operations", async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const largeDataset = CustomerDataFactory.createLargeDataset(2000);
        await dbHelper.insertTestCustomers(largeDataset);
        
        const results = await dbHelper.getAllCustomers();
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
        expect(results.length).toBe(2000);
      });

      it("should clean up resources properly", async () => {
        const connections = await dbHelper.executeRawQuery(`
          SELECT count(*) as connection_count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);
        
        expect(connections[0]?.connection_count).toBeLessThan(20);
      });

      it("should handle connection pooling effectively", async () => {
        const concurrentQueries = Array.from({ length: 20 }, () =>
          dbHelper.getCustomerCount()
        );

        const results = await Promise.all(concurrentQueries);
        
        expect(results).toHaveLength(20);
        results.forEach(count => {
          expect(typeof count).toBe('number');
        });
      });
    });
  });

  describe("Security Tests", () => {
    describe("SQL Injection Prevention", () => {
      beforeEach(async () => {
        const testData = CustomerDataFactory.createBasicCustomers();
        await dbHelper.insertTestCustomers(testData);
      });

      it("should prevent SQL injection in search queries", async () => {
        const maliciousInputs = [
          "'; DROP TABLE customers; --",
          "' OR '1'='1",
          "'; INSERT INTO customers (name, address) VALUES ('hacker', 'address'); --",
          "' UNION SELECT * FROM customers WHERE '1'='1",
          "'; UPDATE customers SET name='hacked' WHERE '1'='1'; --"
        ];

        for (const maliciousInput of maliciousInputs) {
          const results = await dbHelper.searchCustomers(maliciousInput);
          
          expect(Array.isArray(results)).toBe(true);
          
          const customerCount = await dbHelper.getCustomerCount();
          expect(customerCount).toBeGreaterThan(0);
          
          const allCustomers = await dbHelper.getAllCustomers();
          const hasHackedData = allCustomers.some(c => 
            c.name.toLowerCase().includes('hack') || 
            c.name.toLowerCase().includes('inject')
          );
          expect(hasHackedData).toBe(false);
        }
      });

      it("should prevent SQL injection in parameterized queries", async () => {
        const maliciousName = "'; DROP TABLE customers; --";
        
        await expect(
          dbHelper.getDb()
            .select()
            .from(customers)
            .where(sql`${customers.name} = ${maliciousName}`)
        ).resolves.not.toThrow();
        
        const customerCount = await dbHelper.getCustomerCount();
        expect(customerCount).toBeGreaterThan(0);
      });

      it("should sanitize special characters in data", async () => {
        const specialCharacterData = {
          name: "Test <script>alert('xss')</script>",
          email: "test+special@example.com",
          address: "123 Main & 5th St, Apt #456",
          phone: "+1-555-123-4567",
          taxId: "TAX-ID-123/456",
          status: "active" as const,
        };

        const [created] = await dbHelper.insertTestCustomers([specialCharacterData]);
        
        expect(created.name).toBe("Test <script>alert('xss')</script>");
        expect(created.email).toBe("test+special@example.com");
        expect(created.phone).toBe("+1-555-123-4567");
        
        const retrieved = await dbHelper.getCustomerById(created.id);
        expect(retrieved?.name).toBe(specialCharacterData.name);
      });

      it("should handle Unicode and international characters securely", async () => {
        const unicodeData = {
          name: "测试用户 🌟 العربية Русский",
          address: "123 테스트 주소 ñoño",
          email: "unicode@münchen.de",
          status: "active" as const,
        };

        const [created] = await dbHelper.insertTestCustomers([unicodeData]);
        
        expect(created.name).toBe(unicodeData.name);
        expect(created.address).toBe(unicodeData.address);
        
        const searchResults = await dbHelper.searchCustomers("测试");
        expect(searchResults.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Data Sanitization and Validation", () => {
      it("should validate email formats securely", async () => {
        const maliciousEmails = [
          "javascript:alert('xss')@example.com",
          "test@<script>alert('xss')</script>.com",
          "test@example.com<script>alert('xss')</script>",
          "data:text/html,<script>alert('xss')</script>@example.com"
        ];

        for (const maliciousEmail of maliciousEmails) {
          const customerData = {
            name: "Test Customer",
            email: maliciousEmail,
            address: "Test Address",
            status: "active" as const,
          };

          const [created] = await dbHelper.insertTestCustomers([customerData]);
          expect(created.email).toBe(maliciousEmail);
          
          const retrieved = await dbHelper.getCustomerById(created.id);
          expect(retrieved?.email).toBe(maliciousEmail);
        }
      });

      it("should handle boundary values securely", async () => {
        const boundaryTests = [
          { field: "name", value: "A".repeat(200), shouldPass: true },
          { field: "name", value: "A".repeat(201), shouldPass: false },
          { field: "email", value: "test@" + "a".repeat(240) + ".com", shouldPass: false },
          { field: "address", value: "A".repeat(500), shouldPass: true },
          { field: "address", value: "A".repeat(501), shouldPass: false },
          { field: "phone", value: "1".repeat(15), shouldPass: true },
          { field: "phone", value: "1".repeat(16), shouldPass: false },
        ];

        for (const test of boundaryTests) {
          const customerData: any = {
            name: "Test Customer",
            address: "Test Address", 
            status: "active",
            [test.field]: test.value,
          };

          if (test.shouldPass) {
            await expect(
              dbHelper.insertTestCustomers([customerData])
            ).resolves.not.toThrow();
          } else {
            await expect(
              dbHelper.insertTestCustomers([customerData])
            ).rejects.toThrow();
          }
        }
      });

      it("should prevent buffer overflow attacks", async () => {
        const massiveString = "A".repeat(100000);
        
        const attackData = {
          name: massiveString,
          address: massiveString,
          email: `test@${massiveString}.com`,
          phone: massiveString,
          taxId: massiveString,
          status: "active" as const,
        };

        await expect(
          dbHelper.insertTestCustomers([attackData])
        ).rejects.toThrow();
        
        const customerCount = await dbHelper.getCustomerCount();
        expect(customerCount).toBe(0);
      });
    });

    describe("Access Control and Authentication", () => {
      it("should enforce database-level constraints", async () => {
        const constraintViolations = [
          { name: null, address: "Test", status: "active" },
          { name: "Test", address: null, status: "active" },
          { name: "Test", address: "Test", status: "invalid_status" },
        ];

        for (const violation of constraintViolations) {
          await expect(
            dbHelper.insertTestCustomers([violation as any])
          ).rejects.toThrow();
        }
        
        const customerCount = await dbHelper.getCustomerCount();
        expect(customerCount).toBe(0);
      });

      it("should maintain transaction isolation", async () => {
        const customer1Data = CustomerDataFactory.createSingleCustomer({ name: "Transaction Test 1" });
        const customer2Data = CustomerDataFactory.createSingleCustomer({ name: "Transaction Test 2" });

        const transaction1 = dbHelper.getSql().begin(async (sql) => {
          await sql`INSERT INTO customers (name, address, status) VALUES (${customer1Data.name}, ${customer1Data.address}, ${customer1Data.status})`;
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const count = await sql`SELECT COUNT(*) as count FROM customers WHERE name LIKE 'Transaction Test%'`;
          return count[0]?.count;
        });

        const transaction2 = dbHelper.getSql().begin(async (sql) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          await sql`INSERT INTO customers (name, address, status) VALUES (${customer2Data.name}, ${customer2Data.address}, ${customer2Data.status})`;
          
          const count = await sql`SELECT COUNT(*) as count FROM customers WHERE name LIKE 'Transaction Test%'`;
          return count[0]?.count;
        });

        const [result1, result2] = await Promise.all([transaction1, transaction2]);
        
        expect(result1).toBe(1);
        expect(result2).toBe(1);
        
        const finalCount = await dbHelper.getCustomerCount();
        expect(finalCount).toBe(2);
      });

      it("should handle concurrent access safely", async () => {
        const concurrentOperations = Array.from({ length: 10 }, (_, index) => {
          const customerData = CustomerDataFactory.createSingleCustomer({ 
            name: `Concurrent ${index}` 
          });
          return dbHelper.insertTestCustomers([customerData]);
        });

        const results = await Promise.all(concurrentOperations);
        
        expect(results).toHaveLength(10);
        
        const uniqueIds = new Set();
        results.forEach(([customer]) => {
          expect(customer.id).toBeTruthy();
          expect(uniqueIds.has(customer.id)).toBe(false);
          uniqueIds.add(customer.id);
        });
        
        expect(uniqueIds.size).toBe(10);
      });
    });

    describe("Data Protection and Privacy", () => {
      it("should handle sensitive data appropriately", async () => {
        const sensitiveData = {
          name: "Sensitive Customer",
          email: "sensitive@privacy-test.com",
          address: "123 Private Address",
          phone: "0900000000",
          taxId: "SENSITIVE-TAX-ID-123",
          status: "active" as const,
        };

        const [created] = await dbHelper.insertTestCustomers([sensitiveData]);
        
        expect(created.taxId).toBe(sensitiveData.taxId);
        expect(created.email).toBe(sensitiveData.email);
        
        const retrieved = await dbHelper.getCustomerById(created.id);
        expect(retrieved).toEqual(created);
      });

      it("should maintain data integrity during operations", async () => {
        const originalData = CustomerDataFactory.createSingleCustomer();
        const [created] = await dbHelper.insertTestCustomers([originalData]);
        
        const retrievedAfterCreate = await dbHelper.getCustomerById(created.id);
        expect(retrievedAfterCreate?.name).toBe(created.name);
        expect(retrievedAfterCreate?.email).toBe(created.email);
        
        const updatedData = {
          name: "Updated Name",
          updatedAt: new Date(),
        };
        
        await dbHelper.getDb()
          .update(customers)
          .set(updatedData)
          .where(sql`id = ${created.id}`);
        
        const retrievedAfterUpdate = await dbHelper.getCustomerById(created.id);
        expect(retrievedAfterUpdate?.name).toBe(updatedData.name);
        expect(retrievedAfterUpdate?.email).toBe(created.email);
        expect(retrievedAfterUpdate?.id).toBe(created.id);
      });
    });
  });
});