import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConcoursView } from './concours-view';

export default async function ConcoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const displayName = user.email?.split('@')[0] ?? 'Éleveur';

  return <ConcoursView userName={displayName} />;
}
