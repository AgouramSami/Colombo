import { loginAction } from './actions';

type Props = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--cb-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px clamp(16px, 5vw, 40px) 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--cb-accent-soft)',
              marginBottom: 20,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--cb-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <title>Colombo</title>
              <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
              <circle cx="12" cy="9" r="1" />
            </svg>
          </div>
          <h1
            className="cb-display"
            style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', margin: '0 0 10px' }}
          >
            Colombo
          </h1>
          <p className="cb-muted" style={{ fontSize: '1.125rem' }}>
            Votre pigeonnier en ligne
          </p>
        </div>

        {/* Carte */}
        <div className="cb-card" style={{ padding: 'clamp(28px, 5vw, 44px)' }}>
          {params.sent ? (
            <ConfirmationState email={params.sent} />
          ) : (
            <LoginForm error={params.error} />
          )}
        </div>

        {/* Aide WhatsApp */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <a
            href="https://wa.me/33600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="cb-btn cb-btn--ghost"
            style={{ fontSize: '1rem', gap: 10 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <title>WhatsApp</title>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Besoin d&apos;aide ?
          </a>
        </div>
      </div>
    </main>
  );
}

function LoginForm({ error }: { error?: string }) {
  return (
    <>
      <h2 className="cb-display" style={{ fontSize: '1.625rem', marginBottom: 8 }}>
        Connexion
      </h2>
      <p className="cb-muted" style={{ marginBottom: 32 }}>
        Entrez votre adresse e-mail pour recevoir un lien de connexion.
      </p>

      {error && (
        <div
          style={{
            background: 'var(--cb-danger-soft)',
            color: 'var(--cb-danger)',
            border: '1px solid color-mix(in oklab, var(--cb-danger) 30%, transparent)',
            borderRadius: 'var(--cb-radius)',
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: '1rem',
          }}
          role="alert"
        >
          {error === 'lien_invalide'
            ? 'Ce lien de connexion est invalide ou a expiré. Veuillez recommencer.'
            : 'Une erreur est survenue. Veuillez réessayer.'}
        </div>
      )}

      <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '1.0625rem',
              fontWeight: 600,
              marginBottom: 8,
              color: 'var(--cb-ink)',
            }}
          >
            Votre adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="prenom.nom@exemple.fr"
            className="cb-input"
          />
        </div>

        <button
          type="submit"
          className="cb-btn cb-btn--primary cb-btn--big"
          style={{ width: '100%' }}
        >
          Recevoir mon lien de connexion
        </button>
      </form>

      <p className="cb-faint" style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9375rem' }}>
        Pas encore de compte ?{' '}
        <a
          href="/login"
          style={{ color: 'var(--cb-accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          C&apos;est gratuit, inscrivez-vous.
        </a>
      </p>
    </>
  );
}

function ConfirmationState({ email }: { email: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--cb-positive-soft)',
          marginBottom: 24,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--cb-positive)"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <title>Envoyé</title>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="cb-display" style={{ fontSize: '1.625rem', marginBottom: 12 }}>
        Vérifiez votre messagerie
      </h2>
      <p className="cb-muted" style={{ fontSize: '1.0625rem', lineHeight: 1.6 }}>
        Nous vous avons envoyé un lien de connexion à{' '}
        <strong style={{ color: 'var(--cb-ink)', fontWeight: 600 }}>{email}</strong>. Cliquez sur le
        lien pour accéder à votre espace.
      </p>
      <p className="cb-faint" style={{ marginTop: 16, fontSize: '0.9375rem' }}>
        Le lien est valable 1 heure. Vérifiez vos courriers indésirables si besoin.
      </p>
    </div>
  );
}
