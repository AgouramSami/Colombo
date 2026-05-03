import type { ReactNode } from 'react';

export function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="cb-muted" style={{ margin: 0, fontSize: 14 }}>Aucune donnée.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'end', minHeight: 120 }}>
      {data.map((item) => {
        const height = `${Math.max(10, (item.value / max) * 92)}px`;
        return (
          <div key={`${item.label}-${item.value}`} style={{ flex: 1, minWidth: 0 }}>
            <div
              title={`${item.label} : ${item.value}`}
              style={{
                height,
                borderRadius: 8,
                background:
                  item.value === max
                    ? 'var(--cb-accent)'
                    : 'color-mix(in srgb, var(--cb-accent) 45%, white)',
                transition: 'height 220ms ease',
              }}
            />
            <div className="cb-faint" style={{ marginTop: 6, fontSize: 11, textAlign: 'center' }}>
              {item.label}
            </div>
            <div
              className="cb-tabular"
              style={{ fontSize: 12, textAlign: 'center', fontWeight: 600 }}
            >
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LinePerformanceChart({
  data,
  target,
}: {
  data: { label: string; value: number }[];
  target: number;
}) {
  const width = 720;
  const height = 240;
  const left = 34;
  const right = 14;
  const top = 12;
  const bottom = 28;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  if (data.length === 0) {
    return <p className="cb-muted" style={{ margin: 0, fontSize: 14 }}>Aucune donnée.</p>;
  }
  const max = Math.max(100, ...data.map((d) => d.value));
  const min = 0;
  const x = (i: number) => left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => top + (1 - (v - min) / (max - min || 1)) * innerH;
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(' ');
  const targetY = y(target);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line
        x1={left}
        y1={targetY}
        x2={width - right}
        y2={targetY}
        stroke="var(--cb-positive)"
        strokeDasharray="4 4"
      />
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={left} y1={y(tick)} x2={width - right} y2={y(tick)} stroke="var(--cb-line-2)" />
          <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="var(--cb-ink-4)">
            {tick}
          </text>
        </g>
      ))}
      <path d={linePath} fill="none" stroke="var(--cb-accent)" strokeWidth="2.5" />
      {data.map((d, i) => (
        <g key={`${d.label}-${i}`}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--cb-accent)" />
          <text x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--cb-ink-4)">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StackBars({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((item) => {
        const ratio = Math.round((item.value / total) * 100);
        return (
          <div key={item.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span className="cb-muted">{item.label}</span>
              <span className="cb-tabular" style={{ fontWeight: 600 }}>
                {item.value} ({ratio}%)
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'var(--cb-bg-sunken)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(6, ratio)}%`,
                  height: '100%',
                  background: 'var(--cb-accent)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cb-card" style={{ padding: 16 }}>
      <div className="cb-section-title" style={{ marginBottom: 2 }}>
        {title}
      </div>
      <p className="cb-faint" style={{ margin: 0, fontSize: 12 }}>
        {subtitle}
      </p>
      {empty ? (
        <p className="cb-muted" style={{ marginTop: 14, fontSize: 14 }}>
          Pas assez de données pour afficher ce graphique.
        </p>
      ) : (
        <div style={{ marginTop: 14 }}>{children}</div>
      )}
    </div>
  );
}
