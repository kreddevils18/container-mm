import {
  and,
  count,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import type { drizzle } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import { customers } from "@/drizzle/schema/customers";
import { vehicles } from "@/drizzle/schema/vehicles";
import type { Customer, NewCustomer, NewVehicle, Vehicle } from "../types";

export class DatabaseTestHelper {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof postgres>;
  private transactionRollbacks: Array<() => Promise<void>> = [];

  constructor(
    db: ReturnType<typeof drizzle>,
    sql: ReturnType<typeof postgres>
  ) {
    this.db = db;
    this.sql = sql;
  }

  async startTransaction(): Promise<() => Promise<void>> {
    const rollback = await this.sql.begin(async (transaction) => {
      return async () => {
        await transaction`ROLLBACK`;
      };
    });

    this.transactionRollbacks.push(rollback);
    return rollback;
  }

  async withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      return await callback(tx);
    });
  }

  async rollbackAll(): Promise<void> {
    await Promise.all(this.transactionRollbacks.map((rollback) => rollback()));
    this.transactionRollbacks = [];
  }

  async clearAllData(): Promise<void> {
    await this.sql`TRUNCATE TABLE customers, vehicles RESTART IDENTITY CASCADE`;
  }

  async clearCustomerData(): Promise<void> {
    await this.sql`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`;
  }

  async clearVehicleData(): Promise<void> {
    await this.sql`TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE`;
  }

  async insertTestCustomers(data: NewCustomer[]): Promise<Customer[]> {
    return this.db.insert(customers).values(data).returning();
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const result = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return result[0] || null;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return this.db.select().from(customers);
  }

  async getCustomerCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(customers);
    return result[0]?.count || 0;
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return this.db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.status, "active"),
          or(
            ilike(customers.name, `%${searchTerm}%`),
            ilike(customers.email, `%${searchTerm}%`),
            ilike(customers.phone, `%${searchTerm}%`),
            ilike(customers.address, `%${searchTerm}%`)
          )
        )
      );
  }

  async executeRawQuery(query: string): Promise<any> {
    return this.sql.unsafe(query);
  }

  getDb(): ReturnType<typeof drizzle> {
    return this.db;
  }

  getSql(): ReturnType<typeof postgres> {
    return this.sql;
  }

  // Vehicle-specific methods
  async insertTestVehicles(data: NewVehicle[]): Promise<Vehicle[]> {
    return this.db.insert(vehicles).values(data).returning();
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const result = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));
    return result[0] || null;
  }

  async getVehicleByLicensePlate(
    licensePlate: string
  ): Promise<Vehicle | null> {
    const result = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.licensePlate, licensePlate));
    return result[0] || null;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.db.select().from(vehicles);
  }

  async getVehicleCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(vehicles);
    return result[0]?.count || 0;
  }

  async getVehiclesByStatus(
    status: "available" | "unavailable" | "maintenance"
  ): Promise<Vehicle[]> {
    return this.db.select().from(vehicles).where(eq(vehicles.status, status));
  }

  async searchVehicles(searchTerm: string): Promise<Vehicle[]> {
    return this.db
      .select()
      .from(vehicles)
      .where(
        or(
          ilike(vehicles.licensePlate, `%${searchTerm}%`),
          ilike(vehicles.driverName, `%${searchTerm}%`),
          ilike(vehicles.driverPhone, `%${searchTerm}%`)
        )
      );
  }

  async searchVehiclesFullText(searchTerm: string): Promise<Vehicle[]> {
    return this.db
      .select()
      .from(vehicles)
      .where(
        sql`(
          setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
          setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
        ) @@ plainto_tsquery('simple', ${searchTerm})`
      )
      .orderBy(
        sql`ts_rank((
          setweight(to_tsvector('simple', COALESCE(${vehicles.licensePlate}, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(${vehicles.driverName}, '')), 'B') ||
          setweight(to_tsvector('simple', COALESCE(${vehicles.driverPhone}, '')), 'C')
        ), plainto_tsquery('simple', ${searchTerm})) DESC`
      );
  }

  async updateVehicle(
    id: string,
    data: Partial<NewVehicle>
  ): Promise<Vehicle | null> {
    const result = await this.db
      .update(vehicles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await this.db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return result.length > 0;
  }
}
