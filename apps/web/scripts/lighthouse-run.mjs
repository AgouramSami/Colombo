#!/usr/bin/env node
/**
 * Audits Lighthouse (desktop) sur des URLs publiques — sans session.
 * Les pages app authentifiées (/dashboard, etc.) sont déjà couvertes par `pnpm test:perf`.
 *
 * Prérequis : serveur sur LIGHTHOUSE_BASE_URL (défaut http://127.0.0.1:3005).
 *   — local : `pnpm dev` puis `pnpm lighthouse`
 *   — CI : `pnpm lighthouse:ci` (build + démarrage Next puis audits).
 *
 * Sorties : apps/web/.lighthouse/<route>.html|.json
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse, { desktopConfig, generateReport } from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(WEB_ROOT, '.lighthouse');

const BASE = process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:3005';

/** Budget max par URL (Lighthouse peut attendre indéfiniment si rien ne répond sur le port). */
const AUDIT_BUDGET_MS = Number.parseInt(process.env.LIGHTHOUSE_BUDGET_MS ?? '120000', 10);

/** Routes sans auth utiles pour Lighthouse */
const PATHS = ['/login', '/signup'];

function slugFromPath(p) {
  if (p === '/' || p === '') return 'home';
  return p.replace(/^\//, '').replace(/\//g, '-') || 'home';
}

async function waitForHttpOk(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status < 500) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Serveur injoignable (${timeoutMs} ms) : ${url}`);
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function runLighthouseOne(fullUrl, label) {
  const chrome = await launchChrome({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    console.log(`[lighthouse] Audit (${label}) …`);
    const runnerResult = await withTimeout(
      lighthouse(
        fullUrl,
        {
          port: chrome.port,
          logLevel: 'error',
        },
        desktopConfig,
      ),
      AUDIT_BUDGET_MS,
      `Lighthouse > ${AUDIT_BUDGET_MS} ms pour ${fullUrl} — serveur arrêté ou page bloquée ?`,
    );
    if (!runnerResult) {
      throw new Error(`Lighthouse n'a pas retourné de résultat pour ${fullUrl}`);
    }

    const { lhr } = runnerResult;
    const html = generateReport(lhr, 'html');
    const json = JSON.stringify(lhr, null, 2);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, `${label}.html`), html);
    fs.writeFileSync(path.join(OUT_DIR, `${label}.json`), json);

    const categories = lhr.categories;
    const line = Object.entries(categories)
      .filter(([, c]) => c?.score != null)
      .map(([id, c]) => `${id}:${Math.round((c.score ?? 0) * 100)}`)
      .join(' ');
    console.log(`[lighthouse] ${fullUrl} → .lighthouse/${label}.html (${line})`);
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

function startProductionServer() {
  return spawn('pnpm', ['exec', 'next', 'start', '-p', '3005'], {
    cwd: WEB_ROOT,
    env: { ...process.env, PORT: '3005' },
    stdio: 'inherit',
    shell: false,
  });
}

async function main() {
  const useCi = process.argv.includes('--ci');
  let serverProc = null;

  console.log(
    `[lighthouse] Base ${BASE} · budget audit ${AUDIT_BUDGET_MS} ms` +
      (useCi ? ' · mode CI (next start lancé par ce script)' : ' · démarre le serveur sur le port 3005 (pnpm dev)'),
  );

  if (useCi) {
    serverProc = startProductionServer();
    await waitForHttpOk(`${BASE}/login`);
  } else {
    await waitForHttpOk(`${BASE}/login`, 15_000).catch(() => {
      throw new Error(
        `Démarre le serveur sur ${BASE} (ex. pnpm dev), ou lance pnpm lighthouse:ci après un build.`,
      );
    });
  }

  try {
    for (const p of PATHS) {
      const label = slugFromPath(p);
      await runLighthouseOne(new URL(p, BASE).href, label);
    }
    console.log(`\nRapports HTML : ${OUT_DIR}`);
  } finally {
    if (serverProc) {
      serverProc.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 2000));
      if (!serverProc.killed) {
        serverProc.kill('SIGKILL');
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
