/**
 * Lightweight perf timing — affiche dans le terminal `pnpm dev` et en prod (Vercel logs).
 * Aucun overhead notable : performance.now() coute < 0.01ms.
 *
 * Usage:
 *   const result = await time('dashboard.loadData', () => loadDashboardData(...));
 *
 * Output:
 *   [perf] dashboard.loadData: 942ms
 *   [perf] dashboard.loadData.users: 87ms
 *   [perf] dashboard.loadData.pigeon_results (chunk 0): 412ms
 *
 * Désactiver via env: COLOMBO_PERF=0
 */

const ENABLED = process.env.COLOMBO_PERF !== '0';

function emit(label: string, ms: number, failed = false) {
  if (!ENABLED) return;
  const tag = failed ? 'FAIL' : ms > 500 ? 'SLOW' : ms > 200 ? 'WARN' : 'ok';
  // biome-ignore lint/suspicious/noConsoleLog: instrumentation perf voulue
  console.log(`[perf:${tag}] ${label}: ${ms.toFixed(0)}ms`);
}

/**
 * Detecte les controls flow Next.js (redirect, notFound) qui throws.
 * Ces erreurs ne sont pas de vrais echecs — c'est ainsi que Next.js
 * abort le rendu et redirige.
 */
function isNextControlFlow(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const digest = (e as Error & { digest?: unknown }).digest;
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND')
  );
}

export async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!ENABLED) return fn();
  const start = performance.now();
  try {
    const result = await fn();
    emit(label, performance.now() - start);
    return result;
  } catch (e) {
    if (!isNextControlFlow(e)) {
      emit(label, performance.now() - start, true);
    }
    throw e;
  }
}

export function timeSync<T>(label: string, fn: () => T): T {
  if (!ENABLED) return fn();
  const start = performance.now();
  try {
    const result = fn();
    emit(label, performance.now() - start);
    return result;
  } catch (e) {
    if (!isNextControlFlow(e)) {
      emit(label, performance.now() - start, true);
    }
    throw e;
  }
}
