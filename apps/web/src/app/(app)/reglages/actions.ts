'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  display_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export async function updateUserAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const parsed = UpdateUserSchema.safeParse({
    display_name: (formData.get('display_name') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
  });

  if (!parsed.success) return { ok: false as const, error: 'Données invalides' };

  const { error } = await supabase.from('users').update(parsed.data).eq('id', user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/reglages');
  return { ok: true as const };
}

const UpdateLoftSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  licence_number: z.string().max(30).optional(),
});

export async function updateLoftAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const parsed = UpdateLoftSchema.safeParse({
    name: formData.get('name'),
    address: (formData.get('address') as string) || undefined,
    licence_number: (formData.get('licence_number') as string) || undefined,
  });

  if (!parsed.success) return { ok: false as const, error: 'Données invalides' };

  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null).limit(1);

  const loftId = lofts?.[0]?.id;
  if (!loftId) return { ok: false as const, error: 'Pigeonnier introuvable' };

  const { error } = await supabase.from('lofts').update(parsed.data).eq('id', loftId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/reglages');
  revalidatePath('/pigeonnier');
  return { ok: true as const };
}

export async function addPigeonsAction(
  matricules: string[],
  nameVariants: string[],
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non autorisé' };

  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null).limit(1);
  const loftId = lofts?.[0]?.id;
  if (!loftId) return { ok: false, error: 'Pigeonnier introuvable' };

  let added = 0;
  if (matricules.length > 0) {
    const { data } = await supabase.rpc('claim_orphan_pigeons', {
      target_matricules: matricules,
      target_loft_id: loftId,
    });
    added = data?.length ?? 0;
  }

  if (nameVariants.length > 0) {
    await supabase.from('users').update({ name_variants: nameVariants }).eq('id', user.id);
  }

  revalidatePath('/pigeonnier');
  revalidatePath('/reglages');
  return { ok: true, added };
}
