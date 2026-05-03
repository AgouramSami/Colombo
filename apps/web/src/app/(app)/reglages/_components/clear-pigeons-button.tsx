'use client';

import { useState, useTransition } from 'react';
import { clearLoftPigeonsAction } from '../actions';

export function ClearPigeonsButton() {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; cleared?: number; error?: string } | null>(
    null,
  );

  function handleClear() {
    startTransition(async () => {
      const res = await clearLoftPigeonsAction();
      setResult(res);
      setConfirm(false);
    });
  }

  if (result?.ok) {
    return (
      <div
        className="cb-card"
        style={{
          padding: '16px 20px',
          border: '1px solid color-mix(in oklab, var(--cb-positive) 30%, var(--cb-line))',
          background: 'var(--cb-positive-soft)',
          color: 'var(--cb-positive)',
          fontSize: 14,
        }}
      >
        {result.cleared
          ? `${result.cleared} pigeon${result.cleared > 1 ? 's retirés' : ' retiré'} du pigeonnier. Allez dans "Retrouver mes pigeons" pour les ré-importer.`
          : 'Pigeonnier déjà vide.'}
      </div>
    );
  }

  return (
    <div
      className="cb-card"
      style={{
        padding: '20px 20px',
        border: '1px solid color-mix(in oklab, var(--cb-danger) 30%, var(--cb-line))',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>
        Vider le pigeonnier
      </div>
      <div className="cb-faint" style={{ fontSize: 13, marginBottom: 16 }}>
        Retire tous vos pigeons pour recommencer l&apos;import depuis zéro. Les résultats de
        concours sont conservés.
      </div>

      {!confirm ? (
        <button
          type="button"
          className="cb-btn"
          onClick={() => setConfirm(true)}
          style={{
            minHeight: 42,
            padding: '0 18px',
            fontSize: 14,
            color: 'var(--cb-danger)',
            borderColor: 'color-mix(in oklab, var(--cb-danger) 50%, var(--cb-line))',
          }}
        >
          Vider le pigeonnier
        </button>
      ) : (
        <div
          style={{
            background: 'color-mix(in oklab, var(--cb-danger) 6%, var(--cb-bg))',
            border: '1.5px solid color-mix(in oklab, var(--cb-danger) 40%, transparent)',
            borderRadius: 'var(--cb-radius)',
            padding: '14px 16px',
          }}
        >
          <p style={{ fontWeight: 600, color: 'var(--cb-danger)', margin: '0 0 12px' }}>
            Confirmer la suppression ?
          </p>
          <p className="cb-faint" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Tous vos pigeons seront retirés. Cette action est réversible via "Retrouver mes
            pigeons".
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="cb-btn"
              onClick={handleClear}
              disabled={isPending}
              style={{
                minHeight: 42,
                padding: '0 18px',
                fontSize: 14,
                fontWeight: 700,
                background: 'var(--cb-danger)',
                color: '#fff',
                borderColor: 'var(--cb-danger)',
              }}
            >
              {isPending ? 'Suppression...' : 'Oui, vider le pigeonnier'}
            </button>
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              onClick={() => setConfirm(false)}
              disabled={isPending}
              style={{ minHeight: 42, padding: '0 14px', fontSize: 14 }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {result?.error && (
        <p role="alert" style={{ color: 'var(--cb-danger)', fontSize: 13, marginTop: 10 }}>
          {result.error}
        </p>
      )}
    </div>
  );
}
