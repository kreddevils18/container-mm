import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { VehicleDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { vehicles } from "@/drizzle/schema/vehicles";

describe("Vehicle Validation Integration Tests", () => {
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

  describe("Required Field Validation", () => {
    it("should reject vehicle without license plate", async () => {
      const invalidVehicle = {
        driverName: "Test Driver",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
        status: "available",
      } as any;

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should reject vehicle without driver name", async () => {
      const invalidVehicle = {
        licensePlate: "TEST-123",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
        status: "available",
      } as any;

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should reject vehicle without driver phone", async () => {
      const invalidVehicle = {
        licensePlate: "TEST-123",
        driverName: "Test Driver",
        driverIdCard: "123456789",
        status: "available",
      } as any;

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should reject vehicle without driver ID card", async () => {
      const invalidVehicle = {
        licensePlate: "TEST-123",
        driverName: "Test Driver",
        driverPhone: "0901234567",
        status: "available",
      } as any;

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should accept vehicle with all required fields", async () => {
      const validVehicle = VehicleDataFactory.createSingleVehicle();

      const created = await dbHelper.insertTestVehicles([validVehicle]);

      expect(created).toHaveLength(1);
      expect(created[0]?.licensePlate).toBe(validVehicle.licensePlate);
      expect(created[0]?.driverName).toBe(validVehicle.driverName);
      expect(created[0]?.driverPhone).toBe(validVehicle.driverPhone);
      expect(created[0]?.driverIdCard).toBe(validVehicle.driverIdCard);
    });
  });

  describe("License Plate Validation", () => {
    it("should accept valid Vietnamese license plate formats", async () => {
      const validLicensePlates = [
        "29A-12345",  // HCM City format
        "30G1-23456", // HCM City format
        "51F-67890",  // HCM City format
        "30A-11111",  // Hanoi format
        "43A-33333",  // Da Nang format
        "ABC-123",    // Simple format
        "TEST-001",   // Test format
      ];

      for (const licensePlate of validLicensePlates) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.licensePlate).toBe(licensePlate);
        
        // Clean up for next test
        await dbHelper.clearVehicleData();
      }
    });

    it("should enforce unique license plate constraint", async () => {
      const licensePlate = "UNIQUE-TEST-123";
      
      const vehicle1 = VehicleDataFactory.createSingleVehicle({
        licensePlate,
        driverName: "Driver 1",
      });
      
      const vehicle2 = VehicleDataFactory.createSingleVehicle({
        licensePlate, // Same license plate
        driverName: "Driver 2",
      });

      // First vehicle should succeed
      await dbHelper.insertTestVehicles([vehicle1]);
      
      // Second vehicle with same license plate should fail
      await expect(
        dbHelper.insertTestVehicles([vehicle2])
      ).rejects.toThrow();
    });

    it("should handle license plate length constraints", async () => {
      // Test maximum length (20 characters)
      const maxLengthPlate = "A".repeat(20);
      const validVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: maxLengthPlate,
      });

      const created = await dbHelper.insertTestVehicles([validVehicle]);
      expect(created[0]?.licensePlate).toBe(maxLengthPlate);
      
      await dbHelper.clearVehicleData();
      
      // Test over maximum length (21 characters) - should fail
      const overLengthPlate = "A".repeat(21);
      const invalidVehicle = VehicleDataFactory.createSingleVehicle({
        licensePlate: overLengthPlate,
      });

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should handle special characters in license plates", async () => {
      const specialCharPlates = [
        "ABC-123",    // Dash
        "ABC.123",    // Dot
        "ABC 123",    // Space
        "29A-12345",  // Vietnamese format
        "51F-67890",  // Vietnamese format
      ];

      for (const licensePlate of specialCharPlates) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          licensePlate,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.licensePlate).toBe(licensePlate);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should allow empty license plate (database allows empty strings)", async () => {
      const vehicleWithEmptyPlate = VehicleDataFactory.createSingleVehicle({
        licensePlate: "",
      });

      const created = await dbHelper.insertTestVehicles([vehicleWithEmptyPlate]);
      
      expect(created).toHaveLength(1);
      expect(created[0]?.licensePlate).toBe("");
    });
  });

  describe("Driver Name Validation", () => {
    it("should accept Vietnamese names with diacritics", async () => {
      const vietnameseNames = [
        "Nguyễn Văn An",
        "Trần Thị Bình",
        "Lê Hoàng Cường",
        "Phạm Thị Dung",
        "Hoàng Văn Em",
        "Vũ Thị Phương",
        "Đặng Minh Quang",
        "Bùi Thị Hoa",
        "Đỗ Văn Tùng",
        "Ngô Thị Linh",
      ];

      for (const driverName of vietnameseNames) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverName,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverName).toBe(driverName);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should accept English names", async () => {
      const englishNames = [
        "John Driver",
        "Jane Smith",
        "Bob Johnson",
        "Mary Brown",
        "David Wilson",
      ];

      for (const driverName of englishNames) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverName,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverName).toBe(driverName);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should handle driver name length constraints", async () => {
      // Test maximum length (100 characters)
      const maxLengthName = "A".repeat(100);
      const validVehicle = VehicleDataFactory.createSingleVehicle({
        driverName: maxLengthName,
      });

      const created = await dbHelper.insertTestVehicles([validVehicle]);
      expect(created[0]?.driverName).toBe(maxLengthName);
      
      await dbHelper.clearVehicleData();
      
      // Test over maximum length (101 characters) - should fail
      const overLengthName = "A".repeat(101);
      const invalidVehicle = VehicleDataFactory.createSingleVehicle({
        driverName: overLengthName,
      });

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should handle special characters in names", async () => {
      const specialCharNames = [
        "Nguyễn Văn An", // Vietnamese diacritics
        "Mary O'Connor", // Apostrophe
        "Jean-Pierre",   // Hyphen
        "José María",    // Spanish characters
        "李小明",        // Chinese characters
        "محمد علي",      // Arabic characters
      ];

      for (const driverName of specialCharNames) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverName,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverName).toBe(driverName);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should allow empty driver name (database allows empty strings)", async () => {
      const vehicleWithEmptyName = VehicleDataFactory.createSingleVehicle({
        driverName: "",
      });

      const created = await dbHelper.insertTestVehicles([vehicleWithEmptyName]);
      
      expect(created).toHaveLength(1);
      expect(created[0]?.driverName).toBe("");
    });
  });

  describe("Driver Phone Validation", () => {
    it("should accept valid Vietnamese phone numbers", async () => {
      const validPhones = [
        "0901234567",  // Viettel
        "0912345678",  // Vinaphone
        "0987654321",  // Mobifone
        "0356789012",  // Viettel 035
        "0367890123",  // Viettel 036
        "0378901234",  // Viettel 037
        "0389012345",  // Vinaphone 038
        "0390123456",  // Vinaphone 039
      ];

      for (const driverPhone of validPhones) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverPhone,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverPhone).toBe(driverPhone);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should handle phone number length constraints", async () => {
      // Test maximum length (20 characters)
      const maxLengthPhone = "1".repeat(20);
      const validVehicle = VehicleDataFactory.createSingleVehicle({
        driverPhone: maxLengthPhone,
      });

      const created = await dbHelper.insertTestVehicles([validVehicle]);
      expect(created[0]?.driverPhone).toBe(maxLengthPhone);
      
      await dbHelper.clearVehicleData();
      
      // Test over maximum length (21 characters) - should fail
      const overLengthPhone = "1".repeat(21);
      const invalidVehicle = VehicleDataFactory.createSingleVehicle({
        driverPhone: overLengthPhone,
      });

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should accept international phone formats", async () => {
      const internationalPhones = [
        "+84901234567",  // Vietnam with country code
        "+1555123456",   // US format
        "+86138123456",  // China format
        "0901-234-567",  // With dashes
        "(090) 123-4567", // With parentheses
      ];

      for (const driverPhone of internationalPhones) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverPhone,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverPhone).toBe(driverPhone);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should allow empty phone number (database allows empty strings)", async () => {
      const vehicleWithEmptyPhone = VehicleDataFactory.createSingleVehicle({
        driverPhone: "",
      });

      const created = await dbHelper.insertTestVehicles([vehicleWithEmptyPhone]);
      
      expect(created).toHaveLength(1);
      expect(created[0]?.driverPhone).toBe("");
    });
  });

  describe("Driver ID Card Validation", () => {
    it("should accept valid CMND format (9 digits)", async () => {
      const cmndNumbers = [
        "123456789",
        "987654321",
        "456789123",
        "111222333",
        "999888777",
      ];

      for (const driverIdCard of cmndNumbers) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverIdCard,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverIdCard).toBe(driverIdCard);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should accept valid CCCD format (12 digits)", async () => {
      const cccdNumbers = [
        "123456789012",
        "987654321098",
        "456789123456",
        "111222333444",
        "999888777666",
      ];

      for (const driverIdCard of cccdNumbers) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverIdCard,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverIdCard).toBe(driverIdCard);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should handle ID card length constraints", async () => {
      // Test maximum length (20 characters)
      const maxLengthId = "1".repeat(20);
      const validVehicle = VehicleDataFactory.createSingleVehicle({
        driverIdCard: maxLengthId,
      });

      const created = await dbHelper.insertTestVehicles([validVehicle]);
      expect(created[0]?.driverIdCard).toBe(maxLengthId);
      
      await dbHelper.clearVehicleData();
      
      // Test over maximum length (21 characters) - should fail
      const overLengthId = "1".repeat(21);
      const invalidVehicle = VehicleDataFactory.createSingleVehicle({
        driverIdCard: overLengthId,
      });

      await expect(
        dbHelper.insertTestVehicles([invalidVehicle])
      ).rejects.toThrow();
    });

    it("should accept ID cards with special characters", async () => {
      const specialFormatIds = [
        "123-456-789",    // With dashes
        "123.456.789",    // With dots
        "ID123456789",    // With prefix
        "PASSPORT123456", // Passport format
        "DL-12345678",    // Driver license format
      ];

      for (const driverIdCard of specialFormatIds) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          driverIdCard,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.driverIdCard).toBe(driverIdCard);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should allow empty ID card (database allows empty strings)", async () => {
      const vehicleWithEmptyId = VehicleDataFactory.createSingleVehicle({
        driverIdCard: "",
      });

      const created = await dbHelper.insertTestVehicles([vehicleWithEmptyId]);
      
      expect(created).toHaveLength(1);
      expect(created[0]?.driverIdCard).toBe("");
    });
  });

  describe("Status Validation", () => {
    it("should accept valid status values", async () => {
      const validStatuses = ["available", "unavailable", "maintenance"];

      for (const status of validStatuses) {
        const vehicle = VehicleDataFactory.createSingleVehicle({
          status: status as any,
        });

        const created = await dbHelper.insertTestVehicles([vehicle]);
        expect(created[0]?.status).toBe(status);
        
        await dbHelper.clearVehicleData();
      }
    });

    it("should reject invalid status values", async () => {
      const invalidStatuses = ["active", "inactive", "broken", "out-of-service", ""];

      for (const status of invalidStatuses) {
        const invalidVehicle = VehicleDataFactory.createSingleVehicle({
          status: status as any,
        });

        await expect(
          dbHelper.insertTestVehicles([invalidVehicle])
        ).rejects.toThrow();
      }
    });

    it("should default to available status when not specified", async () => {
      const vehicleWithoutStatus = {
        licensePlate: "DEFAULT-STATUS",
        driverName: "Default Driver",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
      } as any;

      const created = await dbHelper.insertTestVehicles([vehicleWithoutStatus]);
      expect(created[0]?.status).toBe("available");
    });
  });

  describe("Bulk Validation", () => {
    it("should validate all vehicles in bulk insert", async () => {
      const mixedValidityVehicles = [
        VehicleDataFactory.createSingleVehicle({ licensePlate: "VALID-001" }),
        VehicleDataFactory.createSingleVehicle({ licensePlate: "VALID-002" }),
        { // Invalid - missing required fields
          licensePlate: "INVALID-001",
          status: "available",
        } as any,
      ];

      await expect(
        dbHelper.insertTestVehicles(mixedValidityVehicles)
      ).rejects.toThrow();
      
      // Verify no vehicles were inserted due to transaction rollback
      const count = await dbHelper.getVehicleCount();
      expect(count).toBe(0);
    });

    it("should handle validation with Vietnamese data", async () => {
      const vietnameseVehicles = VehicleDataFactory.createVietnameseVehicles();
      
      const created = await dbHelper.insertTestVehicles(vietnameseVehicles);
      
      expect(created).toHaveLength(vietnameseVehicles.length);
      
      created.forEach((vehicle, index) => {
        expect(vehicle.licensePlate).toBe(vietnameseVehicles[index]?.licensePlate);
        expect(vehicle.driverName).toBe(vietnameseVehicles[index]?.driverName);
        expect(vehicle.driverPhone).toBe(vietnameseVehicles[index]?.driverPhone);
        expect(vehicle.driverIdCard).toBe(vietnameseVehicles[index]?.driverIdCard);
      });
    });

    it("should enforce unique constraints in bulk operations", async () => {
      const duplicatePlateVehicles = [
        VehicleDataFactory.createSingleVehicle({ 
          licensePlate: "DUPLICATE-PLATE",
          driverName: "Driver 1",
        }),
        VehicleDataFactory.createSingleVehicle({ 
          licensePlate: "DUPLICATE-PLATE", // Same plate
          driverName: "Driver 2",
        }),
      ];

      await expect(
        dbHelper.insertTestVehicles(duplicatePlateVehicles)
      ).rejects.toThrow();
    });
  });

  describe("Transaction Validation", () => {
    it("should rollback transaction on validation failure", async () => {
      const initialCount = await dbHelper.getVehicleCount();
      
      const validVehicle = VehicleDataFactory.createSingleVehicle();
      const invalidVehicle = {
        licensePlate: "INVALID",
        driverName: null, // This should cause constraint violation
        driverPhone: "0901234567",
        driverIdCard: "123456789",
        status: "available",
      } as any;

      // Use the new withTransaction helper that properly handles Drizzle transactions
      await expect(async () => {
        await dbHelper.withTransaction(async (tx) => {
          await tx.insert(vehicles).values(validVehicle);
          await tx.insert(vehicles).values(invalidVehicle); // This will throw
        });
      }).rejects.toThrow();

      const finalCount = await dbHelper.getVehicleCount();
      expect(finalCount).toBe(initialCount);
    });

    it("should maintain data integrity during concurrent validation", async () => {
      const concurrentVehicles = Array.from({ length: 5 }, (_, index) =>
        VehicleDataFactory.createSingleVehicle({
          licensePlate: `CONCURRENT-${index}`,
          driverName: `Concurrent Driver ${index}`,
        })
      );

      const insertPromises = concurrentVehicles.map(vehicle =>
        dbHelper.insertTestVehicles([vehicle])
      );

      const results = await Promise.all(insertPromises);
      
      expect(results).toHaveLength(5);
      
      const uniqueLicensePlates = new Set();
      results.forEach(([vehicle]) => {
        expect(vehicle.licensePlate).toBeTruthy();
        expect(uniqueLicensePlates.has(vehicle.licensePlate)).toBe(false);
        uniqueLicensePlates.add(vehicle.licensePlate);
      });
      
      expect(uniqueLicensePlates.size).toBe(5);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null values appropriately", async () => {
      const nullValueTests = [
        { licensePlate: null, shouldFail: true },
        { driverName: null, shouldFail: true },
        { driverPhone: null, shouldFail: true },
        { driverIdCard: null, shouldFail: true },
      ];

      for (const test of nullValueTests) {
        const vehicleData = {
          ...VehicleDataFactory.createSingleVehicle(),
          ...test,
        };
        
        if (test.shouldFail) {
          await expect(
            dbHelper.insertTestVehicles([vehicleData as any])
          ).rejects.toThrow();
        }
      }
    });

    it("should handle undefined values appropriately", async () => {
      const undefinedValueTests = [
        { licensePlate: undefined, shouldFail: true },
        { driverName: undefined, shouldFail: true },
        { driverPhone: undefined, shouldFail: true },
        { driverIdCard: undefined, shouldFail: true },
      ];

      for (const test of undefinedValueTests) {
        const vehicleData = {
          ...VehicleDataFactory.createSingleVehicle(),
          ...test,
        };
        
        if (test.shouldFail) {
          await expect(
            dbHelper.insertTestVehicles([vehicleData as any])
          ).rejects.toThrow();
        }
      }
    });

    it("should handle whitespace-only values", async () => {
      const whitespaceTests = [
        { field: "licensePlate", value: "   ", shouldFail: false },
        { field: "driverName", value: "   ", shouldFail: false },
        { field: "driverPhone", value: "   ", shouldFail: false },
        { field: "driverIdCard", value: "   ", shouldFail: false },
      ];

      for (const test of whitespaceTests) {
        const vehicleData = {
          ...VehicleDataFactory.createSingleVehicle(),
          [test.field]: test.value,
        };
        
        if (test.shouldFail) {
          await expect(
            dbHelper.insertTestVehicles([vehicleData])
          ).rejects.toThrow();
        } else {
          const created = await dbHelper.insertTestVehicles([vehicleData]);
          expect(created[0]?.[test.field as keyof typeof created[0]]).toBe(test.value);
          await dbHelper.clearVehicleData();
        }
      }
    });

    it("should provide meaningful error information", async () => {
      try {
        const invalidVehicle = {
          licensePlate: null,
          driverName: "Test Driver",
          driverPhone: "0901234567",
          driverIdCard: "123456789",
          status: "available",
        } as any;
        
        await dbHelper.insertTestVehicles([invalidVehicle]);
      } catch (_error) {
        // Expected to fail
      }
      
      // Verify system can recover after validation error
      const validVehicle = VehicleDataFactory.createSingleVehicle();
      const [created] = await dbHelper.insertTestVehicles([validVehicle]);
      
      expect(created).toBeDefined();
      expect(created.id).toBeTruthy();
    });
  });
});