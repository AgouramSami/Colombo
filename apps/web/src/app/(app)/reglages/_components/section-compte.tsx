'use client';

import { useState, useTransition } from 'react';
import { updateUserAction } from '../actions';
import type { UserData } from '../types';
import { LogoutIcon, TrashIcon } from './icons';
import { SaveFeedback } from './save-feedback';

function HelpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Aide</title>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function SectionCompte({ userData }: { userData: UserData }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await updateUserAction(fd);
            setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
          });
        }}
      >
        <div className="cb-card" style={{ padding: 'clamp(18px, 4vw, 28px)' }}>
          <h2 className="cb-section-title">Informations personnelles</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label className="cb-label" htmlFor="s-name">
                Nom affiché
              </label>
              <input
                id="s-name"
                name="display_name"
                className="cb-input"
                placeholder="Jean Dupont"
                defaultValue={userData.display_name ?? ''}
              />
              <p className="cb-faint" style={{ fontSize: 12, marginTop: 6 }}>
                Affiché dans votre pigeonnier et sur vos fiches.
              </p>
            </div>
            <div>
              <label className="cb-label" htmlFor="s-email">
                Adresse e-mail
              </label>
              <input
                id="s-email"
                className="cb-input"
                value={userData.email}
                readOnly
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
              />
              <p className="cb-faint" style={{ fontSize: 12, marginTop: 6 }}>
                Non modifiable. Utilisé pour la connexion.
              </p>
            </div>
            <div>
              <label className="cb-label" htmlFor="s-tel">
                Téléphone
              </label>
              <input
                id="s-tel"
                name="phone"
                className="cb-input"
                placeholder="06 12 34 56 78"
                defaultValue={userData.phone ?? ''}
              />
              <p className="cb-faint" style={{ fontSize: 12, marginTop: 6 }}>
                Optionnel · utilisé pour vous contacter via WhatsApp.
              </p>
            </div>
          </div>

          {result && <SaveFeedback ok={result.ok} error={result.error} />}

          <div style={{ marginTop: 24 }}>
            <button type="submit" className="cb-btn cb-btn--primary" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </form>

      <div className="cb-card" style={{ padding: 'clamp(18px, 4vw, 28px)' }}>
        <h2 className="cb-section-title">Sécurité & connexion</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <a
            href="https://wa.me/33600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="cb-btn cb-btn--ghost"
            style={{ justifyContent: 'flex-start', minHeight: 52, gap: 12 }}
          >
            <HelpIcon />
            Aide WhatsApp
          </a>
          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button
              type="submit"
              className="cb-btn cb-btn--ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                minHeight: 52,
                gap: 12,
                color: 'var(--cb-danger)',
              }}
            >
              <LogoutIcon />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      <div
        className="cb-card"
        style={{
          padding: 'clamp(18px, 4vw, 28px)',
          border: '1px solid color-mix(in oklab, var(--cb-danger) 25%, var(--cb-line))',
        }}
      >
        <h2
          className="cb-section-title"
          style={{ color: 'var(--cb-danger)', fontSize: '1.125rem' }}
        >
          Zone sensible
        </h2>
        <p className="cb-muted" style={{ marginTop: 0, marginBottom: 18, fontSize: '0.9375rem' }}>
          La suppression de votre compte est définitive. Toutes vos données (pigeons, résultats,
          notes) seront effacées et ne pourront pas être récupérées.
        </p>
        <button
          type="button"
          className="cb-btn cb-btn--ghost"
          style={{ borderColor: 'var(--cb-danger)', color: 'var(--cb-danger)' }}
        >
          <TrashIcon /> Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
