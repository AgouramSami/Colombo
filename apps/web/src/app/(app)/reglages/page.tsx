import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReglagesView } from './reglages-view';

export type UserData = {
  email: string;
  display_name: string | null;
  phone: string | null;
  plan: string;
  created_at: string | null;
};

export type LoftData = {
  id: string;
  name: string;
  address: string | null;
  licence_number: string | null;
  pigeonCount?: number;
};

export type ProfileStats = {
  pigeonCount: number;
  raceCount: number;
};

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, loftRes] = await Promise.all([
    supabase
      .from('users')
      .select('email, display_name, phone, plan, name_variants, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('lofts')
      .select('id, name, address, licence_number')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  const userData: UserData = userRes.data ?? {
    email: user.email ?? '',
    display_name: null,
    phone: null,
    plan: 'free',
    created_at: null,
  };

  const nameVariants: string[] =
    (userRes.data as { name_variants?: string[] } | null)?.name_variants ?? [];
  const loftData: LoftData[] = loftRes.data ?? [];
  const displayName = userData.display_name ?? user.email?.split('@')[0] ?? 'Éleveur';

  const loftIds = loftData.map((l) => l.id);
  const { count: pigeonCount } = loftIds.length
    ? await supabase
        .from('pigeons')
        .select('matricule', { count: 'exact', head: true })
        .in('loft_id', loftIds)
    : { count: 0 };

  const stats: ProfileStats = {
    pigeonCount: pigeonCount ?? 0,
    raceCount: 0,
  };

  return (
    <ReglagesView
      userName={displayName}
      userData={userData}
      loftData={loftData}
      nameVariants={nameVariants}
      stats={stats}
    />
  );
}
