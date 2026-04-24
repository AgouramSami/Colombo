import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PigeonDetailTabs } from './pigeon-detail-tabs';

export type CareerEntry = {
  date: string;
  race: string;
  category: string;
  distanceKm: number | null;
  place: number;
  engaged: number | null;
  velocity: number;
  pct: number | null;
};

export default async function PigeonDetailPage({
  params,
}: {
  params: Promise<{ matricule: string }>;
}) {
  const { matricule } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pigeon } = await supabase
    .from('pigeons')
    .select(
      'matricule, name, is_female, year_of_birth, color, father_matricule, mother_matricule, loft_id',
    )
    .eq('matricule', matricule)
    .single();

  if (!pigeon) redirect('/pigeonnier');

  const { data: results } = await supabase
    .from('pigeon_results')
    .select(
      'place, velocity_m_per_min, n_engagement, races(race_date, release_point, category, distance_min_km, distance_max_km)',
    )
    .eq('pigeon_matricule', matricule)
    .order('races(race_date)', { ascending: false });

  const career: CareerEntry[] = (results ?? []).map((r) => {
    const race = r.races as unknown as {
      race_date: string;
      release_point: string;
      category: string;
      distance_min_km: number | null;
      distance_max_km: number | null;
    } | null;
    const velocity = Number.parseFloat(r.velocity_m_per_min ?? '0');
    const pct =
      r.n_engagement && r.n_engagement > 0 ? Math.round((r.place / r.n_engagement) * 100) : null;
    return {
      date: race?.race_date ?? '',
      race: race?.release_point ?? '—',
      category: race?.category ?? '—',
      distanceKm: race?.distance_min_km ?? null,
      place: r.place,
      engaged: r.n_engagement,
      velocity,
      pct,
    };
  });

  const velocities = career.map((c) => c.velocity).filter((v) => v > 0);
  const avgVelocity =
    velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : null;
  const bestPlace = career.length > 0 ? Math.min(...career.map((c) => c.place)) : null;

  const displayMatricule = formatMatricule(pigeon.matricule);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      {/* Topbar */}
      <header className="cb-topbar">
        <a href="/pigeonnier" className="cb-topbar__brand">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Colombo</title>
            <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
            <circle cx="12" cy="9" r="1" />
          </svg>
          Colombo
        </a>
        <div style={{ flex: 1 }} />
        <nav className="cb-topbar__nav">
          <a href="/pigeonnier" data-current="false">
            Pigeonnier
          </a>
        </nav>
        <form action="/auth/signout" method="post">
          <button type="submit" className="cb-btn cb-btn--ghost" style={{ minHeight: 44 }}>
            Se déconnecter
          </button>
        </form>
      </header>

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '24px clamp(16px, 4vw, 40px) 80px' }}
      >
        <Link
          href="/pigeonnier"
          className="cb-btn cb-btn--ghost"
          style={{ minHeight: 44, padding: '0 14px', marginBottom: 18, display: 'inline-flex' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <title>Retour</title>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour au pigeonnier
        </Link>

        {/* Hero */}
        <div className="cb-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr' }}
            className="cb-hero-grid"
          >
            {/* Photo placeholder */}
            <div
              style={{
                background: 'var(--cb-bg-sunken)',
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="cb-muted" style={{ fontSize: 14 }}>
                Photo à venir
              </span>
            </div>

            {/* Infos */}
            <div style={{ padding: '28px 32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className="cb-badge"
                  style={{
                    background: pigeon.is_female
                      ? 'color-mix(in oklab, #c2185b 12%, var(--cb-bg-sunken))'
                      : 'var(--cb-accent-soft)',
                    color: pigeon.is_female ? '#c2185b' : 'var(--cb-accent-soft-ink)',
                  }}
                >
                  {pigeon.is_female ? 'Femelle' : 'Mâle'}
                </span>
                {pigeon.color && <span className="cb-badge">{pigeon.color}</span>}
                <span className="cb-badge">Né en {pigeon.year_of_birth}</span>
                {bestPlace === 1 && (
                  <span className="cb-badge cb-badge--gold">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <title>Champion</title>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                      <path d="M4 22h16" />
                    </svg>
                    Champion
                  </span>
                )}
              </div>

              <h1
                className="cb-display"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '4px 0 6px' }}
              >
                {pigeon.name ?? (
                  <span className="cb-muted" style={{ fontStyle: 'italic', fontWeight: 400 }}>
                    Sans nom
                  </span>
                )}
              </h1>
              <div
                className="cb-matricule cb-muted"
                style={{ fontSize: '1.0625rem', marginBottom: 22 }}
              >
                {displayMatricule}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <MiniKPI label="Concours" value={career.length} />
                {bestPlace && <MiniKPI label="Meilleure place" value={`${bestPlace}e`} accent />}
                {avgVelocity && (
                  <MiniKPI label="Vitesse moy." value={avgVelocity.toFixed(0)} suffix="m/min" />
                )}
                {career[0] && <MiniKPI label="Dernier" value={career[0].race} small />}
              </div>
            </div>
          </div>
        </div>

        <PigeonDetailTabs
          career={career}
          fatherMatricule={pigeon.father_matricule}
          motherMatricule={pigeon.mother_matricule}
        />
      </main>

      <style>{`
        @media (max-width: 860px) { .cb-hero-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  suffix,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div
        className="cb-muted"
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {label}
      </div>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: small ? '1.125rem' : '1.625rem',
          color: accent ? 'var(--cb-accent)' : 'var(--cb-ink)',
          marginTop: 2,
        }}
      >
        {value}
        {suffix && (
          <span className="cb-muted" style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
