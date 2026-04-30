import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante dans apps/web/.env.local\n' +
        '→ Supabase Dashboard > Settings > API > service_role key\n' +
        '→ Décommenter et remplir la ligne dans .env.local puis relancer pnpm dev',
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
