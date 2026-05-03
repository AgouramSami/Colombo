'use client';

import { AppTopbar } from '@/components/app-topbar';
import { HelpIcon as MenuHelpIcon, LogoutIcon as MenuLogoutIcon } from '@/components/user-menu';
import { useState, useTransition } from 'react';
import {
  clearLoftPigeonsAction,
  createLoftAction,
  deleteLoftAction,
  updateLoftAction,
  updateUserAction,
} from './actions';
import type { LoftData, ProfileStats, UserData } from './page';
import { PigeonsTab } from './pigeons-tab';

type Tab = 'compte' | 'abo' | 'pigeonnier' | 'mes-pigeons' | 'fede';

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Découverte', color: 'var(--cb-ink-3)', bg: 'var(--cb-bg-sunken)' },
  eleveur: { label: 'Éleveur', color: 'var(--cb-gold)', bg: 'var(--cb-gold-soft)' },
  club: { label: 'Club', color: 'var(--cb-accent-soft-ink)', bg: 'var(--cb-accent-soft)' },
};

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'compte', label: 'Mon compte', icon: <UserIcon /> },
  { id: 'abo', label: 'Abonnement', icon: <StarIcon /> },
  { id: 'pigeonnier', label: 'Mon pigeonnier', icon: <HomeIcon /> },
  { id: 'mes-pigeons', label: 'Retrouver mes pigeons', icon: <SearchIcon /> },
  { id: 'fede', label: 'Fédération', icon: <SyncIcon /> },
];

