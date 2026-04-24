import { AppTopbar } from '@/components/app-topbar';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { addPigeonAction } from './actions';

const ERRORS: Record<string, string> = {
  invalide: 'Les données saisies sont invalides. Vérifiez le format du matricule.',
  doublon: 'Ce matricule existe déjà dans la base. Il est peut-être déjà dans votre pigeonnier.',
  no_loft: 'Aucun pigeonnier trouvé. Contactez le support.',
  serveur: 'Une erreur serveur est survenue. Réessayez.',
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AjouterPigeonPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await searchParams;
  const userName = user.email?.split('@')[0] ?? 'Éleveur';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 820, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        <Link
          href="/pigeonnier"
          className="cb-btn cb-btn--ghost"
          style={{ minHeight: 44, padding: '0 14px', marginBottom: 18, display: 'inline-flex' }}
        >
          <BackIcon /> Retour
        </Link>

        <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
          Nouveau pigeon
        </div>
        <h1
          className="cb-display"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 8px' }}
        >
          Ajouter un pigeon manuellement
        </h1>
        <p className="cb-muted" style={{ fontSize: '1.0625rem', marginTop: 0, marginBottom: 28 }}>
          Pour un pigeon que Francolomb n&apos;a pas encore enregistré, ou issu d&apos;un achat
          récent.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--cb-danger-soft)',
              color: 'var(--cb-danger)',
              border: '1px solid color-mix(in oklab, var(--cb-danger) 30%, transparent)',
              borderRadius: 'var(--cb-radius)',
              padding: '12px 16px',
              marginBottom: 20,
            }}
          >
            {ERRORS[error] ?? 'Une erreur est survenue.'}
          </div>
        )}

        <form action={addPigeonAction}>
          <div className="cb-card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 className="cb-section-title">Matricule</h3>

            <div
              style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 80px', gap: 12 }}
              className="cb-mat-grid"
            >
              <div>
                <label className="cb-label" htmlFor="country">
                  Pays
                </label>
                <select id="country" name="country" className="cb-input cb-select">
                  {['FR', 'BE', 'NL', 'DE', 'ES', 'LU', 'PO'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cb-label" htmlFor="ring_number">
                  Numéro de bague
                </label>
                <input
                  id="ring_number"
                  name="ring_number"
                  className="cb-input cb-matricule"
                  placeholder="203119"
                  required
                  pattern="\d{4,7}"
                  title="4 à 7 chiffres"
                />
              </div>
              <div>
                <label className="cb-label" htmlFor="year">
                  Année
                </label>
                <input
                  id="year"
                  name="year"
                  className="cb-input cb-matricule"
                  placeholder="24"
                  defaultValue="24"
                  required
                  pattern="\d{2}"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="cb-label" htmlFor="sex">
                  Sexe
                </label>
                <select id="sex" name="sex" className="cb-input cb-select">
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '12px 16px',
                background: 'var(--cb-bg-sunken)',
                borderRadius: 'var(--cb-radius)',
                fontFamily: 'var(--cb-font-mono)',
                fontWeight: 700,
                fontSize: '1.0625rem',
                textAlign: 'center',
                color: 'var(--cb-ink-3)',
              }}
            >
              FR-••••••-24 ou FR-••••••-24-F
            </div>
          </div>

          <div className="cb-card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 className="cb-section-title">Caractéristiques (optionnel)</h3>
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
                />
              </div>
              <div>
                <label className="cb-label" htmlFor="color">
                  Robe
                </label>
                <select id="color" name="color" className="cb-input cb-select">
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
            <h3 className="cb-section-title">Parents (optionnel)</h3>
            <p className="cb-muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
              Renseignez les matricules si vous les connaissez. Format&nbsp;: FR-203119-23 ou
              FR-203119-23-F
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
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="cb-btn cb-btn--primary cb-btn--big">
              Ajouter au pigeonnier
              <ArrowRightIcon />
            </button>
            <Link href="/pigeonnier" className="cb-btn cb-btn--ghost cb-btn--big">
              Annuler
            </Link>
          </div>
        </form>
      </main>

      <style>{`
        @media (max-width: 560px) {
          .cb-mat-grid { grid-template-columns: 80px 1fr !important; }
        }
      `}</style>
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

function ArrowRightIcon() {
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
      <title>Continuer</title>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
