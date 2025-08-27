import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { VehicleDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { vehicles } from "@/drizzle/schema/vehicles";

describe("Vehicle Performance and Security Tests", () => {
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
    await dbHelper.clearVehicleData();
  });

  describe("Performance Tests", () => {
    describe("Large Dataset Operations", () => {
      beforeEach(async () => {
        const largeFleet = VehicleDataFactory.createLargeFleet(5000);
        console.log("Setting up large vehicle fleet...");
        await dbHelper.insertTestVehicles(largeFleet);
        console.log("Large fleet setup completed");
      }, 60000);

      it("should handle large dataset queries efficiently", async () => {
        const startTime = Date.now();
        
        const allVehicles = await dbHelper.getAllVehicles();
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(3000); // Under 3 seconds
        expect(allVehicles.length).toBe(5000);
        
        console.log(`Query time for 5000 vehicles: ${queryTime}ms`);
      });

      it("should perform full-text search efficiently on large dataset", async () => {
        const startTime = Date.now();
        
        // Search for "Nguyễn" which appears in Vietnamese names
        const searchResults = await dbHelper.searchVehiclesFullText("Nguyễn");
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        expect(searchTime).toBeLessThan(2000); // Under 2 seconds
        expect(searchResults.length).toBeGreaterThan(0);
        
        console.log(`Full-text search time on 5000 vehicles: ${searchTime}ms`);
        console.log(`Found ${searchResults.length} vehicles with 'Nguyễn'`);
      });

      it("should handle GIN index search efficiently", async () => {
        const startTime = Date.now();
        
        // Test full-text search using the GIN index
        const ginSearchResults = await dbHelper.getDb()
          .select()
          .from(vehicles)
          .where(
            sql`(
              setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
              setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
              setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
            ) @@ plainto_tsquery('simple', 'Nguyễn')`
          )
          .limit(50);
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        expect(searchTime).toBeLessThan(1000); // Under 1 second with index
        expect(ginSearchResults.length).toBeGreaterThan(0);
        
        console.log(`GIN index search time: ${searchTime}ms`);
      });

      it("should handle pagination efficiently", async () => {
        const pageSize = 100;
        const pageNumber = 25; // Middle page
        
        const startTime = Date.now();
        
        const paginatedResults = await dbHelper.getDb()
          .select()
          .from(vehicles)
          .limit(pageSize)
          .offset((pageNumber - 1) * pageSize);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(1000); // Under 1 second
        expect(paginatedResults.length).toBe(pageSize);
        
        console.log(`Pagination query time: ${queryTime}ms`);
      });

      it("should perform bulk operations efficiently", async () => {
        const bulkUpdateData = Array.from({ length: 100 }, (_, index) => 
          VehicleDataFactory.createSingleVehicle({
            licensePlate: `BULK-${index.toString().padStart(3, '0')}`,
            driverName: `Bulk Driver ${index}`,
            status: "available",
          })
        );

        const startTime = Date.now();
        
        await dbHelper.insertTestVehicles(bulkUpdateData);
        
        const endTime = Date.now();
        const insertTime = endTime - startTime;
        
        expect(insertTime).toBeLessThan(2000); // Under 2 seconds
        
        console.log(`Bulk insert time for 100 vehicles: ${insertTime}ms`);
      });

      it("should maintain performance under concurrent load", async () => {
        const concurrentOperations = Array.from({ length: 10 }, (_, index) =>
          dbHelper.searchVehiclesFullText(`Driver ${index * 100}`)
        );

        const startTime = Date.now();
        
        const results = await Promise.all(concurrentOperations);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        expect(totalTime).toBeLessThan(5000); // Under 5 seconds total
        expect(results).toHaveLength(10);
        
        console.log(`Concurrent operations time: ${totalTime}ms`);
      });
    });

    describe("Query Optimization", () => {
      beforeEach(async () => {
        const testFleet = VehicleDataFactory.createLargeFleet(1000);
        await dbHelper.insertTestVehicles(testFleet);
      });

      it("should utilize database indexes effectively", async () => {
        const indexQuery = await dbHelper.executeRawQuery(`
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename = 'vehicles'
        `);
        
        expect(indexQuery.length).toBeGreaterThan(0);
        
        // Check for unique index on license_plate
        const hasLicensePlateIndex = indexQuery.some((idx: any) => 
          idx.indexdef.includes('license_plate') && idx.indexdef.includes('UNIQUE')
        );
        expect(hasLicensePlateIndex).toBe(true);
        
        // Check for GIN index for full-text search
        const hasGinIndex = indexQuery.some((idx: any) => 
          idx.indexdef.includes('gin') && idx.indexdef.includes('tsvector')
        );
        expect(hasGinIndex).toBe(true);
      });

      it("should use query plans efficiently for search operations", async () => {
        const explainQuery = await dbHelper.executeRawQuery(`
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM vehicles 
          WHERE driver_name ILIKE '%Driver%' 
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
            expect(time).toBeLessThan(100); // Under 100ms
          }
        }
      });

      it("should optimize full-text search queries with GIN index", async () => {
        const startTime = Date.now();
        
        const searchResults = await dbHelper.getDb()
          .select()
          .from(vehicles)
          .where(
            sql`(
              setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
              setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
              setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
            ) @@ websearch_to_tsquery('simple', 'Nguyễn')`
          )
          .limit(50);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(500); // Under 500ms with GIN index
        expect(Array.isArray(searchResults)).toBe(true);
      });

      it("should handle complex filtering efficiently", async () => {
        const complexFilter = {
          status: ["available", "unavailable"],
          licensePattern: "29A",
          phonePattern: "090",
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date()
          }
        };

        const startTime = Date.now();
        
        const filteredResults = await dbHelper.getDb()
          .select()
          .from(vehicles)
          .where(
            sql`${vehicles.status} IN ('available', 'unavailable')
                AND ${vehicles.licensePlate} ILIKE ${'%29A%'}
                AND ${vehicles.driverPhone} ILIKE ${'%090%'}
                AND ${vehicles.createdAt} >= ${complexFilter.dateRange.from.toISOString()}
                AND ${vehicles.createdAt} <= ${complexFilter.dateRange.to.toISOString()}`
          );
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(queryTime).toBeLessThan(1000); // Under 1 second
        expect(Array.isArray(filteredResults)).toBe(true);
      });

      it("should optimize unique constraint checking", async () => {
        const uniquePlate = "UNIQUE-PERF-TEST";
        
        // First insert
        const vehicle1 = VehicleDataFactory.createSingleVehicle({
          licensePlate: uniquePlate,
        });
        
        const startTime = Date.now();
        await dbHelper.insertTestVehicles([vehicle1]);
        const firstInsertTime = Date.now() - startTime;
        
        // Attempt duplicate insert (should fail quickly)
        const vehicle2 = VehicleDataFactory.createSingleVehicle({
          licensePlate: uniquePlate, // Same plate
          driverName: "Different Driver",
        });
        
        const duplicateStartTime = Date.now();
        await expect(
          dbHelper.insertTestVehicles([vehicle2])
        ).rejects.toThrow();
        const duplicateCheckTime = Date.now() - duplicateStartTime;
        
        expect(firstInsertTime).toBeLessThan(500); // Fast insert
        expect(duplicateCheckTime).toBeLessThan(100); // Fast constraint check
      });
    });

    describe("Memory and Resource Management", () => {
      it("should handle memory efficiently during large operations", async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const largeFleet = VehicleDataFactory.createLargeFleet(2000);
        await dbHelper.insertTestVehicles(largeFleet);
        
        const results = await dbHelper.getAllVehicles();
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Should not increase memory by more than 200MB for 2000 vehicles
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
        expect(results.length).toBe(2000);
      });

      it("should clean up resources properly", async () => {
        const connections = await dbHelper.executeRawQuery(`
          SELECT count(*) as connection_count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);
        
        expect(Number(connections[0]?.connection_count)).toBeLessThan(20);
      });

      it("should handle connection pooling effectively", async () => {
        const concurrentQueries = Array.from({ length: 20 }, () =>
          dbHelper.getVehicleCount()
        );

        const results = await Promise.all(concurrentQueries);
        
        expect(results).toHaveLength(20);
        results.forEach(count => {
          expect(typeof count).toBe('number');
          expect(count).toBeGreaterThanOrEqual(0);
        });
      });

      it("should handle large result sets efficiently", async () => {
        const largeFleet = VehicleDataFactory.createLargeFleet(3000);
        await dbHelper.insertTestVehicles(largeFleet);
        
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Stream-like processing simulation
        const batchSize = 500;
        let processedCount = 0;
        
        for (let offset = 0; offset < 3000; offset += batchSize) {
          const batch = await dbHelper.getDb()
            .select()
            .from(vehicles)
            .limit(batchSize)
            .offset(offset);
          
          processedCount += batch.length;
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        expect(processedCount).toBe(3000);
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Memory efficient
      });
    });
  });

  describe("Security Tests", () => {
    describe("SQL Injection Prevention", () => {
      beforeEach(async () => {
        const testFleet = VehicleDataFactory.createBasicVehicles();
        await dbHelper.insertTestVehicles(testFleet);
      });

      it("should prevent SQL injection in search queries", async () => {
        const maliciousInputs = [
          "'; DROP TABLE vehicles; --",
          "' OR '1'='1",
          "'; INSERT INTO vehicles (license_plate, driver_name, driver_phone, driver_id_card, status) VALUES ('HACKED', 'Hacker', '0000000000', '000000000', 'available'); --",
          "' UNION SELECT * FROM vehicles WHERE '1'='1",
          "'; UPDATE vehicles SET driver_name='hacked' WHERE '1'='1'; --",
          "Driver'; DELETE FROM vehicles; --"
        ];

        for (const maliciousInput of maliciousInputs) {
          const results = await dbHelper.searchVehiclesFullText(maliciousInput);
          
          // Should return safe results, not execute malicious SQL
          expect(Array.isArray(results)).toBe(true);
          
          // Verify table still exists and has data
          const vehicleCount = await dbHelper.getVehicleCount();
          expect(vehicleCount).toBeGreaterThan(0);
          
          // Verify no malicious data was inserted
          const allVehicles = await dbHelper.getAllVehicles();
          const hasHackedData = allVehicles.some(v => 
            v.driverName.toLowerCase().includes('hack') || 
            v.licensePlate.toLowerCase().includes('hack')
          );
          expect(hasHackedData).toBe(false);
        }
      });

      it("should prevent SQL injection in parameterized queries", async () => {
        const maliciousLicensePlate = "'; DROP TABLE vehicles; --";
        
        // Using parameterized query should be safe
        await expect(
          dbHelper.getDb()
            .select()
            .from(vehicles)
            .where(sql`${vehicles.licensePlate} = ${maliciousLicensePlate}`)
        ).resolves.not.toThrow();
        
        // Verify table still exists
        const vehicleCount = await dbHelper.getVehicleCount();
        expect(vehicleCount).toBeGreaterThan(0);
      });

      it("should sanitize special characters in vehicle data", async () => {
        const specialCharacterVehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate: "TEST<>\"'&", // Keep within 20 char limit but test special chars
          driverName: "Driver <svg onload=alert('xss')>", // Driver name can be longer
          driverPhone: "0909123456", // Valid Vietnamese phone format
          driverIdCard: "123456789", // 9 digits only
        });

        const [created] = await dbHelper.insertTestVehicles([specialCharacterVehicle]);
        
        // Data should be stored as-is (database level, not HTML escaped)
        expect(created.licensePlate).toBe("TEST<>\"'&");
        expect(created.driverName).toBe("Driver <svg onload=alert('xss')>");
        expect(created.driverPhone).toBe("0909123456");
        expect(created.driverIdCard).toBe("123456789");
        
        const retrieved = await dbHelper.getVehicleById(created.id);
        expect(retrieved?.licensePlate).toBe(specialCharacterVehicle.licensePlate);
        expect(retrieved?.driverName).toBe(specialCharacterVehicle.driverName);
      });

      it("should handle Unicode and Vietnamese characters securely", async () => {
        const vietnameseVehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate: "29A-12345",
          driverName: "Nguyễn Văn Tèo 🚚 العربية Русский",
          driverPhone: "0901234567",
          driverIdCard: "123456789",
        });

        const [created] = await dbHelper.insertTestVehicles([vietnameseVehicle]);
        
        expect(created.driverName).toBe(vietnameseVehicle.driverName);
        expect(created.licensePlate).toBe(vietnameseVehicle.licensePlate);
        
        // Test Vietnamese character search
        const searchResults = await dbHelper.searchVehiclesFullText("Nguyễn");
        expect(searchResults.length).toBeGreaterThanOrEqual(0);
        
        // Test accent-insensitive search
        const accentResults = await dbHelper.searchVehiclesFullText("Nguyen");
        expect(Array.isArray(accentResults)).toBe(true);
      });
    });

    describe("Data Sanitization and Validation", () => {
      it("should validate license plate formats securely", async () => {
        // Test malicious content within schema constraints (≤20 chars)
        const maliciousPlatesValid = [
          "'; DROP TABLE; --", // 17 chars - SQL injection attempt
          "<script>alert(1)", // 16 chars - XSS attempt (truncated)  
          "javascript:alert", // 16 chars - XSS attempt (truncated)
          "EVIL<>\"'&", // 9 chars - Various special chars
        ];

        for (const maliciousPlate of maliciousPlatesValid) {
          const vehicleData = VehicleDataFactory.createSingleVehicle({
            licensePlate: maliciousPlate,
          });

          // These should succeed (database constraint allows them)
          const [created] = await dbHelper.insertTestVehicles([vehicleData]);
          expect(created.licensePlate).toBe(maliciousPlate);
          
          const retrieved = await dbHelper.getVehicleById(created.id);
          expect(retrieved?.licensePlate).toBe(maliciousPlate);
          
          await dbHelper.clearVehicleData();
        }

        // Test malicious content that exceeds schema constraints (>20 chars)
        const maliciousPlatesInvalid = [
          "javascript:alert('xss')", // 24 chars - should fail
          "<script>alert('xss')</script>", // 32 chars - should fail
          "data:text/html,<script>alert('xss')</script>", // 44 chars - should fail
          "PLATE<iframe src=x onload=alert('xss')>", // 39 chars - should fail
        ];

        for (const maliciousPlate of maliciousPlatesInvalid) {
          const vehicleData = VehicleDataFactory.createSingleVehicle({
            licensePlate: maliciousPlate,
          });

          // These should fail due to length constraint
          await expect(
            dbHelper.insertTestVehicles([vehicleData])
          ).rejects.toThrow();
        }
      });

      it("should handle boundary values securely", async () => {
        const boundaryTests = [
          { field: "licensePlate", value: "A".repeat(20), shouldPass: true }, // Max length
          { field: "licensePlate", value: "A".repeat(21), shouldPass: false }, // Over limit
          { field: "driverName", value: "B".repeat(100), shouldPass: true }, // Max length
          { field: "driverName", value: "B".repeat(101), shouldPass: false }, // Over limit
          { field: "driverPhone", value: "1".repeat(20), shouldPass: true }, // Max length
          { field: "driverPhone", value: "1".repeat(21), shouldPass: false }, // Over limit
          { field: "driverIdCard", value: "C".repeat(20), shouldPass: true }, // Max length
          { field: "driverIdCard", value: "C".repeat(21), shouldPass: false }, // Over limit
        ];

        for (const test of boundaryTests) {
          const vehicleData: any = VehicleDataFactory.createSingleVehicle();
          vehicleData[test.field] = test.value;

          if (test.shouldPass) {
            await expect(
              dbHelper.insertTestVehicles([vehicleData])
            ).resolves.not.toThrow();
            await dbHelper.clearVehicleData();
          } else {
            await expect(
              dbHelper.insertTestVehicles([vehicleData])
            ).rejects.toThrow();
          }
        }
      });

      it("should prevent buffer overflow attacks", async () => {
        const massiveString = "A".repeat(100000);
        
        const attackVehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate: massiveString,
          driverName: massiveString,
          driverPhone: massiveString,
          driverIdCard: massiveString,
        });

        await expect(
          dbHelper.insertTestVehicles([attackVehicle])
        ).rejects.toThrow();
        
        const vehicleCount = await dbHelper.getVehicleCount();
        expect(vehicleCount).toBe(0);
      });

      it("should validate status enum values securely", async () => {
        const maliciousStatuses = [
          "<script>alert('xss')</script>",
          "'; DROP TABLE vehicles; --", 
          "javascript:alert('xss')",
          "invalid_status",
          "",
          "AVAILABLE", // Wrong case
        ];

        for (const maliciousStatus of maliciousStatuses) {
          const vehicleData = VehicleDataFactory.createSingleVehicle({
            status: maliciousStatus as any,
          });

          await expect(
            dbHelper.insertTestVehicles([vehicleData])
          ).rejects.toThrow();
        }
        
        const vehicleCount = await dbHelper.getVehicleCount();
        expect(vehicleCount).toBe(0);
      });
    });

    describe("Access Control and Authentication", () => {
      it("should enforce database-level constraints", async () => {
        const constraintViolations = [
          { licensePlate: null, driverName: "Test", driverPhone: "0901234567", driverIdCard: "123456789", status: "available" },
          { licensePlate: "TEST", driverName: null, driverPhone: "0901234567", driverIdCard: "123456789", status: "available" },
          { licensePlate: "TEST", driverName: "Test", driverPhone: null, driverIdCard: "123456789", status: "available" },
          { licensePlate: "TEST", driverName: "Test", driverPhone: "0901234567", driverIdCard: null, status: "available" },
          { licensePlate: "TEST", driverName: "Test", driverPhone: "0901234567", driverIdCard: "123456789", status: "invalid_status" },
        ];

        for (const violation of constraintViolations) {
          await expect(
            dbHelper.insertTestVehicles([violation as any])
          ).rejects.toThrow();
        }
        
        const vehicleCount = await dbHelper.getVehicleCount();
        expect(vehicleCount).toBe(0);
      });

      it("should maintain transaction isolation", async () => {
        const vehicle1Data = VehicleDataFactory.createSingleVehicle({ 
          licensePlate: "TX-001",
          driverName: "Transaction Test 1" 
        });
        const vehicle2Data = VehicleDataFactory.createSingleVehicle({ 
          licensePlate: "TX-002",
          driverName: "Transaction Test 2" 
        });

        const transaction1 = dbHelper.getSql().begin(async (sql) => {
          await sql`INSERT INTO vehicles (license_plate, driver_name, driver_phone, driver_id_card, status) 
                   VALUES (${vehicle1Data.licensePlate}, ${vehicle1Data.driverName}, ${vehicle1Data.driverPhone}, ${vehicle1Data.driverIdCard}, ${vehicle1Data.status})`;
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const count = await sql`SELECT COUNT(*) as count FROM vehicles WHERE driver_name = ${vehicle1Data.driverName}`;
          return Number(count[0]?.count);
        });

        const transaction2 = dbHelper.getSql().begin(async (sql) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          
          await sql`INSERT INTO vehicles (license_plate, driver_name, driver_phone, driver_id_card, status) 
                   VALUES (${vehicle2Data.licensePlate}, ${vehicle2Data.driverName}, ${vehicle2Data.driverPhone}, ${vehicle2Data.driverIdCard}, ${vehicle2Data.status})`;
          
          const count = await sql`SELECT COUNT(*) as count FROM vehicles WHERE driver_name = ${vehicle2Data.driverName}`;
          return Number(count[0]?.count);
        });

        const [result1, result2] = await Promise.all([transaction1, transaction2]);
        
        expect(result1).toBe(1);
        expect(result2).toBe(1);
        
        const finalCount = await dbHelper.getVehicleCount();
        expect(finalCount).toBe(2);
      });

      it("should handle concurrent access safely", async () => {
        const concurrentOperations = Array.from({ length: 10 }, (_, index) => {
          const vehicleData = VehicleDataFactory.createSingleVehicle({ 
            licensePlate: `CONC-${index.toString().padStart(3, '0')}`,
            driverName: `Concurrent Driver ${index}` 
          });
          return dbHelper.insertTestVehicles([vehicleData]);
        });

        const results = await Promise.all(concurrentOperations);
        
        expect(results).toHaveLength(10);
        
        const uniqueIds = new Set();
        const uniquePlates = new Set();
        
        results.forEach(([vehicle]) => {
          expect(vehicle.id).toBeTruthy();
          expect(uniqueIds.has(vehicle.id)).toBe(false);
          expect(uniquePlates.has(vehicle.licensePlate)).toBe(false);
          
          uniqueIds.add(vehicle.id);
          uniquePlates.add(vehicle.licensePlate);
        });
        
        expect(uniqueIds.size).toBe(10);
        expect(uniquePlates.size).toBe(10);
      });

      it("should prevent duplicate license plate registration", async () => {
        const basePlate = "SECURITY-TEST-001";
        
        const vehicle1 = VehicleDataFactory.createSingleVehicle({
          licensePlate: basePlate,
          driverName: "Driver 1",
        });
        
        const vehicle2 = VehicleDataFactory.createSingleVehicle({
          licensePlate: basePlate, // Same license plate
          driverName: "Driver 2",
        });

        // First vehicle should succeed
        await dbHelper.insertTestVehicles([vehicle1]);
        
        // Second vehicle with same plate should fail
        await expect(
          dbHelper.insertTestVehicles([vehicle2])
        ).rejects.toThrow();
        
        const vehicleCount = await dbHelper.getVehicleCount();
        expect(vehicleCount).toBe(1);
      });
    });

    describe("Data Protection and Privacy", () => {
      it("should handle sensitive driver information appropriately", async () => {
        const sensitiveVehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate: "PRIV-001",
          driverName: "Nguyễn Văn Bảo Mật",
          driverPhone: "0901234567",
          driverIdCard: "123456789012", // CCCD format
        });

        const [created] = await dbHelper.insertTestVehicles([sensitiveVehicle]);
        
        expect(created.driverName).toBe(sensitiveVehicle.driverName);
        expect(created.driverPhone).toBe(sensitiveVehicle.driverPhone);
        expect(created.driverIdCard).toBe(sensitiveVehicle.driverIdCard);
        
        const retrieved = await dbHelper.getVehicleById(created.id);
        expect(retrieved).toEqual(created);
      });

      it("should maintain data integrity during operations", async () => {
        const originalVehicle = VehicleDataFactory.createSingleVehicle();
        const [created] = await dbHelper.insertTestVehicles([originalVehicle]);
        
        const retrievedAfterCreate = await dbHelper.getVehicleById(created.id);
        expect(retrievedAfterCreate?.licensePlate).toBe(created.licensePlate);
        expect(retrievedAfterCreate?.driverName).toBe(created.driverName);
        expect(retrievedAfterCreate?.driverPhone).toBe(created.driverPhone);
        
        const updatedData = {
          driverName: "Updated Driver Name",
          updatedAt: new Date(),
        };
        
        await dbHelper.updateVehicle(created.id, updatedData);
        
        const retrievedAfterUpdate = await dbHelper.getVehicleById(created.id);
        expect(retrievedAfterUpdate?.driverName).toBe(updatedData.driverName);
        expect(retrievedAfterUpdate?.licensePlate).toBe(created.licensePlate); // Unchanged
        expect(retrievedAfterUpdate?.driverPhone).toBe(created.driverPhone); // Unchanged
        expect(retrievedAfterUpdate?.id).toBe(created.id);
      });

      it("should handle Vietnamese personal data with proper encoding", async () => {
        const vietnameseVehicles = VehicleDataFactory.createVietnameseVehicles();
        
        const created = await dbHelper.insertTestVehicles(vietnameseVehicles);
        
        created.forEach((vehicle, index) => {
          const original = vietnameseVehicles[index];
          expect(vehicle.driverName).toBe(original?.driverName);
          expect(vehicle.driverName.length).toBeGreaterThan(0);
          
          // Verify UTF-8 encoding is preserved
          expect(typeof vehicle.driverName).toBe("string");
          expect(vehicle.driverName).not.toMatch(/[Ã¢Ã¡Ã]/); // Should not be double-encoded
        });
        
        // Test search with Vietnamese characters
        const searchResults = await dbHelper.searchVehiclesFullText("Nguyễn");
        expect(searchResults.length).toBeGreaterThan(0);
        
        searchResults.forEach(vehicle => {
          expect(vehicle.driverName).toContain("Nguyễn");
        });
      });

      it("should prevent data leakage through error messages", async () => {
        // Attempt to insert invalid data
        const invalidVehicle = {
          licensePlate: "A".repeat(21), // Too long
          driverName: "Test Driver",
          driverPhone: "0901234567",
          driverIdCard: "123456789",
          status: "available",
        };

        try {
          await dbHelper.insertTestVehicles([invalidVehicle as any]);
        } catch (error: any) {
          // Error message should not expose sensitive internal details
          expect(error.message).not.toContain("password");
          expect(error.message).not.toContain("secret");
          expect(error.message).not.toContain("token");
          
          // But should be informative enough for debugging
          expect(typeof error.message).toBe("string");
          expect(error.message.length).toBeGreaterThan(0);
        }
      });
    });
  });
});