import { defineConfig } from 'drizzle-kit';

/**
 * Config Drizzle pour Colombo.
 *
 * - Les migrations Drizzle auto-generees vont dans migrations/drizzle/.
 * - Les migrations SQL manuelles (RLS, RPC, triggers) vont dans migrations/sql/
 *   et sont appliquees par le script pnpm db:migrate apres celles de Drizzle.
 */
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
  casing: 'snake_case',
});
