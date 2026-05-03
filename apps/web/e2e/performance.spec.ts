import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, signInAsTestUser } from './helpers/admin';
import { collectPagePerfMetrics } from './helpers/perf';

/**
 * Mesure les temps de chargement document (Navigation Timing + FCP) sur les routes app.
 * En local avec `pnpm dev`, les seuils sont volontairement larges ; en CI (`next build` + start), plus stricts.
 */
test.describe('performance — chargement des pages', () => {
  test('routes principales (utilisateur onboardé)', async ({ page }) => {
    test.setTimeout(180_000);

    const maxLoadMs = process.env.CI ? 15_000 : 45_000;
    const maxDomInteractiveMs = process.env.CI ? 12_000 : 40_000;

    const { userId, email } = await createTestUser({ onboarded: true });

    try {
      await signInAsTestUser(page, email);
      await expect(page).toHaveURL(/\/dashboard/);

      const routes: { path: string; label: string; ready: () => Promise<void> }[] = [
        {
          path: '/dashboard',
          label: 'dashboard',
          ready: async () => {
            await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible({
              timeout: 30_000,
            });
          },
        },
        {
          path: '/performance',
          label: 'performance',
          ready: async () => {
            await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible({
              timeout: 30_000,
            });
          },
        },
        {
          path: '/pigeonnier',
          label: 'pigeonnier',
          ready: async () => {
            await expect(page.getByText('Pigeonnier', { exact: true }).first()).toBeVisible({
              timeout: 30_000,
            });
          },
        },
        {
          path: '/concours',
          label: 'concours',
          ready: async () => {
            await expect(page.getByRole('heading', { name: 'Concours' })).toBeVisible({
              timeout: 30_000,
            });
          },
        },
        {
          path: '/reglages',
          label: 'reglages',
          ready: async () => {
            await expect(page).toHaveURL(/\/reglages/);
            await expect(page.locator('h1.cb-display').first()).toBeVisible({ timeout: 30_000 });
          },
        },
      ];

      const summary: Record<
        string,
        {
          responseMs: number;
          domInteractiveMs: number;
          domContentLoadedMs: number;
          loadEventMs: number;
          fcpMs: number | null;
        }
      > = {};

      for (const route of routes) {
        await test.step(`/${route.label}`, async () => {
          await page.goto(route.path, { waitUntil: 'load', timeout: 90_000 });
          const metrics = await collectPagePerfMetrics(page);
          expect(metrics, `pas de PerformanceNavigationTiming pour ${route.path}`).not.toBeNull();

          await route.ready();

          const m = metrics!;
          summary[route.label] = m;

          test.info().annotations.push({
            type: 'perf',
            description: `${route.label}: load=${m.loadEventMs}ms domInteractive=${m.domInteractiveMs}ms fcp=${m.fcpMs ?? 'n/a'}ms`,
          });

          expect(m.loadEventMs, `load trop lent pour ${route.path}`).toBeLessThan(maxLoadMs);
          expect(m.domInteractiveMs, `DOM interactive trop lent pour ${route.path}`).toBeLessThan(
            maxDomInteractiveMs,
          );

          // Journal Playwright (visible avec `playwright test --reporter=list`)
          console.log(
            `[perf] ${route.path} load=${m.loadEventMs}ms domContentLoaded=${m.domContentLoadedMs}ms fcp=${m.fcpMs ?? 'n/a'}ms`,
          );
        });
      }

      test.info().attach('perf-summary.json', {
        body: Buffer.from(JSON.stringify(summary, null, 2)),
        contentType: 'application/json',
      });
    } finally {
      await deleteTestUser(userId);
    }
  });
});
