type PlaceBadgeProps = {
  place: number;
  total?: number | null;
  size?: 'sm' | 'md';
};

export function PlaceBadge({ place, total, size = 'md' }: PlaceBadgeProps) {
  const pct = total ? Math.round((place / total) * 100) : null;
  const color =
    place === 1
      ? 'var(--cb-gold)'
      : place <= 3
        ? 'var(--cb-accent)'
        : place <= 10
          ? 'var(--cb-ink-2)'
          : 'var(--cb-ink-4)';
  const bg =
    place === 1 ? 'var(--cb-gold-soft)' : place <= 3 ? 'var(--cb-accent-soft)' : 'transparent';
  const fontSize = size === 'sm' ? '1.1rem' : '1.375rem';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span
        className="cb-display cb-tabular"
        style={{
          fontSize,
          color,
          background: bg,
          padding: bg !== 'transparent' ? '2px 8px' : undefined,
          borderRadius: bg !== 'transparent' ? 6 : undefined,
        }}
      >
        {place}
        <sup style={{ fontSize: 11 }}>e</sup>
      </span>
      {pct !== null && <span style={{ fontSize: 11, color: 'var(--cb-ink-4)' }}>top {pct}%</span>}
    </div>
  );
}
