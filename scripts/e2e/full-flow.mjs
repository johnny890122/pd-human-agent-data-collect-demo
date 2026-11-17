// Full-flow end-to-end test with a review report (NFR-8, NFR-8.1; docs/design.md Phases 44, 46).
// Admin launches a Mixed Mode group → participant A completes the survey from the invite link →
// participant B stops halfway → admin exports the payment ledger. Proves that the amount shown
// on the debrief = Submission.payoutNtd = the ledger's Total Payout. Then runs the edge cases
// EC-1…EC-13 (leave and return, attend twice, another device, full group, guards, …).
// Usage: npm run test:e2e   (builds dist/ first)
// Output: test-results/e2e/<timestamp>/ — shots/, report.html, report.pdf, payments*.csv, server.log
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { chromium } from 'playwright-core';
import { SessionGroupModel } from '../../backend/models/SessionGroup.js';
import { QUESTIONNAIRE } from '../../utils/questionnaire.js';
import { SessionModel } from '../../backend/models/Session.js';
import { ScenarioModel } from '../../backend/models/Scenario.js';
import { SubmissionModel } from '../../backend/models/Submission.js';
import {
  POINT_TO_NTD, PARTICIPATION_FEE_NTD, MIN_TOTAL_NTD, MAX_TOTAL_NTD, payoffPoints, totalPayoutNtd,
} from '../../utils/payment.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.E2E_PORT || 3200);
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = 'e2e-admin';
const TAILWIND_CDN = /^https:\/\/cdn\.tailwindcss\.com\//;
// Shared with the IRB capture, so both tools use one pinned Tailwind build
const TAILWIND_CACHE = path.join(ROOT, 'docs/irb/screenshots/.cache/tailwindcss-cdn.js');
// The Cloudflare widget can't be solved headless: the stub hands back a token at once, and the
// real /api/turnstile/verify (which accepts any token in development) sets the cookie
const TURNSTILE_STUB = `window.turnstile = {
  render(el, opts) { setTimeout(() => { opts.callback('e2e-token'); window.__e2eTurnstileToken = true; }, 50); return 'e2e-widget'; },
  reset() {}, remove() {},
};`;
const STUDY = { maxK: 1, scenariosPerSession: 5, targetSizePerScenario: 1, focalNode: 'KMT1', opponentNode: 'DPP4', expectedScenarios: 18 };
const GROUP_NAME = 'E2E full flow';
// `answers`: index of the option picked for Q1–Q8 (REQ-416)
const A = { code: 'E2E001', email: 'e2e-a@example.com', sliders: [70, 30, 90, 10, 50], answers: [0, 1, 0, 1, 1, 0, 1, 0] };
const B = { sliders: [60, 40] };
const C = { code: 'E2E003', email: 'e2e-c@example.com', sliders: [60, 40, 80, 25, 55], reanswer: 20, answers: [1, 1, 1, 1, 0, 0, 0, 0] };
const expectedAnswers = (picks) => QUESTIONNAIRE.map((q, i) => ({ questionId: q.id, answer: q.options[picks[i]] }));
const D = { participantId: 'e2e-device-2', email: 'e2e-a-phone@example.com' };
// A browser context is one device; FingerprintJS hashes timezone and language among others
const DEVICES = {
  A: { timezoneId: 'Asia/Taipei', locale: 'zh-TW' },
  B: { timezoneId: 'America/New_York', locale: 'en-US' },
  C: { timezoneId: 'Europe/Berlin', locale: 'de-DE' },
  E: { timezoneId: 'Australia/Sydney', locale: 'en-AU' },
  X: { timezoneId: 'Asia/Singapore', locale: 'en-SG' },
  // Own timezone: on a phone the fingerprint ignores the user agent, so sharing A's would make it "A again"
  firefox: { timezoneId: 'Asia/Tokyo', locale: 'zh-TW', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:128.0) Gecko/20100101 Firefox/128.0' },
};
const FULL_MSG = '無法參與實驗';

// Phone run (NFR-8.3): E2E_DEVICE=mobile puts every participant on an emulated phone
const MOBILE = process.env.E2E_DEVICE === 'mobile';
const PHONE = {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
};
if (MOBILE) DEVICES.firefox.userAgent = 'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0';

// The edge-case catalogue (requirements.md NFR-8.1)
const EDGE_CASES = [
  ['EC-1', 'Wrong quiz answers first', 'Hint shown; cannot continue until retried correctly'],
  ['EC-2', 'Empty code / malformed email', '下一步 disabled; email error, 送出 disabled (REQ-403)'],
  ['EC-3', 'Leaves during the intro', 'No session or submission created (REQ-307)'],
  ['EC-4', 'Refresh mid-scenario before confirming', 'Same scenario again; unconfirmed answer not saved (REQ-404)'],
  ['EC-5', 'Closes the tab, returns via the invite link', 'Resumes at the next unanswered scenario, same session/submission (REQ-313, REQ-404)'],
  ['EC-6', 'Browser Back to a confirmed scenario', 'Stays on the next unanswered scenario with the 「已確認的答案無法修改。」 toast; answer unchanged; API change rejected (REQ-402.4)'],
  ['EC-7', 'Returns after completing (same device)', `「${FULL_MSG}」 on arrival; nothing created or changed (REQ-313, REQ-405)`],
  ['EC-8', 'Same person, another device, same code', 'Observation: accepted and listed twice; invalidating removes it from the ledger (REQ-350)'],
  ['EC-9', 'Every scenario reached its target', `Group completed (REQ-309); new visitor sees 「${FULL_MSG}」 on arrival, no session; API start refused (REQ-405.1)`],
  ['EC-10', 'Non-Chrome browser', '開始實驗 disabled with the Chrome notice (REQ-415)'],
  ['EC-11', 'Invite link to an unknown group', '「找不到此實驗」 on arrival, no 開始實驗, no session (REQ-405.2)'],
  ['EC-12', 'Direct API misuse', 'Out-of-range answer, no Turnstile, no admin login, editing or re-completing a completed submission, completing without the questionnaire all rejected (REQ-402, REQ-100, REQ-408.8, REQ-402.4, REQ-416)'],
  ['EC-13', 'No participant completed yet', 'Export Payments disabled (REQ-408.7)'],
];

// The report's roadmap (NFR-8.2): journey stage → happy-path step → edge cases
const ROADMAP = [
  ['Admin sets up the study', 'admin', []],
  ['Participant opens the invite link', 'participantA', ['EC-9', 'EC-10', 'EC-11']],
  ['Intro, quiz, Turnstile', 'participantA', ['EC-1', 'EC-3']],
  ['Scenarios', 'participantA', ['EC-4', 'EC-5', 'EC-6']],
  ['Outro: debrief, questionnaire, email', 'participantA', ['EC-2']],
  ['Coming back later', null, ['EC-7', 'EC-8']],
  ['Payment ledger', 'ledger', ['EC-13']],
  ['Behind the UI (direct API)', null, ['EC-12']],
];
{
  const placed = ROADMAP.flatMap(([, , ids]) => ids);
  const bad = EDGE_CASES.map(([id]) => id).filter((id) => placed.filter((p) => p === id).length !== 1);
  if (bad.length || placed.length !== EDGE_CASES.length) throw new Error(`ROADMAP must place each edge case exactly once: ${bad.join(', ') || 'unknown id in ROADMAP'}`);
}

const stamp = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};
const OUT_DIR = process.env.E2E_OUT ? path.resolve(process.env.E2E_OUT) : path.join(ROOT, 'test-results/e2e', `${stamp()}${MOBILE ? '-mobile' : ''}`);
const SHOTS_DIR = path.join(OUT_DIR, 'shots');

// ── Recording ────────────────────────────────────────────────────────────────
const steps = [];
const run = { startedAt: new Date() };
let current = null;
let currentEc = null;
let shotCounter = 0;

/** Set the edge case that the following checks belong to. */
const ec = (id) => { currentEc = id; };

function check(label, expected, actual, pass = Object.is(expected, actual)) {
  current.checks.push({ kind: 'check', ec: currentEc, label, expected, actual, pass: Boolean(pass) });
  console.log(`  ${pass ? '✓' : '✗'} ${label}${pass ? '' : ` — expected ${fmt(expected)}, got ${fmt(actual)}`}`);
}

/** Behaviour no requirement defines: shown in the report, never fails the run. */
function observe(label, actual) {
  current.checks.push({ kind: 'note', ec: currentEc, label, expected: '', actual, pass: true });
  console.log(`  ℹ ${label}: ${fmt(actual)}`);
}

