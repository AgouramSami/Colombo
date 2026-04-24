import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReglagesView } from './reglages-view';

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const displayName = user.email?.split('@')[0] ?? 'Éleveur';

  return <ReglagesView userName={displayName} userEmail={user.email ?? ''} />;
}
