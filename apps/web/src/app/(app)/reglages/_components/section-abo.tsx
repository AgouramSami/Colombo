import { FeatureCheckIcon, FeatureCrossIcon } from './icons';

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Découverte', color: 'var(--cb-ink-3)', bg: 'var(--cb-bg-sunken)' },
  eleveur: { label: 'Éleveur', color: 'var(--cb-gold)', bg: 'var(--cb-gold-soft)' },
  club: { label: 'Club', color: 'var(--cb-accent-soft-ink)', bg: 'var(--cb-accent-soft)' },
};

export function SectionAbo({ plan }: { plan: string }) {
  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  if (!planConfig) return null;
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
      <div
        className="cb-card"
        style={{
          padding: 'clamp(18px, 4vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: planConfig.bg,
          border: `1px solid color-mix(in oklab, ${planConfig.color} 30%, transparent)`,
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
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
                padding: 'clamp(16px, 4vw, 22px)',
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
