'use client';

import type { PigeonSearchResult } from '@/lib/supabase/rpc';
import { formatMatricule } from '@colombo/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { claimPigeonsAction, searchPigeonsAction } from './actions';

type SearchState =
  | { status: 'idle' }
  | { status: 'success'; results: PigeonSearchResult[]; selectedNames: Set<string> }
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
        // Pré-sélectionner toutes les variantes trouvées
        const selectedNames = new Set(distinctNames);
        setState({ status: 'success', results: result.results, selectedNames });
        setChecked(new Set(result.results.map((r) => r.pigeon_matricule)));
      } else {
        setState({ status: 'error', message: result.error });
      }
    });
  }

  function toggleName(n: string) {
    if (state.status !== 'success') return;
    const next = new Set(state.selectedNames);
    if (next.has(n)) {
      next.delete(n);
    } else {
      next.add(n);
    }
    setState({ ...state, selectedNames: next });
    // Mettre à jour les pigeons cochés selon les noms sélectionnés
    const matricules = state.results
      .filter((r) => next.has(r.amateur_display_name))
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

  function handleClaim(matriculesToClaim: string[], nameVariants: string[] = []) {
    setClaimError('');
    const finalLoftName = loftName.trim() || 'Mon pigeonnier';
    startClaiming(async () => {
      const result = await claimPigeonsAction(matriculesToClaim, finalLoftName, nameVariants);
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
    state.status === 'success' && state.selectedNames.size > 0
      ? state.results.filter((r) => state.selectedNames.has(r.amateur_display_name))
      : [];

  // Étape 3 : confirmation
  if (state.status === 'claimed') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
        <header className="cb-topbar">
          <span className="cb-topbar__brand">
            <PigeonIcon />
            Colombo
          </span>
        </header>
        <div
          style={{ maxWidth: 640, margin: '0 auto', padding: '80px clamp(16px, 5vw, 40px)' }}
          className="cb-fade-up"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--cb-positive-soft)',
              margin: '0 auto 28px',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--cb-positive)"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <title>Succès</title>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            className="cb-display"
            style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Votre pigeonnier est prêt.
          </h1>
          <p
            className="cb-muted"
            style={{
              textAlign: 'center',
              fontSize: '1.125rem',
              lineHeight: 1.65,
              marginBottom: 12,
            }}
          >
            {state.claimedCount > 0
              ? `${state.claimedCount} pigeon${state.claimedCount > 1 ? 's ont été ajoutés' : ' a été ajouté'}. Vous pouvez maintenant consulter ses résultats, compléter sa fiche et suivre ses performances.`
              : 'Votre pigeonnier a été créé. Vous pouvez maintenant ajouter vos pigeons manuellement.'}
          </p>
          {state.skippedCount > 0 && (
            <p
              className="cb-faint"
              style={{ textAlign: 'center', fontSize: '0.9375rem', marginBottom: 16 }}
            >
              {state.skippedCount} pigeon{state.skippedCount > 1 ? "s n'ont" : " n'a"} pas pu être
              ajouté{state.skippedCount > 1 ? 's' : ''} car{' '}
              {state.skippedCount > 1 ? 'ils sont déjà associés' : 'il est déjà associé'} à un autre
              compte.
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push('/pigeonnier?welcome=1')}
            className="cb-btn cb-btn--primary cb-btn--big"
            style={{ width: '100%', marginTop: 32 }}
          >
            Découvrir mon pigeonnier
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <header className="cb-topbar">
        <span className="cb-topbar__brand">
          <PigeonIcon />
          Colombo
        </span>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px clamp(16px, 5vw, 40px) 80px' }}>
        <h1
          className="cb-display cb-fade-up"
          style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Retrouvons vos pigeons
        </h1>
        <p
          className="cb-muted cb-fade-up"
          style={{
            textAlign: 'center',
            fontSize: '1.125rem',
            marginBottom: 48,
            animationDelay: '60ms',
          }}
        >
          Tapez votre nom tel qu&apos;il apparaît dans vos résultats de concours.
        </p>

        {/* Étape 1 : formulaire de recherche */}
        <form onSubmit={handleSubmit} method="get" action="/onboarding" noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <label
              htmlFor="nom-eleveur"
              style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--cb-ink)' }}
            >
              Quel est votre nom d&apos;éleveur ?
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
              className={`cb-input${shake ? ' cb-shake' : ''}`}
              style={fieldError ? { borderColor: 'var(--cb-danger)' } : undefined}
            />
            <p id="nom-aide" className="cb-faint" style={{ fontSize: '0.875rem' }}>
              C&apos;est le nom qui apparaît sur vos résultats de concours.
            </p>
            {fieldError && (
              <p
                id="nom-erreur"
                role="alert"
                style={{ color: 'var(--cb-danger)', fontSize: '1rem' }}
              >
                {fieldError}
              </p>
            )}
          </div>

          {state.status === 'error' && !isPending && (
            <p
              role="alert"
              style={{ color: 'var(--cb-danger)', fontSize: '1rem', marginBottom: 8 }}
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="cb-btn cb-btn--primary cb-btn--big"
            style={{ width: '100%', marginTop: 16, opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? loadingMessage(elapsed) : 'Rechercher mes pigeons'}
          </button>
        </form>

        {/* Étape 2 : résultats */}
        {state.status === 'success' && !isPending && (
          <div style={{ marginTop: 48 }} className="cb-fade-up">
            {/* Cas C : aucun résultat */}
            {state.results.length === 0 && (
              <div className="cb-card" style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
                <h2 className="cb-display" style={{ fontSize: '1.5rem', marginBottom: 12 }}>
                  Nous n&apos;avons pas trouvé de résultats à ce nom.
                </h2>
                <p className="cb-muted" style={{ fontSize: '1.0625rem', marginBottom: 24 }}>
                  Cela peut arriver si vous êtes nouvel éleveur, si votre club ne publie pas encore
                  ses résultats en ligne, ou si votre nom apparaît différemment dans les
                  classements.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setState({ status: 'idle' });
                    setName('');
                  }}
                  className="cb-btn cb-btn--primary"
                  style={{ width: '100%' }}
                >
                  Réessayer avec un autre nom
                </button>
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 28,
                    borderTop: '1px solid var(--cb-line)',
                  }}
                >
                  <LoftNameField value={loftName} onChange={setLoftName} />
                  {claimError && (
                    <p role="alert" style={{ color: 'var(--cb-danger)', marginTop: 8 }}>
                      {claimError}
                    </p>
                  )}
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <button
                      type="button"
                      disabled={isClaiming}
                      onClick={() => handleClaim([], [])}
                      className="cb-btn cb-btn--link"
                      style={{ fontSize: '1rem' }}
                    >
                      {isClaiming
                        ? 'Création de votre pigeonnier...'
                        : 'Continuer sans résultats et ajouter mes pigeons manuellement'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cas B : plusieurs variantes de nom trouvées */}
            {state.results.length > 0 && distinctNames.length > 1 && (
              <div
                className="cb-card"
                style={{
                  padding: 'clamp(24px, 4vw, 36px)',
                  marginBottom: visiblePigeons.length > 0 ? 16 : 0,
                }}
              >
                <h2 className="cb-display" style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                  Nous avons trouvé plusieurs orthographes de votre nom.
                </h2>
                <p className="cb-muted" style={{ fontSize: '1.0625rem', marginBottom: 6 }}>
                  Cochez toutes les versions qui vous correspondent — les résultats sous chaque nom
                  seront regroupés.
                </p>
                <p className="cb-faint" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
                  Cela arrive quand votre nom a été saisi différemment selon les concours.
                </p>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="sr-only">Vos variantes de nom d&apos;éleveur</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {distinctNames.map((n) => {
                      const isSelected = state.status === 'success' && state.selectedNames.has(n);
                      return (
                        <label
                          key={n}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            minHeight: 52,
                            padding: '12px 18px',
                            borderRadius: 'var(--cb-radius)',
                            border: `2px solid ${isSelected ? 'var(--cb-accent)' : 'var(--cb-line)'}`,
                            cursor: 'pointer',
                            background: isSelected ? 'var(--cb-accent-soft)' : 'var(--cb-bg-elev)',
                            transition: 'border-color var(--cb-dur) var(--cb-ease)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleName(n)}
                            style={{
                              width: 20,
                              height: 20,
                              accentColor: 'var(--cb-accent)',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '1.0625rem',
                              fontWeight: 600,
                              color: 'var(--cb-ink)',
                              flex: 1,
                            }}
                          >
                            {n}
                          </span>
                          <span className="cb-faint" style={{ fontSize: '0.875rem' }}>
                            {state.results.filter((r) => r.amateur_display_name === n).length}{' '}
                            pigeon
                            {state.results.filter((r) => r.amateur_display_name === n).length > 1
                              ? 's'
                              : ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {/* Cas A : pigeons trouvés */}
            {visiblePigeons.length > 0 && (
              <div className="cb-card" style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
                <h2
                  className="cb-display"
                  style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: 8 }}
                >
                  Nous avons retrouvé {visiblePigeons.length} pigeon
                  {visiblePigeons.length > 1 ? 's' : ''} à votre nom
                </h2>
                <p
                  className="cb-muted"
                  style={{ textAlign: 'center', fontSize: '1.0625rem', marginBottom: 28 }}
                >
                  Vérifiez qu&apos;il s&apos;agit bien de vous avant de les ajouter.
                </p>

                {visiblePigeons.length > 10 && (
                  <div
                    style={{
                      background: 'var(--cb-accent-soft)',
                      color: 'var(--cb-accent-soft-ink)',
                      borderRadius: 'var(--cb-radius)',
                      padding: '12px 16px',
                      marginBottom: 16,
                      fontSize: '0.9375rem',
                    }}
                  >
                    Tous vos pigeons sont cochés. Vous pouvez en décocher certains si vous ne les
                    reconnaissez pas.
                  </div>
                )}

                {visiblePigeons.length === 50 && (
                  <p className="cb-faint" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                    Les 50 premiers résultats sont affichés. Si votre pigeon n&apos;est pas dans la
                    liste, vous pourrez l&apos;ajouter manuellement depuis votre pigeonnier.
                  </p>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {visiblePigeons.map((pigeon) => {
                    const isChecked = checked.has(pigeon.pigeon_matricule);
                    const labelId = `pigeon-${pigeon.pigeon_matricule}`;
                    return (
                      <li
                        key={pigeon.pigeon_matricule}
                        style={{ borderBottom: '1px solid var(--cb-line-2)' }}
                      >
                        <label
                          htmlFor={labelId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            minHeight: 52,
                            padding: '12px 0',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            id={labelId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChecked(pigeon.pigeon_matricule)}
                            style={{
                              width: 22,
                              height: 22,
                              flexShrink: 0,
                              accentColor: 'var(--cb-accent)',
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <p
                                className="cb-matricule"
                                style={{ fontWeight: 700, fontSize: '1.0625rem' }}
                              >
                                {formatMatricule(pigeon.pigeon_matricule)}
                              </p>
                              <p
                                className="cb-faint"
                                style={{ fontSize: '0.875rem', marginTop: 2 }}
                              >
                                Dernier concours : {formatDate(pigeon.last_seen_at)}
                              </p>
                            </div>
                            <span className="cb-badge cb-badge--accent" style={{ flexShrink: 0 }}>
                              {pigeon.race_count} concours
                            </span>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: '1px solid var(--cb-line)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 20,
                    }}
                  >
                    <span className="cb-muted" style={{ fontSize: '0.9375rem' }}>
                      {checked.size} pigeon{checked.size > 1 ? 's' : ''} sélectionné
                      {checked.size > 1 ? 's' : ''}
                    </span>
                  </div>
                  <LoftNameField value={loftName} onChange={setLoftName} />
                  {claimError && (
                    <p
                      role="alert"
                      style={{ color: 'var(--cb-danger)', marginTop: 8, fontSize: '1rem' }}
                    >
                      {claimError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={checked.size === 0 || isClaiming}
                  onClick={() =>
                    handleClaim(
                      [...checked],
                      state.status === 'success' ? [...state.selectedNames] : [],
                    )
                  }
                  className="cb-btn cb-btn--primary cb-btn--big"
                  style={{ width: '100%', marginTop: 16 }}
                >
                  {isClaiming
                    ? 'Création de votre pigeonnier...'
                    : `Ajouter ${checked.size} pigeon${checked.size > 1 ? 's' : ''} à mon pigeonnier`}
                </button>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setState({ status: 'idle' })}
                    className="cb-btn cb-btn--link"
                    style={{ fontSize: '0.9375rem' }}
                  >
                    Aucun de ces pigeons ne m&apos;appartient
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor="nom-pigeonnier"
        style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--cb-ink)' }}
      >
        Nom de votre pigeonnier
      </label>
      <input
        id="nom-pigeonnier"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        className="cb-input"
      />
      <p className="cb-faint" style={{ fontSize: '0.875rem' }}>
        Vous pourrez le modifier depuis votre profil.
      </p>
    </div>
  );
}

function PigeonIcon() {
  return (
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
  );
}
