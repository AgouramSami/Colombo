import { loginAction } from './actions';

type Props = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--cb-bg)',
      }}
    >
      {/* Colonne gauche : formulaire */}
      <main
        style={{
          flex: '0 0 560px',
          maxWidth: '100%',
          padding: '40px 64px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--cb-font-display)',
            fontWeight: 700,
            fontSize: '1.375rem',
            textDecoration: 'none',
            color: 'var(--cb-ink)',
          }}
        >
          <svg
            width="26"
            height="26"
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
          Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
        </div>

        {/* Contenu centré */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 420,
            marginTop: 48,
          }}
        >
          {params.sent ? (
            <ConfirmationState email={params.sent} />
          ) : (
            <LoginForm error={params.error} />
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            color: 'var(--cb-ink-4)',
            fontSize: 14,
            display: 'flex',
            gap: 22,
            paddingTop: 28,
          }}
        >
          <a href="/mentions-legales" style={{ textDecoration: 'none' }}>
            Mentions légales
          </a>
          <a href="/cgu" style={{ textDecoration: 'none' }}>
            CGU
          </a>
          <a
            href="https://wa.me/33600000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            Aide
          </a>
        </footer>
      </main>

      {/* Colonne droite : preuve sociale */}
      <aside
        className="cb-login-aside"
        style={{
          flex: 1,
          background: 'var(--cb-bg-sunken)',
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <LoginAside />
      </aside>

      <style>{`
        @media (max-width: 980px) {
          .cb-login-aside { display: none !important; }
          main { flex: 1 !important; padding: 40px clamp(24px, 6vw, 64px) !important; }
        }
      `}</style>
    </div>
  );
}

function LoginForm({ error }: { error?: string }) {
  return (
    <>
      <h1
        className="cb-display"
        style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', margin: '0 0 14px' }}
      >
        Bon retour parmi
        <br />
        les colombophiles.
      </h1>
      <p className="cb-muted" style={{ fontSize: '1.125rem', marginTop: 0, marginBottom: 36 }}>
        Entrez votre adresse e-mail, nous vous envoyons un lien de connexion. Pas de mot de passe à
        retenir.
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
            marginBottom: 24,
            fontSize: '1rem',
          }}
        >
          {error === 'lien_invalide'
            ? 'Ce lien de connexion est invalide ou a expiré. Veuillez recommencer.'
            : 'Une erreur est survenue. Veuillez réessayer.'}
        </div>
      )}

      <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <label
          htmlFor="email"
          style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '1.0625rem' }}
        >
          Votre adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.fr"
          className="cb-input cb-input--big"
          style={{ marginBottom: 18 }}
        />
        <button
          type="submit"
          className="cb-btn cb-btn--primary cb-btn--big"
          style={{ width: '100%' }}
        >
          Recevoir mon lien de connexion
          <ArrowRightIcon />
        </button>
      </form>

      <p style={{ marginTop: 28, color: 'var(--cb-ink-3)', fontSize: '0.9375rem' }}>
        Pas encore inscrit ?{' '}
        <a
          href="/login"
          style={{
            color: 'var(--cb-accent)',
            textUnderlineOffset: 4,
            textDecoration: 'underline',
          }}
        >
          Créer un compte
        </a>{' '}
        — c&apos;est gratuit pour 3 pigeons.
      </p>
    </>
  );
}

function ConfirmationState({ email }: { email: string }) {
  return (
    <div className="cb-card cb-fade-up" style={{ padding: 28 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--cb-positive-soft)',
          color: 'var(--cb-positive)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <CheckIcon size={28} />
      </div>
      <h2 className="cb-display" style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>
        Vérifiez votre boîte e-mail
      </h2>
      <p style={{ color: 'var(--cb-ink-3)', marginTop: 0, lineHeight: 1.6 }}>
        Un lien a été envoyé à <strong style={{ color: 'var(--cb-ink)' }}>{email}</strong>. Cliquez
        dessus pour vous connecter. Vérifiez vos courriers indésirables si besoin.
      </p>
    </div>
  );
}

function LoginAside() {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
      <span
        className="cb-badge cb-badge--accent"
        style={{ marginBottom: 20, display: 'inline-flex' }}
      >
        <TrophyIcon size={14} /> Saison 2026 en cours
      </span>
      <h2 className="cb-display" style={{ fontSize: '2rem', margin: '0 0 10px' }}>
        La carrière complète de vos pigeons, d&apos;un seul coup d&apos;œil.
      </h2>
      <p style={{ color: 'var(--cb-ink-3)', fontSize: '1.0625rem', marginBottom: 28 }}>
        Colombo&apos; rassemble automatiquement vos résultats depuis Francolomb et tous les sites de
        clubs.
      </p>

      {/* Carte dernier concours */}
      <div className="cb-card" style={{ padding: 22, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                color: 'var(--cb-ink-4)',
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                fontWeight: 600,
              }}
            >
              Dernier concours
            </div>
            <div className="cb-display" style={{ fontSize: '1.375rem', marginTop: 4 }}>
              Lamotte-Beuvron · 248 km
            </div>
          </div>
          <span className="cb-badge cb-badge--gold">
            <TrophyIcon size={12} /> 1er
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            borderTop: '1px solid var(--cb-line)',
            paddingTop: 14,
          }}
        >
          <AsideStat label="Engagés" value="1 052" />
          <AsideStat label="Classés" value="5" accent />
          <AsideStat label="Vit. max" value="1 341" suffix="m/min" />
        </div>
      </div>

      {/* Carte activité */}
      <div
        className="cb-card"
        style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'var(--cb-accent-soft)',
            color: 'var(--cb-accent-soft-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChartIcon size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>+12 nouveaux résultats cette semaine</div>
          <div style={{ color: 'var(--cb-ink-3)', fontSize: 14 }}>
            Bourges, Argenton, Châteauroux — déjà importés.
          </div>
        </div>
      </div>
    </div>
  );
}

function AsideStat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div style={{ color: 'var(--cb-ink-4)', fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: '1.625rem',
          color: accent ? 'var(--cb-accent)' : 'var(--cb-ink)',
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: 12, color: 'var(--cb-ink-3)', fontWeight: 500, marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <title>Validé</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrophyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Champion</title>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Statistiques</title>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
