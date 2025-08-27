import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { setupTestContainer, setupDatabase, globalCleanup } from "../../setup/testcontainer-setup";
import { DatabaseTestHelper } from "../../setup/database-helper";
import { CustomerDataFactory } from "../../setup/test-data-factory";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Customer, NewCustomer } from "../../types";
import { customers } from "@/drizzle/schema/customers";

describe("Customer CRUD Integration Tests", () => {
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

  describe("Create Customer", () => {
    it("should create a basic customer successfully", async () => {
      const customerData = CustomerDataFactory.createSingleCustomer();
      
      const [createdCustomer] = await dbHelper.insertTestCustomers([customerData]);
      
      expect(createdCustomer).toMatchObject({
        id: expect.any(String),
        name: customerData.name,
        email: customerData.email,
        address: customerData.address,
        phone: customerData.phone,
        taxId: customerData.taxId,
        status: customerData.status,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should create customer with Vietnamese data", async () => {
      const vietnameseCustomers = CustomerDataFactory.createVietnameseCustomers();
      
      const createdCustomers = await dbHelper.insertTestCustomers(vietnameseCustomers);
      
      expect(createdCustomers).toHaveLength(5);
      expect(createdCustomers[0]?.name).toMatch(/^Nguyễn|Trần|Lê|Phạm|Hoàng/);
      expect(createdCustomers[0]?.address).toContain("Quận");
    });

    it("should create customer with minimal required fields", async () => {
      const minimalCustomer: NewCustomer = {
        name: "Minimal Customer",
        address: "Min Address",
        status: "active",
        email: null,
        phone: null,
        taxId: null,
      };
      
      const [createdCustomer] = await dbHelper.insertTestCustomers([minimalCustomer]);
      
      expect(createdCustomer).toMatchObject({
        id: expect.any(String),
        name: "Minimal Customer",
        email: null,
        address: "Min Address",
        phone: null,
        taxId: null,
        status: "active",
      });
    });

    it("should handle bulk customer creation", async () => {
      const bulkCustomers = CustomerDataFactory.createLargeDataset(50);
      
      const createdCustomers = await dbHelper.insertTestCustomers(bulkCustomers);
      
      expect(createdCustomers).toHaveLength(50);
      
      const totalCount = await dbHelper.getCustomerCount();
      expect(totalCount).toBe(50);
    });

    it("should create customer with different statuses", async () => {
      const activeCustomers = CustomerDataFactory.createCustomersWithStatus("active", 3);
      const inactiveCustomers = CustomerDataFactory.createCustomersWithStatus("inactive", 2);
      
      await dbHelper.insertTestCustomers([...activeCustomers, ...inactiveCustomers]);
      
      const allCustomers = await dbHelper.getAllCustomers();
      const activeCount = allCustomers.filter(c => c.status === "active").length;
      const inactiveCount = allCustomers.filter(c => c.status === "inactive").length;
      
      expect(activeCount).toBe(3);
      expect(inactiveCount).toBe(2);
    });
  });

  describe("Read Customer", () => {
    let testCustomers: Customer[];

    beforeEach(async () => {
      const testData = CustomerDataFactory.createBasicCustomers();
      testCustomers = await dbHelper.insertTestCustomers(testData);
    });

    it("should retrieve customer by ID", async () => {
      const customer = testCustomers[0];
      if (!customer) throw new Error("Test setup failed");
      
      const retrievedCustomer = await dbHelper.getCustomerById(customer.id);
      
      expect(retrievedCustomer).toEqual(customer);
    });

    it("should return null for non-existent customer ID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      
      const retrievedCustomer = await dbHelper.getCustomerById(fakeId);
      
      expect(retrievedCustomer).toBeNull();
    });

    it("should retrieve all customers", async () => {
      const allCustomers = await dbHelper.getAllCustomers();
      
      expect(allCustomers).toHaveLength(3);
      expect(allCustomers).toEqual(expect.arrayContaining(testCustomers));
    });

    it("should handle empty database", async () => {
      await dbHelper.clearAllData();
      
      const allCustomers = await dbHelper.getAllCustomers();
      const count = await dbHelper.getCustomerCount();
      
      expect(allCustomers).toHaveLength(0);
      expect(count).toBe(0);
    });

    it("should get accurate customer count", async () => {
      const count = await dbHelper.getCustomerCount();
      
      expect(count).toBe(3);
    });
  });

  describe("Update Customer", () => {
    let testCustomer: Customer;

    beforeEach(async () => {
      const customerData = CustomerDataFactory.createSingleCustomer();
      [testCustomer] = await dbHelper.insertTestCustomers([customerData]);
    });

    it("should update customer name", async () => {
      const newName = "Updated Name";
      
      await dbHelper.getDb()
        .update(customers)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(customers.id, testCustomer.id));
      
      const updatedCustomer = await dbHelper.getCustomerById(testCustomer.id);
      
      expect(updatedCustomer?.name).toBe(newName);
      expect(updatedCustomer?.updatedAt).not.toEqual(testCustomer.updatedAt);
    });

    it("should update customer status", async () => {
      await dbHelper.getDb()
        .update(customers)
        .set({ status: "inactive", updatedAt: new Date() })
        .where(eq(customers.id, testCustomer.id));
      
      const updatedCustomer = await dbHelper.getCustomerById(testCustomer.id);
      
      expect(updatedCustomer?.status).toBe("inactive");
    });

    it("should update multiple fields simultaneously", async () => {
      const updates = {
        name: "Multi Update Name",
        email: "multi.update@example.com",
        phone: "0999888777",
        updatedAt: new Date(),
      };
      
      await dbHelper.getDb()
        .update(customers)
        .set(updates)
        .where(eq(customers.id, testCustomer.id));
      
      const updatedCustomer = await dbHelper.getCustomerById(testCustomer.id);
      
      expect(updatedCustomer?.name).toBe(updates.name);
      expect(updatedCustomer?.email).toBe(updates.email);
      expect(updatedCustomer?.phone).toBe(updates.phone);
    });

    it("should handle Vietnamese text updates", async () => {
      const vietnameseName = "Nguyễn Văn Cập Nhật";
      const vietnameseAddress = "123 Đường Cập Nhật, Quận 1, TP.HCM";
      
      await dbHelper.getDb()
        .update(customers)
        .set({ 
          name: vietnameseName,
          address: vietnameseAddress,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, testCustomer.id));
      
      const updatedCustomer = await dbHelper.getCustomerById(testCustomer.id);
      
      expect(updatedCustomer?.name).toBe(vietnameseName);
      expect(updatedCustomer?.address).toBe(vietnameseAddress);
    });
  });

  describe("Delete Customer", () => {
    let testCustomer: Customer;

    beforeEach(async () => {
      const customerData = CustomerDataFactory.createSingleCustomer();
      [testCustomer] = await dbHelper.insertTestCustomers([customerData]);
    });

    it("should delete customer successfully", async () => {
      const initialCount = await dbHelper.getCustomerCount();
      
      await dbHelper.getDb()
        .delete(customers)
        .where(eq(customers.id, testCustomer.id));
      
      const finalCount = await dbHelper.getCustomerCount();
      const deletedCustomer = await dbHelper.getCustomerById(testCustomer.id);
      
      expect(finalCount).toBe(initialCount - 1);
      expect(deletedCustomer).toBeNull();
    });

    it("should handle delete non-existent customer gracefully", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const initialCount = await dbHelper.getCustomerCount();
      
      await expect(
        dbHelper.getDb()
          .delete(customers)
          .where(eq(customers.id, fakeId))
      ).resolves.not.toThrow();
      
      const finalCount = await dbHelper.getCustomerCount();
      expect(finalCount).toBe(initialCount);
    });

    it("should delete multiple customers", async () => {
      const additionalCustomers = CustomerDataFactory.createBasicCustomers();
      await dbHelper.insertTestCustomers(additionalCustomers);
      
      const allCustomers = await dbHelper.getAllCustomers();
      const customerIdsToDelete = allCustomers.slice(0, 2).map(c => c.id);
      
      await dbHelper.getDb()
        .delete(customers)
        .where(inArray(customers.id, customerIdsToDelete));
      
      const remainingCustomers = await dbHelper.getAllCustomers();
      expect(remainingCustomers).toHaveLength(allCustomers.length - 2);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data integrity across operations", async () => {
      const originalData = CustomerDataFactory.createSingleCustomer();
      const [created] = await dbHelper.insertTestCustomers([originalData]);
      
      const retrieved = await dbHelper.getCustomerById(created.id);
      expect(retrieved).toEqual(created);
      
      const newName = "Consistency Test";
      await dbHelper.getDb()
        .update(customers)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(customers.id, created.id));
      
      const updated = await dbHelper.getCustomerById(created.id);
      expect(updated?.name).toBe(newName);
      expect(updated?.id).toBe(created.id);
      
      await dbHelper.getDb()
        .delete(customers)
        .where(eq(customers.id, created.id));
      
      const deleted = await dbHelper.getCustomerById(created.id);
      expect(deleted).toBeNull();
    });

    it("should handle concurrent operations", async () => {
      const concurrentData = CustomerDataFactory.createConcurrentTestData();
      
      const promises = concurrentData.map(data => 
        dbHelper.insertTestCustomers([data])
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(([customer]) => {
        expect(customer).toBeDefined();
        expect(customer.id).toBeTruthy();
      });
      
      const totalCount = await dbHelper.getCustomerCount();
      expect(totalCount).toBe(10);
    });

    it("should preserve timestamps correctly", async () => {
      const beforeCreate = new Date();
      
      const customerData = CustomerDataFactory.createSingleCustomer();
      const [created] = await dbHelper.insertTestCustomers([customerData]);
      
      const afterCreate = new Date();
      
      // Add small buffer for timestamp precision
      expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 100);
      expect(created.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 100);
      expect(created.updatedAt).toEqual(created.createdAt);
    });
  });
});