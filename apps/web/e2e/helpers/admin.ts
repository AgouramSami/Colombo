import type { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour les tests E2E',
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(options: { onboarded?: boolean } = {}) {
  const admin = adminClient();
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@colombo-test.invalid`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Impossible de créer l'utilisateur de test : ${error?.message}`);
  }

  if (options.onboarded) {
    await admin
      .from('users')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return { userId: data.user.id, email };
}

export async function deleteTestUser(userId: string) {
  const admin = adminClient();
  // La suppression du user cascade sur lofts → pigeons.loft_id = null
  await admin.auth.admin.deleteUser(userId);
}

export async function signInAsTestUser(page: Page, email: string) {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3005'}/auth/callback`,
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(`Impossible de générer le magic link : ${error?.message}`);
  }

  await page.goto(data.properties.action_link);
  // Le callback échange le code → /dashboard → middleware → /onboarding ou /pigeonnier
  await page.waitForURL(/\/(onboarding|pigeonnier|dashboard)/, { timeout: 15000 });
}

export type TestPigeonFixture = {
  clubId: string;
  raceId: string;
  pigeonMatricule: string;
};

export async function seedTestPigeon(amateurName: string): Promise<TestPigeonFixture> {
  const admin = adminClient();

  const { data: regions } = await admin.from('regions').select('id').limit(1);
  const regionId = regions?.[0]?.id;
  if (!regionId) throw new Error('Aucune région en base — le seed initial a-t-il été appliqué ?');

  const { data: club, error: clubErr } = await admin
    .from('clubs')
    .insert({ region_id: regionId, name: 'Club E2E Test', type: 'société' })
    .select('id')
    .single();
  if (clubErr || !club) throw new Error(`Création club : ${clubErr?.message}`);

  const { data: race, error: raceErr } = await admin
    .from('races')
    .insert({
      club_id: club.id,
      race_date: '2025-04-01',
      release_point: 'Point de lâcher test',
      category: 'vitesse',
      age_class: 'vieux',
    })
    .select('id')
    .single();
  if (raceErr || !race) throw new Error(`Création concours : ${raceErr?.message}`);

  const suffix = Date.now().toString().slice(-5);
  const matricule = `FR-TE${suffix}-25`;

  const { error: pigeonErr } = await admin.from('pigeons').insert({
    matricule,
    country_iso: 'FR',
    year_of_birth: 2025,
    is_female: false,
  });
  if (pigeonErr) throw new Error(`Création pigeon : ${pigeonErr.message}`);

  const { error: resultErr } = await admin.from('pigeon_results').insert({
    race_id: race.id,
    pigeon_matricule: matricule,
    amateur_display_name: amateurName,
    place: 1,
    clocked_at_time: '09:30:00',
    velocity_m_per_min: '1250.000',
  });
  if (resultErr) throw new Error(`Création résultat : ${resultErr.message}`);

  return { clubId: club.id, raceId: race.id, pigeonMatricule: matricule };
}

export async function cleanupTestPigeon(fixture: TestPigeonFixture) {
  const admin = adminClient();
  // races → cascade pigeon_results
  await admin.from('races').delete().eq('id', fixture.raceId);
  await admin.from('clubs').delete().eq('id', fixture.clubId);
  // pigeon_results supprimés par cascade, pigeon.loft_id = null si revendiqué
  await admin.from('pigeons').delete().eq('matricule', fixture.pigeonMatricule);
}
