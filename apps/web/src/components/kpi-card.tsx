import type { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'gold' | 'accent';
  suffix?: string;
  hint?: string;
  trend?: { text: string; tone: 'up' | 'down' | 'flat' };
  icon?: ReactNode;
};

export function KpiCard({
  label,
  value,
  tone = 'default',
  suffix,
  hint,
  trend,
  icon,
}: KpiCardProps) {
  const valueColor =
    tone === 'gold' ? 'var(--cb-gold)' : tone === 'accent' ? 'var(--cb-accent)' : 'var(--cb-ink)';
  const iconColor =
    tone === 'gold' ? 'var(--cb-gold)' : tone === 'accent' ? 'var(--cb-accent)' : 'var(--cb-ink-3)';

  return (
    <div className="cb-card" style={{ padding: '18px 20px', background: 'var(--cb-bg-elev)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div className="cb-eyebrow">{label}</div>
        {icon && (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: 'var(--cb-bg-sunken)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className="cb-display cb-tabular"
        style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: valueColor }}
      >
        {value}
        {suffix !== undefined && suffix !== '' && (
          <span className="cb-muted" style={{ fontSize: 13, fontWeight: 500, marginLeft: 5 }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <div
          className="cb-faint"
          style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.3, maxWidth: '100%' }}
        >
          {hint}
        </div>
      )}
      {trend && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color:
              trend.tone === 'up'
                ? 'var(--cb-positive)'
                : trend.tone === 'down'
                  ? 'var(--cb-danger)'
                  : 'var(--cb-ink-4)',
          }}
        >
          {trend.text}
        </div>
      )}
    </div>
  );
}
