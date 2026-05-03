import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SectionHeader } from '../_components/section-header';
import { SectionPigeonnier } from '../_components/section-pigeonnier';
import type { LoftData } from '../types';

export default async function PigeonnierReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('lofts')
    .select('id, name, address, licence_number')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const loftData: LoftData[] = data ?? [];

  return (
    <>
      <SectionHeader title="Mon pigeonnier" subtitle="Gérez vos lofts, adresses et licences FCF." />
      <SectionPigeonnier loftData={loftData} />
    </>
  );
}
