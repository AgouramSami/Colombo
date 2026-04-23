import { loginAction } from './actions';

type Props = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / titre */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Colombo</h1>
          <p className="text-lg text-gray-600">Votre pigeonnier en ligne</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-md">
          {params.sent ? (
            <div className="text-center">
              <p className="mb-2 text-2xl font-semibold text-gray-900">
                Verifiez votre messagerie
              </p>
              <p className="text-gray-600">
                Nous vous avons envoye un lien de connexion a{' '}
                <strong>{params.sent}</strong>. Cliquez sur le lien pour acceder
                a votre espace.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                Connexion
              </h2>

              {params.error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
                  {params.error === 'lien_invalide'
                    ? 'Ce lien de connexion est invalide ou a expire. Veuillez recommencer.'
                    : 'Une erreur est survenue. Veuillez reessayer.'}
                </div>
              )}

              <form action={loginAction} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-lg font-medium text-gray-700"
                  >
                    Votre adresse email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="prenom.nom@exemple.fr"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  Recevoir mon lien de connexion
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                Pas encore de compte ?{' '}
                <a href="/login" className="text-blue-700 underline">
                  Creez-en un gratuitement
                </a>
              </p>
            </>
          )}
        </div>

        {/* Aide WhatsApp */}
        <div className="mt-6 text-center">
          <a
            href="https://wa.me/33600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span className="text-xl">💬</span>
            <span className="text-base font-medium">Besoin d&apos;aide ? Contactez-nous</span>
          </a>
        </div>
      </div>
    </main>
  );
}
