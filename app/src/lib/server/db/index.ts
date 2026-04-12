import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL!;

// Admin client — bypasses RLS, used for seeding/migrations/background jobs
const adminClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const adminDb = drizzle(adminClient, { schema });

// Backward-compat alias (will be removed once all routes use withRLS)
export const db = adminDb;

// RLS client — prepare:false required for SET LOCAL ROLE in transactions
const rlsClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
const rlsDb = drizzle(rlsClient, { schema });

// Type for the database instance (admin or RLS transaction)
export type AppDatabase = typeof adminDb;

const ALLOWED_ROLES = new Set(['authenticated', 'anon']);

/**
 * Execute Drizzle queries with RLS context from the authenticated user.
 * Sets Postgres session variables so RLS policies can check auth.uid().
 */
export async function withRLS<T>(
  userId: string,
  role: string,
  fn: (tx: AppDatabase) => Promise<T>,
): Promise<T> {
  if (!userId) {
    throw new Error('withRLS requires a valid userId');
  }
  if (!ALLOWED_ROLES.has(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  return rlsDb.transaction(async (tx) => {
    await tx.execute(sql`
      SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE);
      SET LOCAL ROLE ${sql.raw(role)};
    `);

    try {
      return await fn(tx as unknown as AppDatabase);
    } finally {
      await tx.execute(sql`
        SELECT set_config('request.jwt.claim.sub', '', TRUE);
        RESET ROLE;
      `);
    }
  });
}
