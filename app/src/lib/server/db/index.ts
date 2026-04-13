import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import * as schema from './schema/index.js';

function getConnectionString() {
  const url = env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

// Lazy-initialized clients (avoids module-init timing issues with env loading)
let _adminDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _rlsDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getAdminDb() {
  if (!_adminDb) {
    const client = postgres(getConnectionString(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _adminDb = drizzle(client, { schema });
  }
  return _adminDb;
}

function getRlsDb() {
  if (!_rlsDb) {
    const client = postgres(getConnectionString(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    _rlsDb = drizzle(client, { schema });
  }
  return _rlsDb;
}

// Public accessors
export const adminDb = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getAdminDb() as any)[prop];
  },
});

export const db = adminDb;

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

  const rlsDb = getRlsDb();
  return rlsDb.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', ${userId}, TRUE)`);
    await tx.execute(sql`SET LOCAL ROLE ${sql.raw(role)}`);

    try {
      return await fn(tx as unknown as AppDatabase);
    } finally {
      await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', '', TRUE)`);
      await tx.execute(sql`RESET ROLE`);
    }
  });
}
