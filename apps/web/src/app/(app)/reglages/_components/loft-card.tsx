'use client';

import { useState, useTransition } from 'react';
import { deleteLoftAction, updateLoftAction } from '../actions';
import type { LoftData } from '../types';
import { HomeIcon } from './icons';
import { SaveFeedback } from './save-feedback';

export function LoftCard({ loft }: { loft: LoftData }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!editing) {
    return (
      <div
        className="cb-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--cb-accent-soft)',
            color: 'var(--cb-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HomeIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{loft.name}</div>
          {loft.address && (
            <div className="cb-muted" style={{ fontSize: 13 }}>
              {loft.address}
            </div>
          )}
          {loft.licence_number && (
            <div className="cb-matricule cb-faint" style={{ fontSize: 12 }}>
              {loft.licence_number}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            className="cb-btn cb-btn--ghost"
            style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
            onClick={() => setEditing(true)}
          >
            Modifier
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              style={{
                minHeight: 36,
                padding: '0 12px',
                fontSize: 13,
                color: 'var(--cb-danger)',
                borderColor: 'color-mix(in oklab, var(--cb-danger) 40%, var(--cb-line))',
              }}
              onClick={() => setConfirmDelete(true)}
            >
              Supprimer
            </button>
          ) : (
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              style={{ minHeight: 36, padding: '0 12px', fontSize: 13, color: 'var(--cb-danger)' }}
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteLoftAction(loft.id);
                });
              }}
            >
              {isPending ? 'Suppression...' : 'Confirmer'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.append('loft_id', loft.id);
        startTransition(async () => {
          const res = await updateLoftAction(fd);
          if (res.ok) setEditing(false);
          else setResult({ ok: false, error: res.error });
        });
      }}
    >
      <div className="cb-card" style={{ padding: 20, border: '2px solid var(--cb-accent)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
          }}
        >
          <div>
            <label className="cb-label" htmlFor={`name-${loft.id}`}>
              Nom
            </label>
            <input
              id={`name-${loft.id}`}
              name="name"
              className="cb-input"
              defaultValue={loft.name}
              required
            />
          </div>
          <div>
            <label className="cb-label" htmlFor={`addr-${loft.id}`}>
              Adresse
            </label>
            <input
              id={`addr-${loft.id}`}
              name="address"
              className="cb-input"
              defaultValue={loft.address ?? ''}
              placeholder="Rue, commune"
            />
          </div>
          <div>
            <label className="cb-label" htmlFor={`lic-${loft.id}`}>
              Licence FCF
            </label>
            <input
              id={`lic-${loft.id}`}
              name="licence_number"
              className="cb-input cb-matricule"
              defaultValue={loft.licence_number ?? ''}
              placeholder="FR-00-0000"
            />
          </div>
        </div>
        {result && <SaveFeedback ok={result.ok} error={result.error} />}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="submit" className="cb-btn cb-btn--primary" disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" className="cb-btn cb-btn--ghost" onClick={() => setEditing(false)}>
            Annuler
          </button>
        </div>
      </div>
    </form>
  );
}
