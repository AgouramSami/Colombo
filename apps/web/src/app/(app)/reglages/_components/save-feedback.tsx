import { CheckIcon } from './icons';

export function SaveFeedback({ ok, error }: { ok: boolean; error?: string }) {
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
