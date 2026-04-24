import { expect, test } from '@playwright/test';
import {
  cleanupTestPigeon,
  createTestUser,
  deleteTestUser,
  seedTestPigeon,
  signInAsTestUser,
  type TestPigeonFixture,
} from './helpers/admin';

const TEST_AMATEUR_NAME = 'MARTIN TEST E2E';

test.describe('onboarding', () => {
  test('happy path : trouve des pigeons et les revendique', async ({ page }) => {
    const { userId, email } = await createTestUser({ onboarded: false });
    let pigeonFixture: TestPigeonFixture | null = null;

    try {
      pigeonFixture = await seedTestPigeon(TEST_AMATEUR_NAME);
      await signInAsTestUser(page, email);

      await expect(page).toHaveURL('/onboarding');

      // Étape 1 : recherche
      await page.fill('#nom-eleveur', TEST_AMATEUR_NAME);
      await page.click('button[type="submit"]');

      // Étape 2 : résultats (cas A)
      await expect(page.getByText('Nous avons retrouvé')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('1 concours')).toBeVisible();

      // Vérifier le champ nom pigeonnier et le remplir
      await expect(page.locator('#nom-pigeonnier')).toHaveValue('Mon pigeonnier');
      await page.fill('#nom-pigeonnier', 'Pigeonnier Martin');

      // Revendiquer
      await page.click('button:has-text("Ajouter 1 pigeon")');

      // Étape 3 : confirmation
      await expect(page.getByText('Votre pigeonnier est prêt.')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('1 pigeon a été ajouté')).toBeVisible();

      // Redirection vers /pigeonnier
      await page.click('button:has-text("Découvrir mon pigeonnier")');
      await expect(page).toHaveURL('/pigeonnier');
      await expect(page.getByText('Pigeonnier Martin')).toBeVisible();
    } finally {
      await deleteTestUser(userId);
      if (pigeonFixture) await cleanupTestPigeon(pigeonFixture);
    }
  });

  test('cas C : aucun pigeon trouvé, continue manuellement', async ({ page }) => {
    const { userId, email } = await createTestUser({ onboarded: false });

    try {
      await signInAsTestUser(page, email);
      await expect(page).toHaveURL('/onboarding');

      // Recherche sans résultats
      await page.fill('#nom-eleveur', 'ZZZNOMINTROUVABLE');
      await page.click('button[type="submit"]');

      // Cas C
      await expect(
        page.getByText("Nous n'avons pas trouvé de résultats à ce nom."),
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByText('Cela peut arriver si vous êtes nouvel éleveur'),
      ).toBeVisible();

      // Continuer sans résultats
      await page.click('button:has-text("Continuer sans résultats")');

      // Confirmation
      await expect(page.getByText('Votre pigeonnier est prêt.')).toBeVisible({ timeout: 10000 });

      // Redirection
      await page.click('button:has-text("Découvrir mon pigeonnier")');
      await expect(page).toHaveURL('/pigeonnier');
    } finally {
      await deleteTestUser(userId);
    }
  });
});
