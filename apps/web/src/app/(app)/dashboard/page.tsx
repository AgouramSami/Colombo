import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

const CATEGORY_LABELS: Record<string, string> = {
  vitesse: 'Vitesse',
  petit_demi_fond: 'Petit demi-fond',
  demi_fond: 'Demi-fond',
  grand_demi_fond: 'Grand demi-fond',
  fond: 'Fond',
  grand_fond: 'Grand fond',
  jeunes: 'Jeunes',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ periode?: string | string[] }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const userName = user.email?.split('@')[0] ?? 'Éleveur';
  const firstName = userName.split('.')[0] ?? userName;

  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const displayName = userData?.display_name ?? firstName;

  // Tous les pigeonniers de l'utilisateur
  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null);
  const loftIds = (lofts ?? []).map((l) => l.id);

  type MyPigeonRow = { matricule: string; name: string | null };
  const PAGE_SIZE = 1000;
  const myPigeons: MyPigeonRow[] = [];
  for (let offset = 0; loftIds.length; offset += PAGE_SIZE) {
    const { data } = await supabase
      .from('pigeons')
      .select('matricule, name')
      .in('loft_id', loftIds)
      .is('deleted_at', null)
      .order('matricule', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    myPigeons.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const myMatricules = new Set(myPigeons.map((p) => p.matricule));
  const totalPigeons = myPigeons.length;

  // Tous les résultats des pigeons de l'utilisateur en une seule requête
  // (pas de filtre/tri sur table étrangère — fait en JS)
  type PigeonResultRow = {
    id: string;
    place: number;
    n_engagement: number | null;
    velocity_m_per_min: string | null;
    pigeon_matricule: string;
    races?: unknown;
  };

  // Pagination + chunk pour éviter le plafond de lignes et des URL trop longues.
  const allResults: PigeonResultRow[] = [];
  const myMatriculesArray = [...myMatricules];
  const MATRICULES_CHUNK_SIZE = 500;
  for (let i = 0; i < myMatriculesArray.length; i += MATRICULES_CHUNK_SIZE) {
    const chunk = myMatriculesArray.slice(i, i + MATRICULES_CHUNK_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data } = await supabase
        .from('pigeon_results')
        .select(
          'id, place, n_engagement, velocity_m_per_min, pigeon_matricule, races(id, race_date, release_point, category)',
        )
        .in('pigeon_matricule', chunk)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      allResults.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }

  type RaceRef = { id?: string; race_date: string; release_point: string; category: string } | null;

  // Tri par date descendante (pas de tri SQL sur table étrangère — fait en JS)
  const sortedResults = [...(allResults ?? [])].sort((a, b) => {
    const da = (a.races as unknown as RaceRef)?.race_date ?? '';
    const db = (b.races as unknown as RaceRef)?.race_date ?? '';
    return db.localeCompare(da);
  });

  const recentResults = sortedResults.slice(0, 5);

  const championsTotal = (allResults ?? []).filter((r) => r.place === 1).length;

  const currentYear = new Date().getFullYear();
  const seasonStart = `${currentYear}-01-01`;
  const periodParam = Array.isArray(params?.periode) ? params?.periode[0] : params?.periode;
  const selectedPeriod: 'season' | '12m' = periodParam === '12m' ? '12m' : 'season';
  const rollingStart = new Date();
  rollingStart.setMonth(rollingStart.getMonth() - 11);
  rollingStart.setDate(1);
  const rollingStartStr = rollingStart.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const periodStart = selectedPeriod === '12m' ? rollingStartStr : seasonStart;
  const periodLabel = selectedPeriod === '12m' ? '12 derniers mois' : `Saison ${currentYear}`;

  const periodResults = sortedResults.filter((r) => {
    const race = r.races as unknown as RaceRef;
    return race && race.race_date >= periodStart && race.race_date <= todayStr;
  });
  const previousPeriodRange =
    selectedPeriod === '12m'
      ? (() => {
          const prevEnd = new Date(rollingStart);
          prevEnd.setDate(prevEnd.getDate() - 1);
          const prevStart = new Date(rollingStart);
          prevStart.setFullYear(prevStart.getFullYear() - 1);
          return {
            start: prevStart.toISOString().slice(0, 10),
            end: prevEnd.toISOString().slice(0, 10),
          };
        })()
      : (() => {
          const prevStart = `${currentYear - 1}-01-01`;
          const prevEnd = new Date(today);
          prevEnd.setFullYear(prevEnd.getFullYear() - 1);
          return {
            start: prevStart,
            end: prevEnd.toISOString().slice(0, 10),
          };
        })();
  const previousPeriodResults = sortedResults.filter((r) => {
    const raceDate = (r.races as unknown as RaceRef)?.race_date;
    return raceDate && raceDate >= previousPeriodRange.start && raceDate <= previousPeriodRange.end;
  });
  const periodPlaces = periodResults.map((r) => r.place).filter((p) => p > 0);
  const bestPlaceSeason = periodPlaces.length > 0 ? Math.min(...periodPlaces) : null;
  const tauxDePrix =
    periodResults.length > 0
      ? Math.round((periodPlaces.length / periodResults.length) * 100)
      : null;

  const velocities = recentResults
    .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
    .filter((v) => v > 0);
  const avgVelocity =
    velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : null;

  const seasonRaceIds = new Set(
    periodResults
      .map((r) => (r.races as unknown as RaceRef)?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  const seasonUniqueRaces = seasonRaceIds.size;
  const podiumCount = periodResults.filter((r) => r.place > 0 && r.place <= 3).length;
  const topTenCount = periodResults.filter((r) => r.place > 0 && r.place <= 10).length;
  const podiumRate =
    periodResults.length > 0 ? Math.round((podiumCount / periodResults.length) * 100) : null;
  const topTenRate =
    periodResults.length > 0 ? Math.round((topTenCount / periodResults.length) * 100) : null;
  const avgPlaceSeason =
    periodPlaces.length > 0
      ? Math.round(
          (periodPlaces.reduce((sum, place) => sum + place, 0) / periodPlaces.length) * 10,
        ) / 10
      : null;
  const prevPlaces = previousPeriodResults.map((r) => r.place).filter((p) => p > 0);
  const prevTauxDePrix =
    previousPeriodResults.length > 0
      ? Math.round((prevPlaces.length / previousPeriodResults.length) * 100)
      : null;
  const prevPodiumRate =
    previousPeriodResults.length > 0
      ? Math.round(
          (previousPeriodResults.filter((r) => r.place > 0 && r.place <= 3).length /
            previousPeriodResults.length) *
            100,
        )
      : null;
  const prevTopTenRate =
    previousPeriodResults.length > 0
      ? Math.round(
          (previousPeriodResults.filter((r) => r.place > 0 && r.place <= 10).length /
            previousPeriodResults.length) *
            100,
        )
      : null;
  const prevVelocities = previousPeriodResults
    .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
    .filter((v) => v > 0);
  const prevAvgVelocity =
    prevVelocities.length > 0
      ? prevVelocities.reduce((sum, v) => sum + v, 0) / prevVelocities.length
      : null;

  const now = new Date();
  const monthlyLabels = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const monthlyMap = new Map<string, number>();
  for (const key of monthlyLabels) monthlyMap.set(key, 0);
  for (const r of periodResults) {
    const raceDate = (r.races as unknown as RaceRef)?.race_date;
    if (!raceDate) continue;
    const monthKey = raceDate.slice(0, 7);
    if (monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1);
    }
  }
  const monthlySeries = monthlyLabels.map((key) => {
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleDateString('fr-FR', { month: 'short' });
    return { label: label[0]?.toUpperCase() + label.slice(1), value: monthlyMap.get(key) ?? 0 };
  });

  const categoryMap = new Map<string, number>();
  for (const r of periodResults) {
    const category = (r.races as unknown as RaceRef)?.category;
    if (!category) continue;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
  }
  const categorySeries = [...categoryMap.entries()]
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const placeDistribution = [
    { label: '1-3', value: periodResults.filter((r) => r.place > 0 && r.place <= 3).length },
    { label: '4-10', value: periodResults.filter((r) => r.place >= 4 && r.place <= 10).length },
    { label: '11-50', value: periodResults.filter((r) => r.place >= 11 && r.place <= 50).length },
    { label: '51+', value: periodResults.filter((r) => r.place >= 51).length },
  ];

  // Top 3 pigeons par vitesse moyenne
  const topPigeons: {
    matricule: string;
    name: string | null;
    avg_velocity: number;
    race_count: number;
  }[] = [];
  if (myMatricules.size > 0) {
    const grouped: Record<string, number[]> = {};
    for (const r of allResults ?? []) {
      const v = Number.parseFloat(r.velocity_m_per_min ?? '0');
      if (v > 0) {
        const key = r.pigeon_matricule;
        if (!grouped[key]) grouped[key] = [];
        (grouped[key] as number[]).push(v);
      }
    }
    const sorted = Object.entries(grouped)
      .map(([mat, vs]) => ({
        matricule: mat,
        name: (myPigeons ?? []).find((p) => p.matricule === mat)?.name ?? null,
        avg_velocity: vs.reduce((a, b) => a + b) / vs.length,
        race_count: vs.length,
      }))
      .sort((a, b) => b.avg_velocity - a.avg_velocity)
      .slice(0, 3);
    topPigeons.push(...sorted);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
            {periodLabel}
          </div>
          <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
            Bonjour, {displayName}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard?periode=season"
              className="cb-period-pill"
              data-active={selectedPeriod === 'season'}
            >
              Saison
            </Link>
            <Link
              href="/dashboard?periode=12m"
              className="cb-period-pill"
              data-active={selectedPeriod === '12m'}
            >
              12 derniers mois
            </Link>
          </div>
        </div>

        {/* KPI grid */}
        <div
          className="cb-kpi-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <KpiCard label="Pigeons" value={totalPigeons} icon={<LoftIcon />} />
          <KpiCard
            label="Résultats"
            value={periodResults.length}
            trend={computeTrend(periodResults.length, previousPeriodResults.length)}
            icon={<StatsIcon />}
          />
          <KpiCard label="Concours disputés" value={seasonUniqueRaces} icon={<FlagIcon />} />
          <KpiCard
            label="Champions"
            value={championsTotal}
            accent={championsTotal > 0}
            icon={<TrophyIcon />}
          />
          {bestPlaceSeason && (
            <KpiCard
              label="Meilleure place"
              value={`${bestPlaceSeason}e`}
              accent={bestPlaceSeason <= 3}
              suffix=""
              icon={<PodiumIcon />}
            />
          )}
          {tauxDePrix !== null && (
            <KpiCard
              label="Taux de prix"
              value={`${tauxDePrix}%`}
              accent={tauxDePrix >= 30}
              trend={computeTrend(tauxDePrix, prevTauxDePrix)}
              icon={<TargetIcon />}
            />
          )}
          {podiumRate !== null && (
            <KpiCard
              label="Podiums"
              value={`${podiumRate}%`}
              accent={podiumRate >= 15}
              trend={computeTrend(podiumRate, prevPodiumRate)}
              icon={<PodiumIcon />}
            />
          )}
          {topTenRate !== null && (
            <KpiCard
              label="Top 10"
              value={`${topTenRate}%`}
              trend={computeTrend(topTenRate, prevTopTenRate)}
              icon={<StatsIcon />}
            />
          )}
          {avgPlaceSeason !== null && (
            <KpiCard
              label="Place moyenne"
              value={avgPlaceSeason.toFixed(1)}
              trend={computeTrend(
                avgPlaceSeason,
                prevPlaces.length > 0
                  ? Math.round(
                      (prevPlaces.reduce((sum, place) => sum + place, 0) / prevPlaces.length) * 10,
                    ) / 10
                  : null,
                true,
              )}
              icon={<RankIcon />}
            />
          )}
          {avgVelocity && (
            <KpiCard
              label="Vitesse moy."
              value={avgVelocity.toFixed(0)}
              suffix="m/min"
              trend={computeTrend(avgVelocity, prevAvgVelocity)}
              icon={<BoltIcon />}
            />
          )}
        </div>

        {/* Stats visuelles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
          className="cb-stats-grid"
        >
          <ChartCard
            title="Évolution mensuelle"
            subtitle="6 derniers mois"
            empty={periodResults.length === 0}
          >
            <MiniBarChart data={monthlySeries} />
          </ChartCard>
          <ChartCard
            title="Répartition par catégorie"
            subtitle="Poids des types de concours"
            empty={categorySeries.length === 0}
          >
            <StackBars data={categorySeries} />
          </ChartCard>
          <ChartCard
            title="Distribution des places"
            subtitle="Répartition des classements"
            empty={periodResults.length === 0}
          >
            <StackBars data={placeDistribution} />
          </ChartCard>
        </div>

        {/* Main content grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: 20,
          }}
          className="cb-dashboard-grid"
        >
          {/* Derniers résultats */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="cb-section-title" style={{ margin: 0 }}>
                Derniers résultats
              </h2>
              <Link
                href="/concours"
                className="cb-btn cb-btn--ghost"
                style={{ minHeight: 38, padding: '0 12px', fontSize: '0.875rem' }}
              >
                Voir tout →
              </Link>
            </div>

            {recentResults.length === 0 ? (
              <div className="cb-card" style={{ padding: 32, textAlign: 'center' }}>
                <p className="cb-muted">
                  Vos résultats apparaîtront ici dès qu&apos;ils seront importés.
                </p>
                <Link
                  href="/concours"
                  className="cb-btn cb-btn--soft"
                  style={{ marginTop: 16, display: 'inline-flex' }}
                >
                  Voir les concours
                </Link>
              </div>
            ) : (
              <div className="cb-card" style={{ overflow: 'hidden' }}>
                {recentResults.map((r, i) => {
                  const race = r.races as unknown as {
                    race_date: string;
                    release_point: string;
                    category: string;
                  } | null;
                  const isChamp = r.place <= 3;
                  const pigeonName = (myPigeons ?? []).find(
                    (p) => p.matricule === r.pigeon_matricule,
                  )?.name;
                  return (
                    <Link
                      key={`${r.pigeon_matricule}-${i}`}
                      href={`/pigeonnier/${r.pigeon_matricule}`}
                      className="cb-result-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 20px',
                        borderTop: i > 0 ? '1px solid var(--cb-line-2)' : undefined,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          background: isChamp ? 'var(--cb-accent-soft)' : 'var(--cb-bg-sunken)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="cb-display cb-tabular"
                          style={{
                            fontSize: '1rem',
                            color: isChamp ? 'var(--cb-accent)' : 'var(--cb-ink-3)',
                          }}
                        >
                          {r.place}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {race?.release_point ?? '—'}
                        </div>
                        <div className="cb-muted" style={{ fontSize: 13 }}>
                          {race?.race_date
                            ? new Date(race.race_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })
                            : '—'}{' '}
                          · {CATEGORY_LABELS[race?.category ?? ''] ?? race?.category ?? '—'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {pigeonName ?? (
                            <span className="cb-matricule" style={{ fontSize: 11 }}>
                              {formatMatricule(r.pigeon_matricule)}
                            </span>
                          )}
                        </div>
                        {r.n_engagement && (
                          <div className="cb-faint" style={{ fontSize: 12 }}>
                            {r.place}/{r.n_engagement}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top pigeons */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 className="cb-section-title" style={{ margin: 0 }}>
                Meilleurs pigeons
              </h2>
              <Link
                href="/pigeonnier"
                className="cb-btn cb-btn--ghost"
                style={{ minHeight: 38, padding: '0 12px', fontSize: '0.875rem' }}
              >
                Pigeonnier →
              </Link>
            </div>

            {topPigeons.length === 0 ? (
              <div className="cb-card" style={{ padding: 32, textAlign: 'center' }}>
                <p className="cb-muted" style={{ fontSize: '0.9375rem' }}>
                  Ajoutez des pigeons pour voir leur palmarès.
                </p>
                <Link
                  href="/pigeonnier/ajouter"
                  className="cb-btn cb-btn--soft"
                  style={{ marginTop: 16, display: 'inline-flex' }}
                >
                  Ajouter un pigeon
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topPigeons.map((p, rank) => (
                  <Link
                    key={p.matricule}
                    href={`/pigeonnier/${p.matricule}`}
                    className="cb-card"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textDecoration: 'none',
                      transition: 'box-shadow var(--cb-dur) var(--cb-ease)',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background:
                          rank === 0
                            ? 'var(--cb-gold-soft)'
                            : rank === 1
                              ? 'var(--cb-bg-sunken)'
                              : 'var(--cb-bg-deep)',
                        color: rank === 0 ? 'var(--cb-gold)' : 'var(--cb-ink-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--cb-font-display)',
                        fontWeight: 700,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {rank + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name ?? (
                          <span className="cb-muted" style={{ fontStyle: 'italic' }}>
                            Sans nom
                          </span>
                        )}
                      </div>
                      <div className="cb-matricule cb-muted" style={{ fontSize: 12 }}>
                        {formatMatricule(p.matricule)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        className="cb-display cb-tabular"
                        style={{ fontSize: '1.125rem', color: 'var(--cb-ink)' }}
                      >
                        {p.avg_velocity.toFixed(0)}
                      </div>
                      <div className="cb-faint" style={{ fontSize: 11 }}>
                        m/min · {p.race_count} conc.
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/pigeonnier/ajouter" className="cb-btn cb-btn--primary">
            <PlusIcon />
            Ajouter un pigeon
          </Link>
          <Link href="/concours" className="cb-btn cb-btn--ghost">
            <FlagIcon />
            Voir les concours
          </Link>
          <Link href="/reglages" className="cb-btn cb-btn--ghost">
            Réglages du compte
          </Link>
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .cb-dashboard-grid { grid-template-columns: 1fr !important; }
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

function KpiCard({
  label,
  value,
  accent,
  suffix,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  suffix?: string;
  trend?: { text: string; tone: 'up' | 'down' | 'flat' };
  icon?: ReactNode;
}) {
  return (
    <div className="cb-card" style={{ padding: '18px 20px', background: 'var(--cb-bg-elev)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div className="cb-eyebrow">{label}</div>
        {icon && (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: 'var(--cb-bg-sunken)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent ? 'var(--cb-accent)' : 'var(--cb-ink-3)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
          color: accent ? 'var(--cb-accent)' : 'var(--cb-ink)',
        }}
      >
        {value}
        {suffix !== undefined && suffix !== '' && (
          <span className="cb-muted" style={{ fontSize: 13, fontWeight: 500, marginLeft: 5 }}>
            {suffix}
          </span>
        )}
      </div>
      {trend && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color:
              trend.tone === 'up'
                ? 'var(--cb-positive)'
                : trend.tone === 'down'
                  ? 'var(--cb-danger)'
                  : 'var(--cb-faint)',
          }}
        >
          {trend.text}
        </div>
      )}
    </div>
  );
}

function computeTrend(
  current: number,
  previous: number | null,
  inverse = false,
): { text: string; tone: 'up' | 'down' | 'flat' } | undefined {
  if (previous === null || Number.isNaN(previous)) return undefined;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return { text: '= stable vs période précédente', tone: 'flat' };
  const isUp = inverse ? delta < 0 : delta > 0;
  const sign = delta > 0 ? '+' : '';
  return {
    text: `${sign}${delta} vs période précédente`,
    tone: isUp ? 'up' : 'down',
  };
}

function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cb-card" style={{ padding: 16 }}>
      <div className="cb-section-title" style={{ marginBottom: 2 }}>
        {title}
      </div>
      <p className="cb-faint" style={{ margin: 0, fontSize: 12 }}>
        {subtitle}
      </p>
      {empty ? (
        <p className="cb-muted" style={{ marginTop: 14, fontSize: 14 }}>
          Pas assez de données pour afficher ce graphique.
        </p>
      ) : (
        <div style={{ marginTop: 14 }}>{children}</div>
      )}
    </div>
  );
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'end', minHeight: 120 }}>
      {data.map((item) => {
        const height = `${Math.max(10, (item.value / max) * 92)}px`;
        return (
          <div key={item.label} style={{ flex: 1, minWidth: 0 }}>
            <div
              title={`${item.label} : ${item.value}`}
              style={{
                height,
                borderRadius: 8,
                background:
                  item.value === max
                    ? 'var(--cb-accent)'
                    : 'color-mix(in srgb, var(--cb-accent) 45%, white)',
                transition: 'height 220ms ease',
              }}
            />
            <div className="cb-faint" style={{ marginTop: 6, fontSize: 11, textAlign: 'center' }}>
              {item.label}
            </div>
            <div
              className="cb-tabular"
              style={{ fontSize: 12, textAlign: 'center', fontWeight: 600 }}
            >
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StackBars({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((item) => {
        const ratio = Math.round((item.value / total) * 100);
        return (
          <div key={item.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span className="cb-muted">{item.label}</span>
              <span className="cb-tabular" style={{ fontWeight: 600 }}>
                {item.value} ({ratio}%)
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'var(--cb-bg-sunken)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(6, ratio)}%`,
                  height: '100%',
                  background: 'var(--cb-accent)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Ajouter</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Stats</title>
      <path d="M4 19V9M12 19V5M20 19v-7" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Trophée</title>
      <path d="M8 4h8v3a4 4 0 0 1-8 0zM6 7H4a2 2 0 0 0 2 2M18 7h2a2 2 0 0 1-2 2M12 11v4M9 19h6" />
    </svg>
  );
}

function PodiumIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Podium</title>
      <path d="M4 20h16M7 20v-5h4v5M13 20v-8h4v8" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Cible</title>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Classement</title>
      <path d="M7 17V7M12 17V4M17 17v-9" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Vitesse</title>
      <path d="M13 2 4 14h7l-1 8 10-13h-7z" />
    </svg>
  );
}

function LoftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>Pigeonnier</title>
      <path d="M3 11 12 4l9 7M5 10v10h14V10" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Concours</title>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
