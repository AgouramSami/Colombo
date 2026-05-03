import type { Page } from '@playwright/test';

/** Métriques issues de PerformanceNavigationTiming + paint (FCP). */
export type PagePerfMetrics = {
  /** ms depuis fetch jusqu’à réponse serveur (approx. TTFB côté navigation) */
  responseMs: number;
  domInteractiveMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
  /** First Contentful Paint (ms depuis time origin), si disponible */
  fcpMs: number | null;
};

export async function collectPagePerfMetrics(page: Page): Promise<PagePerfMetrics | null> {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return null;

    const paints = performance.getEntriesByType('paint');
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');

    return {
      responseMs: Math.round(nav.responseEnd - nav.fetchStart),
      domInteractiveMs: Math.round(nav.domInteractive - nav.fetchStart),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
      loadEventMs: Math.round(nav.loadEventEnd - nav.fetchStart),
      fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
    };
  });
}