export function ReglagesView({
  userName,
  userData,
  loftData,
  nameVariants,
  stats,
}: {
  userName: string;
  userData: UserData;
  loftData: LoftData[];
  nameVariants: string[];
  stats: ProfileStats;
}) {
  const [tab, setTab] = useState<Tab>('compte');

  const plan = (PLAN_CONFIG[userData.plan] ?? PLAN_CONFIG.free) as NonNullable<
    (typeof PLAN_CONFIG)[string]
  >;
  const initials = userName
    .split(/[\s.@]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const memberSince = userData.created_at
    ? new Date(userData.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        {/* Hero profil */}
        <div
          className="cb-card"
          style={{
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
            background: 'var(--cb-bg-elev)',
            backgroundImage: 'linear-gradient(135deg, rgba(154,52,18,0.04) 0%, transparent 60%)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: 'var(--cb-accent)',
              color: 'var(--cb-accent-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--cb-font-display)',
              fontWeight: 700,
              fontSize: '1.75rem',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(154,52,18,0.25)',
            }}
          >
            {initials || '?'}
          </div>

          {/* Identité */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                className="cb-display"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: 0 }}
              >
                {userName}
              </h1>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  background: plan.bg,
                  color: plan.color,
                }}
              >
                {plan.label}
              </span>
            </div>
            <div className="cb-muted" style={{ marginTop: 4, fontSize: '0.9375rem' }}>
              {userData.email}
              {memberSince && (
                <span style={{ marginLeft: 14, color: 'var(--cb-ink-4)' }}>
                  · Membre depuis {memberSince}
                </span>
              )}
            </div>
          </div>

          {/* Stats rapides */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexShrink: 0,
            }}
            className="cb-profile-stats"
          >
            <ProfileStat value={stats.pigeonCount} label="Pigeons" />
            <ProfileStat
              value={loftData.length}
              label={loftData.length > 1 ? 'Pigeonniers' : 'Pigeonnier'}
              small
            />
          </div>
        </div>

        {/* Compte — Aide + Logout (visible toutes plateformes, primary entry sur mobile) */}
        <div className="cb-card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="cb-eyebrow" style={{ marginBottom: 12 }}>
            Compte
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://wa.me/33600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="cb-btn cb-btn--ghost"
              style={{ justifyContent: 'flex-start', minHeight: 52, gap: 12 }}
            >
              <MenuHelpIcon />
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
                <MenuLogoutIcon />
                Se d&eacute;connecter
              </button>
            </form>
          </div>
        </div>

        {/* Layout sidebar + contenu */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 24,
            alignItems: 'start',
          }}
          className="cb-settings-grid"
        >
          {/* Sidebar */}
          <aside className="cb-settings-aside">
            <nav
              className="cb-settings-nav"
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 48,
                    padding: '0 14px',
                    border: 'none',
                    borderRadius: 'var(--cb-radius)',
                    background: tab === item.id ? 'var(--cb-accent-soft)' : 'transparent',
                    color: tab === item.id ? 'var(--cb-accent-soft-ink)' : 'var(--cb-ink-3)',
                    fontWeight: tab === item.id ? 700 : 500,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition:
                      'background var(--cb-dur) var(--cb-ease), color var(--cb-dur) var(--cb-ease)',
                    width: '100%',
                  }}
                >
                  <span
                    style={{
                      color: tab === item.id ? 'var(--cb-accent)' : 'var(--cb-ink-4)',
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Déconnexion dans sidebar */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: '1px solid var(--cb-line)',
              }}
            >
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 44,
                    padding: '0 14px',
                    border: 'none',
                    borderRadius: 'var(--cb-radius)',
                    background: 'transparent',
                    color: 'var(--cb-ink-3)',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <LogoutIcon />
                  Se déconnecter
                </button>
              </form>
            </div>
          </aside>

          {/* Contenu */}
          <div>
            {tab === 'compte' && <SectionCompte userData={userData} />}
            {tab === 'abo' && <SectionAbo plan={userData.plan} />}
            {tab === 'pigeonnier' && <SectionPigeonnier loftData={loftData} />}
            {tab === 'mes-pigeons' && <PigeonsTab nameVariants={nameVariants} />}
            {tab === 'fede' && <SectionFede />}
          </div>
        </div>
      </main>

      <style>{`
        .cb-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--cb-ink-3);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        @media (max-width: 720px) {
          .cb-settings-grid { grid-template-columns: 1fr !important; }
          .cb-profile-stats { display: none !important; }
          .cb-settings-nav {
            flex-direction: row !important;
            overflow-x: auto;
            gap: 6px !important;
            padding-bottom: 4px;
          }
          .cb-settings-nav button {
            flex-shrink: 0;
            min-height: 38px !important;
            padding: 0 14px !important;
            border-radius: 999px !important;
            white-space: nowrap;
            width: auto !important;
          }
          .cb-settings-aside > div { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function ProfileStat({
  value,
  label,
  small,
}: { value: string | number; label: string; small?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: small ? '1.125rem' : '1.75rem',
          color: 'var(--cb-ink)',
          lineHeight: 1,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>
      <div className="cb-faint" style={{ fontSize: 12, marginTop: 3, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function SaveFeedback({ ok, error }: { ok: boolean; error?: string }) {
  if (ok)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--cb-positive)',
          fontWeight: 600,
          marginTop: 14,
          fontSize: '0.9375rem',
        }}
      >
        <CheckIcon /> Modifications enregistrées.
      </div>
    );
  if (error)
    return (
      <p role="alert" style={{ color: 'var(--cb-danger)', marginTop: 12 }}>
        {error}
      </p>
    );
  return null;
}

function SectionCompte({ userData }: { userData: UserData }) {
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
        <div className="cb-card" style={{ padding: 28 }}>
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

      {/* Zone danger */}
      <div
        className="cb-card"
        style={{
          padding: 28,
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

function SectionAbo({ plan }: { plan: string }) {
  const planConfig =
    PLAN_CONFIG[plan] ?? (PLAN_CONFIG.free as NonNullable<(typeof PLAN_CONFIG)[string]>);
  const isFree = plan === 'free';
  const isEleveur = plan === 'eleveur';

  const plans = [
    {
      key: 'free',
      name: 'Découverte',
      price: 'Gratuit',
      priceDetail: 'pour toujours',
      features: [
        { label: "Jusqu'à 3 pigeons", ok: true },
        { label: 'Fiches de base', ok: true },
        { label: 'Résultats consultables', ok: true },
        { label: 'Stats avancées', ok: false },
        { label: "Carnet d'entraînement", ok: false },
        { label: 'Export PDF', ok: false },
      ],
    },
    {
      key: 'eleveur',
      name: 'Éleveur',
      price: '9 €',
      priceDetail: 'par mois',
      highlight: true,
      features: [
        { label: 'Pigeons illimités', ok: true },
        { label: 'Fiches complètes', ok: true },
        { label: 'Stats avancées', ok: true },
        { label: "Carnet d'entraînement", ok: true },
        { label: 'Export PDF', ok: true },
        { label: 'Gestion club', ok: false },
      ],
    },
    {
      key: 'club',
      name: 'Club',
      price: '29 €',
      priceDetail: 'par mois',
      features: [
        { label: 'Tout Éleveur', ok: true },
        { label: 'Gestion des membres', ok: true },
        { label: 'Partage de résultats', ok: true },
        { label: 'Support prioritaire', ok: true },
        { label: 'Statistiques club', ok: true },
        { label: 'API accès', ok: true },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plan actuel */}
      <div
        className="cb-card"
        style={{
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: planConfig.bg,
          border: `1px solid color-mix(in oklab, ${planConfig.color} 30%, transparent)`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="cb-eyebrow" style={{ marginBottom: 4 }}>
            Plan actuel
          </div>
          <div
            className="cb-display"
            style={{ fontSize: '1.75rem', color: planConfig.color, margin: 0 }}
          >
            {planConfig.label}
          </div>
          <div className="cb-muted" style={{ marginTop: 4, fontSize: '0.9375rem' }}>
            {isFree
              ? "Gratuit · jusqu'à 3 pigeons"
              : isEleveur
                ? '9 € / mois · pigeons illimités'
                : '29 € / mois · accès club complet'}
          </div>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: 'var(--cb-positive)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
          }}
        >
          Actif
        </div>
      </div>

      {/* Grille des formules */}
      <h2 className="cb-section-title" style={{ margin: 0 }}>
        Changer de formule
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {plans.map((p) => {
          const isCurrent = plan === p.key;
          return (
            <div
              key={p.key}
              className="cb-card"
              style={{
                padding: 22,
                border: isCurrent
                  ? '2px solid var(--cb-accent)'
                  : p.highlight
                    ? '1.5px solid var(--cb-line)'
                    : undefined,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {p.highlight && !isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: -1,
                    right: 16,
                    background: 'var(--cb-accent)',
                    color: 'var(--cb-accent-ink)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '0 0 8px 8px',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Populaire
                </div>
              )}

              <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 8 }}>
                {p.name}
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="cb-display" style={{ fontSize: '2rem', color: 'var(--cb-ink)' }}>
                  {p.price}
                </span>
                <span className="cb-muted" style={{ fontSize: 13, marginLeft: 4 }}>
                  {p.priceDetail}
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', flex: 1 }}>
                {p.features.map((f) => (
                  <li
                    key={f.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 0',
                      fontSize: '0.875rem',
                      color: f.ok ? 'var(--cb-ink-2)' : 'var(--cb-ink-4)',
                    }}
                  >
                    {f.ok ? <FeatureCheckIcon /> : <FeatureCrossIcon />}
                    {f.label}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: 'var(--cb-radius)',
                    background: 'var(--cb-accent-soft)',
                    color: 'var(--cb-accent-soft-ink)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Votre formule actuelle
                </div>
              ) : (
                <button
                  type="button"
                  className={`cb-btn ${p.highlight ? 'cb-btn--primary' : 'cb-btn--ghost'}`}
                  style={{ width: '100%' }}
                >
                  Choisir {p.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoftCard({ loft }: { loft: LoftData }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!editing) {
    return (
      <div
        className="cb-card"
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
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
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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

function SectionPigeonnier({ loftData }: { loftData: LoftData[] }) {
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
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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

function ClearPigeonsButton() {
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
          <div style={{ display: 'flex', gap: 10 }}>
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

function SectionFede() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="cb-card"
        style={{
          padding: 28,
          background: 'var(--cb-accent-soft)',
          border: '1px solid color-mix(in oklab, var(--cb-accent) 20%, transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--cb-accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SyncIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--cb-ink)' }}>
              Importation automatique active
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--cb-accent-soft-ink)' }}>
              Résultats mis à jour toutes les 2 heures
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--cb-ink-2)' }}>
          Colombo&apos; récupère automatiquement vos résultats depuis Francolomb. Aucun identifiant
          requis — nous lisons les données publiques de la Fédération Colombophile.
        </p>
      </div>

      <div className="cb-card" style={{ padding: 28 }}>
        <h2 className="cb-section-title">Source des données</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              label: 'Francolomb',
              status: 'Connecté',
              ok: true,
              detail: 'francolomb.com · résultats régionaux',
            },
            {
              label: 'FCF',
              status: 'Non connecté',
              ok: false,
              detail: 'Fédération Colombophile Française · à venir',
            },
          ].map((src) => (
            <div
              key={src.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 'var(--cb-radius)',
                background: 'var(--cb-bg-sunken)',
                border: '1px solid var(--cb-line-2)',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: src.ok ? 'var(--cb-positive)' : 'var(--cb-ink-4)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{src.label}</div>
                <div className="cb-faint" style={{ fontSize: 13 }}>
                  {src.detail}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: src.ok ? 'var(--cb-positive)' : 'var(--cb-ink-4)',
                }}
              >
                {src.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
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
      <title>Compte</title>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StarIcon() {
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
      <title>Abonnement</title>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function HomeIcon() {
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
      <title>Pigeonnier</title>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
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
      <title>Rechercher</title>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Fédération</title>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function LogoutIcon() {
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
      <title>Se déconnecter</title>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>OK</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Supprimer</title>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function FeatureCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--cb-positive)"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Inclus</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FeatureCrossIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--cb-ink-4)"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Non inclus</title>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
