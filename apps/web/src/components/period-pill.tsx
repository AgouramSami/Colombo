import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Href = ComponentProps<typeof Link>['href'];

export function PeriodPill({
  href,
  active,
  children,
}: {
  href: Href;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="cb-chip" data-active={active}>
      {children}
    </Link>
  );
}
