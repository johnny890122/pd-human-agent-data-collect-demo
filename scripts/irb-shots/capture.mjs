// Capture the IRB before/after screenshot set (NFR-7, docs/design.md Phase 40).
// Usage: npm run irb:shots -- --label before|after [--only S01,S11]
// The npm script builds dist/ first, so the screenshots always match the current source.
// To (re)capture the untouched baseline from another checkout, e.g. a git worktree of the
// baseline commit: run `npx vite build` there, then
//   node scripts/irb-shots/capture.mjs --label before --app <worktree dir>
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { chromium } from 'playwright-core';
import { FIXTURE, seedFixture } from './fixture.mjs';
import { APP_SOURCE_PATHS, BASELINE_COMMIT, PACKET_ONLY, SHOTS, VIEWPORTS } from './shots.mjs';
import { turnstileCookieValue } from '../turnstile-cookie.mjs';

// Issued by the server under test (REQ-102.1); works for the old app source too, whose cookie is plain
let turnstileCookie;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.IRB_SHOTS_PORT || 3100);
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = 'irb-shots-admin';
const JWT_SECRET = 'irb-shots-secret';
const RANDOM_SEED = 20261001;
const SHOT_TIMEOUT_MS = 120_000;
const TAILWIND_CDN = /^https:\/\/cdn\.tailwindcss\.com\//;
const TAILWIND_CACHE = path.join(ROOT, 'docs/irb/screenshots/.cache/tailwindcss-cdn.js');

// index.html loads Tailwind from its CDN at runtime. Serving one cached copy keeps a slow CDN
// from stalling a run and pins the same Tailwind build for "before" and "after".
async function loadTailwindRuntime() {
  if (existsSync(TAILWIND_CACHE)) return fs.readFile(TAILWIND_CACHE, 'utf8');
  const response = await fetch('https://cdn.tailwindcss.com', { redirect: 'follow' });
  if (!response.ok) throw new Error(`Could not download the Tailwind runtime: HTTP ${response.status}`);
  const body = await response.text();
  await fs.mkdir(path.dirname(TAILWIND_CACHE), { recursive: true });
  await fs.writeFile(TAILWIND_CACHE, body);
  console.log(`Cached the Tailwind runtime from ${response.url}`);
  return body;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function parseArgs(argv) {
  const args = { label: null, only: null, appDir: ROOT };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--label') args.label = argv[++i];
    else if (argv[i] === '--only') args.only = new Set(argv[++i].split(','));
    else if (argv[i] === '--app') args.appDir = path.resolve(argv[++i]);
  }
  if (!['before', 'after'].includes(args.label)) {
    throw new Error('Usage: node scripts/irb-shots/capture.mjs --label before|after [--only S01,S11] [--app <dir>]');
  }
  return args;
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function appSourceMatchesBaseline(appDir) {
  try {
    execFileSync('git', ['diff', '--quiet', BASELINE_COMMIT, '--', ...APP_SOURCE_PATHS], { cwd: appDir });
  } catch {
    return false;
  }
  // git diff ignores untracked files, e.g. a newly added module
  return git(appDir, 'ls-files', '--others', '--exclude-standard', '--', ...APP_SOURCE_PATHS) === '';
}

async function readPaymentSettings(appDir) {
  const modulePath = path.join(appDir, 'utils/payment.js');
  if (!existsSync(modulePath)) return null;
  const payment = await import(pathToFileURL(modulePath).href);
  return {
    POINT_TO_NTD: payment.POINT_TO_NTD,
    PARTICIPATION_FEE_NTD: payment.PARTICIPATION_FEE_NTD,
    PAYMENT_METHOD_TEXT: payment.PAYMENT_METHOD_TEXT,
    PAYMENT_TIMELINE_TEXT: payment.PAYMENT_TIMELINE_TEXT,
  };
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

// Runs in the page before any app script, on every navigation.
function pageInitScript({ seed, sessionId, submissionId, storedPath, adminToken }) {
  // mulberry32: identical random sequence in every run, so shuffled node positions and the
  // randomized slider start match between "before" and "after"
  const mulberry32 = (initial) => {
    let state = initial >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // The Tailwind CDN runtime also calls Math.random, a varying number of times depending on
  // which classes exist, so the app bundle gets its own stream that nothing else can shift
  const appRandom = mulberry32(seed);
  const otherRandom = mulberry32(seed ^ 0x9e3779b9);
  Math.random = () => (/\/assets\/index-[^/]*\.js/.test(new Error().stack || '') ? appRandom() : otherRandom());
  try {
    if (storedPath) {
      localStorage.setItem(`survey_session_${sessionId}`, JSON.stringify({ submissionId, path: storedPath }));
    }
    if (adminToken) localStorage.setItem('token', adminToken);
  } catch {
    // about:blank has no localStorage
  }
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  // page.evaluate has no timeout of its own, so never wait on fonts forever
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 5000))]));
  // Tailwind's CDN runtime styles newly rendered classes asynchronously
  await page.waitForTimeout(700);
}

