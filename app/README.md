# HomeTrack

Real estate listing management platform for teams. Multi-tenant SaaS with Supabase authentication, RLS security, and real-time collaboration.

## Tech Stack

- **Frontend:** SvelteKit 2.57, Svelte 5 (runes), Tailwind CSS v4
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** Supabase GoTrue (self-hosted)
- **Storage:** Supabase Storage (S3-compatible)
- **Deployment:** Railway with adapter-node

## Getting Started

### Prerequisites
- Node.js 20+
- Access to a Supabase Postgres instance (or self-hosted)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure `.env` with your Supabase credentials:
   ```
   DATABASE_URL=postgresql://postgres:password@host:port/postgres
   SUPABASE_URL=https://your-kong-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Push schema and seed data:
   ```bash
   npm run db:reset
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset DB (push + seed) |
| `npm run db:studio` | Open Drizzle Studio |

## Architecture

- **Data Layer:** Drizzle ORM with dual clients -- `adminDb` (bypasses RLS) and `withRLS()` (enforces row-level security)
- **Auth:** GoTrue JWT verified in `hooks.server.ts`, session via httpOnly cookies
- **Security:** RLS policies on all 24 tables, tenant isolation via `team_id`
- **Storage:** Supabase Storage for file uploads, Drizzle for metadata
