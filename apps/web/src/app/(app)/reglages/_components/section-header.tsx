import Link from 'next/link';
import { ArrowLeftIcon } from './icons';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Link
        href="/reglages"
        className="cb-faint"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          textDecoration: 'none',
          marginBottom: 12,
        }}
      >
        <ArrowLeftIcon /> Profil
      </Link>
      <h1 className="cb-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: 0 }}>
        {title}
      </h1>
      {subtitle && (
        <p className="cb-faint" style={{ marginTop: 6, fontSize: 14 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
