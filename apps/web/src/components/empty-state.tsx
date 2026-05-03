import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  size?: 'compact' | 'default';
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'default',
}: EmptyStateProps) {
  const containerClass =
    size === 'compact' ? 'cb-empty-state cb-empty-state--compact' : 'cb-empty-state';

  return (
    <div className={containerClass}>
      {icon && <div className="cb-empty-state__icon">{icon}</div>}
      <div className="cb-empty-state__title">{title}</div>
      {description && <p className="cb-empty-state__description">{description}</p>}
      {action &&
        (action.href ? (
          <a href={action.href} className="cb-btn cb-btn--soft" style={{ marginTop: 4 }}>
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="cb-btn cb-btn--soft"
            style={{ marginTop: 4 }}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
