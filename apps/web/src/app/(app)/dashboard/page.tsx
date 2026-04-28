import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const CATEGORY_LABELS: Record<string, string> = {
  vitesse: 'Vitesse',
  petit_demi_fond: 'Petit demi-fond',
  demi_fond: 'Demi-fond',
  grand_demi_fond: 'Grand demi-fond',
  fond: 'Fond',
  grand_fond: 'Grand fond',
  jeunes: 'Jeunes',
};

export default async function DashboardPage() {
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

  const { data: myPigeons } = loftIds.length
    ? await supabase
        .from('pigeons')
        .select('matricule, name')
        .in('loft_id', loftIds)
        .is('deleted_at', null)
    : { data: [] };

  const myMatricules = new Set((myPigeons ?? []).map((p) => p.matricule));
  const totalPigeons = myPigeons?.length ?? 0;

  // Tous les résultats des pigeons de l'utilisateur en une seule requête
  // (pas de filtre/tri sur table étrangère — fait en JS)
  const { data: allResults } =
    myMatricules.size > 0
      ? await supabase
          .from('pigeon_results')
          .select(
            'place, n_engagement, velocity_m_per_min, pigeon_matricule, races(race_date, release_point, category)',
          )
          .in('pigeon_matricule', [...myMatricules])
      : { data: [] };

  type RaceRef = { race_date: string; release_point: string; category: string } | null;

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
  const seasonResults = sortedResults.filter((r) => {
    const race = r.races as unknown as RaceRef;
    return race && race.race_date >= seasonStart;
  });
  const seasonPlaces = seasonResults.map((r) => r.place).filter((p) => p > 0);
  const bestPlaceSeason = seasonPlaces.length > 0 ? Math.min(...seasonPlaces) : null;
  const tauxDePrix =
    seasonResults.length > 0
      ? Math.round((seasonPlaces.length / seasonResults.length) * 100)
      : null;

  const velocities = recentResults
    .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
    .filter((v) => v > 0);
  const avgVelocity =
    velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : null;

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
            Saison {currentYear}
          </div>
          <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
            Bonjour, {displayName}
          </h1>
        </div>

        {/* KPI grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <KpiCard label="Pigeons" value={totalPigeons} />
          <KpiCard label="Champions" value={championsTotal} accent={championsTotal > 0} />
          {bestPlaceSeason && (
            <KpiCard
              label="Meilleure place"
              value={`${bestPlaceSeason}e`}
              accent={bestPlaceSeason <= 3}
              suffix=""
            />
          )}
          {tauxDePrix !== null && (
            <KpiCard
              label="Taux de prix"
              value={`${tauxDePrix}%`}
              accent={tauxDePrix >= 30}
            />
          )}
          {avgVelocity && (
            <KpiCard label="Vitesse moy." value={avgVelocity.toFixed(0)} suffix="m/min" />
          )}
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
                  return (
                    <div
                      key={`${r.pigeon_matricule}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 20px',
                        borderTop: i > 0 ? '1px solid var(--cb-line-2)' : undefined,
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
                        <div className="cb-muted" style={{ fontSize: 12 }}>
                          <span className="cb-matricule" style={{ fontSize: 11 }}>
                            {formatMatricule(r.pigeon_matricule)}
                          </span>
                        </div>
                        {r.n_engagement && (
                          <div className="cb-faint" style={{ fontSize: 12 }}>
                            / {r.n_engagement}
                          </div>
                        )}
                      </div>
                    </div>
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
          .cb-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
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
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div className="cb-card" style={{ padding: '18px 20px' }}>
      <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
        {label}
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
