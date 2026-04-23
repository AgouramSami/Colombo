import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL est requis. Definissez-le dans .env.local.');
  }
  // prepare: false requis pour Supabase PgBouncer (connection pooler)
  const connection = postgres(url, { prepare: false });
  return drizzle(connection, { schema, casing: 'snake_case' });
}

export const db = createClient();
export type Database = typeof db;
