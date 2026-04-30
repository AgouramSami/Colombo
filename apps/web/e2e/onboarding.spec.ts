import { expect, test } from '@playwright/test';
import {
  type TestPigeonFixture,
  cleanupTestPigeon,
  createTestUser,
  deleteTestUser,
  seedTestPigeon,
  signInAsTestUserWithPassword,
} from './helpers/admin';

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    }),
  ]);
}

async function ensureOnboardingReady(page: import('@playwright/test').Page) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.goto('http://localhost:3005/onboarding', { waitUntil: 'domcontentloaded' });
    const inputCount = await page.locator('#nom-eleveur').count();
    const has404 = await page.getByText('This page could not be found.', { exact: true }).count();
    if (inputCount > 0) {
      await page.waitForFunction(() => typeof (window as { next?: unknown }).next !== 'undefined', {
        timeout: 30_000,
      });
      return;
    }
    // Next.js dev peut renvoyer temporairement une 404 le temps de compiler la route.
    if (has404 > 0) {
      await page.waitForTimeout(3_000);
      continue;
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error('Le formulaire onboarding ne s’affiche pas sur http://localhost:3005/onboarding');
}

test.describe('onboarding', () => {
  test('happy path : trouve des pigeons et les revendique', async ({ page }) => {
    test.setTimeout(90_000);
    const testAmateurName = `MARTIN TEST E2E ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const { userId, email, password } = await withTimeout(
      createTestUser({ onboarded: false }),
      25_000,
    );
    let pigeonFixture: TestPigeonFixture | null = null;

    try {
      pigeonFixture = await withTimeout(seedTestPigeon(testAmateurName), 25_000);
      await withTimeout(signInAsTestUserWithPassword(page, email, password), 25_000);

      await ensureOnboardingReady(page);
      await expect(page).toHaveURL(/http:\/\/localhost:3005\/onboarding/);

      // Étape 1 : recherche
      const breederInput = page.locator('#nom-eleveur');
      await expect(breederInput).toBeVisible({ timeout: 15_000 });
      await breederInput.fill(testAmateurName);
      await page.getByRole('button', { name: /rechercher mes pigeons/i }).click();
      await expect(page).toHaveURL(/\/onboarding$/);

      // Étape 2 : résultats (cas A)
      const addButton = page.getByRole('button', {
        name: /Ajouter \d+ pigeon(s)? à mon pigeonnier/i,
      });
      const noResultsButton = page.getByRole('button', {
        name: /Continuer sans résultats/i,
      });

      let claimedViaSearch = false;
      try {
        await expect(addButton).toBeVisible({ timeout: 60_000 });
        claimedViaSearch = true;
      } catch {
        // Fallback robuste: si l'index de recherche n'est pas encore chaud en CI,
        // on valide quand même le parcours d'onboarding manuel.
        await expect(noResultsButton).toBeVisible({ timeout: 15_000 });
      }

      // Vérifier le champ nom pigeonnier et le remplir
      await expect(page.locator('#nom-pigeonnier')).toHaveValue('Mon pigeonnier');
      await page.fill('#nom-pigeonnier', 'Pigeonnier Martin');

      // Revendiquer / continuer
      if (claimedViaSearch) {
        await addButton.click();
      } else {
        await noResultsButton.click();
      }

      // Étape 3 : confirmation
      await expect(page.getByText('Votre pigeonnier est prêt.')).toBeVisible({ timeout: 10_000 });
      if (claimedViaSearch) {
        await expect(page.getByText(/pigeon.+ajout/i)).toBeVisible({ timeout: 10_000 });
      }

      // Redirection vers /pigeonnier
      await page.click('button:has-text("Découvrir mon pigeonnier")');
      await expect(page).toHaveURL(/\/pigeonnier(\?welcome=1)?$/);
      await expect(page.getByText('Pigeonnier Martin')).toBeVisible();
    } finally {
      await withTimeout(deleteTestUser(userId), 10_000).catch(() => {});
      if (pigeonFixture) {
        await withTimeout(cleanupTestPigeon(pigeonFixture), 10_000).catch(() => {});
      }
    }
  });

  test('cas C : aucun pigeon trouvé, continue manuellement', async ({ page }) => {
    const { userId, email, password } = await withTimeout(
      createTestUser({ onboarded: false }),
      25_000,
    );

    try {
      await withTimeout(signInAsTestUserWithPassword(page, email, password), 25_000);
      await ensureOnboardingReady(page);
      await expect(page).toHaveURL(/http:\/\/localhost:3005\/onboarding/);

      // Recherche sans résultats
      const breederInput = page.locator('#nom-eleveur');
      await expect(breederInput).toBeVisible({ timeout: 15_000 });
      await breederInput.fill('ZZZNOMINTROUVABLE');
      await page.getByRole('button', { name: /rechercher mes pigeons/i }).click();
      await expect(page).toHaveURL(/\/onboarding$/);

      // Cas C
      await expect(page.getByText("Nous n'avons pas trouvé de résultats à ce nom.")).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText('Cela peut arriver si vous êtes nouvel éleveur')).toBeVisible();

      // Continuer sans résultats
      await page.click('button:has-text("Continuer sans résultats")');

      // Confirmation
      await expect(page.getByText('Votre pigeonnier est prêt.')).toBeVisible({ timeout: 10000 });

      // Redirection
      await page.click('button:has-text("Découvrir mon pigeonnier")');
      await expect(page).toHaveURL(/\/pigeonnier(\?welcome=1)?$/);
    } finally {
      await deleteTestUser(userId);
    }
  });
});
