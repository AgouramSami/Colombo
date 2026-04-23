import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Colombo</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
            >
              Se deconnecter
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Votre pigeonnier</h2>
        <p className="mb-8 text-lg text-gray-600">Bienvenue, {user.email}</p>

        {/* Placeholder -- ecrans a venir */}
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-xl text-gray-500">
            Votre pigeonnier est vide pour le moment.
          </p>
          <p className="mt-2 text-gray-400">
            Les fonctionnalites arrivent bientot.
          </p>
        </div>
      </div>
    </main>
  );
}
