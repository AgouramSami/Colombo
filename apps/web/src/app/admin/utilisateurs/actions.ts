'use server';

import { requireAdmin } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  display_name: z.string().max(100).optional(),
  plan: z.enum(['free', 'eleveur', 'club']).optional(),
  is_admin: z.boolean().optional(),
});

export async function adminUpdateUserAction(
  userId: string,
  raw: { display_name?: string; plan?: string; is_admin?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = UpdateUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Données invalides' };

  const db = createServiceClient();
  const { error } = await db.from('users').update(parsed.data).eq('id', userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/utilisateurs');
  return { ok: true };
}

export async function adminDeleteUserAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = createServiceClient();

  // Libérer les pigeons avant suppression (loft cascade delete → pigeons loft_id = NULL)
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/utilisateurs');
  return { ok: true };
}
