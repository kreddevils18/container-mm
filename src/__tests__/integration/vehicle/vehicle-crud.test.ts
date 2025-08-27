import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { VehicleDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Vehicle } from "../../types";

describe("Vehicle CRUD Integration Tests", () => {
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
    
    const basicData = VehicleDataFactory.createBasicVehicles();
    testVehicles = await dbHelper.insertTestVehicles(basicData);
  });

  describe("Vehicle Creation", () => {
    it("should create a vehicle with valid data", async () => {
      const newVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: "NEW-123",
        driverName: "New Driver",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
        status: "available",
      });

      const createdVehicles = await dbHelper.insertTestVehicles([newVehicle]);
      const vehicle = createdVehicles[0];

      expect(vehicle).toBeDefined();
      expect(vehicle?.id).toBeDefined();
      expect(vehicle?.licensePlate).toBe("NEW-123");
      expect(vehicle?.driverName).toBe("New Driver");
      expect(vehicle?.driverPhone).toBe("0901234567");
      expect(vehicle?.driverIdCard).toBe("123456789");
      expect(vehicle?.status).toBe("available");
      expect(vehicle?.createdAt).toBeDefined();
      expect(vehicle?.updatedAt).toBeDefined();
    });

    it("should create Vietnamese vehicle with diacritics", async () => {
      const vietnameseVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: "29A-12345",
        driverName: "Nguyễn Văn Anh",
        driverPhone: "0901234567",
        driverIdCard: "123456789012",
        status: "available",
      });

      const created = await dbHelper.insertTestVehicles([vietnameseVehicle]);
      const vehicle = created[0];

      expect(vehicle?.licensePlate).toBe("29A-12345");
      expect(vehicle?.driverName).toBe("Nguyễn Văn Anh");
      expect(vehicle?.driverIdCard).toBe("123456789012");
    });

    it("should create vehicle with different statuses", async () => {
      const vehicles = [
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "AVAIL-001",
          status: "available",
        }),
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "UNAVAIL-001", 
          status: "unavailable",
        }),
        VehicleDataFactory.createSingleVehicle({
          licensePlate: "MAINT-001",
          status: "maintenance",
        }),
      ];

      const created = await dbHelper.insertTestVehicles(vehicles);

      expect(created).toHaveLength(3);
      expect(created[0]?.status).toBe("available");
      expect(created[1]?.status).toBe("unavailable");
      expect(created[2]?.status).toBe("maintenance");
    });

    it("should enforce unique license plate constraint", async () => {
      const licensePlate = "UNIQUE-TEST";
      
      const vehicle1 = VehicleDataFactory.createSingleVehicle({
        licensePlate,
        driverName: "Driver 1",
      });
      
      const vehicle2 = VehicleDataFactory.createSingleVehicle({
        licensePlate, // Same license plate
        driverName: "Driver 2",
      });

      await dbHelper.insertTestVehicles([vehicle1]);
      
      await expect(
        dbHelper.insertTestVehicles([vehicle2])
      ).rejects.toThrow();
    });

    it("should handle bulk vehicle creation", async () => {
      await dbHelper.clearVehicleData();
      
      const bulkVehicles = VehicleDataFactory.createLargeFleet(50);
      
      const startTime = Date.now();
      const created = await dbHelper.insertTestVehicles(bulkVehicles);
      const endTime = Date.now();
      
      expect(created).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const count = await dbHelper.getVehicleCount();
      expect(count).toBe(50);
    });
  });

  describe("Vehicle Retrieval", () => {
    it("should retrieve vehicle by ID", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const vehicle = await dbHelper.getVehicleById(vehicleId!);
      
      expect(vehicle).toBeDefined();
      expect(vehicle?.id).toBe(vehicleId);
      expect(vehicle?.licensePlate).toBe(testVehicles[0]?.licensePlate);
    });

    it("should retrieve vehicle by license plate", async () => {
      const licensePlate = testVehicles[0]?.licensePlate;
      expect(licensePlate).toBeDefined();

      const vehicle = await dbHelper.getVehicleByLicensePlate(licensePlate!);
      
      expect(vehicle).toBeDefined();
      expect(vehicle?.licensePlate).toBe(licensePlate);
      expect(vehicle?.id).toBe(testVehicles[0]?.id);
    });

    it("should return null for non-existent vehicle ID", async () => {
      const nonExistentId = "00000000-0000-4000-8000-000000000000";
      
      const vehicle = await dbHelper.getVehicleById(nonExistentId);
      
      expect(vehicle).toBeNull();
    });

    it("should return null for non-existent license plate", async () => {
      const vehicle = await dbHelper.getVehicleByLicensePlate("NON-EXISTENT");
      
      expect(vehicle).toBeNull();
    });

    it("should retrieve all vehicles", async () => {
      const allVehicles = await dbHelper.getAllVehicles();
      
      expect(allVehicles).toHaveLength(testVehicles.length);
      
      const licensePlates = allVehicles.map(v => v.licensePlate).sort();
      const expectedPlates = testVehicles.map(v => v.licensePlate).sort();
      
      expect(licensePlates).toEqual(expectedPlates);
    });

    it("should get correct vehicle count", async () => {
      const count = await dbHelper.getVehicleCount();
      
      expect(count).toBe(testVehicles.length);
    });

    it("should filter vehicles by status", async () => {
      // Create vehicles with specific statuses
      await dbHelper.clearVehicleData();
      
      const availableVehicles = VehicleDataFactory.createVehiclesWithStatus("available", 3);
      const unavailableVehicles = VehicleDataFactory.createVehiclesWithStatus("unavailable", 2);
      const maintenanceVehicles = VehicleDataFactory.createVehiclesWithStatus("maintenance", 1);
      
      await dbHelper.insertTestVehicles([...availableVehicles, ...unavailableVehicles, ...maintenanceVehicles]);
      
      const available = await dbHelper.getVehiclesByStatus("available");
      const unavailable = await dbHelper.getVehiclesByStatus("unavailable");
      const maintenance = await dbHelper.getVehiclesByStatus("maintenance");
      
      expect(available).toHaveLength(3);
      expect(unavailable).toHaveLength(2);
      expect(maintenance).toHaveLength(1);
      
      for (const v of available) {
        expect(v.status).toBe("available");
      }
      for (const v of unavailable) {
        expect(v.status).toBe("unavailable");
      }
      for (const v of maintenance) {
        expect(v.status).toBe("maintenance");
      }
    });
  });

  describe("Vehicle Updates", () => {
    it("should update vehicle driver information", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const updateData = {
        driverName: "Updated Driver Name",
        driverPhone: "0999888777",
        driverIdCard: "987654321",
      };

      const updated = await dbHelper.updateVehicle(vehicleId!, updateData);
      
      expect(updated).toBeDefined();
      expect(updated?.driverName).toBe("Updated Driver Name");
      expect(updated?.driverPhone).toBe("0999888777");
      expect(updated?.driverIdCard).toBe("987654321");
      expect(updated?.licensePlate).toBe(testVehicles[0]?.licensePlate); // Unchanged
    });

    it("should update vehicle status", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const updated = await dbHelper.updateVehicle(vehicleId!, {
        status: "maintenance",
      });
      
      expect(updated?.status).toBe("maintenance");
    });

    it("should update vehicle license plate", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const newLicensePlate = "UPDATED-123";
      
      const updated = await dbHelper.updateVehicle(vehicleId!, {
        licensePlate: newLicensePlate,
      });
      
      expect(updated?.licensePlate).toBe(newLicensePlate);
      
      // Verify the update persisted
      const retrieved = await dbHelper.getVehicleById(vehicleId!);
      expect(retrieved?.licensePlate).toBe(newLicensePlate);
    });

    it("should update Vietnamese driver name with diacritics", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const vietnameseName = "Trần Thị Bình";
      
      const updated = await dbHelper.updateVehicle(vehicleId!, {
        driverName: vietnameseName,
      });
      
      expect(updated?.driverName).toBe(vietnameseName);
    });

    it("should handle partial updates", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const originalVehicle = testVehicles[0];
      
      // Update only phone number
      const updated = await dbHelper.updateVehicle(vehicleId!, {
        driverPhone: "0111222333",
      });
      
      expect(updated?.driverPhone).toBe("0111222333");
      expect(updated?.driverName).toBe(originalVehicle?.driverName);
      expect(updated?.licensePlate).toBe(originalVehicle?.licensePlate);
      expect(updated?.driverIdCard).toBe(originalVehicle?.driverIdCard);
      expect(updated?.status).toBe(originalVehicle?.status);
    });

    it("should return null when updating non-existent vehicle", async () => {
      const nonExistentId = "00000000-0000-4000-8000-000000000000";
      
      const result = await dbHelper.updateVehicle(nonExistentId, {
        driverName: "Test Driver",
      });
      
      expect(result).toBeNull();
    });

    it("should handle concurrent updates", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const promises = [
        dbHelper.updateVehicle(vehicleId!, { driverPhone: "0111111111" }),
        dbHelper.updateVehicle(vehicleId!, { status: "maintenance" }),
        dbHelper.updateVehicle(vehicleId!, { driverName: "Concurrent Driver" }),
      ];

      const results = await Promise.all(promises);
      
      // All updates should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result?.id).toBe(vehicleId);
      });
      
      // Verify final state
      const final = await dbHelper.getVehicleById(vehicleId!);
      expect(final).toBeDefined();
    });
  });

  describe("Vehicle Deletion", () => {
    it("should delete vehicle successfully", async () => {
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      const deleted = await dbHelper.deleteVehicle(vehicleId!);
      
      expect(deleted).toBe(true);
      
      const retrieved = await dbHelper.getVehicleById(vehicleId!);
      expect(retrieved).toBeNull();
      
      const count = await dbHelper.getVehicleCount();
      expect(count).toBe(testVehicles.length - 1);
    });

    it("should return false when deleting non-existent vehicle", async () => {
      const nonExistentId = "00000000-0000-4000-8000-000000000000";
      
      const deleted = await dbHelper.deleteVehicle(nonExistentId);
      
      expect(deleted).toBe(false);
    });

    it("should handle cascade constraints when deleting vehicle", async () => {
      // This test would be more comprehensive with actual relationships
      // For now, just test basic deletion
      const vehicleId = testVehicles[0]?.id;
      expect(vehicleId).toBeDefined();

      await expect(
        dbHelper.deleteVehicle(vehicleId!)
      ).resolves.toBe(true);
    });
  });

  describe("Data Consistency and Integrity", () => {
    it("should maintain data consistency across multiple operations", async () => {
      const initialCount = await dbHelper.getVehicleCount();
      
      // Create
      const newVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: "CONSISTENCY-TEST",
      });
      await dbHelper.insertTestVehicles([newVehicle]);
      
      let count = await dbHelper.getVehicleCount();
      expect(count).toBe(initialCount + 1);
      
      // Update
      const vehicle = await dbHelper.getVehicleByLicensePlate("CONSISTENCY-TEST");
      expect(vehicle).toBeDefined();
      
      await dbHelper.updateVehicle(vehicle!.id, { status: "maintenance" });
      const updated = await dbHelper.getVehicleById(vehicle!.id);
      expect(updated?.status).toBe("maintenance");
      
      count = await dbHelper.getVehicleCount();
      expect(count).toBe(initialCount + 1); // Count unchanged by update
      
      // Delete
      await dbHelper.deleteVehicle(vehicle!.id);
      count = await dbHelper.getVehicleCount();
      expect(count).toBe(initialCount);
    });

    it("should preserve timestamps correctly", async () => {
      const vehicle = testVehicles[0];
      expect(vehicle).toBeDefined();

      const originalCreatedAt = vehicle?.createdAt;
      const originalUpdatedAt = vehicle?.updatedAt;
      
      expect(originalCreatedAt).toBeDefined();
      expect(originalUpdatedAt).toBeDefined();
      
      // Small delay to ensure different timestamp  
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updated = await dbHelper.updateVehicle(vehicle!.id, {
        driverName: "Updated for timestamp test",
      });
      
      expect(updated?.createdAt).toEqual(originalCreatedAt); // Should not change
      expect(updated?.updatedAt?.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
    });

    it("should handle transaction rollbacks properly", async () => {
      const initialCount = await dbHelper.getVehicleCount();
      
      try {
        await dbHelper.getSql().begin(async sql => {
          // Insert a vehicle
          await sql`
            INSERT INTO vehicles (license_plate, driver_name, driver_phone, driver_id_card, status)
            VALUES ('ROLLBACK-TEST', 'Test Driver', '0901234567', '123456789', 'available')
          `;
          
          // Cause an error to trigger rollback
          throw new Error("Intentional rollback");
        });
      } catch (_error) {
        // Expected error
      }
      
      const finalCount = await dbHelper.getVehicleCount();
      expect(finalCount).toBe(initialCount); // Should be unchanged due to rollback
      
      const rolledBackVehicle = await dbHelper.getVehicleByLicensePlate("ROLLBACK-TEST");
      expect(rolledBackVehicle).toBeNull();
    });

    it("should handle large dataset operations efficiently", async () => {
      await dbHelper.clearVehicleData();
      
      const largeFleet = VehicleDataFactory.createLargeFleet(200);
      
      const startTime = Date.now();
      const created = await dbHelper.insertTestVehicles(largeFleet);
      const endTime = Date.now();
      
      expect(created).toHaveLength(200);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify data integrity
      const count = await dbHelper.getVehicleCount();
      expect(count).toBe(200);
      
      // Test bulk status updates
      const updateStartTime = Date.now();
      await dbHelper.getSql()`
        UPDATE vehicles 
        SET status = 'maintenance' 
        WHERE license_plate LIKE '29A-12345-%'
      `;
      const updateEndTime = Date.now();
      
      expect(updateEndTime - updateStartTime).toBeLessThan(2000);
      
      const maintenanceVehicles = await dbHelper.getVehiclesByStatus("maintenance");
      expect(maintenanceVehicles.length).toBeGreaterThan(0);
    });
  });
});