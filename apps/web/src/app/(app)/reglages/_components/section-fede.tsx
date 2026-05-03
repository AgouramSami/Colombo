import { SyncIcon } from './icons';

export function SectionFede() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="cb-card"
        style={{
          padding: 'clamp(18px, 4vw, 28px)',
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

      <div className="cb-card" style={{ padding: 'clamp(18px, 4vw, 28px)' }}>
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
