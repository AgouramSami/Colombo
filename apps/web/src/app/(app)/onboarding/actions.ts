'use server';

import { type PigeonSearchResult, PigeonSearchResultSchema } from '@/lib/supabase/rpc';
import { createClient } from '@/lib/supabase/server';

type SearchPigeonsResult =
  | { ok: true; results: PigeonSearchResult[] }
  | { ok: false; error: string };

export async function searchPigeonsAction(name: string): Promise<SearchPigeonsResult> {
  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { ok: false, error: 'Continuez à taper...' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('find_pigeons_by_amateur_name', {
    search: trimmed,
  });

  if (error) {
    return {
      ok: false,
      error: "Nous n'avons pas pu lancer la recherche. Vérifiez votre connexion et réessayez.",
    };
  }

  const parsed = PigeonSearchResultSchema.array().safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Nous n'avons pas pu lancer la recherche. Vérifiez votre connexion et réessayez.",
    };
  }

  return { ok: true, results: parsed.data };
}

type ClaimPigeonsResult =
  | { ok: true; claimed: number; skipped: number }
  | { ok: false; error: string };

export async function claimPigeonsAction(
  matricules: string[],
  loftName: string,
): Promise<ClaimPigeonsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Votre session a expiré. Veuillez vous reconnecter.' };
  }

  const { data: loft, error: loftError } = await supabase
    .from('lofts')
    .insert({ user_id: user.id, name: loftName })
    .select('id')
    .single();

  if (loftError || !loft) {
    return { ok: false, error: "Nous n'avons pas pu créer votre pigeonnier. Réessayez." };
  }

  let claimed = 0;
  if (matricules.length > 0) {
    const { data: claimedPigeons } = await supabase.rpc('claim_orphan_pigeons', {
      target_matricules: matricules,
      target_loft_id: loft.id,
    });
    claimed = claimedPigeons?.length ?? 0;
  }

  await supabase.from('users').update({ onboarded_at: new Date().toISOString() }).eq('id', user.id);

  return { ok: true, claimed, skipped: matricules.length - claimed };
}
