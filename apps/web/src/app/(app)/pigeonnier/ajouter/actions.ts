'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const AddPigeonSchema = z.object({
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  ring_number: z.string().min(4).max(7).regex(/^\d+$/),
  year: z
    .string()
    .length(2)
    .regex(/^\d{2}$/),
  sex: z.enum(['M', 'F']),
  name: z.string().max(80).optional(),
  color: z.string().max(40).optional(),
  father_matricule: z.string().max(20).optional(),
  mother_matricule: z.string().max(20).optional(),
});

export async function addPigeonAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const parsed = AddPigeonSchema.safeParse({
    country: (formData.get('country') as string)?.toUpperCase(),
    ring_number: formData.get('ring_number'),
    year: formData.get('year'),
    sex: formData.get('sex'),
    name: (formData.get('name') as string) || undefined,
    color: (formData.get('color') as string) || undefined,
    father_matricule: (formData.get('father_matricule') as string) || undefined,
    mother_matricule: (formData.get('mother_matricule') as string) || undefined,
  });

  if (!parsed.success) {
    redirect('/pigeonnier/ajouter?error=invalide');
  }

  const { country, ring_number, year, sex, name, color, father_matricule, mother_matricule } =
    parsed.data;

  const matricule = `${country}-${ring_number}-${year}${sex === 'F' ? '-F' : ''}`;
  const yearNum = Number.parseInt(year, 10);
  const year_of_birth = yearNum <= 29 ? 2000 + yearNum : 1900 + yearNum;
  const is_female = sex === 'F';

  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null).limit(1);

  const loft_id = lofts?.[0]?.id;
  if (!loft_id) redirect('/pigeonnier/ajouter?error=no_loft');

  const { error } = await supabase.from('pigeons').insert({
    matricule,
    loft_id,
    country_iso: country,
    year_of_birth,
    is_female,
    name: name ?? null,
    color: color ?? null,
    father_matricule: father_matricule ?? null,
    mother_matricule: mother_matricule ?? null,
  });

  if (error) {
    if (error.code === '23505') {
      redirect('/pigeonnier/ajouter?error=doublon');
    }
    redirect('/pigeonnier/ajouter?error=serveur');
  }

  redirect(`/pigeonnier/${matricule}?added=1`);
}
