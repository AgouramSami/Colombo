'use client';

import { AppTopbar } from '@/components/app-topbar';
import { useState } from 'react';

const MOCK_UPCOMING = [
  {
    id: '1',
    date: '26',
    month: 'AVRIL',
    name: 'Guéret',
    category: 'Grand demi-fond',
    ageClass: 'Vieux',
    distance: 452,
    club: 'SRC Centre',
    deadline: '24 avr.',
  },
  {
    id: '2',
    date: '3',
    month: 'MAI',
    name: 'Argenton-sur-Creuse',
    category: 'Fond',
    ageClass: 'Vieux',
    distance: 521,
    club: 'SRC Centre',
    deadline: '1 mai',
  },
  {
    id: '3',
    date: '10',
    month: 'MAI',
    name: 'Châteauroux',
    category: 'Demi-fond',
    ageClass: 'Yearlings',
    distance: 338,
    club: 'SRC Centre',
    deadline: '8 mai',
  },
];

const MOCK_PAST = [
  {
    id: 'p1',
    date: '19 avr.',
    name: 'Issoudun',
    category: 'Demi-fond',
    distance: 285,
    pigeonsEngaged: 1041,
    yourEngaged: 4,
    yourClassed: 3,
    bestPlace: 7,
  },
  {
    id: 'p2',
    date: '12 avr.',
    name: 'Lamotte-Beuvron',
    category: 'Demi-fond',
    distance: 248,
    pigeonsEngaged: 1052,
    yourEngaged: 6,
    yourClassed: 5,
    bestPlace: 1,
  },
  {
    id: 'p3',
    date: '5 avr.',
    name: 'Bourges',
    category: 'Fond',
    distance: 412,
    pigeonsEngaged: 1620,
    yourEngaged: 4,
    yourClassed: 2,
    bestPlace: 3,
  },
];

export function ConcoursView({ userName }: { userName: string }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '28px clamp(16px, 4vw, 40px) 80px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
              Saison 2026
            </div>
            <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
              Concours
            </h1>
            <p className="cb-muted" style={{ margin: '6px 0 0', fontSize: '1.0625rem' }}>
              Engagements à venir et résultats publiés par votre société.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="cb-btn cb-btn--primary">
              <PlusIcon /> Engager des pigeons
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--cb-line)',
            marginBottom: 22,
          }}
        >
          {(
            [
              { id: 'upcoming', label: 'À venir', count: MOCK_UPCOMING.length },
              { id: 'past', label: 'Résultats', count: MOCK_PAST.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="cb-btn"
              style={{
                minHeight: 52,
                padding: '0 20px',
                borderRadius: 0,
                borderBottom: tab === t.id ? '2px solid var(--cb-accent)' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.id ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
                fontWeight: tab === t.id ? 700 : 500,
                marginBottom: -1,
              }}
            >
              {t.label}{' '}
              <span className="cb-muted" style={{ fontWeight: 500, marginLeft: 6 }}>
                · {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === 'upcoming' && <UpcomingList />}
        {tab === 'past' && <PastList />}
      </main>
    </div>
  );
}

function UpcomingList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MOCK_UPCOMING.map((r) => (
        <div
          key={r.id}
          className="cb-card"
          style={{
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: '90px 1fr auto auto',
            gap: 22,
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              className="cb-display"
              style={{ fontSize: '2rem', lineHeight: 1, color: 'var(--cb-accent)' }}
            >
              {r.date}
            </div>
            <div className="cb-eyebrow" style={{ marginTop: 4 }}>
              {r.month}
            </div>
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--cb-font-display)',
                  fontSize: '1.375rem',
                  fontWeight: 600,
                }}
              >
                {r.name}
              </div>
              <span className="cb-badge">{r.category}</span>
              <span className="cb-badge">{r.ageClass}</span>
            </div>
            <div className="cb-muted" style={{ fontSize: 14 }}>
              <MapIcon /> {r.distance} km · {r.club}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="cb-muted"
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Clôture
            </div>
            <div style={{ fontWeight: 600 }}>{r.deadline}</div>
          </div>
          <button
            type="button"
            className="cb-btn cb-btn--primary"
            style={{ minHeight: 44, padding: '0 18px' }}
          >
            Engager <ArrowRightIcon />
          </button>
        </div>
      ))}

      <style>{`
        @media (max-width: 760px) {
          .cb-race-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function PastList() {
  return (
    <div className="cb-card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
        <thead>
          <tr
            style={{
              background: 'var(--cb-bg-sunken)',
              color: 'var(--cb-ink-3)',
              textAlign: 'left',
            }}
          >
            {[
              { label: 'Date', style: { padding: '14px 22px' } },
              { label: 'Concours', style: { padding: '14px 16px' } },
              { label: 'Engagés', style: { padding: '14px 16px', textAlign: 'right' as const } },
              {
                label: 'Vos pigeons',
                style: { padding: '14px 16px', textAlign: 'right' as const },
              },
              {
                label: 'Meilleure place',
                style: { padding: '14px 16px', textAlign: 'right' as const },
              },
              { label: '', style: { padding: '14px 22px' } },
            ].map((h) => (
              <th
                key={h.label}
                style={{
                  ...h.style,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_PAST.map((r) => (
            <tr
              key={r.id}
              style={{
                borderTop: '1px solid var(--cb-line-2)',
                height: 64,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--cb-bg-sunken)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <td style={{ padding: '12px 22px', fontWeight: 600 }}>{r.date}</td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div className="cb-muted" style={{ fontSize: 12 }}>
                  {r.category} · {r.distance} km
                </div>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }} className="cb-tabular">
                {r.pigeonsEngaged.toLocaleString('fr-FR')}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }} className="cb-tabular">
                <span style={{ fontWeight: 600 }}>{r.yourClassed}</span>
                <span className="cb-muted">/{r.yourEngaged}</span>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <span
                  className="cb-display cb-tabular"
                  style={{
                    fontSize: '1.25rem',
                    color: r.bestPlace <= 3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
                  }}
                >
                  {r.bestPlace}
                  <sup style={{ fontSize: 12 }}>e</sup>
                </span>
              </td>
              <td style={{ padding: '12px 22px', textAlign: 'right' }}>
                <ArrowRightIcon />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlusIcon() {
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
      <title>Ajouter</title>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ verticalAlign: 'middle', marginRight: 4 }}
      aria-hidden="true"
    >
      <title>Distance</title>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function ArrowRightIcon() {
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
      <title>Voir</title>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
