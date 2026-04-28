import { AppTopbar } from '@/components/app-topbar';
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

export type Training = {
  id: string;
  training_date: string;
  release_point: string | null;
  distance_km: number | null;
  return_time: string | null;
  weather: string | null;
  notes: string | null;
};

export type PigeonNote = {
  id: string;
  body: string;
  created_at: string;
};

export type ParentPigeon = {
  matricule: string;
  displayMatricule: string;
  name: string | null;
  color: string | null;
  isFemale: boolean;
} | null;

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
  const userName = user.email?.split('@')[0] ?? 'Éleveur';

  // Trainings, notes, parents en parallèle
  const [trainingsRes, notesRes, fatherRes, motherRes] = await Promise.all([
    supabase
      .from('trainings')
      .select('id, training_date, release_point, distance_km, return_time, weather, notes')
      .eq('pigeon_matricule', matricule)
      .order('training_date', { ascending: false }),
    supabase
      .from('pigeon_notes')
      .select('id, body, created_at')
      .eq('pigeon_matricule', matricule)
      .order('created_at', { ascending: false }),
    pigeon.father_matricule
      ? supabase
          .from('pigeons')
          .select('matricule, name, color, is_female')
          .eq('matricule', pigeon.father_matricule)
          .single()
      : Promise.resolve({ data: null }),
    pigeon.mother_matricule
      ? supabase
          .from('pigeons')
          .select('matricule, name, color, is_female')
          .eq('matricule', pigeon.mother_matricule)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const trainings: Training[] = (trainingsRes.data ?? []) as Training[];
  const notes: PigeonNote[] = (notesRes.data ?? []) as PigeonNote[];

  const fatherPigeon: ParentPigeon = fatherRes.data
    ? {
        matricule: fatherRes.data.matricule,
        displayMatricule: formatMatricule(fatherRes.data.matricule),
        name: fatherRes.data.name,
        color: fatherRes.data.color,
        isFemale: fatherRes.data.is_female,
      }
    : null;

  const motherPigeon: ParentPigeon = motherRes.data
    ? {
        matricule: motherRes.data.matricule,
        displayMatricule: formatMatricule(motherRes.data.matricule),
        name: motherRes.data.name,
        color: motherRes.data.color,
        isFemale: motherRes.data.is_female,
      }
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

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
        <div
          className="cb-card"
          style={{ padding: 'clamp(20px, 4vw, 32px)', marginBottom: 24 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 'clamp(16px, 3vw, 28px)',
              alignItems: 'start',
            }}
            className="cb-hero-grid"
          >
            {/* Avatar initiales */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: bestPlace === 1 ? 'var(--cb-gold-soft)' : 'var(--cb-accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--cb-font-display)',
                fontWeight: 700,
                fontSize: '1.625rem',
                color: bestPlace === 1 ? 'var(--cb-gold)' : 'var(--cb-accent)',
              }}
            >
              {(pigeon.name ?? pigeon.matricule).slice(0, 2).toUpperCase()}
            </div>

            {/* Infos */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <title>Champion</title>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /><path d="M4 22h16" />
                    </svg>
                    Champion
                  </span>
                )}
              </div>
              <h1 className="cb-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', margin: '0 0 4px' }}>
                {pigeon.name ?? (
                  <span className="cb-muted" style={{ fontStyle: 'italic', fontWeight: 400 }}>Sans nom</span>
                )}
              </h1>
              <div className="cb-matricule cb-muted" style={{ fontSize: '1rem', marginBottom: 16 }}>
                {displayMatricule}
              </div>
              <Link href={`/pigeonnier/${matricule}/modifier`} className="cb-btn cb-btn--primary" style={{ minHeight: 42 }}>
                Modifier la fiche
              </Link>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
              <MiniKPI label="Concours" value={career.length} />
              <MiniKPI label="Meilleure place" value={bestPlace ? `${bestPlace}e` : '—'} accent={!!bestPlace && bestPlace <= 3} />
              <MiniKPI label="Vitesse moy." value={avgVelocity ? `${Math.round(avgVelocity).toLocaleString('fr-FR')}` : '—'} suffix={avgVelocity ? 'm/min' : undefined} />
              <MiniKPI label="Dernier" value={career[0]?.race ?? '—'} small />
            </div>
          </div>
        </div>

        <PigeonDetailTabs
          career={career}
          trainings={trainings}
          notes={notes}
          fatherPigeon={fatherPigeon}
          motherPigeon={motherPigeon}
          fatherMatricule={pigeon.father_matricule}
          motherMatricule={pigeon.mother_matricule}
          matricule={matricule}
        />
      </main>

      <style>{`
        @media (max-width: 680px) {
          .cb-hero-grid { grid-template-columns: 1fr !important; }
          .cb-hero-grid > :last-child { grid-template-columns: 1fr 1fr; }
        }
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
