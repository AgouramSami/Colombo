'use client';

import { AppTopbar } from '@/components/app-topbar';
import { useState, useTransition } from 'react';
import { updateLoftAction, updateUserAction } from './actions';
import type { LoftData, UserData } from './page';
import { PigeonsTab } from './pigeons-tab';

type Tab = 'compte' | 'abo' | 'pigeonnier' | 'mes-pigeons' | 'fede';

const SECTIONS: { id: Tab; label: string }[] = [
  { id: 'compte', label: 'Compte' },
  { id: 'abo', label: 'Abonnement' },
  { id: 'pigeonnier', label: 'Mon pigeonnier' },
  { id: 'mes-pigeons', label: 'Retrouver mes pigeons' },
  { id: 'fede', label: 'Connexion Fédération' },
];

const PLAN_LABELS: Record<string, string> = {
  free: 'Découverte',
  eleveur: 'Éleveur',
  club: 'Club',
};

export function ReglagesView({
  userName,
  userData,
  loftData,
  nameVariants,
}: {
  userName: string;
  userData: UserData;
  loftData: LoftData | null;
  nameVariants: string[];
}) {
  const [tab, setTab] = useState<Tab>('compte');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
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
            {tab === 'compte' && <SettingsCompte userData={userData} />}
            {tab === 'abo' && <SettingsAbo plan={userData.plan} />}
            {tab === 'pigeonnier' && <SettingsPigeonnier loftData={loftData} />}
            {tab === 'mes-pigeons' && <PigeonsTab nameVariants={nameVariants} />}
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

function SaveFeedback({ ok, error }: { ok: boolean; error?: string }) {
  if (ok)
    return (
      <p style={{ color: 'var(--cb-positive)', fontWeight: 600, marginTop: 12 }}>
        Modifications enregistrées.
      </p>
    );
  if (error)
    return (
      <p role="alert" style={{ color: 'var(--cb-danger)', marginTop: 12 }}>
        {error}
      </p>
    );
  return null;
}

function SettingsCompte({ userData }: { userData: UserData }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
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
          </div>
          <div>
            <label className="cb-label" htmlFor="s-email">
              Email
            </label>
            <input
              id="s-email"
              className="cb-input"
              value={userData.email}
              readOnly
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label className="cb-label" htmlFor="s-tel">
              Téléphone (WhatsApp)
            </label>
            <input
              id="s-tel"
              name="phone"
              className="cb-input"
              placeholder="06 12 34 56 78"
              defaultValue={userData.phone ?? ''}
            />
          </div>
        </div>

        {result && <SaveFeedback ok={result.ok} error={result.error} />}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="submit" className="cb-btn cb-btn--primary" disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="cb-card" style={{ padding: 28, marginTop: 16 }}>
        <h3 className="cb-section-title">Sécurité</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <form action="/auth/signout" method="post">
            <button type="submit" className="cb-btn cb-btn--ghost">
              Se déconnecter
            </button>
          </form>
        </div>
        <div style={{ height: 1, background: 'var(--cb-line)', border: 0, margin: '24px 0' }} />
        <h3 className="cb-section-title" style={{ color: 'var(--cb-danger)', fontSize: '1.25rem' }}>
          Zone sensible
        </h3>
        <p className="cb-muted" style={{ marginTop: 0, marginBottom: 14, fontSize: 14 }}>
          La suppression de votre compte est définitive et efface toutes vos données.
        </p>
        <button type="button" className="cb-btn cb-btn--danger">
          Supprimer mon compte
        </button>
      </div>
    </form>
  );
}

function SettingsAbo({ plan }: { plan: string }) {
  const planLabel = PLAN_LABELS[plan] ?? 'Découverte';
  const isFree = plan === 'free';

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
          {planLabel}
        </div>
        <div className="cb-muted" style={{ fontSize: '1.0625rem' }}>
          {isFree ? "Jusqu'à 3 pigeons · Fiches de base · Gratuit" : 'Accès illimité'}
        </div>
        {isFree && (
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="cb-btn cb-btn--primary">
              Passer à Éleveur — 9 € / mois
            </button>
          </div>
        )}
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
            key: 'free',
          },
          {
            name: 'Éleveur',
            price: '9 € / mois',
            limit: 'Illimité',
            features: ['Stats complètes', "Carnet d'entraînement", 'Export PDF'],
            key: 'eleveur',
          },
          {
            name: 'Club',
            price: '29 € / mois',
            limit: 'Illimité + membres',
            features: ['Tout Éleveur', 'Gestion club', 'Partage résultats', 'Support prioritaire'],
            key: 'club',
          },
        ].map((p) => (
          <div
            key={p.name}
            className="cb-card"
            style={{
              padding: 18,
              borderColor: plan === p.key ? 'var(--cb-accent)' : 'var(--cb-line)',
              borderWidth: plan === p.key ? 2 : 1,
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

function SettingsPigeonnier({ loftData }: { loftData: LoftData | null }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await updateLoftAction(fd);
          setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
        });
      }}
    >
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
            <input
              id="p-nom"
              name="name"
              className="cb-input"
              placeholder="Mon pigeonnier"
              defaultValue={loftData?.name ?? ''}
              required
            />
          </div>
          <div>
            <label className="cb-label" htmlFor="p-adresse">
              Adresse
            </label>
            <input
              id="p-adresse"
              name="address"
              className="cb-input"
              placeholder="Rue, commune"
              defaultValue={loftData?.address ?? ''}
            />
          </div>
          <div>
            <label className="cb-label" htmlFor="p-licence">
              Numéro de licence FCF
            </label>
            <input
              id="p-licence"
              name="licence_number"
              className="cb-input cb-matricule"
              placeholder="FR-00-0000"
              defaultValue={loftData?.licence_number ?? ''}
            />
          </div>
        </div>

        {result && <SaveFeedback ok={result.ok} error={result.error} />}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            type="submit"
            className="cb-btn cb-btn--primary"
            disabled={isPending || !loftData}
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}

function SettingsFede() {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Connexion à la Fédération Colombophile</h3>
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
        <SyncIcon /> Importation automatique active · résultats toutes les 2 heures
      </div>
      <p className="cb-muted" style={{ marginTop: 0 }}>
        Colombo&apos; récupère automatiquement vos résultats depuis Francolomb. Aucun identifiant
        requis — nous lisons les données publiques de la Fédération.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <button type="button" className="cb-btn cb-btn--ghost">
          Forcer une synchronisation
        </button>
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