async function runStep(page, step) {
  if (step.action === 'revealAll') {
    const markers = page.locator('svg text').filter({ hasText: /^\?$/ });
    for (let guard = 0; (await markers.count()) > 0 && guard < 30; guard++) {
      await markers.first().click({ force: true });
      await page.waitForTimeout(200);
    }
  } else if (step.action === 'setSlider') {
    // Use the native setter so React sees the change exactly like a user drag
    await page.locator('input[type="range"]').first().evaluate((input, value) => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setValue.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, step.value);
  } else if (step.action === 'clickButton') {
    // force: glowing buttons scale forever, so they never pass Playwright's "stable" check
    await page.getByRole('button', { name: step.name }).click({ force: true });
  } else {
    throw new Error(`Unknown step action: ${step.action}`);
  }
  await page.waitForTimeout(300);
}

async function freezeAnimations(page) {
  await page.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      try {
        svg.pauseAnimations();
        svg.setCurrentTime(0);
      } catch {
        // nested <svg> elements share the root timeline
      }
    }
  });
}

async function captureShot(browser, shot, viewportName, { outDir, adminToken, label, tailwindRuntime }) {
  const context = await browser.newContext({
    ...VIEWPORTS[viewportName],
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    colorScheme: 'light',
    acceptDownloads: true,
  });
  try {
    await context.route(TAILWIND_CDN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: tailwindRuntime }));
    await context.addCookies([{ name: 'turnstile_verified', value: turnstileCookie, url: BASE_URL }]);
    const isSurvey = shot.route.startsWith('/survey');
    const search = isSurvey ? `?sessionId=${FIXTURE.sessionId}` : '';
    await context.addInitScript(pageInitScript, {
      seed: RANDOM_SEED,
      sessionId: FIXTURE.sessionId,
      submissionId: FIXTURE.liveSubmissionId,
      storedPath: isSurvey ? `${shot.route}${search}` : null,
      adminToken: shot.admin ? adminToken : null,
    });

    const page = await context.newPage();
    if (shot.failDebrief) {
      await page.route('**/graphql', (route) => {
        const body = route.request().postData() || '';
        return /FetchSubmission|DrawRealisedRound/.test(body) ? route.abort('failed') : route.continue();
      });
    }

    // The Tailwind CDN occasionally stalls; one retry keeps a network blip from failing the run
    for (let attempt = 1; ; attempt++) {
      try {
        await page.goto(`${BASE_URL}${shot.route}${search}`, { waitUntil: 'networkidle' });
        break;
      } catch (error) {
        if (attempt >= 2) throw error;
        console.warn(`↻ ${shot.id} ${viewportName}: ${error?.message?.split('\n')[0]} — retrying`);
      }
    }
    await settle(page);
    for (const step of shot.steps || []) await runStep(page, step);
    await settle(page);
    await freezeAnimations(page);

    const file = path.join(outDir, viewportName, `${shot.id}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide' });

    // E2: the payment ledger only exists after the change
    if (shot.id === 'S14' && label === 'after') {
      const exportButton = page.getByRole('button', { name: /Export Payments/ });
      if (await exportButton.count()) {
        const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()]);
        await download.saveAs(path.join(outDir, 'evidence', 'E2.csv'));
      }
    }
    return path.relative(outDir, file);
  } finally {
    await context.close();
  }
}

async function captureEvidenceE1(outDir) {
  const request = {
    query: '{ recentSubmissions(limit: 20) { _id isCompleted registrationCode email } }',
  };
  const response = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const evidence = { request: { ...request, headers: 'no Authorization header' }, status: response.status, body: await response.json() };
  await fs.writeFile(path.join(outDir, 'evidence', 'E1.json'), `${JSON.stringify(evidence, null, 2)}\n`);
}

async function main() {
  const { label, only, appDir } = parseArgs(process.argv.slice(2));
  if (!existsSync(path.join(appDir, 'dist/index.html'))) throw new Error(`${appDir}/dist is missing — build it first`);

  const outDir = path.join(ROOT, 'docs/irb/screenshots', label);
  if (!only) await fs.rm(outDir, { recursive: true, force: true });
  for (const dir of [...Object.keys(VIEWPORTS), 'evidence']) await fs.mkdir(path.join(outDir, dir), { recursive: true });

  const matchesBaseline = appSourceMatchesBaseline(appDir);
  if (label === 'before' && !matchesBaseline) {
    console.warn(`⚠️  App source differs from ${BASELINE_COMMIT}; this is not a valid "before" set.`);
  }

  const tailwindRuntime = await loadTailwindRuntime();

  const externalMongo = process.env.IRB_SHOTS_MONGODB_URI;
  const mongo = externalMongo ? null : await MongoMemoryServer.create();
  const mongoUri = externalMongo || mongo.getUri('irb-shots');
  await seedFixture(mongoUri);

  const serverLog = createWriteStream(path.join(outDir, 'server.log'));
  const server = spawn(process.execPath, ['server.js'], {
    cwd: appDir,
    env: { ...process.env, PORT: String(PORT), MONGODB_URI: mongoUri, ADMIN_PASSWORD, JWT_SECRET, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.pipe(serverLog);
  server.stderr.pipe(serverLog);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const captured = [];
  const failures = [];
  try {
    await waitForServer(`${BASE_URL}/api/turnstile/status`);
    turnstileCookie = await turnstileCookieValue(BASE_URL); // REQ-102.1
    const login = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });
    const { token: adminToken } = await login.json();

    // Every real finisher sees the debrief before completing, which saves their payout.
    // Replay that visit for the completed fixture participant (a no-op on the old code).
    await fetch(`${BASE_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation DrawRealisedRound($id: ID!) { drawRealisedRound(submissionId: $id) { realisedRoundIndex } }',
        variables: { id: FIXTURE.doneSubmissionId },
      }),
    });

    await captureEvidenceE1(outDir);

    const shots = label === 'after' ? [...SHOTS, ...PACKET_ONLY] : SHOTS;
    for (const shot of shots) {
      if (only && !only.has(shot.id)) continue;
      for (const viewportName of shot.viewports || Object.keys(VIEWPORTS)) {
        try {
          const file = await withTimeout(
            captureShot(browser, shot, viewportName, { outDir, adminToken, label, tailwindRuntime }),
            SHOT_TIMEOUT_MS,
            `${shot.id} ${viewportName}`,
          );
          captured.push({ id: shot.id, viewport: viewportName, file });
          console.log(`✓ ${shot.id} ${viewportName}`);
        } catch (error) {
          failures.push({ id: shot.id, viewport: viewportName, error: String(error?.message || error) });
          console.error(`✗ ${shot.id} ${viewportName}: ${error?.message || error}`);
        }
      }
    }

    // A partial (--only) run updates the existing set instead of replacing its metadata
    const metaPath = path.join(outDir, 'meta.json');
    const previous = only && existsSync(metaPath) ? JSON.parse(await fs.readFile(metaPath, 'utf8')) : null;
    const isRecaptured = (entry) => only.has(entry.id);
    const meta = {
      label,
      capturedAt: new Date().toISOString(),
      appDir: path.relative(ROOT, appDir) || '.',
      git: { sha: git(appDir, 'rev-parse', '--short', 'HEAD'), dirty: git(appDir, 'status', '--porcelain') !== '' },
      baselineCommit: BASELINE_COMMIT,
      appSourceMatchesBaseline: previous ? previous.appSourceMatchesBaseline && matchesBaseline : matchesBaseline,
      payment: await readPaymentSettings(appDir),
      chrome: browser.version(),
      viewports: VIEWPORTS,
      randomSeed: RANDOM_SEED,
      captured: [...(previous?.captured || []).filter((entry) => !isRecaptured(entry)), ...captured],
      failures: [...(previous?.failures || []).filter((entry) => !isRecaptured(entry)), ...failures],
    };
    await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  } finally {
    await browser.close();
    server.kill();
    if (mongo) await mongo.stop();
  }

  console.log(`\n${captured.length} screenshots → ${path.relative(ROOT, outDir)} (${failures.length} failed)`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
