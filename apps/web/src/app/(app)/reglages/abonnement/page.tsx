import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SectionAbo } from '../_components/section-abo';
import { SectionHeader } from '../_components/section-header';

export default async function AbonnementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.from('users').select('plan').eq('id', user.id).single();
  const plan = data?.plan ?? 'free';

  return (
    <>
      <SectionHeader
        title="Abonnement"
        subtitle="Votre formule actuelle et les options disponibles."
      />
      <SectionAbo plan={plan} />
    </>
  );
}
