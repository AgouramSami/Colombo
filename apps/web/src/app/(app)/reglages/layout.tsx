import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ReglagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const userName = userData?.display_name ?? user.email?.split('@')[0] ?? 'Éleveur';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />
      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        {children}
      </main>
    </div>
  );
}
