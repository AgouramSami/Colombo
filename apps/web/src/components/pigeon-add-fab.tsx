import Link from 'next/link';

export function PigeonAddFab() {
  return (
    <Link href="/pigeonnier/ajouter" className="cb-fab-floating" aria-label="Ajouter un pigeon">
      <PlusIcon />
    </Link>
  );
}

function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Ajouter un pigeon</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
