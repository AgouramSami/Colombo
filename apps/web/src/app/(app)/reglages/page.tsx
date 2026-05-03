import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ChevronRightIcon,
  HomeIcon,
  SearchIcon,
  StarIcon,
  SyncIcon,
  UserIcon,
} from './_components/icons';
import { ProfileHero } from './_components/profile-hero';
import type { UserData } from './types';

export type { UserData, LoftData, ProfileStats } from './types';

const MENU_ITEMS = [
  {
    href: '/reglages/compte',
    icon: <UserIcon />,
    label: 'Mon compte',
    description: 'Nom, e-mail, téléphone, déconnexion',
  },
  {
    href: '/reglages/abonnement',
    icon: <StarIcon />,
    label: 'Abonnement',
    description: 'Formule actuelle, facturation',
  },
  {
    href: '/reglages/pigeonnier',
    icon: <HomeIcon />,
    label: 'Mon pigeonnier',
    description: 'Lofts, licences, gestion',
  },
  {
    href: '/reglages/mes-pigeons',
    icon: <SearchIcon />,
    label: 'Retrouver mes pigeons',
    description: 'Variantes de nom pour l’import',
  },
  {
    href: '/reglages/federation',
    icon: <SyncIcon />,
    label: 'Fédération',
    description: 'Sources de données, Francolomb',
  },
] as const;

export default async function ReglagesIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, loftRes] = await Promise.all([
    supabase
      .from('users')
      .select('email, display_name, phone, plan, created_at')
      .eq('id', user.id)
      .single(),
    supabase.from('lofts').select('id').is('deleted_at', null),
  ]);

  const userData: UserData = userRes.data ?? {
    email: user.email ?? '',
    display_name: null,
    phone: null,
    plan: 'free',
    created_at: null,
  };

  const loftIds = (loftRes.data ?? []).map((l) => l.id);
  const { count: pigeonCount } = loftIds.length
    ? await supabase
        .from('pigeons')
        .select('matricule', { count: 'exact', head: true })
        .in('loft_id', loftIds)
    : { count: 0 };

  const userName = userData.display_name ?? user.email?.split('@')[0] ?? 'Éleveur';
  const memberSince = userData.created_at
    ? new Date(userData.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <ProfileHero
        userName={userName}
        email={userData.email}
        plan={userData.plan}
        memberSince={memberSince}
        pigeonCount={pigeonCount ?? 0}
        loftCount={loftIds.length}
      />

      <div className="cb-eyebrow" style={{ marginBottom: 12 }}>
        Réglages
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="cb-card"
            style={{
              padding: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textDecoration: 'none',
              color: 'var(--cb-ink)',
              transition:
                'transform var(--cb-dur) var(--cb-ease), border-color var(--cb-dur) var(--cb-ease)',
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--cb-accent-soft)',
                color: 'var(--cb-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '1rem' }}>
                {item.label}
              </span>
              <span className="cb-faint" style={{ display: 'block', fontSize: 13, marginTop: 2 }}>
                {item.description}
              </span>
            </span>
            <span style={{ color: 'var(--cb-ink-4)', flexShrink: 0 }}>
              <ChevronRightIcon />
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .cb-profile-hero {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
            padding: 18px !important;
          }
          .cb-profile-hero h1 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
}
