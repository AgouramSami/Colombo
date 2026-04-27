'use client';

import { searchPigeonsAction } from '@/app/(app)/onboarding/actions';
import type { PigeonSearchResult } from '@/lib/supabase/rpc';
import { formatMatricule } from '@colombo/shared';
import { useEffect, useRef, useState, useTransition } from 'react';
import { addPigeonsAction } from './actions';

type SearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'success'; results: PigeonSearchResult[]; selectedNames: Set<string> }
  | { status: 'done'; added: number }
  | { status: 'error'; message: string };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function PigeonsTab({ nameVariants }: { nameVariants: string[] }) {
  const [name, setName] = useState(nameVariants[0] ?? '');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isAdding, startAdding] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPending) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPending]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name.trim().length < 3) return;
    startTransition(async () => {
      const result = await searchPigeonsAction(name.trim());
      if (result.ok) {
        const distinctNames = [...new Set(result.results.map((r) => r.amateur_display_name))];
        setState({
          status: 'success',
          results: result.results,
          selectedNames: new Set(distinctNames),
        });
        setChecked(new Set(result.results.map((r) => r.pigeon_matricule)));
      } else {
        setState({ status: 'error', message: result.error });
      }
    });
  }

  function toggleName(n: string) {
    if (state.status !== 'success') return;
    const next = new Set(state.selectedNames);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setState({ ...state, selectedNames: next });
    const matricules = state.results
      .filter((r) => next.has(r.amateur_display_name))
      .map((r) => r.pigeon_matricule);
    setChecked(new Set(matricules));
  }

  function toggleChecked(matricule: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(matricule)) next.delete(matricule);
      else next.add(matricule);
      return next;
    });
  }

  function handleAdd() {
    if (state.status !== 'success') return;
    startAdding(async () => {
      const result = await addPigeonsAction([...checked], [...state.selectedNames]);
      if (result.ok) {
        setState({ status: 'done', added: result.added });
      } else {
        setState({ status: 'error', message: result.error });
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

  if (state.status === 'done') {
    return (
      <section>
        <h2 className="cb-display" style={{ fontSize: '1.5rem', marginBottom: 8 }}>
          Retrouver mes pigeons
        </h2>
        <div
          style={{
            background: 'var(--cb-positive-soft)',
            color: 'var(--cb-positive)',
            borderRadius: 'var(--cb-radius)',
            padding: '16px 20px',
            marginTop: 24,
          }}
        >
          {state.added > 0
            ? `${state.added} pigeon${state.added > 1 ? 's ajoutés' : ' ajouté'} à votre pigeonnier.`
            : 'Aucun nouveau pigeon — ils sont peut-être déjà dans votre pigeonnier.'}
        </div>
        <button
          type="button"
          onClick={() => setState({ status: 'idle' })}
          className="cb-btn cb-btn--link"
          style={{ marginTop: 16 }}
        >
          Faire une autre recherche
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2 className="cb-display" style={{ fontSize: '1.5rem', marginBottom: 4 }}>
        Retrouver mes pigeons
      </h2>
      <p className="cb-muted" style={{ marginTop: 0, marginBottom: 28 }}>
        Recherchez votre nom tel qu&apos;il apparaît dans les résultats de concours pour ajouter des
        pigeons manquants à votre pigeonnier.
      </p>

      {nameVariants.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--cb-ink-3)', marginBottom: 8 }}>
            Vos noms enregistrés :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {nameVariants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setName(v)}
                className="cb-badge cb-badge--accent"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : DUPONT, DA COSTA J..."
          className="cb-input"
          style={{ flex: 1 }}
          minLength={3}
          required
        />
        <button
          type="submit"
          disabled={isPending || name.trim().length < 3}
          className="cb-btn cb-btn--primary"
          style={{ flexShrink: 0 }}
        >
          {isPending ? (elapsed >= 2 ? 'Recherche...' : 'Recherche en cours...') : 'Rechercher'}
        </button>
      </form>

      {state.status === 'error' && (
        <p role="alert" style={{ color: 'var(--cb-danger)', marginBottom: 16 }}>
          {state.message}
        </p>
      )}

      {state.status === 'success' && !isPending && (
        <>
          {state.results.length === 0 && (
            <p className="cb-muted">Aucun résultat trouvé pour ce nom.</p>
          )}

          {distinctNames.length > 1 && (
            <div className="cb-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 12 }}>
                Plusieurs orthographes trouvées — cochez celles qui sont les vôtres :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {distinctNames.map((n) => {
                  const isSelected = state.selectedNames.has(n);
                  return (
                    <label
                      key={n}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 'var(--cb-radius)',
                        border: `2px solid ${isSelected ? 'var(--cb-accent)' : 'var(--cb-line)'}`,
                        background: isSelected ? 'var(--cb-accent-soft)' : 'var(--cb-bg-elev)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleName(n)}
                        style={{ width: 18, height: 18, accentColor: 'var(--cb-accent)' }}
                      />
                      <span style={{ fontWeight: 600 }}>{n}</span>
                      <span
                        className="cb-faint"
                        style={{ fontSize: '0.875rem', marginLeft: 'auto' }}
                      >
                        {state.results.filter((r) => r.amateur_display_name === n).length} pigeon
                        {state.results.filter((r) => r.amateur_display_name === n).length > 1
                          ? 's'
                          : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {visiblePigeons.length > 0 && (
            <div className="cb-card" style={{ padding: '20px 24px' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {visiblePigeons.length} pigeon{visiblePigeons.length > 1 ? 's' : ''} trouvé
                {visiblePigeons.length > 1 ? 's' : ''}
              </p>
              <p className="cb-faint" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
                Décochez les pigeons qui ne vous appartiennent pas.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {visiblePigeons.map((pigeon) => {
                  const isChecked = checked.has(pigeon.pigeon_matricule);
                  return (
                    <li
                      key={pigeon.pigeon_matricule}
                      style={{ borderBottom: '1px solid var(--cb-line-2)' }}
                    >
                      <label
                        htmlFor={`p-${pigeon.pigeon_matricule}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          minHeight: 48,
                          padding: '10px 0',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          id={`p-${pigeon.pigeon_matricule}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecked(pigeon.pigeon_matricule)}
                          style={{
                            width: 20,
                            height: 20,
                            accentColor: 'var(--cb-accent)',
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <div>
                            <p className="cb-matricule" style={{ fontWeight: 700 }}>
                              {formatMatricule(pigeon.pigeon_matricule)}
                            </p>
                            <p className="cb-faint" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
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

              <button
                type="button"
                disabled={checked.size === 0 || isAdding}
                onClick={handleAdd}
                className="cb-btn cb-btn--primary cb-btn--big"
                style={{ width: '100%', marginTop: 20 }}
              >
                {isAdding
                  ? 'Ajout en cours...'
                  : `Ajouter ${checked.size} pigeon${checked.size > 1 ? 's' : ''} à mon pigeonnier`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
