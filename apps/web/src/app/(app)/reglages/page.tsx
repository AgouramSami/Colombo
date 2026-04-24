import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReglagesView } from './reglages-view';

export type UserData = {
  email: string;
  display_name: string | null;
  phone: string | null;
  plan: string;
};

export type LoftData = {
  id: string;
  name: string;
  address: string | null;
  licence_number: string | null;
};

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, loftRes] = await Promise.all([
    supabase.from('users').select('email, display_name, phone, plan').eq('id', user.id).single(),
    supabase
      .from('lofts')
      .select('id, name, address, licence_number')
      .is('deleted_at', null)
      .limit(1)
      .single(),
  ]);

  const userData: UserData = userRes.data ?? {
    email: user.email ?? '',
    display_name: null,
    phone: null,
    plan: 'free',
  };

  const loftData: LoftData | null = loftRes.data ?? null;
  const displayName = userData.display_name ?? user.email?.split('@')[0] ?? 'Éleveur';

  return <ReglagesView userName={displayName} userData={userData} loftData={loftData} />;
}
