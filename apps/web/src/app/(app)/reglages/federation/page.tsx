import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SectionFede } from '../_components/section-fede';
import { SectionHeader } from '../_components/section-header';

export default async function FederationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <>
      <SectionHeader title="Fédération" subtitle="Sources de données et imports automatiques." />
      <SectionFede />
    </>
  );
}
