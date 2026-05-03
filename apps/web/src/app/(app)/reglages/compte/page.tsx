import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SectionCompte } from '../_components/section-compte';
import { SectionHeader } from '../_components/section-header';
import type { UserData } from '../types';

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('users')
    .select('email, display_name, phone, plan, created_at')
    .eq('id', user.id)
    .single();

  const userData: UserData = data ?? {
    email: user.email ?? '',
    display_name: null,
    phone: null,
    plan: 'free',
    created_at: null,
  };

  return (
    <>
      <SectionHeader
        title="Mon compte"
        subtitle="Vos informations et la gestion de la connexion."
      />
      <SectionCompte userData={userData} />
    </>
  );
}
