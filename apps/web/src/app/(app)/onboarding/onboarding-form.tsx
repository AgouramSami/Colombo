'use client';

import { formatMatricule } from '@colombo/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { PigeonSearchResult } from '@/lib/supabase/rpc';
import { claimPigeonsAction, searchPigeonsAction } from './actions';

type SearchState =
  | { status: 'idle' }
  | { status: 'success'; results: PigeonSearchResult[]; selectedName: string | null }
  | { status: 'claimed'; claimedCount: number; skippedCount: number; loftName: string }
  | { status: 'error'; message: string };

function loadingMessage(elapsed: number): string {
  if (elapsed >= 5) return 'Cela prend un peu plus de temps que prévu, merci de patienter...';
  if (elapsed >= 2) return 'Nous parcourons les résultats des compétitions françaises...';
  return 'Recherche en cours...';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [shake, setShake] = useState(false);
  const [loftName, setLoftName] = useState('Mon pigeonnier');
  const [claimError, setClaimError] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isClaiming, startClaiming] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPending) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPending]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError('');

    if (name.trim().length < 3) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setFieldError("Entrez votre nom tel qu'il apparaît sur vos résultats.");
      return;
    }

    startTransition(async () => {
      const result = await searchPigeonsAction(name);
      if (result.ok) {
        const distinctNames = [...new Set(result.results.map((r) => r.amateur_display_name))];
        const selectedName = distinctNames.length === 1 ? (distinctNames[0] ?? null) : null;
        setState({ status: 'success', results: result.results, selectedName });
        const initialMatricules = result.results
          .filter((r) => selectedName === null || r.amateur_display_name === selectedName)
          .map((r) => r.pigeon_matricule);
        setChecked(new Set(initialMatricules));
      } else {
        setState({ status: 'error', message: result.error });
      }
    });
  }

  function selectName(selectedName: string) {
    if (state.status !== 'success') return;
    setState({ ...state, selectedName });
    const matricules = state.results
      .filter((r) => r.amateur_display_name === selectedName)
      .map((r) => r.pigeon_matricule);
    setChecked(new Set(matricules));
  }

  function toggleChecked(matricule: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(matricule)) {
        next.delete(matricule);
      } else {
        next.add(matricule);
      }
      return next;
    });
  }

  function handleClaim(matriculesToClaim: string[]) {
    setClaimError('');
    const finalLoftName = loftName.trim() || 'Mon pigeonnier';
    startClaiming(async () => {
      const result = await claimPigeonsAction(matriculesToClaim, finalLoftName);
      if (result.ok) {
        setState({
          status: 'claimed',
          claimedCount: result.claimed,
          skippedCount: result.skipped,
          loftName: finalLoftName,
        });
      } else {
        setClaimError(result.error);
      }
    });
  }

  const distinctNames =
    state.status === 'success'
      ? [...new Set(state.results.map((r) => r.amateur_display_name))]
      : [];

  const visiblePigeons =
    state.status === 'success' && state.selectedName !== null
      ? state.results.filter((r) => r.amateur_display_name === state.selectedName)
      : [];

  // Étape 3 : confirmation
  if (state.status === 'claimed') {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto max-w-2xl">
            <p className="text-2xl font-bold text-gray-900">Colombo</p>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">Votre pigeonnier est prêt.</h1>
          <p className="mb-2 text-lg text-gray-600">
            {state.claimedCount > 0
              ? `${state.claimedCount} pigeon${state.claimedCount > 1 ? 's ont été ajoutés' : ' a été ajouté'}. Vous pouvez maintenant consulter ses résultats, compléter sa fiche et suivre ses performances.`
              : 'Votre pigeonnier a été créé. Vous pouvez maintenant ajouter vos pigeons manuellement.'}
          </p>
          {state.skippedCount > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {state.skippedCount} pigeon{state.skippedCount > 1 ? 's n\'ont' : ' n\'a'} pas pu
              être ajouté{state.skippedCount > 1 ? 's' : ''} car{' '}
              {state.skippedCount > 1 ? 'ils sont déjà associés' : 'il est déjà associé'} à un
              autre compte. Contactez-nous si vous pensez qu'il s'agit d'une erreur.
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push('/pigeonnier')}
            className="mt-8 min-h-[48px] w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Découvrir mon pigeonnier
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-2xl">
          <p className="text-2xl font-bold text-gray-900">Colombo</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-3 text-center text-3xl font-bold text-gray-900">
          Retrouvons vos pigeons
        </h1>
        <p className="mb-12 text-center text-lg text-gray-500">
          Tapez votre nom tel qu'il apparaît dans vos résultats de concours.
        </p>

        {/* Étape 1 : formulaire de recherche */}
        <form onSubmit={handleSubmit} method="get" action="/onboarding" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="nom-eleveur"
              className="block font-semibold text-gray-900"
              style={{ fontSize: '18px' }}
            >
              Quel est votre nom d'éleveur ?
            </label>
            <input
              id="nom-eleveur"
              name="q"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError('');
              }}
              placeholder="Ex : Dupont, Martin J., DA COSTA..."
              autoComplete="off"
              aria-describedby="nom-aide nom-erreur"
              className={[
                'w-full rounded-xl border-2 px-5 py-4 text-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-200',
                shake ? 'animate-shake' : '',
                fieldError
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-300 focus:border-blue-500',
              ].join(' ')}
            />
            <p id="nom-aide" className="text-gray-500" style={{ fontSize: '14px' }}>
              C'est le nom qui apparaît sur vos résultats de concours.
            </p>
            {fieldError && (
              <p id="nom-erreur" role="alert" className="text-base text-red-600">
                {fieldError}
              </p>
            )}
          </div>

          {state.status === 'error' && !isPending && (
            <p role="alert" className="mt-3 text-base text-red-600">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={[
              'mt-6 min-h-[48px] w-full rounded-xl px-6 py-4 text-lg font-semibold text-white',
              'focus:outline-none focus:ring-4 focus:ring-blue-200 transition-colors duration-150',
              isPending
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-600 hover:bg-blue-700',
            ].join(' ')}
          >
            {isPending ? loadingMessage(elapsed) : 'Rechercher mes pigeons'}
          </button>
        </form>

        {/* Étape 2 : résultats */}
        {state.status === 'success' && !isPending && (
          <div className="mt-12">

            {/* Cas C : aucun résultat */}
            {state.results.length === 0 && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">
                  Nous n'avons pas trouvé de résultats à ce nom.
                </h2>
                <p className="mb-6 text-lg text-gray-600">
                  Cela peut arriver si vous êtes nouvel éleveur, si votre club ne publie pas encore
                  ses résultats en ligne, ou si votre nom apparaît différemment dans les classements.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setState({ status: 'idle' });
                    setName('');
                  }}
                  className="min-h-[48px] w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  Réessayer avec un autre nom
                </button>
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <LoftNameField value={loftName} onChange={setLoftName} />
                  {claimError && (
                    <p role="alert" className="mt-2 text-base text-red-600">
                      {claimError}
                    </p>
                  )}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      disabled={isClaiming}
                      onClick={() => handleClaim([])}
                      className="text-base text-gray-500 underline hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isClaiming
                        ? 'Création de votre pigeonnier...'
                        : 'Continuer sans résultats et ajouter mes pigeons manuellement'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cas B : plusieurs noms distincts, pas encore de sélection */}
            {state.results.length > 0 && state.selectedName === null && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Nous avons trouvé plusieurs éleveurs avec ce nom.
                </h2>
                <p className="mb-6 text-lg text-gray-600">Lequel êtes-vous ?</p>
                <fieldset>
                  <legend className="sr-only">Choisissez votre nom d'éleveur</legend>
                  <div className="space-y-3">
                    {distinctNames.map((n) => (
                      <label
                        key={n}
                        className="flex min-h-[48px] cursor-pointer items-center gap-4 rounded-xl border-2 border-gray-200 px-5 py-3 hover:border-blue-400 transition-colors duration-150"
                      >
                        <input
                          type="radio"
                          name="nom-distinct"
                          value={n}
                          onChange={() => selectName(n)}
                          className="h-5 w-5 accent-blue-600"
                        />
                        <span className="text-lg font-semibold text-gray-900">{n}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Cas A : pigeons trouvés, nom sélectionné */}
            {visiblePigeons.length > 0 && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-1 text-center text-2xl font-bold text-gray-900">
                  Nous avons retrouvé {visiblePigeons.length} pigeon
                  {visiblePigeons.length > 1 ? 's' : ''} à votre nom
                </h2>
                <p className="mb-6 text-center text-lg text-gray-600">
                  Vérifiez qu'il s'agit bien de vous avant de les ajouter à votre pigeonnier.
                </p>

                {visiblePigeons.length > 10 && (
                  <p className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-base text-blue-800">
                    Tous vos pigeons sont cochés. Vous pouvez en décocher certains si vous ne les
                    reconnaissez pas.
                  </p>
                )}

                {visiblePigeons.length === 50 && (
                  <p className="mb-4 text-sm text-gray-500">
                    Les 50 premiers résultats sont affichés. Si votre pigeon n'est pas dans la
                    liste, vous pourrez l'ajouter manuellement depuis votre pigeonnier.
                  </p>
                )}

                <ul className="divide-y divide-gray-100" role="list">
                  {visiblePigeons.map((pigeon) => {
                    const isChecked = checked.has(pigeon.pigeon_matricule);
                    const labelId = `pigeon-${pigeon.pigeon_matricule}`;
                    return (
                      <li key={pigeon.pigeon_matricule}>
                        <label
                          htmlFor={labelId}
                          className="flex min-h-[48px] cursor-pointer items-center gap-4 py-3"
                        >
                          <input
                            id={labelId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChecked(pigeon.pigeon_matricule)}
                            className="h-6 w-6 flex-shrink-0 rounded accent-blue-600"
                          />
                          <div className="flex flex-1 items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {formatMatricule(pigeon.pigeon_matricule)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Dernier concours : {formatDate(pigeon.last_seen_at)}
                              </p>
                            </div>
                            <p className="ml-4 shrink-0 text-base font-semibold text-blue-700">
                              {pigeon.race_count} concours
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <LoftNameField value={loftName} onChange={setLoftName} />
                  {claimError && (
                    <p role="alert" className="mt-2 text-base text-red-600">
                      {claimError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={checked.size === 0 || isClaiming}
                  onClick={() => handleClaim([...checked])}
                  className={[
                    'mt-4 min-h-[48px] w-full rounded-xl px-6 py-4 text-lg font-semibold text-white',
                    'focus:outline-none focus:ring-4 focus:ring-blue-200 transition-colors duration-150',
                    checked.size === 0 || isClaiming
                      ? 'cursor-not-allowed bg-gray-300'
                      : 'bg-blue-600 hover:bg-blue-700',
                  ].join(' ')}
                >
                  {isClaiming
                    ? 'Création de votre pigeonnier...'
                    : `Ajouter ${checked.size} pigeon${checked.size > 1 ? 's' : ''} à mon pigeonnier`}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setState({ status: 'idle' })}
                    className="text-base text-gray-500 underline hover:text-gray-700"
                  >
                    Aucun de ces pigeons ne m'appartient
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function LoftNameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="nom-pigeonnier"
        className="block font-semibold text-gray-900"
        style={{ fontSize: '18px' }}
      >
        Nom de votre pigeonnier
      </label>
      <input
        id="nom-pigeonnier"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        className="w-full rounded-xl border-2 border-gray-300 px-5 py-4 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <p className="text-gray-500" style={{ fontSize: '14px' }}>
        Vous pourrez le modifier depuis votre profil.
      </p>
    </div>
  );
}
