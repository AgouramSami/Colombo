const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Découverte', color: 'var(--cb-ink-3)', bg: 'var(--cb-bg-sunken)' },
  eleveur: { label: 'Éleveur', color: 'var(--cb-gold)', bg: 'var(--cb-gold-soft)' },
  club: { label: 'Club', color: 'var(--cb-accent-soft-ink)', bg: 'var(--cb-accent-soft)' },
};

type Props = {
  userName: string;
  email: string;
  plan: string;
  memberSince: string | null;
  pigeonCount: number;
  loftCount: number;
};

export function ProfileHero({ userName, email, plan, memberSince, pigeonCount, loftCount }: Props) {
  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  if (!planConfig) return null;

  const initials = userName
    .split(/[\s.@]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <div
      className="cb-card cb-profile-hero"
      style={{
        padding: 'clamp(20px, 4vw, 32px)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
        background: 'var(--cb-bg-elev)',
        backgroundImage: 'linear-gradient(135deg, rgba(154,52,18,0.04) 0%, transparent 60%)',
      }}
    >
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

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="cb-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: 0 }}>
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
              background: planConfig.bg,
              color: planConfig.color,
            }}
          >
            {planConfig.label}
          </span>
        </div>
        <div className="cb-muted" style={{ marginTop: 4, fontSize: '0.9375rem' }}>
          {email}
          {memberSince && (
            <span style={{ marginLeft: 14, color: 'var(--cb-ink-4)' }}>
              · Membre depuis {memberSince}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexShrink: 0 }} className="cb-profile-stats">
        <ProfileStat value={pigeonCount} label="Pigeons" />
        <ProfileStat value={loftCount} label={loftCount > 1 ? 'Pigeonniers' : 'Pigeonnier'} small />
      </div>
    </div>
  );
}

function ProfileStat({
  value,
  label,
  small,
}: {
  value: string | number;
  label: string;
  small?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="cb-display cb-tabular"
        style={{ fontSize: small ? '1.125rem' : '1.75rem', color: 'var(--cb-ink)', lineHeight: 1 }}
      >
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>
      <div className="cb-faint" style={{ fontSize: 12, marginTop: 3, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}
