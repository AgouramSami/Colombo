'use client';

import { AppTopbar } from '@/components/app-topbar';
import { useState } from 'react';

type Tab = 'compte' | 'abo' | 'pigeonnier' | 'fede';

const SECTIONS: { id: Tab; label: string }[] = [
  { id: 'compte', label: 'Compte' },
  { id: 'abo', label: 'Abonnement' },
  { id: 'pigeonnier', label: 'Mon pigeonnier' },
  { id: 'fede', label: 'Connexion Fédération' },
];

export function ReglagesView({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [tab, setTab] = useState<Tab>('compte');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '28px clamp(16px, 4vw, 40px) 80px',
        }}
      >
        <h1
          className="cb-display"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', margin: '0 0 28px' }}
        >
          Réglages
        </h1>

        <div
          style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28 }}
          className="cb-settings-grid"
        >
          <aside>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="cb-btn"
                  onClick={() => setTab(s.id)}
                  style={{
                    minHeight: 48,
                    justifyContent: 'flex-start',
                    gap: 12,
                    background: tab === s.id ? 'var(--cb-bg-elev)' : 'transparent',
                    border: tab === s.id ? '1px solid var(--cb-line)' : '1px solid transparent',
                    fontWeight: tab === s.id ? 700 : 500,
                    color: tab === s.id ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
                    padding: '0 14px',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          <div>
            {tab === 'compte' && <SettingsCompte email={userEmail} />}
            {tab === 'abo' && <SettingsAbo />}
            {tab === 'pigeonnier' && <SettingsPigeonnier />}
            {tab === 'fede' && <SettingsFede />}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .cb-settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SettingsCompte({ email }: { email: string }) {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Informations personnelles</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <label className="cb-label" htmlFor="s-prenom">
            Prénom
          </label>
          <input id="s-prenom" className="cb-input" placeholder="Jean" />
        </div>
        <div>
          <label className="cb-label" htmlFor="s-nom">
            Nom
          </label>
          <input id="s-nom" className="cb-input" placeholder="Dupont" />
        </div>
        <div>
          <label className="cb-label" htmlFor="s-email">
            Email
          </label>
          <input id="s-email" className="cb-input" defaultValue={email} type="email" readOnly />
        </div>
        <div>
          <label className="cb-label" htmlFor="s-tel">
            Téléphone
          </label>
          <input id="s-tel" className="cb-input" placeholder="06 12 34 56 78" />
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--cb-line)', border: 0, margin: '28px 0' }} />
      <h3 className="cb-section-title">Sécurité</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="cb-btn cb-btn--ghost">
          Envoyer un lien de connexion
        </button>
        <form action="/auth/signout" method="post">
          <button type="submit" className="cb-btn cb-btn--ghost">
            Se déconnecter
          </button>
        </form>
      </div>
      <div style={{ height: 1, background: 'var(--cb-line)', border: 0, margin: '28px 0' }} />
      <h3 className="cb-section-title" style={{ color: 'var(--cb-danger)' }}>
        Zone sensible
      </h3>
      <button type="button" className="cb-btn cb-btn--danger">
        Supprimer mon compte
      </button>
    </div>
  );
}

