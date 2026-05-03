import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SectionHeader } from '../_components/section-header';
import { PigeonsTab } from '../pigeons-tab';

export default async function MesPigeonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.from('users').select('name_variants').eq('id', user.id).single();

  const nameVariants: string[] = (data as { name_variants?: string[] } | null)?.name_variants ?? [];

  return (
    <>
      <SectionHeader
        title="Retrouver mes pigeons"
        subtitle="Variantes de noms utilisees pour vous identifier dans les imports."
      />
      <PigeonsTab nameVariants={nameVariants} />
    </>
  );
}
