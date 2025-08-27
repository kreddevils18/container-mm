import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { VehicleDataFactory } from "../../setup/test-data-factory";
import { getVehiclesToExport } from "@/services/vehicles/getVehiclesToExport";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Vehicle } from "../../types";

describe("Vehicle Export Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;
  let testVehicles: Vehicle[];

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
    
    // Set up test data with different statuses and dates
    const diverseVehicles = [
      VehicleDataFactory.createSingleVehicle({
        licensePlate: "EXPORT-001",
        driverName: "Export Driver 1",
        status: "available",
      }),
      VehicleDataFactory.createSingleVehicle({
        licensePlate: "EXPORT-002", 
        driverName: "Export Driver 2",
        status: "unavailable",
      }),
      VehicleDataFactory.createSingleVehicle({
        licensePlate: "EXPORT-003",
        driverName: "Export Driver 3", 
        status: "maintenance",
      }),
      ...VehicleDataFactory.createVietnameseVehicles(),
    ];
    
    testVehicles = await dbHelper.insertTestVehicles(diverseVehicles);
  });

  describe("Basic Export Functionality", () => {
    it("should export all vehicles without filters", async () => {
      const exported = await getVehiclesToExport({}, dbHelper.getDb());
      
      expect(exported.length).toBe(testVehicles.length);
      
      // Verify all expected fields are present
      exported.forEach(vehicle => {
        expect(vehicle.id).toBeDefined();
        expect(vehicle.licensePlate).toBeDefined();
        expect(vehicle.driverName).toBeDefined();
        expect(vehicle.driverPhone).toBeDefined();
        expect(vehicle.driverIdCard).toBeDefined();
        expect(vehicle.status).toBeDefined();
        expect(vehicle.createdAt).toBeDefined();
        expect(vehicle.updatedAt).toBeDefined();
      });
    });

    it("should export vehicles with search filter", async () => {
      const searchTerm = "Export Driver";
      
      const exported = await getVehiclesToExport({ q: searchTerm }, dbHelper.getDb());
      
      expect(exported.length).toBeGreaterThan(0);
      
      exported.forEach(vehicle => {
        const matchesSearch = 
          vehicle.driverName.includes(searchTerm) ||
          vehicle.licensePlate.includes(searchTerm) ||
          vehicle.driverPhone.includes(searchTerm);
        
        expect(matchesSearch).toBe(true);
      });
    });

    it("should export vehicles with status filter", async () => {
      const exported = await getVehiclesToExport({ 
        status: ["available"] 
      }, dbHelper.getDb());
      
      expect(exported.length).toBeGreaterThan(0);
      
      exported.forEach(vehicle => {
        expect(vehicle.status).toBe("available");
      });
    });

    it("should export vehicles with multiple status filters", async () => {
      const exported = await getVehiclesToExport({ 
        status: ["available", "unavailable"] 
      }, dbHelper.getDb());
      
      expect(exported.length).toBeGreaterThan(0);
      
      exported.forEach(vehicle => {
        expect(["available", "unavailable"]).toContain(vehicle.status);
      });
    });

    it("should export Vietnamese vehicles with proper encoding", async () => {
      const exported = await getVehiclesToExport({ 
        q: "Nguyễn" 
      }, dbHelper.getDb());
      
      expect(exported.length).toBeGreaterThan(0);
      
      exported.forEach(vehicle => {
        // Should contain Vietnamese characters properly encoded
        expect(vehicle.driverName).toContain("Nguyễn");
        expect(vehicle.driverName.includes("NguyÃªn")).toBe(false); // Should not be double-encoded
      });
    });
  });
});