async function shot(page, id, caption) {
  const file = `shots/${String(++shotCounter).padStart(2, '0')}-${id}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true, animations: 'disabled', caret: 'hide' });
  current.shots.push({ file, caption, phone: (page.viewportSize()?.width ?? 1440) < 600 });
}

const journeyOk = (id) => ['pass', 'fail'].includes(steps.find((s) => s.id === id)?.status);

/** A step runs unless a step it needs broke or did not run; failed checks never block. */
async function step(id, title, fn, { needs = [] } = {}) {
  current = { id, title, shots: [], checks: [], status: 'not run', error: null };
  currentEc = null;
  steps.push(current);
  const missing = needs.filter((n) => !journeyOk(n));
  if (missing.length) {
    current.error = `Not run: needs ${missing.join(', ')}`;
    console.log(`\n▷ ${title} — skipped (needs ${missing.join(', ')})`);
    return;
  }
  console.log(`\n▶ ${title}`);
  try {
    await fn();
    current.status = current.checks.every((c) => c.pass) ? 'pass' : 'fail';
  } catch (error) {
    current.status = 'broken';
    current.error = String(error?.stack || error);
    console.error(`  ✗ broken: ${error?.message || error}`);
    if (run.activePage && !run.activePage.isClosed()) {
      await shot(run.activePage, 'failure', `Page when the step broke: ${error?.message?.split('\n')[0]}`).catch(() => {});
    }
  }
}

// ── Browser helpers ──────────────────────────────────────────────────────────
async function loadTailwindRuntime() {
  if (existsSync(TAILWIND_CACHE)) return fs.readFile(TAILWIND_CACHE, 'utf8');
  const response = await fetch('https://cdn.tailwindcss.com', { redirect: 'follow' });
  if (!response.ok) throw new Error(`Could not download the Tailwind runtime: HTTP ${response.status}`);
  const body = await response.text();
  await fs.mkdir(path.dirname(TAILWIND_CACHE), { recursive: true });
  await fs.writeFile(TAILWIND_CACHE, body);
  return body;
}

let browser;
let tailwind;
async function newContext(device = DEVICES.A, { desktop = false } = {}) {
  const phone = MOBILE && !desktop ? PHONE : {};
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, ...phone, ...device });
  await context.route(TAILWIND_CDN, (route) => route.fulfill({ contentType: 'application/javascript', body: tailwind }));
  await context.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  return context;
}

async function openPage(context, url) {
  const page = await context.newPage();
  run.activePage = page;
  if (url) {
    await page.goto(url);
    await settle(page);
  }
  return page;
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]));
  await page.waitForTimeout(700); // Tailwind's CDN runtime styles new classes asynchronously
}

// force: glowing buttons scale forever and never pass Playwright's "stable" check, but a forced
// click skips the enabled check too, so wait for that first
async function click(locator, timeout = 15_000) {
  await locator.waitFor({ state: 'visible', timeout });
  const deadline = Date.now() + timeout;
  while (!(await locator.isEnabled())) {
    if (Date.now() > deadline) throw new Error(`Button stayed disabled: ${locator}`);
    await locator.page().waitForTimeout(100);
  }
  await locator.click({ force: true });
}
const button = (page, name) => page.getByRole('button', { name }).first();

// The graph legend also draws a sample "?" that never goes away, so stop once a click reveals nothing
async function revealAll(page) {
  // Skip the legend's sample "?" — it sits in a <details> that is closed by default (REQ-409.5)
  const markers = page.locator('svg:not(details svg) text').filter({ hasText: /^\?$/ });
  for (let left = await markers.count(), guard = 0; left > 0 && guard < 30; guard++) {
    await markers.first().click({ force: true });
    await page.waitForTimeout(200);
    const now = await markers.count();
    if (now >= left) break;
    left = now;
  }
}

// Native setter + events, so React sees it exactly like a user drag
async function setSlider(page, value) {
  await page.locator('input[type="range"]').first().evaluate((input, v) => {
    // The start is random (REQ-402.1); if it already equals v, React sees no change and the
    // confirm button stays locked, so step through a neighbouring value first.
    for (const x of [v === 0 ? 1 : v - 1, v]) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(x));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, value);
}

const bodyText = (page) => page.locator('body').innerText();
const amountAfter = (text, label) => Number(text.match(new RegExp(`${label}\\s*新台幣\\s*(\\d+)\\s*元`))?.[1] ?? NaN);
const pathOf = (page) => new URL(page.url()).pathname;
const firstLines = async (page) => (await bodyText(page)).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join(' / ');

/**
 * Walk the intro from step 0. `stopAt` leaves on that step (after its screenshot);
 * `wrongQuizFirst` submits a wrong quiz before the right one (EC-1).
 */
async function intro(page, { record = false, stopAt = null, wrongQuizFirst = false } = {}) {
  for (let i = 0; i <= 8; i++) {
    await page.waitForURL(new RegExp(`/survey/intro/${i}\\b`));
    await settle(page);
    if (i === 3 || i === 4) await revealAll(page);
    if (i === 6) {
      const inputs = page.locator('input[inputmode="numeric"]');
      if (wrongQuizFirst) {
        for (let n = 0; n < 4; n++) await inputs.nth(n).fill('0');
        await click(button(page, '提交'));
        await page.getByText('有部分答案不正確').waitFor();
        check('Wrong quiz answers show the rules hint', true, await page.getByText('有部分答案不正確').isVisible());
        check('Next is disabled until the quiz is correct', true, await button(page, '繼續').isDisabled());
        await shot(page, 'intro-6-wrong', 'Intro step 6 — wrong answers 0/0/0/0: hint shown, Next disabled (EC-1)');
        await click(button(page, '重新作答'));
      }
      for (const [n, answer] of ['1', '3', '3', '2'].entries()) await inputs.nth(n).fill(answer);
      await click(button(page, '提交'));
      await page.getByText('正確。您已經準備好可以繼續了。').waitFor();
    }
    if (i === 4 && record) {
      // REQ-409.5: legend and caption closed until tapped
      const legend = page.locator('details', { has: page.getByText('圖例', { exact: true }) }).first();
      const caption = page.locator('details', { has: page.getByText('圖說', { exact: true }) }).first();
      check('圖例 closed by default (REQ-409.5)', false, await legend.evaluate((d) => d.open));
      check('圖說 closed by default (REQ-409.5)', false, await caption.evaluate((d) => d.open));
      await shot(page, 'intro-4-closed', 'Intro step 4 — 圖說 and 圖例 closed (點擊展開)');
      await legend.locator('summary').click();
      await caption.locator('summary').click();
      check('Tapping opens 圖例 and 圖說', 'true / true', `${await legend.evaluate((d) => d.open)} / ${await caption.evaluate((d) => d.open)}`);
      await page.waitForTimeout(300);
    }
    if (i === 7 && record) {
      const text = await bodyText(page);
      check(`Payment page states the minimum 新台幣 ${MIN_TOTAL_NTD} 元`, true, text.includes(`最少為新台幣 ${MIN_TOTAL_NTD} 元`));
      check(`Payment page states the maximum 新台幣 ${MAX_TOTAL_NTD} 元`, true, text.includes(`最多為新台幣 ${MAX_TOTAL_NTD} 元`));
      check(`Payment page states 1 點 = 新台幣 ${POINT_TO_NTD} 元`, true, text.includes(`1 點 = 新台幣 ${POINT_TO_NTD} 元`));
    }
    if (record) await shot(page, `intro-${i}`, `Intro step ${i}${{ 3: ' — demo edge revealed', 4: ' — all edges revealed', 6: ' — quiz answered 1/3/3/2, correct', 7: ' — 點數兌換報酬說明' }[i] ?? ''}`);
    if (i === stopAt) return;
    await click(i < 8 ? button(page, /^下一步/) : button(page, '開始實驗！'));
  }
}

/** Click 進入測驗 in the Turnstile modal. Returns 'scenarios', or the modal's error text. */
async function enterSurvey(page) {
  await page.waitForFunction(() => window.__e2eTurnstileToken === true); // clicking earlier is a no-op
  await page.waitForTimeout(100);
  await click(button(page, '進入測驗'));
  const error = page.locator('.text-red-600.font-medium').first();
  const outcome = await Promise.race([
    page.waitForURL(/\/survey\/scenarios\/\d+/, { timeout: 30_000 }).then(() => 'scenarios', () => null),
    error.waitFor({ timeout: 30_000 }).then(() => 'error', () => null),
  ]);
  if (outcome === 'error') return `error: ${await error.innerText()}`;
  return outcome ?? 'nothing happened within 30 s';
}

async function answerScenario(page, idx, value, total, record) {
  await page.waitForURL(new RegExp(`/survey/scenarios/${idx}\\b`));
  await settle(page);
  await revealAll(page);
  // The button reads 繼續 (disabled) until every edge is revealed, then 開始決策
  const decide = button(page, '開始決策');
  if (record) check(`Scenario ${idx + 1}: every edge revealed (開始決策 available)`, true, await decide.isVisible());
  await click(decide);
  await setSlider(page, value);
  await page.waitForTimeout(200);
  if (record) await shot(page, `scenario-${idx + 1}`, `Scenario ${idx + 1}/${total}: all edges revealed, slider set to ${value}`);
  await click(button(page, /^確認並(前往下一題|送出)$/));
}

/**
 * Outro step 3, the questionnaire (REQ-416): pick option `picks[i]` for Q(i+1), then 下一步.
 * `full` also checks the required gate and that answers survive a reload halfway through.
 */
async function answerQuestionnaire(page, picks, { prefix, record = false, full = false }) {
  await page.waitForURL(/\/survey\/outro\/3\b/);
  await settle(page);
  const pick = (i) => page.locator(`input[name="${QUESTIONNAIRE[i].id}"][value="${QUESTIONNAIRE[i].options[picks[i]]}"]`).check();
  if (full) {
    check('Questionnaire shows Q1–Q8 with two options each', 16, await page.locator('input[type="radio"]').count());
    check('下一步 disabled before any answer', true, await button(page, '下一步').isDisabled());
    if (record) await shot(page, `${prefix}-questionnaire-empty`, 'Outro 3: questionnaire Q1–Q8, nothing answered — 下一步 disabled');
    for (let i = 0; i < 4; i++) await pick(i);
    await page.reload();
    await settle(page);
    check('Answers to Q1–Q4 survive a reload', '已回答 4 / 8', (await bodyText(page)).match(/已回答 \d+ \/ 8/)?.[0]);
    for (let i = 4; i < 7; i++) await pick(i);
    check('下一步 still disabled with 7 of 8 answered', true, await button(page, '下一步').isDisabled());
    await pick(7);
  } else {
    for (let i = 0; i < QUESTIONNAIRE.length; i++) await pick(i);
  }
  if (record) await shot(page, `${prefix}-questionnaire`, `Outro 3: questionnaire answered — ${picks.map((p, i) => `Q${i + 1} ${QUESTIONNAIRE[i].options[p]}`).join('、')}`);
  await click(button(page, '下一步'));
  await page.waitForURL(/\/survey\/outro\/4\b/);
}

/** Outro steps 1–5 with a code, questionnaire answers and email; returns the debrief total. */
async function finishOutro(page, { code, email, answers, prefix, record }) {
  await page.waitForURL(/\/survey\/outro\/1\b/);
  await settle(page);
  await page.locator('input[placeholder="請輸入代碼"]').fill(code);
  if (record) await shot(page, `${prefix}-outro-code`, `Outro 1: registration code ${code}`);
  await click(button(page, '下一步'));
  await page.waitForURL(/\/survey\/outro\/2\b/);
  await page.getByText('合計').first().waitFor({ timeout: 30_000 });
  await settle(page);
  const z = amountAfter(await bodyText(page), '合計');
  if (record) await shot(page, `${prefix}-debrief`, `Outro 2: debrief — 合計 新台幣 ${z} 元`);
  await click(button(page, '繼續'));
  await answerQuestionnaire(page, answers, { prefix, record });
  await settle(page);
  await page.locator('input[type="email"]').fill(email);
  await click(button(page, '送出'));
  await page.waitForURL(/\/survey\/outro\/5\b/);
  await settle(page);
  return z;
}

/**
 * Open an invite link as a participant who should be turned away. Records whether the
 * 「無法參與實驗」 gate shows on arrival; if not, walks to 進入測驗 to record what happens instead.
 */
async function expectTurnedAway(context, url, prefix, label) {
  const page = await openPage(context, url);
  const arrivedGate = (await bodyText(page)).includes(FULL_MSG);
  check(`${label}: 「${FULL_MSG}」 shown on arrival`, true, arrivedGate);
  await shot(page, `${prefix}-arrival`, `${label} — on arrival: ${await firstLines(page)}`);
  if (arrivedGate) return { page, outcome: 'gate' };
  observe('Shown instead on arrival', `${pathOf(page)} — ${await firstLines(page)}`);
  if (!(await button(page, '開始實驗').isVisible())) return { page, outcome: 'no start button' };
  await click(button(page, '開始實驗'));
  await intro(page);
  const outcome = await enterSurvey(page);
  observe('After the full intro, 進入測驗 leads to', outcome);
  await settle(page);
  await shot(page, `${prefix}-after-intro`, `${label} — after the intro and 進入測驗: ${outcome}`);
  return { page, outcome };
}

// ── DB + API helpers ─────────────────────────────────────────────────────────
let db;
const col = (Model) => db.collection(Model.collection.collectionName);
const sessionsOf = (groupId) => col(SessionModel).find({ groupId }).toArray();

/** GraphQL call that returns { data, error } instead of throwing. */
async function gqlRaw(query, variables = {}, { cookie, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}/graphql`, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const body = await response.json();
  return { data: body.data, error: body.errors?.map((e) => e.message).join('; ') ?? null };
}
async function gql(query, variables, auth) {
  const { data, error } = await gqlRaw(query, variables, auth);
  if (error) throw new Error(error);
  return data;
}
const PARTICIPANT = { cookie: 'turnstile_verified=true' };

