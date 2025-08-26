import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { CustomerDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { NewCustomer } from "@/drizzle/schema";
import { customers } from "@/drizzle/schema";
import { CreateCustomerRequestSchema, UpdateCustomerRequestSchema } from "@/schemas/customer";

describe("Customer Validation and Error Handling Tests", () => {
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

  describe("Zod Schema Validation", () => {
    describe("CreateCustomerRequestSchema", () => {
      it("should validate valid customer data", () => {
        const validData = {
          name: "Valid Customer",
          email: "valid@example.com",
          address: "Valid Address",
          phone: "0123456789",
          taxId: "123456789",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(validData);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it("should validate customer with minimal required fields", () => {
        const minimalData = {
          name: "Minimal Customer",
          address: "Minimal Address",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(minimalData);
        
        expect(result.success).toBe(true);
      });

      it("should reject customer with missing name", () => {
        const invalidData = {
          address: "Address without name",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain("name");
          expect(result.error.issues[0]?.message).toContain("bắt buộc");
        }
      });

      it("should reject customer with empty name", () => {
        const invalidData = {
          name: "",
          address: "Valid Address",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain("name");
        }
      });

      it("should reject customer with missing address", () => {
        const invalidData = {
          name: "Customer Name",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain("address");
        }
      });

      it("should reject customer with invalid email format", () => {
        const invalidData = {
          name: "Customer Name",
          email: "invalid-email-format",
          address: "Valid Address",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain("email");
          expect(result.error.issues[0]?.message).toContain("không hợp lệ");
        }
      });

      it("should accept empty string for optional email", () => {
        const validData = {
          name: "Customer Name",
          email: "",
          address: "Valid Address",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(validData);
        
        expect(result.success).toBe(true);
      });

      it("should reject customer with name too long", () => {
        const invalidData = {
          name: "A".repeat(201),
          address: "Valid Address",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("200 ký tự");
        }
      });

      it("should reject customer with address too long", () => {
        const invalidData = {
          name: "Valid Name",
          address: "A".repeat(501),
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("500 ký tự");
        }
      });

      it("should reject customer with phone too long", () => {
        const invalidData = {
          name: "Valid Name",
          address: "Valid Address",
          phone: "0123456789012345678901234567890",
          status: "active" as const,
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain("15 ký tự");
        }
      });

      it("should reject customer with invalid status", () => {
        const invalidData = {
          name: "Valid Name",
          address: "Valid Address",
          status: "invalid-status",
        };

        const result = CreateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
      });

      it("should default status to active when not provided", () => {
        const dataWithoutStatus = {
          name: "Valid Name",
          address: "Valid Address",
        };

        const result = CreateCustomerRequestSchema.safeParse(dataWithoutStatus);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe("active");
        }
      });
    });

    describe("UpdateCustomerRequestSchema", () => {
      it("should validate partial update data", () => {
        const partialData = {
          name: "Updated Name",
        };

        const result = UpdateCustomerRequestSchema.safeParse(partialData);
        
        expect(result.success).toBe(true);
      });

      it("should allow updating all fields", () => {
        const fullData = {
          name: "Updated Name",
          email: "updated@example.com",
          address: "Updated Address",
          phone: "0987654321",
          taxId: "987654321",
          status: "inactive" as const,
        };

        const result = UpdateCustomerRequestSchema.safeParse(fullData);
        
        expect(result.success).toBe(true);
      });

      it("should allow empty object for update", () => {
        const emptyData = {};

        const result = UpdateCustomerRequestSchema.safeParse(emptyData);
        
        expect(result.success).toBe(true);
      });

      it("should reject invalid email in update", () => {
        const invalidData = {
          email: "invalid-email",
        };

        const result = UpdateCustomerRequestSchema.safeParse(invalidData);
        
        expect(result.success).toBe(false);
      });

      it("should allow empty string for email in update", () => {
        const validData = {
          email: "",
        };

        const result = UpdateCustomerRequestSchema.safeParse(validData);
        
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Database Constraint Validation", () => {
    it("should enforce NOT NULL constraint on name", async () => {
      const invalidCustomer = {
        address: "Test Address",
        status: "active" as const,
      } as any;

      await expect(
        dbHelper.insertTestCustomers([invalidCustomer])
      ).rejects.toThrow();
    });

    it("should enforce NOT NULL constraint on address", async () => {
      const invalidCustomer = {
        name: "Test Customer",
        status: "active" as const,
      } as any;

      await expect(
        dbHelper.insertTestCustomers([invalidCustomer])
      ).rejects.toThrow();
    });

    it("should enforce length constraints on name field", async () => {
      const customerWithLongName: NewCustomer = {
        name: "A".repeat(300),
        address: "Test Address",
        status: "active",
      };

      await expect(
        dbHelper.insertTestCustomers([customerWithLongName])
      ).rejects.toThrow();
    });

    it("should enforce length constraints on email field", async () => {
      const customerWithLongEmail: NewCustomer = {
        name: "Test Customer",
        email: "A".repeat(250) + "@example.com",
        address: "Test Address",
        status: "active",
      };

      await expect(
        dbHelper.insertTestCustomers([customerWithLongEmail])
      ).rejects.toThrow();
    });

    it("should enforce length constraints on address field", async () => {
      const customerWithLongAddress: NewCustomer = {
        name: "Test Customer",
        address: "A".repeat(600),
        status: "active",
      };

      await expect(
        dbHelper.insertTestCustomers([customerWithLongAddress])
      ).rejects.toThrow();
    });

    it("should enforce enum constraint on status field", async () => {
      const customerWithInvalidStatus = {
        name: "Test Customer",
        address: "Test Address",
        status: "invalid-status",
      } as any;

      await expect(
        dbHelper.insertTestCustomers([customerWithInvalidStatus])
      ).rejects.toThrow();
    });

    it("should allow NULL values for optional fields", async () => {
      const customerWithNulls: NewCustomer = {
        name: "Test Customer",
        email: null,
        address: "Test Address",
        phone: null,
        taxId: null,
        status: "active",
      };

      const [created] = await dbHelper.insertTestCustomers([customerWithNulls]);
      
      expect(created.name).toBe("Test Customer");
      expect(created.email).toBeNull();
      expect(created.phone).toBeNull();
      expect(created.taxId).toBeNull();
    });
  });

  describe("Data Integrity and Edge Cases", () => {
    it("should handle Vietnamese characters correctly", async () => {
      const vietnameseCustomer: NewCustomer = {
        name: "Nguyễn Văn Ăăâ Đđ",
        email: "nguyen@example.com",
        address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        phone: "0901234567",
        status: "active",
      };

      const [created] = await dbHelper.insertTestCustomers([vietnameseCustomer]);
      
      expect(created.name).toBe("Nguyễn Văn Ăăâ Đđ");
      expect(created.address).toContain("Đường Lê Lợi");
    });

    it("should handle special characters in data", async () => {
      const specialCustomer: NewCustomer = {
        name: "Customer & Co. @#$%^&*()",
        email: "special+test@example-domain.com",
        address: "123 Main St & 5th Ave, Unit #456",
        phone: "+84-901-234-567",
        taxId: "MST-123-456-789",
        status: "active",
      };

      const [created] = await dbHelper.insertTestCustomers([specialCustomer]);
      
      expect(created.name).toBe("Customer & Co. @#$%^&*()");
      expect(created.email).toBe("special+test@example-domain.com");
      expect(created.phone).toBe("+84-901-234-567");
    });

    it("should handle whitespace in data correctly", async () => {
      const whitespaceCustomer: NewCustomer = {
        name: "  Customer With Spaces  ",
        email: "  whitespace@example.com  ",
        address: "  Address With Spaces  ",
        phone: "  0901234567  ",
        status: "active",
      };

      const [created] = await dbHelper.insertTestCustomers([whitespaceCustomer]);
      
      expect(created.name).toBe("  Customer With Spaces  ");
      expect(created.email).toBe("  whitespace@example.com  ");
    });

    it("should handle empty string vs null correctly", async () => {
      const customer1: NewCustomer = {
        name: "Customer 1",
        email: "",
        address: "Address 1",
        phone: "",
        taxId: "",
        status: "active",
      };

      const customer2: NewCustomer = {
        name: "Customer 2",
        email: null,
        address: "Address 2",
        phone: null,
        taxId: null,
        status: "active",
      };

      const [created1, created2] = await dbHelper.insertTestCustomers([customer1, customer2]);
      
      expect(created1.email).toBe("");
      expect(created1.phone).toBe("");
      expect(created1.taxId).toBe("");
      
      expect(created2.email).toBeNull();
      expect(created2.phone).toBeNull();
      expect(created2.taxId).toBeNull();
    });

    it("should handle concurrent inserts with potential conflicts", async () => {
      const concurrentCustomers = Array.from({ length: 5 }, (_, index) => 
        CustomerDataFactory.createSingleCustomer({
          name: `Concurrent Customer ${index}`,
          email: `concurrent${index}@test.com`,
        })
      );

      const promises = concurrentCustomers.map(customer => 
        dbHelper.insertTestCustomers([customer])
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(([customer]) => {
        expect(customer).toBeDefined();
        expect(customer.id).toBeTruthy();
      });

      const totalCount = await dbHelper.getCustomerCount();
      expect(totalCount).toBe(5);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle database connection errors gracefully", async () => {
      const originalSql = dbHelper.getSql();
      
      const invalidQuery = originalSql`SELECT * FROM non_existent_table`;
      
      await expect(invalidQuery).rejects.toThrow();
    });

    it("should handle transaction rollback on constraint violations", async () => {
      const initialCount = await dbHelper.getCustomerCount();
      
      const validCustomer = CustomerDataFactory.createSingleCustomer();
      const invalidCustomer = {
        address: "Missing name",
        status: "active",
      } as any;

      try {
        await dbHelper.getSql().begin(async (sql) => {
          await dbHelper.getDb().insert(customers).values(validCustomer);
          await dbHelper.getDb().insert(customers).values(invalidCustomer);
        });
      } catch (error) {
        // Transaction should rollback
      }

      const finalCount = await dbHelper.getCustomerCount();
      expect(finalCount).toBe(initialCount);
    });

    it("should provide meaningful error messages for validation failures", async () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        address: "",
        phone: "A".repeat(20),
        status: "invalid-status",
      };

      const result = CreateCustomerRequestSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        
        const issues = result.error.issues;
        const nameIssue = issues.find(issue => issue.path.includes("name"));
        const emailIssue = issues.find(issue => issue.path.includes("email"));
        const addressIssue = issues.find(issue => issue.path.includes("address"));
        const phoneIssue = issues.find(issue => issue.path.includes("phone"));
        
        expect(nameIssue?.message).toContain("bắt buộc");
        expect(emailIssue?.message).toContain("không hợp lệ");
        expect(addressIssue?.message).toContain("bắt buộc");
        expect(phoneIssue?.message).toContain("15 ký tự");
      }
    });

    it("should handle memory constraints on large data", async () => {
      const largeString = "A".repeat(10000);
      const customerWithLargeData = {
        name: largeString.substring(0, 200),
        address: largeString.substring(0, 500),
        email: `test@${largeString.substring(0, 240)}.com`,
        status: "active" as const,
      };

      await expect(
        dbHelper.insertTestCustomers([customerWithLargeData])
      ).rejects.toThrow();
    });

    it("should maintain data consistency after errors", async () => {
      const initialCount = await dbHelper.getCustomerCount();
      
      try {
        const invalidCustomer = {
          name: null,
          address: "Test Address",
          status: "active",
        } as any;
        
        await dbHelper.insertTestCustomers([invalidCustomer]);
      } catch (error) {
        // Expected to fail
      }
      
      const validCustomer = CustomerDataFactory.createSingleCustomer();
      const [created] = await dbHelper.insertTestCustomers([validCustomer]);
      
      expect(created).toBeDefined();
      expect(created.id).toBeTruthy();
      
      const finalCount = await dbHelper.getCustomerCount();
      expect(finalCount).toBe(initialCount + 1);
    });
  });
});