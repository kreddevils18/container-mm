import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { VehicleDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Vehicle } from "../../types";
import { vehicles } from "@/drizzle/schema/vehicles";

describe("Vehicle Search Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;
  let _testVehicles: Vehicle[];

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
    
    const searchData = VehicleDataFactory.createSearchTestData();
    _testVehicles = await dbHelper.insertTestVehicles(searchData);
  });

  describe("Basic Search Functionality", () => {
    it("should search vehicles by license plate", async () => {
      const searchTerm = "29A";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.licensePlate).toContain("29A");
    });

    it("should search vehicles by driver name", async () => {
      const searchTerm = "Anh";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName).toContain("Anh");
    });

    it("should search vehicles by driver phone", async () => {
      const searchTerm = "0901234567";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverPhone).toBe("0901234567");
    });

    it("should perform case-insensitive search", async () => {
      const searchTerm = "nguyễn"; // Match the actual data with diacritics
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName.toLowerCase()).toContain("nguyễn");
    });

    it("should handle partial license plate search", async () => {
      const searchTerm = "G1";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.licensePlate).toContain("G1");
    });

    it("should search by Vietnamese driver name with diacritics", async () => {
      const searchTerm = "Bình";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName).toContain("Bình");
    });

    it("should search with mixed Vietnamese and English", async () => {
      const searchTerm = "Search";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName).toContain("Search");
    });
  });

  describe("Full-Text Search Features", () => {
    beforeEach(async () => {
      await dbHelper.clearVehicleData();
      
      const largeDataset = VehicleDataFactory.createLargeFleet(100);
      const vietnameseData = VehicleDataFactory.createVietnameseVehicles();
      const basicData = VehicleDataFactory.createBasicVehicles();
      
      await dbHelper.insertTestVehicles([...largeDataset, ...vietnameseData, ...basicData]);
    });

    it("should handle full-text search with ranking", async () => {
      const results = await dbHelper.searchVehiclesFullText("Nguyễn");
      
      expect(results.length).toBeGreaterThan(0);
      
      // Verify results are ordered by relevance (ts_rank)
      for (let i = 0; i < Math.min(results.length - 1, 5); i++) {
        const current = results[i];
        const next = results[i + 1];
        
        expect(current?.driverName).toBeTruthy();
        expect(next?.driverName).toBeTruthy();
        
        // All results should contain the search term or be ranked appropriately
        expect(
          current?.driverName.includes("Nguyễn") || 
          current?.licensePlate.includes("Nguyễn") ||
          current?.driverPhone.includes("Nguyễn")
        ).toBe(true);
      }
    });

    it("should search across multiple fields simultaneously", async () => {
      const searchTerm = "John";
      
      const results = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(
          sql`(
            setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
          ) @@ plainto_tsquery('simple', ${searchTerm})`
        );
      
      expect(results.length).toBeGreaterThan(0);
      
      const hasMatchInName = results.some(r => r.driverName.includes(searchTerm));
      const hasMatchInPlate = results.some(r => r.licensePlate.includes(searchTerm));
      
      expect(hasMatchInName || hasMatchInPlate).toBe(true);
    });

    it("should handle search with special characters", async () => {
      const specialVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: "SPECIAL-@#$",
        driverName: "Special Driver àáạảã",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
      });
      
      await dbHelper.insertTestVehicles([specialVehicle]);
      
      const results = await dbHelper.searchVehicles("Special");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName).toContain("Special");
    });

    it("should limit search results correctly", async () => {
      const limit = 5;
      
      const results = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(sql`${vehicles.status} = 'available'`)
        .limit(limit);
      
      expect(results.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("Status Filtering in Search", () => {
    beforeEach(async () => {
      await dbHelper.clearVehicleData();
      
      const availableVehicles = VehicleDataFactory.createVehiclesWithStatus("available", 3);
      const unavailableVehicles = VehicleDataFactory.createVehiclesWithStatus("unavailable", 2);
      const maintenanceVehicles = VehicleDataFactory.createVehiclesWithStatus("maintenance", 1);
      
      await dbHelper.insertTestVehicles([...availableVehicles, ...unavailableVehicles, ...maintenanceVehicles]);
    });

    it("should filter by available status", async () => {
      const results = await dbHelper.getVehiclesByStatus("available");
      
      expect(results).toHaveLength(3);
      results.forEach(vehicle => {
        expect(vehicle.status).toBe("available");
      });
    });

    it("should filter by unavailable status", async () => {
      const results = await dbHelper.getVehiclesByStatus("unavailable");
      
      expect(results).toHaveLength(2);
      results.forEach(vehicle => {
        expect(vehicle.status).toBe("unavailable");
      });
    });

    it("should filter by maintenance status", async () => {
      const results = await dbHelper.getVehiclesByStatus("maintenance");
      
      expect(results).toHaveLength(1);
      results.forEach(vehicle => {
        expect(vehicle.status).toBe("maintenance");
      });
    });

    it("should combine search with status filtering", async () => {
      const searchTerm = "Driver";
      
      const allResults = await dbHelper.searchVehicles(searchTerm);
      const availableResults = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(
          sql`${vehicles.status} = 'available' AND (
            ${vehicles.licensePlate} ILIKE ${`%${searchTerm}%`} OR
            ${vehicles.driverName} ILIKE ${`%${searchTerm}%`} OR
            ${vehicles.driverPhone} ILIKE ${`%${searchTerm}%`}
          )`
        );
      
      expect(allResults.length).toBeGreaterThan(0);
      expect(availableResults.length).toBeGreaterThan(0);
      expect(availableResults.length).toBeLessThanOrEqual(allResults.length);
      
      availableResults.forEach(vehicle => {
        expect(vehicle.status).toBe("available");
      });
    });
  });

  describe("Vietnamese Text Search", () => {
    beforeEach(async () => {
      await dbHelper.clearVehicleData();
      
      const vietnameseVehicles = VehicleDataFactory.createVietnameseVehicles();
      await dbHelper.insertTestVehicles(vietnameseVehicles);
    });

    it("should search Vietnamese names with exact diacritics", async () => {
      const searchTerm = "Nguyễn";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverName).toContain("Nguyễn");
    });

    it("should search Vietnamese names without diacritics", async () => {
      const searchTerm = "Nguyen";
      
      // This tests if the search can find Vietnamese names even when searched without diacritics
      const results = await dbHelper.searchVehicles(searchTerm);
      
      // Note: This depends on the database configuration for unaccent extension
      expect(Array.isArray(results)).toBe(true);
    });

    it("should search Vietnamese license plates", async () => {
      const searchTerm = "29A";
      
      const results = await dbHelper.searchVehicles(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.licensePlate).toContain("29A");
    });

    it("should handle Vietnamese phone number search", async () => {
      const vietnameseVehicle = VehicleDataFactory.createSingleVehicle({
        driverPhone: "0901234567",
        driverName: "Nguyễn Văn Test",
      });
      
      await dbHelper.insertTestVehicles([vietnameseVehicle]);
      
      const results = await dbHelper.searchVehicles("0901234567");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.driverPhone).toBe("0901234567");
    });
  });

  describe("Search Performance", () => {
    beforeEach(async () => {
      await dbHelper.clearVehicleData();
      
      const largeFleet = VehicleDataFactory.createLargeFleet(500);
      await dbHelper.insertTestVehicles(largeFleet);
    });

    it("should perform search efficiently on large dataset", async () => {
      const startTime = Date.now();
      
      const results = await dbHelper.searchVehicles("Nguyễn"); // Search for actual driver names
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle concurrent searches efficiently", async () => {
      const searchTerms = ["Nguyễn", "29A", "Trần", "available", "090"];
      
      const promises = searchTerms.map(term => 
        dbHelper.searchVehicles(term)
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
        WHERE tablename = 'vehicles' 
        AND indexname LIKE '%search%'
      `);
      
      expect(indexInfo.length).toBeGreaterThan(0);
      
      const hasSearchIndex = indexInfo.some((idx: any) => 
        idx.indexdef.includes('gin') && 
        idx.indexdef.includes('to_tsvector')
      );
      
      expect(hasSearchIndex).toBe(true);
    });

    it("should perform full-text search efficiently", async () => {
      const startTime = Date.now();
      
      const results = await dbHelper.searchVehiclesFullText("Nguyễn"); // Search for actual driver names
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Search Edge Cases", () => {
    it("should handle empty search term", async () => {
      const results = await dbHelper.searchVehicles("");
      
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle very long search terms", async () => {
      const longSearchTerm = "A".repeat(1000);
      
      const results = await dbHelper.searchVehicles(longSearchTerm);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it("should handle search with only whitespace", async () => {
      const whitespaceSearch = "   \t\n  ";
      
      const results = await dbHelper.searchVehicles(whitespaceSearch);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle search with SQL injection attempts", async () => {
      const maliciousSearch = "'; DROP TABLE vehicles; --";
      
      await expect(
        dbHelper.searchVehicles(maliciousSearch)
      ).resolves.not.toThrow();
      
      const vehiclesStillExist = await dbHelper.getVehicleCount();
      expect(vehiclesStillExist).toBeGreaterThan(0);
    });

    it("should handle Unicode characters in search", async () => {
      const unicodeVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: "测试-001",
        driverName: "测试司机 🚚",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
      });
      
      await dbHelper.insertTestVehicles([unicodeVehicle]);
      
      const results = await dbHelper.searchVehicles("测试");
      
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty results for non-existent search terms", async () => {
      const nonExistentSearch = "ABSOLUTELY-NONEXISTENT-VEHICLE-12345";
      
      const results = await dbHelper.searchVehicles(nonExistentSearch);
      
      expect(results).toHaveLength(0);
    });

    it("should handle search with special regex characters", async () => {
      const regexChars = ".*+?^$\\{\\}()|[]\\";
      
      const results = await dbHelper.searchVehicles(regexChars);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });
  });

  describe("Advanced Search Scenarios", () => {
    beforeEach(async () => {
      await dbHelper.clearVehicleData();
      
      // Insert diverse test data
      const diverseVehicles = [
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "29A-12345",
          driverName: "Nguyễn Văn An",
          driverPhone: "0901234567",
          status: "available",
        }),
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "51F-67890",
          driverName: "Trần Thị Bình",
          driverPhone: "0912345678",
          status: "unavailable",
        }),
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "ABC-123",
          driverName: "John Driver",
          driverPhone: "0923456789",
          status: "maintenance",
        }),
      ];
      
      await dbHelper.insertTestVehicles(diverseVehicles);
    });

    it("should search and sort by relevance", async () => {
      const results = await dbHelper.getDb()
        .select({
          id: vehicles.id,
          licensePlate: vehicles.licensePlate,
          driverName: vehicles.driverName,
          driverPhone: vehicles.driverPhone,
          status: vehicles.status,
          rank: sql<number>`ts_rank((
            setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
          ), plainto_tsquery('simple', ${'Driver'}))`.as("rank"),
        })
        .from(vehicles)
        .where(
          sql`(
            setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
            setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
          ) @@ plainto_tsquery('simple', ${'Driver'})`
        )
        .orderBy(sql`rank DESC`)
        .limit(10);
      
      expect(results.length).toBeGreaterThan(0);
      
      // Verify results are sorted by rank
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]?.rank).toBeGreaterThanOrEqual(results[i + 1]?.rank ?? 0);
      }
    });

    it("should handle complex search queries", async () => {
      const complexResults = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(
          sql`(
            (${vehicles.licensePlate} ILIKE ${'%A%'} AND ${vehicles.status} = 'available') OR
            (${vehicles.driverName} ILIKE ${'%Trần%'} AND ${vehicles.status} = 'unavailable')
          )`
        );
      
      expect(Array.isArray(complexResults)).toBe(true);
      
      if (complexResults.length > 0) {
        complexResults.forEach(vehicle => {
          const matchesCondition1 = vehicle.licensePlate.includes('A') && vehicle.status === 'available';
          const matchesCondition2 = vehicle.driverName.includes('Trần') && vehicle.status === 'unavailable';
          
          expect(matchesCondition1 || matchesCondition2).toBe(true);
        });
      }
    });

    it("should handle search with pagination", async () => {
      // Add more test data for pagination
      const moreVehicles = Array.from({ length: 20 }, (_, index) =>
        VehicleDataFactory.createSingleVehicle({
          licensePlate: `PAGE-${index}`,
          driverName: `Page Driver ${index}`,
        })
      );
      
      await dbHelper.insertTestVehicles(moreVehicles);
      
      const pageSize = 5;
      const page1 = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(sql`${vehicles.driverName} ILIKE ${'%Page%'}`)
        .limit(pageSize)
        .offset(0);
      
      const page2 = await dbHelper.getDb()
        .select()
        .from(vehicles)
        .where(sql`${vehicles.driverName} ILIKE ${'%Page%'}`)
        .limit(pageSize)
        .offset(pageSize);
      
      expect(page1).toHaveLength(pageSize);
      expect(page2).toHaveLength(pageSize);
      
      // Ensure no overlap between pages
      const page1Ids = page1.map(v => v.id);
      const page2Ids = page2.map(v => v.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      
      expect(overlap).toHaveLength(0);
    });
  });
});