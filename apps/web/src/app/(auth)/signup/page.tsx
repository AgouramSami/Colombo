import { signUpAction } from './actions';

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cb-bg)',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <a
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--cb-font-display)',
            fontWeight: 700,
            fontSize: '1.25rem',
            textDecoration: 'none',
            color: 'var(--cb-ink)',
            marginBottom: 32,
          }}
        >
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
          Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
        </a>

        <h1
          className="cb-display"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', margin: '0 0 8px' }}
        >
          Créer votre compte
        </h1>
        <p className="cb-muted" style={{ marginTop: 0, marginBottom: 28 }}>
          Gratuit pour 3 pigeons. Aucune carte bancaire requise.
        </p>

        {params.error && (
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
            {params.error === 'mots_de_passe_differents'
              ? 'Les mots de passe ne correspondent pas.'
              : params.error === 'formulaire_invalide'
                ? 'Veuillez remplir tous les champs correctement (mot de passe : 8 caractères minimum).'
                : params.error === 'envoi_echoue'
                  ? 'La création du compte a échoué. Veuillez réessayer.'
                  : 'Une erreur est survenue. Veuillez réessayer.'}
          </div>
        )}

        <form action={signUpAction} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <label
            htmlFor="display_name"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '1.0625rem' }}
          >
            Votre nom
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Jean Dupont"
            className="cb-input cb-input--big"
            style={{ marginBottom: 16 }}
          />

          <label
            htmlFor="email"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '1.0625rem' }}
          >
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.fr"
            className="cb-input cb-input--big"
            style={{ marginBottom: 16 }}
          />

          <label
            htmlFor="password"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '1.0625rem' }}
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            className="cb-input cb-input--big"
            style={{ marginBottom: 16 }}
          />

          <label
            htmlFor="confirm_password"
            style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '1.0625rem' }}
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Répétez votre mot de passe"
            className="cb-input cb-input--big"
            style={{ marginBottom: 24 }}
          />

          <button
            type="submit"
            className="cb-btn cb-btn--primary cb-btn--big"
            style={{ width: '100%' }}
          >
            Créer mon compte
            <ArrowRightIcon />
          </button>
        </form>

        <p style={{ marginTop: 24, color: 'var(--cb-ink-3)', fontSize: '0.9375rem' }}>
          Déjà inscrit ?{' '}
          <a
            href="/login"
            style={{
              color: 'var(--cb-accent)',
              textUnderlineOffset: 4,
              textDecoration: 'underline',
            }}
          >
            Se connecter
          </a>
        </p>
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
