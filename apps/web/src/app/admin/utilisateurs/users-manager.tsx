'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { AdminPagination } from '../admin-pagination';
import { adminDeleteUserAction, adminUpdateUserAction } from './actions';

const PLAN_LABEL: Record<string, string> = { free: 'Gratuit', eleveur: 'Éleveur', club: 'Club' };
const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  free: { bg: '#f1f5f9', color: '#64748b' },
  eleveur: { bg: '#ede9fe', color: '#5b21b6' },
  club: { bg: '#dcfce7', color: '#166534' },
};

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  is_admin: boolean;
  onboarded_at: string | null;
  created_at: string | null;
  pigeon_count: number;
};

function EditModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [plan, setPlan] = useState(user.plan);
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      const res = await adminUpdateUserAction(user.id, {
        display_name: displayName || undefined,
        plan: plan as 'free' | 'eleveur' | 'club',
        is_admin: isAdmin,
      });
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
        aria-label="Fermer la modale"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
      />
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 14,
          padding: 32,
          width: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
          Modifier l&apos;utilisateur
        </h2>
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 13,
            color: '#64748b',
            fontFamily: 'monospace',
            background: '#f8fafc',
            padding: '6px 10px',
            borderRadius: 6,
          }}
        >
          {user.email}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="edit-display-name"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              Nom affiché
            </label>
            <input
              id="edit-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nom de l'éleveur"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="edit-plan"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              Plan
            </label>
            <select
              id="edit-plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                background: '#fff',
              }}
            >
              <option value="free">Gratuit</option>
              <option value="eleveur">Éleveur (9 €/mois)</option>
              <option value="club">Club (29 €/mois)</option>
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '10px 12px',
              background: isAdmin ? '#fef9c3' : '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#f59e0b' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                Accès administrateur
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Accès complet au back-office</div>
            </div>
          </label>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 1,
              height: 40,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              height: 40,
              padding: '0 20px',
              background: '#f1f5f9',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const res = await adminDeleteUserAction(user.id);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
        aria-label="Fermer la modale"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
      />
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 14,
          padding: 32,
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          >
            <title>Supprimer</title>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
          }}
        >
          Supprimer ce compte ?
        </h2>
        <p style={{ margin: '0 0 6px', textAlign: 'center', fontSize: 14, color: '#374151' }}>
          <strong>{user.display_name ?? user.email}</strong>
        </p>
        <p style={{ margin: '0 0 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          {user.pigeon_count} pigeon{user.pigeon_count > 1 ? 's' : ''} seront libérés. Cette action
          est irréversible.
        </p>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            style={{
              flex: 1,
              height: 40,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {isPending ? 'Suppression...' : 'Oui, supprimer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 40,
              padding: '0 20px',
              background: '#f1f5f9',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersManager({
  users,
  total,
  page,
  limit,
  q,
  planFilter,
}: {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
  q: string;
  planFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}` as '/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('q', searchRef.current?.value ?? '');
  }

  const th: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    color: '#94a3b8',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 13,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  };

  return (
    <>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: 0, flex: 1, minWidth: 200, maxWidth: 340 }}
        >
          <input
            ref={searchRef}
            defaultValue={q}
            placeholder="Rechercher par email, nom..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Chercher
          </button>
        </form>

        <select
          value={planFilter}
          onChange={(e) => updateParam('plan', e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="">Tous les plans</option>
          <option value="free">Gratuit</option>
          <option value="eleveur">Éleveur</option>
          <option value="club">Club</option>
        </select>

        {(q || planFilter) && (
          <button
            type="button"
            onClick={() => {
              updateParam('q', '');
              updateParam('plan', '');
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            Réinitialiser ×
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                <th style={th}>Utilisateur</th>
                <th style={th}>Plan</th>
                <th style={th}>Pigeons</th>
                <th style={th}>Onboardé</th>
                <th style={th}>Inscrit le</th>
                <th style={th}>Rôle</th>
                <th style={{ ...th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }}
                  >
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const pc = PLAN_COLOR[u.plan] ??
                    PLAN_COLOR.free ?? { bg: '#f1f5f9', color: '#64748b' };
                  return (
                    <tr key={u.id} className="admin-tr">
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {u.display_name ?? (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sans nom</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                          {u.email}
                        </div>
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: pc.bg,
                            color: pc.color,
                          }}
                        >
                          {PLAN_LABEL[u.plan] ?? u.plan}
                        </span>
                      </td>
                      <td
                        style={{
                          ...td,
                          fontWeight: u.pigeon_count > 0 ? 600 : 400,
                          color: u.pigeon_count > 0 ? '#0f172a' : '#cbd5e1',
                        }}
                      >
                        {u.pigeon_count}
                      </td>
                      <td style={td}>
                        {u.onboarded_at ? (
                          <span style={{ color: '#16a34a', fontSize: 13 }}>✓ Oui</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>Non</span>
                        )}
                      </td>
                      <td style={{ ...td, color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td style={td}>
                        {u.is_admin ? (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#92400e',
                            }}
                          >
                            Admin
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: 12 }}>Éleveur</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            title="Modifier"
                            onClick={() => setEditUser(u)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6366f1',
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <title>Modifier</title>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => setDeleteUser(u)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#dc2626',
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <title>Supprimer</title>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination total={total} page={page} limit={limit} />
        <style>{'.admin-tr:hover td { background: #f8fafc; }'}</style>
      </div>

      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} />}
      {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} />}
    </>
  );
}
