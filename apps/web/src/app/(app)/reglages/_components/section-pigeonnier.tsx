'use client';

import { useState, useTransition } from 'react';
import { createLoftAction } from '../actions';
import type { LoftData } from '../types';
import { ClearPigeonsButton } from './clear-pigeons-button';
import { LoftCard } from './loft-card';
import { SaveFeedback } from './save-feedback';

export function SectionPigeonnier({ loftData }: { loftData: LoftData[] }) {
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [createResult, setCreateResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <h2 className="cb-section-title" style={{ margin: 0 }}>
          Mes pigeonniers
          <span
            className="cb-muted"
            style={{ fontWeight: 400, fontSize: '0.875rem', marginLeft: 10 }}
          >
            {loftData.length} pigeonnier{loftData.length > 1 ? 's' : ''}
          </span>
        </h2>
        <button
          type="button"
          className="cb-btn cb-btn--soft"
          style={{ minHeight: 38, padding: '0 14px', fontSize: 14 }}
          onClick={() => setCreating(true)}
        >
          + Nouveau
        </button>
      </div>

      {loftData.map((loft) => (
        <LoftCard key={loft.id} loft={loft} />
      ))}

      {loftData.length === 0 && !creating && (
        <div className="cb-card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="cb-muted">Aucun pigeonnier configuré.</p>
        </div>
      )}

      {loftData.length > 0 && <ClearPigeonsButton />}

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await createLoftAction(fd);
              if (res.ok) setCreating(false);
              else setCreateResult({ ok: false, error: res.error });
            });
          }}
        >
          <div className="cb-card" style={{ padding: 22, border: '2px solid var(--cb-accent)' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>Nouveau pigeonnier</h3>
            <div>
              <label className="cb-label" htmlFor="new-loft-name">
                Nom du pigeonnier
              </label>
              <input
                id="new-loft-name"
                name="name"
                className="cb-input"
                placeholder="Ex : Reproducteurs, Concours 2026..."
                required
                // biome-ignore lint/a11y/noAutofocus: formulaire création intentionnelle
                autoFocus
              />
            </div>
            {createResult && <SaveFeedback ok={createResult.ok} error={createResult.error} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button type="submit" className="cb-btn cb-btn--primary" disabled={isPending}>
                {isPending ? 'Création...' : 'Créer le pigeonnier'}
              </button>
              <button
                type="button"
                className="cb-btn cb-btn--ghost"
                onClick={() => setCreating(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
