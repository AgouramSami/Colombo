import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, signInAsTestUser } from './helpers/admin';

test.describe('middleware : redirections selon onboarding', () => {
  test('utilisateur non onboardé est redirigé vers /onboarding', async ({ page }) => {
    const { userId, email } = await createTestUser({ onboarded: false });

    try {
      await signInAsTestUser(page, email);

      // Après connexion, le middleware redirige vers /onboarding
      await expect(page).toHaveURL('/onboarding');

      // Tenter d'accéder à /dashboard repart vers /onboarding
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/onboarding');
    } finally {
      await deleteTestUser(userId);
    }
  });

  test('utilisateur onboardé ne peut plus accéder à /onboarding', async ({ page }) => {
    const { userId, email } = await createTestUser({ onboarded: true });

    try {
      await signInAsTestUser(page, email);

      // Après connexion, le middleware laisse passer vers /dashboard
      await expect(page).toHaveURL('/dashboard');

      // Tenter /onboarding → redirigé vers /pigeonnier
      await page.goto('/onboarding');
      await expect(page).toHaveURL('/pigeonnier');
    } finally {
      await deleteTestUser(userId);
    }
  });
});