/** A participant driven through the API only (another device, or a filler). */
async function apiParticipant(groupId, participantId, { code, email, probability = 0.5 }) {
  const { startMixedSession: s } = await gql(
    'mutation($g: ID!, $p: String) { startMixedSession(groupId: $g, participantId: $p) { sessionId assignedScenarios { _id } } }',
    { g: groupId, p: participantId }, PARTICIPANT);
  const { startSurvey: sub } = await gql(
    'mutation($s: ID!, $p: String) { startSurvey(sessionId: $s, participantId: $p) { _id } }', { s: s.sessionId, p: participantId }, PARTICIPANT);
  for (const scenario of s.assignedScenarios) {
    await gql('mutation($id: ID!, $sc: ID!, $v: Float!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: $v) { _id } }',
      { id: sub._id, sc: scenario._id, v: probability }, PARTICIPANT);
  }
  const { drawRealisedRound: draw } = await gql('mutation($id: ID!) { drawRealisedRound(submissionId: $id) { payoutNtd } }', { id: sub._id }, PARTICIPANT);
  const { completeSurvey: done } = await gql(
    'mutation($id: ID!, $d: DemographicsInput!, $q: [QuestionnaireAnswerInput!]!) { completeSurvey(submissionId: $id, demographics: $d, questionnaire: $q) { isCompleted } }',
    { id: sub._id, d: { age: 0, gender: code, education: email }, q: expectedAnswers(QUESTIONNAIRE.map(() => 0)) }, PARTICIPANT);
  return { sessionId: s.sessionId, submissionId: sub._id, scenarios: s.assignedScenarios.length, payoutNtd: draw.payoutNtd, isCompleted: done.isCompleted };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (char === '"') quoted = false; else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; } else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (char !== '\r') cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Click Export Payments on the open group page; returns { file, raw, header, rows, byId }. */
async function exportPayments(page, saveAs) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(button(page, 'Export Payments'))]);
  await download.saveAs(path.join(OUT_DIR, saveAs));
  const raw = await fs.readFile(path.join(OUT_DIR, saveAs));
  const [header = [], ...rows] = parseCsv(raw.toString('utf8').replace(/^﻿/, '')).filter((r) => r.some(Boolean));
  const byId = Object.fromEntries(rows.map((r) => [r[0], Object.fromEntries(header.map((h, i) => [h, r[i]]))]));
  return { file: download.suggestedFilename(), raw, header, rows, byId };
}

