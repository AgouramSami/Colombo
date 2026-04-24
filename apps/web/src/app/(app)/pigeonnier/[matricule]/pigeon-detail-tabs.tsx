'use client';

import { useState } from 'react';
import type { CareerEntry } from './page';

type Tab = 'career' | 'pedigree' | 'trainings' | 'notes';

export function PigeonDetailTabs({
  career,
  fatherMatricule,
  motherMatricule,
}: {
  career: CareerEntry[];
  fatherMatricule: string | null;
  motherMatricule: string | null;
}) {
  const [tab, setTab] = useState<Tab>('career');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'career', label: 'Carrière', count: career.length },
    { id: 'pedigree', label: 'Pedigree' },
    { id: 'trainings', label: 'Entraînements' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--cb-line)',
          marginBottom: 22,
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="cb-btn"
            style={{
              minHeight: 52,
              padding: '0 18px',
              borderRadius: 0,
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--cb-accent)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
              fontWeight: tab === t.id ? 700 : 500,
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="cb-muted" style={{ fontWeight: 500, marginLeft: 6 }}>
                · {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'career' && <CareerTab career={career} />}
      {tab === 'pedigree' && <PedigreeTab father={fatherMatricule} mother={motherMatricule} />}
      {tab === 'trainings' && <ComingSoon label="Carnet d'entraînement" />}
      {tab === 'notes' && <ComingSoon label="Notes" />}
    </>
  );
}

function CareerTab({ career }: { career: CareerEntry[] }) {
  if (career.length === 0) {
    return (
      <div className="cb-card" style={{ padding: 48, textAlign: 'center' }}>
        <p className="cb-muted" style={{ fontSize: '1.125rem' }}>
          Aucun résultat de concours enregistré pour ce pigeon.
        </p>
        <p className="cb-faint" style={{ marginTop: 8 }}>
          Les résultats seront importés automatiquement depuis Francolomb.
        </p>
      </div>
    );
  }

  const velocities = career.map((r) => r.velocity).filter((v) => v > 0);
  const minV = Math.min(...velocities);
  const maxV = Math.max(...velocities);
  const range = maxV - minV || 1;

  const chartPts = [...career].reverse().map((r, i, arr) => ({
    x: 30 + (i / Math.max(arr.length - 1, 1)) * 760,
    y: 20 + (1 - (r.velocity - minV) / range) * 160,
    r,
  }));

  const linePath = chartPts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L${chartPts[chartPts.length - 1]?.x ?? 0} 180 L${chartPts[0]?.x ?? 0} 180 Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sparkline */}
      <div className="cb-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="cb-section-title" style={{ margin: 0 }}>
            Évolution de la vitesse
          </h3>
          <span className="cb-muted" style={{ fontSize: 14 }}>
            Saison · {career.length} concours
          </span>
        </div>
        <svg viewBox="0 0 800 200" style={{ width: '100%', height: 200 }} aria-hidden="true">
          <title>Évolution de la vitesse</title>
          <defs>
            <linearGradient id="careergrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a3412" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1="30"
              x2="790"
              y1={20 + t * 160}
              y2={20 + t * 160}
              stroke="#e7dcc5"
              strokeWidth="1"
            />
          ))}
          <path d={areaPath} fill="url(#careergrad)" />
          <path d={linePath} stroke="#9a3412" strokeWidth="2.5" fill="none" />
          {chartPts.map((p) => (
            <circle
              key={`${p.x}-${p.y}`}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#fbf6ec"
              stroke="#9a3412"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* Table */}
      <div className="cb-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--cb-line)' }}>
          <h3 className="cb-section-title" style={{ margin: 0 }}>
            Historique détaillé
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr
              style={{
                background: 'var(--cb-bg-sunken)',
                color: 'var(--cb-ink-3)',
                textAlign: 'left',
              }}
            >
              {['Date', 'Concours', 'Dist.', 'Place', 'Vitesse', '%'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: `12px ${i === 0 ? '22px' : '16px'}`,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    textAlign: i >= 2 ? 'right' : 'left',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {career.map((r) => (
              <tr
                key={`${r.race}-${r.date}`}
                style={{ borderTop: '1px solid var(--cb-line-2)', height: 54 }}
              >
                <td style={{ padding: '10px 22px' }}>
                  {r.date
                    ? new Date(r.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{r.race}</div>
                  <div className="cb-muted" style={{ fontSize: 12 }}>
                    {r.category}
                  </div>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                  {r.distanceKm ? `${r.distanceKm} km` : '—'}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <span
                    className="cb-display cb-tabular"
                    style={{
                      fontSize: '1.125rem',
                      color: r.place <= 3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
                    }}
                  >
                    {r.place}
                  </span>
                  {r.engaged && (
                    <span className="cb-muted" style={{ fontSize: 13 }}>
                      /{r.engaged}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                  {r.velocity.toFixed(1)}
                </td>
                <td style={{ padding: '10px 22px', textAlign: 'right' }} className="cb-tabular">
                  {r.pct !== null ? (
                    <span
                      style={{
                        color:
                          r.pct <= 2
                            ? 'var(--cb-positive)'
                            : r.pct <= 5
                              ? 'var(--cb-ink-2)'
                              : 'var(--cb-ink-4)',
                        fontWeight: 600,
                      }}
                    >
                      {r.pct}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PedigreeTab({ father, mother }: { father: string | null; mother: string | null }) {
  return (
    <div className="cb-card" style={{ padding: 28 }}>
      <h3 className="cb-section-title">Filiation</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 600 }}>
        <div className="cb-card" style={{ padding: 16 }}>
          <div className="cb-muted" style={{ fontSize: 12, fontWeight: 600 }}>
            Père
          </div>
          <div className="cb-matricule" style={{ fontWeight: 600, marginTop: 4 }}>
            {father ?? 'Non renseigné'}
          </div>
        </div>
        <div className="cb-card" style={{ padding: 16 }}>
          <div className="cb-muted" style={{ fontSize: 12, fontWeight: 600 }}>
            Mère
          </div>
          <div className="cb-matricule" style={{ fontWeight: 600, marginTop: 4 }}>
            {mother ?? 'Non renseignée'}
          </div>
        </div>
      </div>
      <p className="cb-muted" style={{ marginTop: 24, fontSize: 15 }}>
        L'arbre généalogique complet sera disponible dans une prochaine version.
      </p>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="cb-card" style={{ padding: 48, textAlign: 'center' }}>
      <p className="cb-muted" style={{ fontSize: '1.125rem' }}>
        {label} — disponible prochainement.
      </p>
    </div>
  );
}
