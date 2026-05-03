import { AppTopbar } from '@/components/app-topbar';
import {
  ChartCard,
  LinePerformanceChart,
  MiniBarChart,
  StackBars,
} from '@/components/performance-charts';
import { PeriodPill } from '@/components/period-pill';
import { CATEGORY_LABELS } from '@/lib/colombo-race-labels';
import { buildMonthlyPerformanceSeries, buildMonthlyVolumeSeries } from '@/lib/performance-series';
import { calendarYearPeriodLabel } from '@/lib/period-labels';
import { type EmbeddedRace, singleRace } from '@/lib/pigeon-result-race';
import { createClient } from '@/lib/supabase/server';
import { loadUserPigeonResults } from '@/lib/user-race-results';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type RaceRef = EmbeddedRace | null;

export default async function PerformancePage({
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

  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const displayName = userData?.display_name ?? userName.split('.')[0] ?? userName;

  const { myPigeons, allResults } = await loadUserPigeonResults(supabase);

  const sortedResults = [...(allResults ?? [])].sort((a, b) => {
    const da = singleRace(a.races)?.race_date ?? '';
    const db = singleRace(b.races)?.race_date ?? '';
    return db.localeCompare(da);
  });

  const currentYear = new Date().getFullYear();
  const seasonStart = `${currentYear}-01-01`;
  const periodParam = Array.isArray(params?.periode) ? params?.periode[0] : params?.periode;
  const selectedPeriod: 'season' | '12m' = periodParam === '12m' ? '12m' : 'season';
  const categoryParam = Array.isArray(params?.type) ? params?.type[0] : params?.type;
  const selectedCategory =
    typeof categoryParam === 'string' && categoryParam in CATEGORY_LABELS ? categoryParam : 'all';
  const ageParam = Array.isArray(params?.age) ? params?.age[0] : params?.age;
  const selectedAge: 'all' | 'vieux' | 'jeune' =
    ageParam === 'vieux' || ageParam === 'jeune' ? ageParam : 'all';

  const rollingStart = new Date();
  rollingStart.setMonth(rollingStart.getMonth() - 11);
  rollingStart.setDate(1);
  const rollingStartStr = rollingStart.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const periodStart = selectedPeriod === '12m' ? rollingStartStr : seasonStart;
  const periodLabel =
    selectedPeriod === '12m' ? '12 derniers mois (glissant)' : calendarYearPeriodLabel(currentYear);

  const raceMatchesFilters = (race: RaceRef) => {
    if (!race) return false;
    const categoryOk = selectedCategory === 'all' || race.category === selectedCategory;
    const ageOk = selectedAge === 'all' || race.age_class === selectedAge;
    return categoryOk && ageOk;
  };

  const periodResults = sortedResults.filter((r) => {
    const race = singleRace(r.races);
    return (
      race &&
      race.race_date >= periodStart &&
      race.race_date <= todayStr &&
      raceMatchesFilters(race)
    );
  });

  const performanceSeries12 = buildMonthlyPerformanceSeries(periodResults, 12);
  const volumeSeries12 = buildMonthlyVolumeSeries(periodResults, 12);

  const categoryMap = new Map<string, number>();
  for (const r of periodResults) {
    const category = singleRace(r.races)?.category;
    if (!category) continue;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
  }
  const categorySeries = [...categoryMap.entries()]
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const placeDistribution = [
    { label: '1-3', value: periodResults.filter((r) => r.place > 0 && r.place <= 3).length },
    { label: '4-10', value: periodResults.filter((r) => r.place >= 4 && r.place <= 10).length },
    { label: '11-50', value: periodResults.filter((r) => r.place >= 11 && r.place <= 50).length },
    { label: '51+', value: periodResults.filter((r) => r.place >= 51).length },
  ];

  const tableRows = periodResults.slice(0, 40);

  const querySuffix =
    selectedCategory !== 'all' || selectedAge !== 'all'
      ? `&type=${selectedCategory}&age=${selectedAge}`
      : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/dashboard"
            className="cb-faint"
            style={{ fontSize: 13, textDecoration: 'none' }}
          >
            ← Tableau de bord
          </Link>
          <h1
            className="cb-display"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: '12px 0 0' }}
          >
            Analyses
          </h1>
          <p className="cb-faint" style={{ margin: '6px 0 0', fontSize: 14 }}>
            {displayName} · {periodLabel}
          </p>
          <p
            className="cb-muted"
            style={{ margin: '12px 0 0', fontSize: 14, maxWidth: 720, lineHeight: 1.5 }}
          >
            Les graphiques utilisent la <strong>date du concours</strong> enregistrée sur la course
            (<code className="cb-matricule">races.race_date</code>), pas la date à laquelle les
            résultats ont été importés. Si une seule barre ou un seul mois apparaît, c&apos;est que
            toutes les lignes filtrées tombent dans ce mois-là dans la période choisie.
            L&apos;option « année civile » couvre le calendrier du 1ᵉʳ janvier au 31 décembre ; pour
            l&apos;année en cours, les résultats affichés s&apos;arrêtent à la date du jour.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <span className="cb-faint" style={{ fontSize: 12 }}>
              Période
            </span>
            <PeriodPill
              href={`/performance?periode=season${querySuffix}`}
              active={selectedPeriod === 'season'}
            >
              Année civile (janv.–déc.)
            </PeriodPill>
            <PeriodPill
              href={`/performance?periode=12m${querySuffix}`}
              active={selectedPeriod === '12m'}
            >
              12 derniers mois
            </PeriodPill>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <ChartCard
            title="% dans le top 10 par mois"
            subtitle="Parmi vos classements du mois, part des places ≤ 10 · jusqu’à 12 mois avec données"
            empty={performanceSeries12.length === 0}
          >
            <LinePerformanceChart data={performanceSeries12} target={30} />
          </ChartCard>
          <ChartCard
            title="Volume de résultats par mois"
            subtitle="Nombre de lignes pigeon résultat dans la période"
            empty={volumeSeries12.length === 0}
          >
            <MiniBarChart data={volumeSeries12} />
          </ChartCard>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
          className="cb-performance-detail-grid"
        >
          <ChartCard
            title="Répartition par catégorie"
            subtitle="Concours de la période"
            empty={categorySeries.length === 0}
          >
            <StackBars data={categorySeries} />
          </ChartCard>
          <ChartCard
            title="Répartition des places"
            subtitle="Toutes lignes de la période"
            empty={periodResults.length === 0}
          >
            <StackBars data={placeDistribution} />
          </ChartCard>
        </div>

        <div style={{ marginBottom: 24 }}>
          <ChartCard
            title="Forme du moment"
            subtitle="Tendance lissée des classements ≤ 50% sur 12 mois — repère stable"
            empty={performanceSeries12.length === 0}
          >
            <LinePerformanceChart data={performanceSeries12} target={50} />
          </ChartCard>
        </div>

        <div className="cb-card" style={{ padding: 20, marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span className="cb-eyebrow">Comparateur</span>
            <span className="cb-badge cb-badge--warning">Bient&ocirc;t disponible</span>
          </div>
          <h2 className="cb-display" style={{ fontSize: '1.5rem', margin: '0 0 6px' }}>
            Comparateur de pigeons
          </h2>
          <p className="cb-muted" style={{ margin: '0 0 16px', fontSize: 14, maxWidth: 560 }}>
            Comparez deux pigeons sur la m&ecirc;me p&eacute;riode (vitesse, places,
            r&eacute;gularit&eacute;). Disponible prochainement.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
                Pigeon A
              </div>
              <select
                disabled
                className="cb-input"
                style={{ width: '100%', opacity: 0.6 }}
                aria-label="S&eacute;lectionner pigeon A"
              >
                <option>S&eacute;lectionner un pigeon</option>
                {myPigeons.slice(0, 20).map((p) => (
                  <option key={`a-${p.matricule}`}>{p.name ?? formatMatricule(p.matricule)}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
                Pigeon B
              </div>
              <select
                disabled
                className="cb-input"
                style={{ width: '100%', opacity: 0.6 }}
                aria-label="S&eacute;lectionner pigeon B"
              >
                <option>S&eacute;lectionner un pigeon</option>
                {myPigeons.slice(0, 20).map((p) => (
                  <option key={`b-${p.matricule}`}>{p.name ?? formatMatricule(p.matricule)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="cb-card" style={{ padding: 16 }}>
          <div className="cb-section-title" style={{ marginBottom: 8 }}>
            D&eacute;tail des r&eacute;sultats ({periodResults.length})
          </div>
          {tableRows.length === 0 ? (
            <p className="cb-muted" style={{ margin: 0 }}>
              Aucun résultat pour cette période et ces filtres.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                className="cb-tabular"
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
              >
                <thead>
                  <tr
                    className="cb-faint"
                    style={{ textAlign: 'left', borderBottom: '1px solid var(--cb-line)' }}
                  >
                    <th style={{ padding: '8px 10px 8px 0' }}>Date</th>
                    <th style={{ padding: '8px 10px' }}>Lieu</th>
                    <th style={{ padding: '8px 10px' }}>Catégorie</th>
                    <th style={{ padding: '8px 10px' }}>Place</th>
                    <th style={{ padding: '8px 10px' }}>Pigeon</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => {
                    const race = singleRace(r.races);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--cb-line-2)' }}>
                        <td style={{ padding: '10px 10px 10px 0', whiteSpace: 'nowrap' }}>
                          {race?.race_date
                            ? new Date(race.race_date).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                        <td style={{ padding: '10px', maxWidth: 200 }}>
                          {race?.release_point ?? '—'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {race ? (CATEGORY_LABELS[race.category] ?? race.category) : '—'}
                        </td>
                        <td style={{ padding: '10px' }}>{r.place > 0 ? r.place : '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <Link
                            href={`/pigeonnier/${encodeURIComponent(r.pigeon_matricule)}`}
                            style={{ textDecoration: 'none', fontWeight: 600 }}
                          >
                            {myPigeons.find((p) => p.matricule === r.pigeon_matricule)?.name ??
                              formatMatricule(r.pigeon_matricule)}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {periodResults.length > tableRows.length && (
                <p className="cb-faint" style={{ margin: '12px 0 0', fontSize: 12 }}>
                  Affichage des {tableRows.length} plus récents sur {periodResults.length}.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .cb-performance-detail-grid { grid-template-columns: 1fr !important; }
        }
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