/** Σ Total Payout of an exported ledger vs the「Actual Payout」card on the open group page (REQ-408.9). */
async function checkPayoutCard(page, ledger, label) {
  const idx = ledger.header.indexOf('Total Payout (NTD)');
  const sum = ledger.rows.reduce((t, r) => t + Number(r[idx] || 0), 0);
  const card = page.locator('div', { has: page.getByText('Actual Payout', { exact: true }) }).last();
  const shown = Number((await card.locator('span').nth(1).innerText()).replace(/[^\d]/g, ''));
  check(`Actual Payout card = ledger total ${label} (REQ-408.9)`, sum, shown);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).ok) return; } catch { /* not listening yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

// ── Journey ──────────────────────────────────────────────────────────────────
async function journey() {
  const admin = await newContext(DEVICES.A, { desktop: true });
  const adminPage = await admin.newPage();

  await step('admin', '1. Admin launches the study', async () => {
    run.activePage = adminPage;
    await adminPage.goto(`${BASE_URL}/admin/setup/mixed`);
    await adminPage.waitForURL(/\/login/);
    await settle(adminPage);
    await adminPage.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await shot(adminPage, 'admin-login', 'Admin login (visiting /admin/setup/mixed redirects here)');
    await click(button(adminPage, '登入'));
    await adminPage.waitForURL(/\/admin\/setup\/mixed/);
    await settle(adminPage);
    run.adminToken = await adminPage.evaluate(() => localStorage.getItem('token'));

    await adminPage.locator('button', { hasText: '民進黨' }).nth(1).click(); // Partner Node → 民進黨
    for (const handle of await adminPage.locator('[role="slider"]').all()) {
      await handle.focus();
      await handle.press('Home'); // maxK 1, scenarios/participant 5 (UI minimum), target 1
    }
    await adminPage.locator('input[placeholder^="k≤"]').fill(GROUP_NAME);
    await settle(adminPage);
    await shot(adminPage, 'admin-setup', `Mixed setup: focal 國民黨, partner 民進黨, max k ${STUDY.maxK}, ${STUDY.scenariosPerSession} scenarios/participant, target ${STUDY.targetSizePerScenario}`);
    await click(button(adminPage, 'Launch Batch Sessions'));
    await click(button(adminPage, 'Yes, Launch'));
    await adminPage.waitForURL(/\/admin\/view\/batch\/[^/?]+/, { timeout: 60_000 });
    run.groupId = decodeURIComponent(adminPage.url().split('/admin/view/batch/')[1].split(/[?#]/)[0]);
    await settle(adminPage);

    const group = await col(SessionGroupModel).findOne({ _id: run.groupId });
    check('Group saved with the configured settings', true,
      group?.name === GROUP_NAME && group?.config?.maxK === STUDY.maxK && group?.config?.scenariosPerSession === STUDY.scenariosPerSession
        && group?.config?.targetSizePerScenario === STUDY.targetSizePerScenario && group?.config?.focalNode === STUDY.focalNode
        && group?.config?.opponentNode === STUDY.opponentNode);
    check('Group totalScenarios', STUDY.expectedScenarios, group?.totalScenarios);
    check('Scenario documents with responseCount 0', STUDY.expectedScenarios,
      await col(ScenarioModel).countDocuments({ groupId: run.groupId, responseCount: 0, status: 'active' }));
    run.inviteUrl = await adminPage.locator('input[readonly][value*="/survey/welcome"]').inputValue();
    check('Invite (Public) URL', `${BASE_URL}/survey/welcome?groupId=${run.groupId}&mode=mixed`, run.inviteUrl);
    ec('EC-13');
    check('Export Payments disabled while nobody has completed', true, await button(adminPage, 'Export Payments').isDisabled());
    await shot(adminPage, 'admin-group', `Group page after launch — ${STUDY.expectedScenarios} scenarios, Public URL to share, Export Payments disabled`);
  });

  await step('participantA', '2. Participant A completes the survey from the invite link', async () => {
    const context = await newContext(DEVICES.A);
    const page = await openPage(context, run.inviteUrl);
    await shot(page, 'welcome', 'Welcome page opened from the invite URL');
    await click(button(page, '開始實驗'));
    ec('EC-1');
    await intro(page, { record: true, wrongQuizFirst: true });
    ec(null);
    const outcome = await enterSurvey(page);
    if (outcome !== 'scenarios') throw new Error(`進入測驗 failed: ${outcome}`);

    const sessionA = await col(SessionModel).findOne({ groupId: run.groupId });
    run.sessionIdA = sessionA?._id;
    run.participantIdA = sessionA?.metadata?.participantId;
    check(`Personal session created with ${STUDY.scenariosPerSession} scenarios after the intro`, STUDY.scenariosPerSession, sessionA?.scenarioIds?.length);

    for (const [idx, value] of A.sliders.entries()) await answerScenario(page, idx, value, A.sliders.length, true);

    await page.waitForURL(/\/survey\/outro\/1\b/);
    await settle(page);
    ec('EC-2');
    check('Outro 1: 下一步 disabled while the code is empty', true, await button(page, '下一步').isDisabled());
    ec(null);
    await page.locator('input[placeholder="請輸入代碼"]').fill(A.code);
    await shot(page, 'outro-code', `Outro 1: registration code ${A.code}`);
    await click(button(page, '下一步'));

    await page.waitForURL(/\/survey\/outro\/2\b/);
    await page.getByText('合計').first().waitFor({ timeout: 30_000 });
    await settle(page);
    run.debriefZ = amountAfter(await bodyText(page), '合計');
    check('Debrief shows a total (合計 新台幣 Z 元)', true, Number.isFinite(run.debriefZ));
    await shot(page, 'debrief', `Outro 2: debrief — 合計 新台幣 ${run.debriefZ} 元`);

    await page.reload();
    await page.getByText('合計').first().waitFor({ timeout: 30_000 });
    await settle(page);
    run.debriefAfterReload = amountAfter(await bodyText(page), '合計');
    check('Debrief total unchanged after reload (REQ-408.5)', run.debriefZ, run.debriefAfterReload);
    await shot(page, 'debrief-reload', `Outro 2 after a page reload — 合計 新台幣 ${run.debriefAfterReload} 元`);
    await click(button(page, '繼續'));

    await answerQuestionnaire(page, A.answers, { prefix: 'a', record: true, full: true });
    await settle(page);
    run.emailZ = Number((await bodyText(page)).match(/把\s*新台幣\s*(\d+)\s*元/)?.[1] ?? NaN);
    check('Email step repeats the amount', run.debriefZ, run.emailZ);
    ec('EC-2');
    await page.locator('input[type="email"]').fill('not-an-email');
    check('Malformed email shows the format error', true, await page.getByText('請輸入正確的 Email 格式').isVisible());
    check('送出 disabled for a malformed email', true, await button(page, '送出').isDisabled());
    await shot(page, 'outro-email-invalid', 'Outro 4: malformed email — error shown, 送出 disabled (EC-2)');
    ec(null);
    await page.locator('input[type="email"]').fill(A.email);
    await shot(page, 'outro-email', `Outro 4: email ${A.email}`);

    // BUG-011 / REQ-403.2: the first 送出 loses its network request — nothing may be lost or "done"
    const dropSave = (route) => (route.request().postData() ?? '').includes('completeSurvey') ? route.abort() : route.continue();
    await page.route('**/graphql', dropSave);
    const dialog = page.waitForEvent('dialog');
    await click(button(page, '送出'));
    const failAlert = await dialog;
    check('Failed save: 「提交失敗，請稍後再試」 shown (REQ-403.2)', '提交失敗，請稍後再試', failAlert.message());
    await failAlert.accept();
    await page.unroute('**/graphql', dropSave);
    check('Failed save: stays on the email step', '/survey/outro/4', pathOf(page));
    check('Failed save: answers still kept in the tab', 8,
      Object.keys(JSON.parse(await page.evaluate(() => Object.entries(sessionStorage).find(([k]) => k.startsWith('survey_questionnaire_'))?.[1] ?? '{}'))).length);
    check('Failed save: submission not completed', false, Boolean((await col(SubmissionModel).findOne({ sessionId: run.sessionIdA }))?.isCompleted));
    check('Failed save: answers never left in localStorage', false,
      await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith('survey_questionnaire_'))));

    await click(button(page, '送出')); // retry

    await page.waitForURL(/\/survey\/outro\/5\b/);
    await settle(page);
    check('Done screen shown', true, (await bodyText(page)).includes('表單已完成'));
    await shot(page, 'outro-done', 'Outro 5: done');
    await context.close();
  }, { needs: ['admin'] });

  await step('participantB', '3. Participant B starts but stops after 2 scenarios', async () => {
    const context = await newContext(DEVICES.B);
    const page = await openPage(context, run.inviteUrl);
    await click(button(page, '開始實驗'));
    await intro(page);
    const outcome = await enterSurvey(page);
    if (outcome !== 'scenarios') throw new Error(`進入測驗 failed: ${outcome}`);
    for (const [idx, value] of B.sliders.entries()) await answerScenario(page, idx, value, STUDY.scenariosPerSession, false);
    await page.waitForURL(new RegExp(`/survey/scenarios/${B.sliders.length}\\b`));
    await settle(page);
    await shot(page, 'participant-b-stopped', `Participant B stops at scenario ${B.sliders.length + 1}/${STUDY.scenariosPerSession} and closes the tab`);
    await context.close();

    const sessionB = await col(SessionModel).findOne({ groupId: run.groupId, _id: { $ne: run.sessionIdA } });
    run.sessionIdB = sessionB?._id;
    check('B has a different participant ID from A', true, Boolean(sessionB?.metadata?.participantId) && sessionB.metadata.participantId !== run.participantIdA);
    const subB = sessionB && (await col(SubmissionModel).findOne({ sessionId: sessionB._id }));
    check('B answered 2 scenarios', B.sliders.length, subB?.results?.length);
    check('B is not completed', false, Boolean(subB?.isCompleted));
  }, { needs: ['admin'] });

  await step('database', '4. Database matches what participant A did and saw', async () => {
    const sub = await col(SubmissionModel).findOne({ sessionId: run.sessionIdA });
    run.submissionIdA = String(sub?._id);
    check('Submission completed', true, sub?.isCompleted);
    check('Answers recorded (cooperationProbability)', A.sliders.map((v) => v / 100).join(', '),
      (sub?.results ?? []).map((r) => r.cooperationProbability).join(', '));
    check('Registration code stored (demographics.gender)', A.code, sub?.demographics?.gender);
    check('Email stored (demographics.education)', A.email, sub?.demographics?.education);
    check('Questionnaire Q1–Q8 stored as answered (REQ-416)', JSON.stringify(expectedAnswers(A.answers)), JSON.stringify(sub?.questionnaire));
    const q = 'query($id: ID!) { submission(id: $id) { questionnaire { questionId answer } } }';
    check('Questionnaire hidden from submission(id) without an admin login', null, (await gql(q, { id: run.submissionIdA })).submission?.questionnaire);
    check('Questionnaire readable with an admin login', 8, (await gql(q, { id: run.submissionIdA }, { token: run.adminToken })).submission?.questionnaire?.length);
    const d = 'query($id: ID!) { submission(id: $id) { demographics { gender education } } }';
    check('Code and email hidden from submission(id) without an admin login (REQ-408.8)', null, (await gql(d, { id: run.submissionIdA })).submission?.demographics);
    check('Email readable with an admin login', A.email, (await gql(d, { id: run.submissionIdA }, { token: run.adminToken })).submission?.demographics?.education);

    const r = sub?.realisedRoundIndex;
    run.draw = { round: r, my: sub?.myDecisions?.[r], opp: sub?.opponentDecisions?.[r], realisedPoints: sub?.realisedPoints, payoutNtd: sub?.payoutNtd };
    run.recomputedPoints = payoffPoints(run.draw.my, run.draw.opp);
    run.recomputedTotal = totalPayoutNtd(run.recomputedPoints);
    check('Realised round drawn and persisted', true, Number.isInteger(r) && r >= 0 && r < A.sliders.length);
    check('realisedPoints = payoffPoints(my, partner) of the realised round', run.recomputedPoints, sub?.realisedPoints);
    check('payoutNtd = totalPayoutNtd(realisedPoints)', run.recomputedTotal, sub?.payoutNtd);
    check('payoutNtd = amount shown on the debrief', run.debriefZ, sub?.payoutNtd);

    const answered = (sub?.results ?? []).map((x) => x.scenarioId);
    check(`Answered scenarios' responseCount = 1`, A.sliders.length,
      await col(ScenarioModel).countDocuments({ _id: { $in: answered }, responseCount: 1 }));
    const { session } = await gql('query($id: ID!) { session(id: $id) { submissionCount } }', { id: run.sessionIdA });
    check('Session submissionCount (GraphQL)', 1, session?.submissionCount);
  }, { needs: ['participantA'] });

  // Participant C uses one device throughout: each new page is "closed the tab and came back"
  const deviceC = await newContext(DEVICES.C);

  await step('participantC', '5. Participant C leaves, refreshes, returns and goes back (EC-3…EC-6)', async () => {
    ec('EC-3');
    const sessionsBefore = (await sessionsOf(run.groupId)).length;
    const submissionsBefore = await col(SubmissionModel).countDocuments({});
    const tab1 = await openPage(deviceC, run.inviteUrl);
    await click(button(tab1, '開始實驗'));
    await intro(tab1, { stopAt: 4 });
    await shot(tab1, 'c-leaves-intro', 'C leaves on intro step 4 and closes the tab (EC-3)');
    await tab1.close();
    check('No session created for a participant who left during the intro', sessionsBefore, (await sessionsOf(run.groupId)).length);
    check('No submission created either', submissionsBefore, await col(SubmissionModel).countDocuments({}));

    ec('EC-4');
    const tab2 = await openPage(deviceC, run.inviteUrl);
    observe('Coming back after leaving the intro opens', `${pathOf(tab2)} — the intro starts over (intro progress is not saved)`);
    await click(button(tab2, '開始實驗'));
    await intro(tab2);
    const outcome = await enterSurvey(tab2);
    if (outcome !== 'scenarios') throw new Error(`進入測驗 failed: ${outcome}`);
    const sessionC = (await sessionsOf(run.groupId)).find((s) => ![run.sessionIdA, run.sessionIdB].includes(s._id));
    run.sessionIdC = sessionC?._id;
    run.participantIdC = sessionC?.metadata?.participantId;
    check('C has its own participant ID (different device)', true,
      Boolean(run.participantIdC) && ![run.participantIdA].includes(run.participantIdC));
    const subC = () => col(SubmissionModel).findOne({ sessionId: run.sessionIdC });
    run.submissionIdC = String((await subC())?._id);

    await answerScenario(tab2, 0, C.sliders[0], STUDY.scenariosPerSession, false);
    await answerScenario(tab2, 1, C.sliders[1], STUDY.scenariosPerSession, false);
    await tab2.waitForURL(/\/survey\/scenarios\/2\b/);
    await settle(tab2);
    await revealAll(tab2);
    await click(button(tab2, '開始決策'));
    await setSlider(tab2, C.sliders[2]);
    await shot(tab2, 'c-before-refresh', `C on scenario 3, slider moved to ${C.sliders[2]} but not confirmed — then refreshes (EC-4)`);
    await tab2.reload();
    await settle(tab2);
    check('After the refresh: still scenario 3', '/survey/scenarios/2', pathOf(tab2));
    check('The unconfirmed answer is not saved (2 answers)', 2, (await subC())?.results?.length);
    check('The decision step starts over (no confirm button)', false, await button(tab2, /^確認並/).isVisible());
    await shot(tab2, 'c-after-refresh', 'C after the refresh: scenario 3 again, edges hidden, no answer saved');
    await tab2.close();

    ec('EC-5');
    const tab3 = await openPage(deviceC, run.inviteUrl);
    await tab3.waitForURL(/\/survey\/scenarios\/\d+/, { timeout: 30_000 }).catch(() => {});
    await settle(tab3);
    check('Returning via the invite link resumes at scenario 3', '/survey/scenarios/2', pathOf(tab3));
    check('No extra session for C', 1, (await sessionsOf(run.groupId)).filter((s) => s.metadata?.participantId === run.participantIdC).length);
    check('Same submission, still 2 answers', `${run.submissionIdC} / 2`, `${String((await subC())?._id)} / ${(await subC())?.results?.length}`);
    await shot(tab3, 'c-resumed', 'C closed the tab and opened the invite link again: resumed at scenario 3 (EC-5)');

    ec('EC-6');
    await answerScenario(tab3, 2, C.sliders[2], STUDY.scenariosPerSession, false);
    await tab3.waitForURL(/\/survey\/scenarios\/3\b/);
    const reansweredId = (await subC())?.results?.[2]?.scenarioId;
    const countBefore = (await col(ScenarioModel).findOne({ _id: reansweredId }))?.responseCount;
    await tab3.goBack();
    const toastShown = await tab3.getByText('已確認的答案無法修改').waitFor({ timeout: 5000 }).then(() => true, () => false);
    await tab3.waitForURL(/\/survey\/scenarios\/3\b/, { timeout: 5000 }).catch(() => {});
    check('Back keeps C on the next unanswered scenario (scenario 4)', '/survey/scenarios/3', pathOf(tab3));
    check('Toast 「已確認的答案無法修改」 shown', true, toastShown);
    await shot(tab3, 'c-after-back', 'C pressed Back after confirming scenario 3: stays on scenario 4, toast 「已確認的答案無法修改。」 (EC-6)');
    await tab3.getByText('已確認的答案無法修改').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {}); // on a phone it covers the graph
    await settle(tab3);
    const before = (await subC())?.results?.find((x) => x.scenarioId === reansweredId)?.cooperationProbability;
    const changed = await gqlRaw('mutation($id: ID!, $sc: ID!, $v: Float!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: $v) { _id } }',
      { id: run.submissionIdC, sc: reansweredId, v: C.reanswer / 100 }, PARTICIPANT);
    check('Changing the confirmed answer through the API rejected', true, /ANSWER_LOCKED/.test(changed.error ?? ''));
    const retry = await gqlRaw('mutation($id: ID!, $sc: ID!, $v: Float!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: $v) { _id } }',
      { id: run.submissionIdC, sc: reansweredId, v: before }, PARTICIPANT);
    check('Re-sending the same answer (network retry) accepted', null, retry.error);
    const afterBack = await subC();
    check('Still 3 answers', 3, afterBack?.results?.length);
    check('Confirmed answer unchanged', C.sliders[2] / 100, afterBack?.results?.find((x) => x.scenarioId === reansweredId)?.cooperationProbability);
    check('responseCount not counted twice', countBefore, (await col(ScenarioModel).findOne({ _id: reansweredId }))?.responseCount);

    ec(null);
    for (let idx = 3; idx < STUDY.scenariosPerSession; idx++) await answerScenario(tab3, idx, C.sliders[idx], STUDY.scenariosPerSession, false);
    run.debriefC = await finishOutro(tab3, { code: C.code, email: C.email, answers: C.answers, prefix: 'c', record: true });
    const sub = await subC();
    check('C completed with 5 answers', '5 / true', `${sub?.results?.length} / ${sub?.isCompleted}`);
    check('C payoutNtd = amount C saw', run.debriefC, sub?.payoutNtd);
    run.payoutC = sub?.payoutNtd;
    await shot(tab3, 'c-done', 'C finished');
    await tab3.close();
  }, { needs: ['admin'] });

  await step('returnC', '6. C opens the invite link again after completing (EC-7)', async () => {
    ec('EC-7');
    const before = await col(SubmissionModel).findOne({ sessionId: run.sessionIdC });
    const { page } = await expectTurnedAway(deviceC, run.inviteUrl, 'c-return', 'C returns after completing');
    const after = await col(SubmissionModel).findOne({ sessionId: run.sessionIdC });
    check('No new session for C', 1, (await sessionsOf(run.groupId)).filter((s) => s.metadata?.participantId === run.participantIdC).length);
    check('No new submission for C', 1, await col(SubmissionModel).countDocuments({ participantId: run.participantIdC }));
    check('Payout unchanged', before?.payoutNtd, after?.payoutNtd);
    check('Registration code unchanged', C.code, after?.demographics?.gender);
    check('Answers unchanged', JSON.stringify(before?.results?.map((r) => r.cooperationProbability)), JSON.stringify(after?.results?.map((r) => r.cooperationProbability)));
    await page.close();
  }, { needs: ['participantC'] });

  await step('participantD', '7. The same person as A on another device, with A\'s code (EC-8)', async () => {
    ec('EC-8');
    run.d = await apiParticipant(run.groupId, D.participantId, { code: A.code, email: D.email });
    observe('A second device with an already-used registration code is accepted', `completed: ${run.d.isCompleted}, payout NT$${run.d.payoutNtd}`);
  }, { needs: ['admin'] });

  await step('ledger', '8. Admin exports the payment ledger, removes the duplicate, exports again', async () => {
    run.activePage = adminPage;
    await adminPage.goto(`${BASE_URL}/admin/view/batch/${run.groupId}`);
    await settle(adminPage);
    await shot(adminPage, 'admin-before-export', 'Group page after the participants — before Export Payments');

    const first = await exportPayments(adminPage, 'payments-1-before-invalidation.csv');
    run.ledgerFile = first.file;
    check('Filename {group}_payments_YYYYMMDD_HHmmss.csv', true, /_payments_\d{8}_\d{6}\.csv$/.test(first.file));
    check('UTF-8 BOM', 'efbbbf', first.raw.subarray(0, 3).toString('hex'));
    const payable = await col(SubmissionModel).find({ sessionId: { $in: (await sessionsOf(run.groupId)).map((s) => s._id) }, isCompleted: true, isInvalid: { $ne: true } }).toArray();
    check('One row per completed, valid submission (B excluded)', payable.map((s) => String(s._id)).sort().join(','), first.rows.map((r) => r[0]).sort().join(','));

    const a = first.byId[run.submissionIdA] ?? {};
    run.ledgerTotal = Number(a['Total Payout (NTD)']);
    check('A: Registration Code', A.code, a['Registration Code']);
    check('A: Email', A.email, a.Email);
    check('A: Realised Round (1-based)', String(run.draw?.round + 1), a['Realised Round']);
    check('A: Points', String(run.draw?.realisedPoints), a.Points);
    check('A: Participation Fee (NTD)', String(PARTICIPATION_FEE_NTD), a['Participation Fee (NTD)']);
    check('A: Total Payout = debrief amount', run.debriefZ, run.ledgerTotal);
    if (run.submissionIdC) check('C: Total Payout = amount C saw', run.debriefC, Number(first.byId[run.submissionIdC]?.['Total Payout (NTD)']));
    await checkPayoutCard(adminPage, first, 'before invalidation');

    if (run.d) {
      ec('EC-8');
      const codes = first.rows.map((r) => r[first.header.indexOf('Registration Code')]);
      const dupes = [...new Set(codes.filter((c, i) => codes.indexOf(c) !== i))];
      observe('Registration codes listed more than once in the ledger', dupes.length ? dupes.join(', ') : 'none');
      await shot(adminPage, 'ledger-first-export', `First export: ${first.rows.length} rows${dupes.length ? ` — code ${dupes.join(', ')} appears twice` : ''}`);

      const row = adminPage.locator('tr', { hasText: D.participantId }).first();
      await click(row.locator('button[title="Mark as invalid"]'));
      await click(button(adminPage, 'Mark Invalid'));
      await adminPage.waitForTimeout(500);
      await settle(adminPage);
      check('Admin marked the duplicate invalid (DB)', true, (await col(SubmissionModel).findOne({ participantId: D.participantId }))?.isInvalid);
      await shot(adminPage, 'ledger-invalidated', 'Admin marked the duplicate submission invalid');
      const second = await exportPayments(adminPage, 'payments.csv');
      check('After invalidation the duplicate is gone from the ledger', false, Boolean(second.byId[run.d.submissionId]));
      check('A is still listed with the same total', run.debriefZ, Number(second.byId[run.submissionIdA]?.['Total Payout (NTD)']));
      await checkPayoutCard(adminPage, second, 'after invalidation, no reload');
      run.ledger = second;
    } else {
      run.ledger = first;
      await fs.copyFile(path.join(OUT_DIR, 'payments-1-before-invalidation.csv'), path.join(OUT_DIR, 'payments.csv'));
    }
    await settle(adminPage);
    await shot(adminPage, 'admin-after-export', `Export Payments downloaded ${run.ledger.file}`);

    // Submissions CSV carries the questionnaire answers (REQ-416)
    const [download] = await Promise.all([adminPage.waitForEvent('download'), click(button(adminPage, 'Export CSV'))]);
    await download.saveAs(path.join(OUT_DIR, 'submissions.csv'));
    const [header = [], ...rows] = parseCsv((await fs.readFile(path.join(OUT_DIR, 'submissions.csv'), 'utf8')).replace(/^\uFEFF/, '')).filter((r) => r.some(Boolean));
    check('Submissions CSV has columns Q1–Q8', true, QUESTIONNAIRE.every((x) => header.includes(x.id)));
    const rowA = rows.find((r) => r[header.indexOf('Submission ID')] === run.submissionIdA);
    check('A\'s CSV row has the questionnaire answers', expectedAnswers(A.answers).map((x) => x.answer).join(','),
      rowA && QUESTIONNAIRE.map((x) => rowA[header.indexOf(x.id)]).join(','));
  }, { needs: ['participantA', 'database'] });

  await step('fullGroup', '9. A group whose scenarios all reached their target (EC-9)', async () => {
    ec('EC-9');
    const { createMixedGroup: g } = await gql(
      'mutation($i: GroupConfigInput!, $n: String!) { createMixedGroup(input: $i, name: $n) { groupId totalScenarios } }',
      { i: { maxK: 1, scenariosPerSession: STUDY.expectedScenarios, targetSizePerScenario: 1, focalNode: 'KMT1', opponentNode: 'DPP4', sampleSize: 1 }, n: 'E2E full group' },
      { token: run.adminToken });
    run.fullGroupId = g.groupId;
    const filler = await apiParticipant(g.groupId, 'e2e-filler', { code: 'FILL01', email: 'filler@example.com' });
    check('The filler answered every scenario', g.totalScenarios, filler.scenarios);
    check('Every scenario reached its target', 0, await col(ScenarioModel).countDocuments({ groupId: g.groupId, responseCount: { $lt: 1 } }));
    check('Group marked completed (REQ-309)', 'completed', (await col(SessionGroupModel).findOne({ _id: g.groupId }))?.status);

    const deviceE = await newContext(DEVICES.E);
    const url = `${BASE_URL}/survey/welcome?groupId=${g.groupId}&mode=mixed`;
    await expectTurnedAway(deviceE, url, 'full-group', 'New visitor to a full group');
    check('No session created for the new visitor (REQ-405.1)', 1, (await sessionsOf(g.groupId)).length);
    const apiStart = await gqlRaw('mutation($g: ID!) { startMixedSession(groupId: $g, participantId: "e2e-late") { sessionId } }', { g: g.groupId }, PARTICIPANT);
    check('startMixedSession refused for a full group (GROUP_FULL)', true, /GROUP_FULL/.test(apiStart.error ?? ''));
    const extra = (await sessionsOf(g.groupId)).find((s) => s.metadata?.participantId !== 'e2e-filler');
    if (extra) {
      const reused = await col(ScenarioModel).countDocuments({ _id: { $in: extra.scenarioIds }, responseCount: { $gte: 1 } });
      observe('The visitor was given scenarios that already reached their target', `${reused} of ${extra.scenarioIds.length}`);
    }
    await deviceE.close();
  }, { needs: ['admin'] });

  await step('entryPoints', '10. Non-Chrome browser and an unknown invite link (EC-10, EC-11)', async () => {
    ec('EC-10');
    const firefox = await newContext(DEVICES.firefox);
    const ff = await openPage(firefox, run.inviteUrl);
    check('Chrome notice shown', true, (await bodyText(ff)).includes('請使用 Google Chrome 瀏覽器'));
    check('開始實驗 disabled', true, await button(ff, '開始實驗').isDisabled());
    await shot(ff, 'non-chrome', 'Firefox user agent: Chrome notice, 開始實驗 disabled (EC-10)');
    await firefox.close();

    ec('EC-11');
    const deviceX = await newContext(DEVICES.X);
    const page = await openPage(deviceX, `${BASE_URL}/survey/welcome?groupId=does-not-exist&mode=mixed`);
    const text = await bodyText(page);
    check('「找不到此實驗」 shown on arrival (REQ-405.2)', true, text.includes('找不到此實驗'));
    check('Tells the participant to check the link with the researcher', true, text.includes('請向研究人員確認連結'));
    check('No 開始實驗 button', false, await button(page, '開始實驗').isVisible());
    check('No session created', 0, (await sessionsOf('does-not-exist')).length);
    await shot(page, 'unknown-link-arrival', 'Invite link with an unknown group — on arrival (EC-11)');
    await deviceX.close();
  }, { needs: ['admin'] });

  await step('apiGuards', '11. Direct API misuse (EC-12)', async () => {
    ec('EC-12');
    const scenarioId = (await col(SessionModel).findOne({ _id: run.sessionIdA }))?.scenarioIds?.[0];
    const outOfRange = await gqlRaw('mutation($id: ID!, $sc: ID!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: 1.5) { _id } }',
      { id: run.submissionIdA, sc: scenarioId }, PARTICIPANT);
    check('Answer 1.5 rejected (REQ-402)', 'cooperationProbability must be between 0 and 1', outOfRange.error);
    const noTurnstile = await gqlRaw('mutation($g: ID!) { startMixedSession(groupId: $g, participantId: "e2e-bot") { sessionId } }', { g: run.groupId });
    check('Starting without Turnstile rejected (REQ-100)', true, /Turnstile verification required/.test(noTurnstile.error ?? ''));
    const noAdmin = await gqlRaw('query($g: ID!) { submissionsByGroup(groupId: $g) { _id demographics { education } } }', { g: run.groupId });
    check('Participant emails without admin login rejected (REQ-408.8)', 'Unauthorized', noAdmin.error);
    if (run.d) {
      const reanswer = await gqlRaw('mutation($id: ID!, $sc: ID!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: 0.9) { _id } }',
        { id: run.d.submissionId, sc: (await col(SubmissionModel).findOne({ participantId: D.participantId }))?.results?.[0]?.scenarioId }, PARTICIPANT);
      check('Changing an answer of a completed submission rejected (REQ-402.4)', true, /ANSWER_LOCKED/.test(reanswer.error ?? ''));
    }
    // BUG-012: a completed submission cannot be completed again (would redirect the payment email)
    const complete = 'mutation($id: ID!, $q: [QuestionnaireAnswerInput!]!) { completeSurvey(submissionId: $id, demographics: { age: 0, gender: "X", education: "attacker@example.com" }, questionnaire: $q) { _id } }';
    const before = await col(SubmissionModel).findOne({ sessionId: run.sessionIdA });
    const again = await gqlRaw(complete, { id: run.submissionIdA, q: expectedAnswers(QUESTIONNAIRE.map(() => 1)) }, PARTICIPANT);
    check('Completing a completed submission rejected (REQ-402.4, BUG-012)', true, /ALREADY_COMPLETED/.test(again.error ?? ''));
    const after = await col(SubmissionModel).findOne({ sessionId: run.sessionIdA });
    check('A\'s email, answers and completedAt unchanged', JSON.stringify([before?.demographics?.education, before?.questionnaire, before?.completedAt]),
      JSON.stringify([after?.demographics?.education, after?.questionnaire, after?.completedAt]));
    const noAnswers = await gqlRaw('mutation($id: ID!) { completeSurvey(submissionId: $id, demographics: { age: 0, gender: "X", education: "x@example.com" }) { _id } }',
      { id: run.submissionIdA }, PARTICIPANT);
    check('Completing without the questionnaire rejected (REQ-416)', true, Boolean(noAnswers.error));
  }, { needs: ['participantA'] });

  await deviceC.close();
  await admin.close();
}

