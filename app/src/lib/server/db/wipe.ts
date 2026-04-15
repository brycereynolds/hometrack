import postgres from 'postgres';

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: db:wipe cannot run in production (NODE_ENV=production).');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString, { max: 1 });

console.log('Wiping database...');
await client.unsafe('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
await client.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE;');
console.log('  Dropped public and drizzle schemas');
console.log('  Database is clean — run db:migrate then db:seed');

await client.end();
