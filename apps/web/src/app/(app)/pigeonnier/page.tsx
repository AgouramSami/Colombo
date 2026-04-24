import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PigeonnierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: lofts } = await supabase
    .from('lofts')
    .select('id, name')
    .is('deleted_at', null)
    .limit(1);

  const { data: pigeons } = await supabase
    .from('pigeons')
    .select('matricule, sex, birth_year')
    .not('loft_id', 'is', null)
    .order('matricule');

  const pigeonCount = pigeons?.length ?? 0;
  const loftName = lofts?.[0]?.name ?? 'Mon pigeonnier';

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Colombo</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="min-h-[48px] rounded-lg border border-gray-300 px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-1 text-3xl font-bold text-gray-900">{loftName}</h2>
        <p className="mb-8 text-lg text-gray-500">
          {pigeonCount} pigeon{pigeonCount > 1 ? 's' : ''} dans votre collection
        </p>

        {pigeonCount === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-xl text-gray-500">Votre pigeonnier est vide pour le moment.</p>
            <p className="mt-2 text-gray-400">
              Ajoutez vos pigeons manuellement ou importez vos résultats.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {pigeons?.map((pigeon) => (
              <li
                key={pigeon.matricule}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-lg font-bold text-gray-900">{pigeon.matricule}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {pigeon.sex === 'F' ? 'Femelle' : 'Mâle'} · {pigeon.birth_year}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