function SettingsAbo() {
  return (
    <div>
      <div
        className="cb-card"
        style={{ padding: 28, marginBottom: 16, position: 'relative', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '8px 16px',
            background: 'var(--cb-positive)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            borderRadius: '0 var(--cb-radius-lg) 0 var(--cb-radius-lg)',
          }}
        >
          Actif
        </div>
        <div className="cb-eyebrow">Plan actuel</div>
        <div className="cb-display" style={{ fontSize: '2.25rem', margin: '6px 0' }}>
          Découverte
        </div>
        <div className="cb-muted" style={{ fontSize: '1.0625rem' }}>
          Jusqu&apos;à 3 pigeons · Fiches de base · Gratuit
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="cb-btn cb-btn--primary">
            Passer à Éleveur — 9 € / mois
          </button>
        </div>
      </div>

      <h3 className="cb-section-title">Comparer les formules</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {[
          {
            name: 'Découverte',
            price: 'Gratuit',
            limit: '3 pigeons',
            features: ['Fiches de base', 'Palmarès consultable'],
            current: true,
          },
          {
            name: 'Éleveur',
            price: '9 € / mois',
            limit: 'Illimité',
            features: ['Stats complètes', "Carnet d'entraînement", 'Export PDF'],
          },
          {
            name: 'Club',
            price: '29 € / mois',
            limit: 'Illimité + membres',
            features: ['Tout Éleveur', 'Gestion club', 'Partage résultats', 'Support prioritaire'],
          },
        ].map((p) => (
          <div
            key={p.name}
            className="cb-card"
            style={{
              padding: 18,
              borderColor: p.current ? 'var(--cb-accent)' : 'var(--cb-line)',
              borderWidth: p.current ? 2 : 1,
            }}
          >
            <div
              style={{ fontFamily: 'var(--cb-font-display)', fontSize: '1.25rem', fontWeight: 600 }}
            >
              {p.name}
            </div>
            <div
              className="cb-display"
              style={{ fontSize: '1.5rem', margin: '6px 0', color: 'var(--cb-accent)' }}
            >
              {p.price}
            </div>
            <div className="cb-muted" style={{ fontSize: 14, marginBottom: 10 }}>
              {p.limit}
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, color: 'var(--cb-ink-2)' }}>
              {p.features.map((f) => (
                <li key={f} style={{ marginBottom: 4 }}>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPigeonnier() {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Mon pigeonnier</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <label className="cb-label" htmlFor="p-nom">
            Nom du pigeonnier
          </label>
          <input id="p-nom" className="cb-input" placeholder="Mon pigeonnier" />
        </div>
        <div>
          <label className="cb-label" htmlFor="p-ville">
            Commune
          </label>
          <input id="p-ville" className="cb-input" placeholder="Ville (département)" />
        </div>
        <div>
          <label className="cb-label" htmlFor="p-licence">
            Numéro de licence
          </label>
          <input id="p-licence" className="cb-input cb-matricule" placeholder="FR-00-0000" />
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--cb-line)', border: 0, margin: '28px 0' }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="cb-btn cb-btn--primary">
          Enregistrer
        </button>
        <button type="button" className="cb-btn cb-btn--ghost">
          Annuler
        </button>
      </div>
    </div>
  );
}

function SettingsFede() {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Connexion à la Fédération Colombophile Française</h3>
      <div
        style={{
          padding: 18,
          borderRadius: 'var(--cb-radius)',
          background: 'var(--cb-accent-soft)',
          color: 'var(--cb-accent-soft-ink)',
          fontWeight: 600,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SyncIcon /> Importation automatique active · résultats mis à jour toutes les 2 heures
      </div>
      <p className="cb-muted" style={{ marginTop: 0 }}>
        Colombo&apos; récupère automatiquement vos résultats depuis Francolomb. Aucun identifiant
        requis — nous lisons les données publiques.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <button type="button" className="cb-btn cb-btn--ghost">
          Forcer une synchro
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--cb-line)', border: 0, margin: '28px 0' }} />
      <h4
        style={{
          fontFamily: 'var(--cb-font-display)',
          fontSize: '1.125rem',
          margin: '0 0 10px',
        }}
      >
        Historique de synchronisation
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
        {[
          '24 avr. 2026 · 14:32 — 2 nouveaux résultats (Lamotte-Beuvron)',
          '19 avr. 2026 · 21:15 — 8 résultats importés (Issoudun)',
          '12 avr. 2026 · 20:48 — Résultats Châteauroux publiés',
          '5 avr. 2026 · 19:22 — Mise à jour palmarès saison',
        ].map((l, i) => (
          <div
            key={l}
            style={{
              padding: '8px 0',
              borderTop: i ? '1px solid var(--cb-line-2)' : 'none',
              color: 'var(--cb-ink-2)',
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Synchronisé</title>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}
