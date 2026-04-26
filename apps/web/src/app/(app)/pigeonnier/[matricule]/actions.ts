'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdatePigeonSchema = z.object({
  name: z.string().max(80).nullable(),
  color: z.string().max(40).nullable(),
  father_matricule: z.string().max(20).nullable(),
  mother_matricule: z.string().max(20).nullable(),
});

export async function updatePigeonAction(matricule: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const raw = {
    name: (formData.get('name') as string | null) || null,
    color: (formData.get('color') as string | null) || null,
    father_matricule: (formData.get('father_matricule') as string | null) || null,
    mother_matricule: (formData.get('mother_matricule') as string | null) || null,
  };

  const parsed = UpdatePigeonSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: 'Données invalides' };

  const { error } = await supabase.from('pigeons').update(parsed.data).eq('matricule', matricule);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/pigeonnier/${matricule}`);
  return { ok: true as const };
}

const AddTrainingSchema = z.object({
  training_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  release_point: z.string().max(100).optional(),
  distance_km: z.coerce.number().int().positive().optional(),
  return_time: z.string().optional(),
  weather: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export async function addTrainingAction(matricule: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const parsed = AddTrainingSchema.safeParse({
    training_date: formData.get('training_date'),
    release_point: (formData.get('release_point') as string) || undefined,
    distance_km: (formData.get('distance_km') as string) || undefined,
    return_time: (formData.get('return_time') as string) || undefined,
    weather: (formData.get('weather') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  });

  if (!parsed.success) return { ok: false as const, error: 'Données invalides' };

  const { error } = await supabase.from('trainings').insert({
    ...parsed.data,
    pigeon_matricule: matricule,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/pigeonnier/${matricule}`);
  return { ok: true as const };
}

export async function deleteTrainingAction(matricule: string, trainingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', trainingId)
    .eq('pigeon_matricule', matricule);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/pigeonnier/${matricule}`);
  return { ok: true as const };
}

export async function addNoteAction(matricule: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const bodyResult = z.string().min(1).max(2000).safeParse(formData.get('body'));
  if (!bodyResult.success) return { ok: false as const, error: 'Note vide ou trop longue' };

  const { error } = await supabase
    .from('pigeon_notes')
    .insert({ pigeon_matricule: matricule, body: bodyResult.data });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/pigeonnier/${matricule}`);
  return { ok: true as const };
}

export async function deleteNoteAction(matricule: string, noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Non autorisé' };

  const { error } = await supabase
    .from('pigeon_notes')
    .delete()
    .eq('id', noteId)
    .eq('pigeon_matricule', matricule);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/pigeonnier/${matricule}`);
  return { ok: true as const };
}