// ── Report ───────────────────────────────────────────────────────────────────
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function fmt(v) { return v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v); }
const mark = (c) => (c.kind === 'note' ? '<span class="info">ℹ</span>' : c.pass ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>');
const git = (...args) => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return '?'; } };

function edgeCaseResult(id) {
  const checks = steps.flatMap((s) => s.checks).filter((c) => c.ec === id);
  const ran = steps.filter((s) => s.checks.some((c) => c.ec === id));
  const stepTitles = [...new Set(ran.map((s) => s.title.split(' ')[0]))].join(' ');
  const stepId = ran[0]?.id;
  if (!checks.length) return { result: 'not run', stepTitles, stepId };
  if (checks.some((c) => c.kind === 'check' && !c.pass)) return { result: 'fail', stepTitles, stepId };
  return { result: checks.every((c) => c.kind === 'note') ? 'observed' : 'pass', stepTitles, stepId, notes: checks.filter((c) => c.kind === 'note') };
}

async function writeReport() {
  const realChecks = steps.flatMap((s) => s.checks).filter((c) => c.kind === 'check');
  const passed = steps.length > 0 && steps.every((s) => s.status === 'pass');
  const serverLog = existsSync(path.join(OUT_DIR, 'server.log')) ? await fs.readFile(path.join(OUT_DIR, 'server.log'), 'utf8') : '';
  const pairingLine = serverLog.split('\n').find((l) => l.includes('opponentProbs matched=')) ?? '(not found in server.log)';
  const z = run.debriefZ;
  const trail = [
    ['Debrief 合計 (participant sees)', run.debriefZ],
    ['Debrief after reload', run.debriefAfterReload],
    ['Email step text', run.emailZ],
    ['DB Submission.payoutNtd', run.draw?.payoutNtd],
    [`Recomputed: totalPayoutNtd(payoffPoints(${run.draw?.my}, ${run.draw?.opp})) = ${run.recomputedPoints} pt × ${POINT_TO_NTD} + ${PARTICIPATION_FEE_NTD}`, run.recomputedTotal],
    ['Ledger Total Payout (researcher pays)', run.ledgerTotal],
  ];
  const badge = {
    pass: '<span class="ok">PASS</span>', fail: '<span class="bad">FAIL</span>', broken: '<span class="bad">BROKEN</span>',
    'not run': '<span class="muted">NOT RUN</span>', observed: '<span class="info">OBSERVED</span>',
  };
  const observations = steps.flatMap((s) => s.checks.filter((c) => c.kind === 'note').map((c) => ({ ...c, step: s.title })));
  const ecTitle = Object.fromEntries(EDGE_CASES.map(([id, title, expected]) => [id, { title, expected }]));
  const ecResults = Object.fromEntries(EDGE_CASES.map(([id]) => [id, edgeCaseResult(id)]));
  const counts = ['pass', 'observed', 'fail', 'not run'].map((r) => `${Object.values(ecResults).filter((x) => x.result === r).length} ${r}`).join(' · ');
  const roadmap = ROADMAP.map(([stage, happyId, ids], i) => {
    const happy = steps.find((s) => s.id === happyId);
    const dot = happy ? (happy.status === 'pass' ? 'pass' : happy.status === 'not run' ? 'not run' : 'fail') : 'none';
    const chips = ids.map((id) => {
      const r = ecResults[id];
      return `<a class="chip r-${r.result.replace(' ', '-')}" href="${r.stepId ? `#step-${r.stepId}` : '#'}" title="Expected: ${esc(ecTitle[id].expected)}"><b>${id}</b> ${esc(ecTitle[id].title)} <i>${r.result.toUpperCase()}</i></a>`;
    }).join('');
    return `<div class="stage"><div class="dot r-${dot.replace(' ', '-')}">${i + 1}</div><div class="stage-body">
      <div class="stage-name">${esc(stage)} ${happy ? `<span class="happy">happy path ${badge[happy.status]}</span>` : ''}</div>
      <div class="chips">${chips || '<span class="muted">no edge cases at this stage</span>'}</div></div></div>`;
  }).join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>E2E full-flow report${MOBILE ? ' — phone' : ''}</title><style>
  body{font:14px/1.5 -apple-system,"PingFang TC","Noto Sans TC",sans-serif;margin:0 auto;max-width:1100px;padding:24px;color:#111;background:#fff}
  h1{margin:0 0 4px} h2{margin-top:36px;border-bottom:2px solid #eee;padding-bottom:4px} h3{margin:24px 0 8px}
  table{border-collapse:collapse;width:100%;margin:8px 0} td,th{border:1px solid #ddd;padding:5px 8px;text-align:left;vertical-align:top} th{background:#f6f6f6}
  .banner{padding:14px 18px;border-radius:8px;font-size:20px;font-weight:700;color:#fff;margin:12px 0} .pass{background:#15803d} .failb{background:#b91c1c}
  .ok{color:#15803d;font-weight:700} .bad{color:#b91c1c;font-weight:700} .muted{color:#888} .info{color:#1d4ed8;font-weight:700}
  figure{margin:12px 0 20px;break-inside:avoid} figure img{width:100%;border:1px solid #ccc;border-radius:6px} figcaption{color:#444;font-size:13px;margin-top:4px}
  figure.phone{display:inline-block;vertical-align:top;width:300px;margin-right:14px} figure.phone img{width:300px}
  pre{background:#f6f6f6;padding:8px;overflow-x:auto;white-space:pre-wrap;font-size:12px} code{font-size:12px}
  .step{break-before:page} .ledger td,.ledger th{font-size:11px;word-break:break-all}
  .roadmap{position:relative;margin:12px 0} .roadmap:before{content:"";position:absolute;left:15px;top:16px;bottom:16px;width:2px;background:#ddd}
  .stage{display:flex;gap:14px;margin:0 0 14px;break-inside:avoid;position:relative} .stage-name{font-weight:700;margin:5px 0 6px}
  .dot{flex:none;width:32px;height:32px;border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;background:#9ca3af}
  .happy{font-weight:400;font-size:12px;color:#555;margin-left:8px} .chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip{display:inline-block;padding:4px 10px;border-radius:14px;border:1px solid;font-size:12.5px;text-decoration:none;color:#111} .chip i{font-style:normal;font-size:10.5px;font-weight:700;margin-left:4px}
  .dot.r-pass{background:#15803d} .dot.r-fail{background:#b91c1c}
  .chip.r-pass{background:#ecfdf3;border-color:#86efac} .chip.r-pass i{color:#15803d}
  .chip.r-fail{background:#fef2f2;border-color:#fca5a5} .chip.r-fail i{color:#b91c1c}
  .chip.r-observed{background:#eff6ff;border-color:#93c5fd} .chip.r-observed i{color:#1d4ed8}
  .chip.r-not-run{background:#f6f6f6;border-color:#ddd} .chip.r-not-run i{color:#888}
  </style></head><body>
  <h1>E2E full-flow report${MOBILE ? ' — phone (390×844)' : ''}</h1>
  ${MOBILE ? '<div class="muted">Participants on an emulated phone: 390×844, touch, Android Chrome. The admin console stays on desktop (NFR-8.3).</div>' : ''}
  <div class="muted">Admin launch → invite link → participant survey → debrief → payment ledger, plus edge cases (NFR-8, NFR-8.1)</div>
  <div class="banner ${passed ? 'pass' : 'failb'}">${passed ? 'PASS' : 'FAIL'} — ${realChecks.filter((c) => c.pass).length}/${realChecks.length} checks passed · ${observations.length} observations</div>

  <h2>Roadmap</h2>
  <p class="muted">The participant journey, stage by stage. Each chip is one edge case; hover for the expected behaviour, click to jump to its step. Edge cases: ${counts}.
  <span class="chip r-pass"><i>PASS</i></span> <span class="chip r-fail"><i>FAIL</i></span> <span class="chip r-observed"><i>OBSERVED</i> needs a decision</span> <span class="chip r-not-run"><i>NOT RUN</i></span></p>
  <div class="roadmap">${roadmap}</div>

  <h2>Summary</h2>
  <table>
  <tr><th>Run</th><td>${esc(run.startedAt.toLocaleString('zh-TW', { hour12: false }))} · ${((Date.now() - run.startedAt) / 1000).toFixed(0)} s</td></tr>
  <tr><th>Code</th><td>${esc(git('rev-parse', '--short', 'HEAD'))}${git('status', '--porcelain') ? ' (uncommitted changes)' : ''}</td></tr>
  <tr><th>Payment settings</th><td>1 點 = NT$${POINT_TO_NTD} · participation fee NT$${PARTICIPATION_FEE_NTD} · range NT$${MIN_TOTAL_NTD}–${MAX_TOTAL_NTD}</td></tr>
  <tr><th>Study</th><td>focal ${STUDY.focalNode}, partner ${STUDY.opponentNode}, max k ${STUDY.maxK}, ${STUDY.scenariosPerSession} scenarios/participant, target ${STUDY.targetSizePerScenario}/scenario → ${STUDY.expectedScenarios} scenarios</td></tr>
  <tr><th>Group</th><td><code>${esc(run.groupId)}</code></td></tr>
  <tr><th>Participant A</th><td>submission <code>${esc(run.submissionIdA)}</code> · code ${A.code} · ${A.email} · answers ${A.sliders.join('/')}%</td></tr>
  <tr><th>Payout</th><td><strong>NT$${esc(z)}</strong> (round ${run.draw ? run.draw.round + 1 : '?'}, ${esc(run.draw?.realisedPoints)} 點)</td></tr>
  <tr><th>Steps</th><td>${steps.map((s) => `${badge[s.status]} ${esc(s.title)}`).join('<br>')}</td></tr>
  </table>

  <h2>Edge cases</h2>
  <table><tr><th>ID</th><th>Case</th><th>Expected</th><th>Step</th><th>Result</th></tr>
  ${EDGE_CASES.map(([id, title, expected]) => { const r = edgeCaseResult(id); return `<tr><td>${id}</td><td>${esc(title)}</td><td>${esc(expected)}</td><td>${esc(r.stepTitles)}</td><td>${badge[r.result]}</td></tr>`; }).join('')}
  </table>

  <h2>Observations</h2>
  <p>Behaviour no requirement defines yet. These never fail the run; they need a decision.</p>
  ${observations.length ? `<table><tr><th>Case</th><th>Observation</th><th>What happened</th></tr>${observations.map((o) => `<tr><td>${esc(o.ec ?? '')}</td><td>${esc(o.label)}</td><td>${esc(o.actual)}</td></tr>`).join('')}</table>` : '<p class="muted">None.</p>'}

  <h2>Money trail (participant A)</h2>
  <p>Every amount must equal what the participant was shown on the debrief (NT$${esc(z)}).</p>
  <table><tr><th>Where</th><th>Amount (NT$)</th><th></th></tr>
  ${trail.map(([where, amount]) => `<tr><td>${esc(where)}</td><td>${esc(amount)}</td><td>${mark({ pass: amount !== undefined && amount === z })}</td></tr>`).join('')}
  </table>
  ${run.draw ? `<p>Realised round ${run.draw.round + 1}: participant ${run.draw.my ? '給' : '不給'}, partner ${run.draw.opp ? '給' : '不給'} → ${run.recomputedPoints} 點.</p>` : ''}

  <h2>Steps</h2>
  ${steps.map((s) => `<section class="step" id="step-${esc(s.id)}"><h3>${badge[s.status]} ${esc(s.title)}</h3>
    ${s.error ? `<pre class="${s.status === 'broken' ? 'bad' : 'muted'}">${esc(s.error)}</pre>` : ''}
    ${s.checks.length ? `<table><tr><th>Case</th><th>Check</th><th>Expected</th><th>Actual</th><th></th></tr>${s.checks.map((c) => `<tr><td>${esc(c.ec ?? '')}</td><td>${esc(c.label)}</td><td>${c.kind === 'note' ? '<span class="muted">(observation)</span>' : esc(fmt(c.expected))}</td><td>${esc(c.kind === 'note' ? c.actual : fmt(c.actual))}</td><td>${mark(c)}</td></tr>`).join('')}</table>` : ''}
    ${s.shots.map((sh) => `<figure${sh.phone ? ' class="phone"' : ''}><img src="${esc(sh.file)}" alt="${esc(sh.caption)}"><figcaption>${esc(sh.file.replace('shots/', ''))} — ${esc(sh.caption)}</figcaption></figure>`).join('')}
  </section>`).join('')}

  <h2 class="step">Payment ledger (final export)</h2>
  ${run.ledger ? `<p>${esc(run.ledger.file)} · ${run.ledger.rows.length} row(s). Participant B (incomplete) and the invalidated duplicate are not listed. The export before invalidation is kept as <code>payments-1-before-invalidation.csv</code>.</p>
  <table class="ledger"><tr>${run.ledger.header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${run.ledger.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : '<p class="muted">Not exported.</p>'}

  <h2>Known issues</h2>
  <p><strong>BUG-008 — partner pairing never matches a real participant.</strong> The 搭檔 decision on the debrief is a 50/50 draw, not another participant's answer, so this test checks the payout against the persisted draws only. Server log:</p>
  <pre>${esc(pairingLine.trim())}</pre>
  </body></html>`;

  const reportPath = path.join(OUT_DIR, 'report.html');
  await fs.writeFile(reportPath, html);
  // Data for the combined PC + phone report (scripts/e2e/run-both.mjs, NFR-8.3)
  await fs.writeFile(path.join(OUT_DIR, 'results.json'), JSON.stringify({
    device: MOBILE ? 'phone' : 'pc', passed, startedAt: run.startedAt, durationS: Math.round((Date.now() - run.startedAt) / 1000),
    steps: steps.map(({ id, title, status, error, checks, shots }) => ({ id, title, status, error, checks, shots })),
    edgeCases: EDGE_CASES.map(([id, title, expected]) => ({ id, title, expected, ...edgeCaseResult(id) })),
    roadmap: ROADMAP, trail, debriefZ: z, draw: run.draw ?? null, recomputedPoints: run.recomputedPoints ?? null,
    groupId: run.groupId, submissionIdA: run.submissionIdA,
    ledger: run.ledger ? { file: run.ledger.file, header: run.ledger.header, rows: run.ledger.rows } : null,
    pairingLine: pairingLine.trim(),
  }, null, 1));
  if (browser) {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(reportPath).href, { waitUntil: 'load' });
    await page.pdf({ path: path.join(OUT_DIR, 'report.pdf'), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
    await page.close();
  }
  return { reportPath, passed };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(path.join(ROOT, 'dist/index.html'))) throw new Error('dist/ is missing — run `npm run test:e2e` (it builds first)');
  await fs.mkdir(SHOTS_DIR, { recursive: true });

  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri('e2e');
  db = (await mongoose.createConnection(mongoUri).asPromise()).db;

  const serverLog = createWriteStream(path.join(OUT_DIR, 'server.log'));
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), MONGODB_URI: mongoUri, ADMIN_PASSWORD, JWT_SECRET: 'e2e-secret', NODE_ENV: 'development', CLIENT_ORIGIN: BASE_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.pipe(serverLog);
  server.stderr.pipe(serverLog);

  let result;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    await waitForServer(`${BASE_URL}/api/turnstile/status`);
    tailwind = await loadTailwindRuntime();
    await journey();
  } catch (error) {
    // Setup failures (before any step) still produce a report
    steps.push({ id: 'setup', title: 'Setup', shots: [], checks: [], status: 'broken', error: String(error?.stack || error) });
    console.error(error);
  } finally {
    server.kill();
    await new Promise((r) => setTimeout(r, 300)); // let the last log lines flush
    try { result = await writeReport(); } catch (error) { console.error('Report failed:', error); }
    await browser?.close();
    await mongoose.disconnect();
    await mongo.stop();
  }

  console.log(`\n${result?.passed ? 'E2E PASSED' : 'E2E FAILED'} — report: ${result?.reportPath ?? '(not written)'}`);
  process.exitCode = result?.passed ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
