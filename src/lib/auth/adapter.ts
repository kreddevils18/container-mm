import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { 
  db, 
  users, 
  accounts, 
  sessions, 
  verificationTokens, 
} from "@/drizzle/schema";

export const customDrizzleAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
}) as any;