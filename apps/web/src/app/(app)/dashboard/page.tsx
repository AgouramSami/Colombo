import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { loadDashboardData } from './dashboard-data';
import { DashboardNewBadgeToast } from './dashboard-new-badge-toast';
import { DashboardUI } from './dashboard-ui';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    periode?: string | string[];
    type?: string | string[];
    age?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const userName = user.email?.split('@')[0] ?? 'Éleveur';
  const fallbackName = userName.split('.')[0] ?? userName;

  const data = await loadDashboardData(supabase, user.id, fallbackName, params);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />
      <DashboardNewBadgeToast badgeNames={data.newlyUnlockedBadgeNames} />
      <DashboardUI data={data} />

      <style>{`
        @media (max-width: 720px) {
          .cb-dashboard-grid { grid-template-columns: 1fr !important; }
          .cb-insights-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .cb-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .cb-result-row:hover { background: var(--cb-bg-sunken); }
        .cb-period-pill {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid var(--cb-line);
          padding: 0 14px;
          text-decoration: none;
          color: var(--cb-ink-2);
          font-size: 0.9rem;
          font-weight: 600;
          background: var(--cb-bg-elev);
        }
        .cb-period-pill[data-active="true"] {
          color: var(--cb-accent);
          border-color: color-mix(in srgb, var(--cb-accent) 45%, white);
          background: var(--cb-accent-soft);
        }
      `}</style>
    </div>
  );
}
