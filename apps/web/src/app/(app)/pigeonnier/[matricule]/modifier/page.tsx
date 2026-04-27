import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { savePigeonAction } from '../actions';

type Props = {
  params: Promise<{ matricule: string }>;
};

export default async function ModifierPigeonPage({ params }: Props) {
  const { matricule } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pigeon } = await supabase
    .from('pigeons')
    .select('matricule, name, color, father_matricule, mother_matricule, is_female, year_of_birth')
    .eq('matricule', matricule)
    .single();

  if (!pigeon) redirect('/pigeonnier');

  const userName = user.email?.split('@')[0] ?? 'Éleveur';
  const displayMatricule = formatMatricule(pigeon.matricule);

  const boundAction = savePigeonAction.bind(null, matricule);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 760, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        <Link
          href={`/pigeonnier/${matricule}`}
          className="cb-btn cb-btn--ghost"
          style={{ minHeight: 44, padding: '0 14px', marginBottom: 18, display: 'inline-flex' }}
        >
          <BackIcon /> Retour à la fiche
        </Link>

        <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
          <span className="cb-matricule">{displayMatricule}</span>
        </div>
        <h1
          className="cb-display"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 24px' }}
        >
          Modifier la fiche
        </h1>

        <form action={boundAction}>
          <div className="cb-card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 className="cb-section-title">Identité</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <label className="cb-label" htmlFor="name">
                  Surnom
                </label>
                <input
                  id="name"
                  name="name"
                  className="cb-input"
                  placeholder="Ex : Le Roi de Salon"
                  defaultValue={pigeon.name ?? ''}
                />
              </div>
              <div>
                <label className="cb-label" htmlFor="color">
                  Robe
                </label>
                <select
                  id="color"
                  name="color"
                  className="cb-input cb-select"
                  defaultValue={pigeon.color ?? ''}
                >
                  <option value="">— Choisir —</option>
                  {[
                    'bleu barré',
                    'bleu écaillé',
                    'rouge',
                    'noir',
                    'blanc',
                    'grivelé',
                    'bleu pâle',
                    'écaillé',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="cb-card" style={{ padding: 28, marginBottom: 28 }}>
            <h3 className="cb-section-title">Filiation</h3>
            <p className="cb-muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
              Format : FR-203119-23 ou FR-203119-23-F
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <label className="cb-label" htmlFor="father_matricule">
                  Père
                </label>
                <input
                  id="father_matricule"
                  name="father_matricule"
                  className="cb-input cb-matricule"
                  placeholder="FR-000000-00"
                  defaultValue={pigeon.father_matricule ?? ''}
                />
              </div>
              <div>
                <label className="cb-label" htmlFor="mother_matricule">
                  Mère
                </label>
                <input
                  id="mother_matricule"
                  name="mother_matricule"
                  className="cb-input cb-matricule"
                  placeholder="FR-000000-00-F"
                  defaultValue={pigeon.mother_matricule ?? ''}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="cb-btn cb-btn--primary cb-btn--big">
              Enregistrer les modifications
            </button>
            <Link href={`/pigeonnier/${matricule}`} className="cb-btn cb-btn--ghost cb-btn--big">
              Annuler
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
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
  );
}
