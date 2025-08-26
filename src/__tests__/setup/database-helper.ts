import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, ilike, or, count } from "drizzle-orm";
import * as schema from "@/drizzle/schema";
import { customers, type Customer, type NewCustomer } from "@/drizzle/schema";

export class DatabaseTestHelper {
  private db: ReturnType<typeof drizzle<typeof schema>>;
  private sql: ReturnType<typeof postgres>;
  private transactionRollbacks: Array<() => Promise<void>> = [];

  constructor(
    db: ReturnType<typeof drizzle<typeof schema>>,
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

  async rollbackAll(): Promise<void> {
    await Promise.all(
      this.transactionRollbacks.map(rollback => rollback())
    );
    this.transactionRollbacks = [];
  }

  async clearAllData(): Promise<void> {
    await this.sql`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`;
  }

  async insertTestCustomers(data: NewCustomer[]): Promise<Customer[]> {
    return this.db.insert(customers).values(data).returning();
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
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
    return this.db.select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, `%${searchTerm}%`),
          ilike(customers.email, `%${searchTerm}%`),
          ilike(customers.phone, `%${searchTerm}%`)
        )
      );
  }

  async executeRawQuery(query: string): Promise<any> {
    return this.sql.unsafe(query);
  }

  getDb(): ReturnType<typeof drizzle<typeof schema>> {
    return this.db;
  }

  getSql(): ReturnType<typeof postgres> {
    return this.sql;
  }
}