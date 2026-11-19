// Simulated pilot data check (NFR-9; docs/design.md Phase 55).
// Fills a local Mixed Mode study with simulated participants of known behaviour (personas),
// exports the research CSV and the payment ledger from the real admin page, and checks every
// value against what was sent — so data problems show up before real participants are recruited.
// Usage: npm run sim:data   (builds dist/ first)
// Env: SIM_MAX_K (2) SIM_PER_SESSION (10) SIM_TARGET (2) SIM_CONCURRENCY (8) SIM_SEED (1) SIM_PORT (3300)
// Output: test-results/sim/<timestamp>/ — report.md, research.csv, payments.csv, ground-truth.json, server.log
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { chromium } from 'playwright-core';
import { QUESTIONNAIRE } from '../../utils/questionnaire.js';
import { turnstileCookieValue } from '../turnstile-cookie.mjs';
import { payoffPoints, totalPayoutNtd, MIN_TOTAL_NTD, MAX_TOTAL_NTD } from '../../utils/payment.js';
import { SessionGroupModel } from '../../backend/models/SessionGroup.js';
import { SessionModel } from '../../backend/models/Session.js';
import { ScenarioModel } from '../../backend/models/Scenario.js';
import { SubmissionModel } from '../../backend/models/Submission.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = (name, fallback) => Number(process.env[name] ?? fallback);
const PORT = env('SIM_PORT', 3300);
const BASE_URL = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = 'sim-admin';
const STUDY = { maxK: env('SIM_MAX_K', 2), scenariosPerSession: env('SIM_PER_SESSION', 10), targetSizePerScenario: env('SIM_TARGET', 2), focalNode: 'KMT1', opponentNode: 'DPP4' };
const CONCURRENCY = env('SIM_CONCURRENCY', 8);
const MAX_PARTICIPANTS = env('SIM_MAX_PARTICIPANTS', 2000);
const PLANTED_SLOPE = 0.6; // Conditional: p = 0.2 + 0.6 × share
const stamp = new Date().toLocaleString('sv').replace(/\D/g, '').replace(/^(\d{8})/, '$1_'); // local time, as the e2e
const OUT_DIR = path.join(ROOT, 'test-results/sim', stamp);

// ── Seeded randomness (mulberry32), so a run's personas and answers can be repeated ──
let seed = env('SIM_SEED', 1) >>> 0;
const rand = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const prob = (x) => Math.round(Math.min(1, Math.max(0, x)) * 100) / 100; // slider step 0.01
const ms = (median, spread = 0.4) => Math.max(0, Math.round(median * Math.exp(spread * normal())));
const giveShare = (edgeStates) => {
  const v = Object.values(edgeStates ?? {});
  return v.length ? v.filter((s) => s === 'give').length / v.length : 0;
};

const conditional = (sc) => prob(0.2 + PLANTED_SLOPE * giveShare(sc.edgeStates) + 0.08 * normal());
// `of20`: how many of every 20 participants get the persona. Handed out from a fixed deck, so
// every persona shows up in every run of 20+ (a random draw left whole personas out).
const PERSONAS = [
  { name: 'conditional', of20: 11, p: conditional, rt: () => ms(8000) },
  { name: 'cooperator', of20: 2, p: () => prob(0.9 + 0.05 * normal()), rt: () => ms(6000) },
  { name: 'defector', of20: 2, p: () => prob(0.1 + 0.05 * normal()), rt: () => ms(6000) },
  { name: 'straightliner', of20: 1, p: () => 0.5, rt: () => ms(3000, 0.2) },
  { name: 'speeder', of20: 1, p: () => prob(rand()), rt: () => 300 + Math.round(rand() * 1200) },
  { name: 'retrier', of20: 1, p: conditional, rt: () => ms(8000), retry: true },
  { name: 'dropout', of20: 2, p: conditional, rt: () => ms(8000), dropout: true },
];
const DECK = PERSONAS.flatMap((p) => Array(p.of20).fill(p));
// Interleave the deck (stride 7 is coprime with 20) so the rare personas are spread over the run
const personaOf = (n) => DECK[(n * 7) % DECK.length];

// ── API ──────────────────────────────────────────────────────────────────────
const PARTICIPANT = { Cookie: '' }; // REQ-102.1: signed cookie, set once the server is up
async function gql(query, variables = {}, headers = PARTICIPANT) {
  const response = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

/** One simulated participant through the same calls the survey page makes. Returns its ground truth, or null when the group is full. */
async function participant(n, groupId) {
  const persona = personaOf(n);
  const id = `sim-${String(n).padStart(4, '0')}`;
  let s;
  try {
    ({ startMixedSession: s } = await gql(
      'mutation($g: ID!, $p: String) { startMixedSession(groupId: $g, participantId: $p) { sessionId assignedScenarios { _id edgeStates } } }',
      { g: groupId, p: id }));
  } catch (error) {
    if (/GROUP_FULL/.test(error.message)) return null;
    throw error;
  }
  const consent = { consentedAt: new Date().toISOString(), version: 'sim' }; // REQ-417
  const { startSurvey: sub } = await gql('mutation($s: ID!, $p: String, $c: ConsentInput) { startSurvey(sessionId: $s, participantId: $p, consent: $c) { _id } }', { s: s.sessionId, p: id, c: consent });
  const truth = { participantId: id, persona: persona.name, sessionId: s.sessionId, submissionId: sub._id, assigned: s.assignedScenarios.map((x) => x._id), answers: [], completed: false };
  const stopAfter = persona.dropout ? 1 + Math.floor(rand() * Math.max(1, s.assignedScenarios.length - 1)) : Infinity;
  const save = 'mutation($id: ID!, $sc: ID!, $v: Float!, $t: Int!) { saveSurveyAnswer(submissionId: $id, scenarioId: $sc, cooperationProbability: $v, responseTime: $t) { _id } }';
  for (const scenario of s.assignedScenarios.slice(0, stopAfter)) {
    const answer = { scenarioId: scenario._id, p: persona.p(scenario), responseTime: persona.rt() };
    const vars = { id: sub._id, sc: answer.scenarioId, v: answer.p, t: answer.responseTime };
    await gql(save, vars);
    if (persona.retry) await gql(save, vars); // a network retry of the same confirm
    truth.answers.push(answer);
  }
  if (persona.dropout) return truth;
  const { drawRealisedRound: draw } = await gql('mutation($id: ID!) { drawRealisedRound(submissionId: $id) { payoutNtd } }', { id: sub._id });
  truth.code = `SIM${String(n).padStart(4, '0')}`;
  truth.email = `${id}@example.com`;
  // REQ-416: Boolean, true = the first option
  truth.questionnaire = QUESTIONNAIRE.map((q) => ({ questionId: q.id, answer: rand() < 0.5 }));
  await gql(
    'mutation($id: ID!, $code: String!, $email: String!, $q: [QuestionnaireAnswerInput!]!) { completeSurvey(submissionId: $id, registrationCode: $code, email: $email, questionnaire: $q) { _id } }',
    { id: sub._id, code: truth.code, email: truth.email, q: truth.questionnaire });
  truth.completed = true;
  truth.shownPayoutNtd = draw.payoutNtd;
  return truth;
}

/** Workers keep recruiting until the server turns new participants away. */
async function recruit(groupId) {
  const truths = [];
  let next = 0;
  let full = false;
  const worker = async () => {
    while (!full && next < MAX_PARTICIPANTS) {
      const t = await participant(++next, groupId);
      if (t) truths.push(t); else full = true;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { truths, full };
}

// ── Export through the admin page ────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some(Boolean));
  return { header, raw: text, rows: body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))) };
}

async function exportCsvs(groupId, token) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    await context.route(/cdn\.tailwindcss\.com|challenges\.cloudflare\.com/, (route) => route.abort());
    await context.addInitScript((t) => localStorage.setItem('token', t), token);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/admin/view/batch/${groupId}`);
    const out = {};
    for (const [label, file] of [['Export CSV', 'research.csv'], ['Export Payments', 'payments.csv']]) {
      const button = page.getByRole('button', { name: label }).first();
      await button.waitFor({ state: 'visible', timeout: 30_000 });
      await page.waitForFunction((el) => !el.disabled, await button.elementHandle(), { timeout: 30_000 });
      const [download] = await Promise.all([page.waitForEvent('download'), button.click({ force: true })]);
      await download.saveAs(path.join(OUT_DIR, file));
      out[file] = parseCsv((await fs.readFile(path.join(OUT_DIR, file), 'utf8')).replace(/^﻿/, ''));
    }
    return out;
  } finally {
    await browser.close();
  }
}

// ── Checks ───────────────────────────────────────────────────────────────────
const results = [];
const check = (id, label, expected, actual, pass = Object.is(expected, actual)) => {
  results.push({ id, label, expected, actual, pass: Boolean(pass) });
  console.log(`  ${pass ? '✓' : '✗'} ${id} ${label}${pass ? '' : ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
};
const observe = (label, actual) => {
  results.push({ id: 'obs', label, expected: '', actual, pass: true, note: true });
  console.log(`  ℹ ${label}: ${typeof actual === 'string' ? actual : JSON.stringify(actual)}`);
};
/** Up to 3 examples of what went wrong, so a failure points at the data. */
const firstBad = (list) => (list.length ? list.slice(0, 3) : 'none');
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const sd = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
function slope(xs, ys) {
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0; let den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return num / den;
}
const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

async function runChecks({ db, groupId, truths, full, csv, ledger }) {
  const subs = await db.collection(SubmissionModel.collection.collectionName).find({ participantId: { $regex: /^sim-/ } }).toArray();
  const sessions = await db.collection(SessionModel.collection.collectionName).find({ groupId }).toArray();
  const scenarios = await db.collection(ScenarioModel.collection.collectionName).find({ groupId }).toArray();
  const group = await db.collection(SessionGroupModel.collection.collectionName).findOne({ _id: groupId });
  const subById = new Map(subs.map((s) => [String(s._id), s]));
  const sessionById = new Map(sessions.map((s) => [String(s._id), s]));
  const completedTruths = truths.filter((t) => t.completed);

  console.log('\nData checks');
  check('D0', 'Every simulated participant has a submission in the DB', truths.length, truths.filter((t) => subById.has(t.submissionId)).length);

  const d1 = completedTruths.flatMap((t) => {
    const s = subById.get(t.submissionId);
    const ids = s?.results.map((r) => r.scenarioId) ?? [];
    const inSession = new Set((sessionById.get(t.sessionId)?.scenarioIds ?? []).map(String));
    const bad = [];
    if (ids.length !== t.assigned.length) bad.push(`${t.participantId}: ${ids.length}/${t.assigned.length} answers`);
    if (new Set(ids).size !== ids.length) bad.push(`${t.participantId}: duplicate answers`);
    if (ids.some((id) => !inSession.has(String(id)))) bad.push(`${t.participantId}: answer outside its session`);
    return bad;
  });
  check('D1', 'Completed submissions: one answer per assigned scenario, no duplicates, none outside the session', 'none', firstBad(d1));

  const d2 = truths.flatMap((t) => t.answers.flatMap((a) => {
    const r = subById.get(t.submissionId)?.results.find((x) => x.scenarioId === a.scenarioId);
    if (!r) return [`${t.participantId}: answer to ${a.scenarioId} missing`];
    if (r.cooperationProbability !== a.p || r.responseTime !== a.responseTime || !r.answeredAt) {
      return [`${t.participantId}: sent p=${a.p} rt=${a.responseTime}, stored p=${r.cooperationProbability} rt=${r.responseTime} at=${r.answeredAt}`];
    }
    return [];
  }));
  check('D2', 'Every stored answer (probability, response time, answeredAt) equals what was sent', 'none', firstBad(d2));

  const stored = new Map();
  for (const s of subs) for (const r of s.results) stored.set(r.scenarioId, (stored.get(r.scenarioId) ?? 0) + 1);
  const d3 = scenarios.filter((sc) => sc.responseCount !== (stored.get(String(sc._id)) ?? 0))
    .map((sc) => `${sc._id}: responseCount ${sc.responseCount}, stored ${stored.get(String(sc._id)) ?? 0}`);
  check('D3', 'Scenario.responseCount = stored answers (retries not counted twice)', 'none', firstBad(d3));

  const d4 = completedTruths.flatMap((t) => {
    const s = subById.get(t.submissionId);
    const bad = [];
    if (!s?.isCompleted) bad.push(`${t.participantId}: not completed`);
    if (s?.registrationCode !== t.code || s?.email !== t.email) bad.push(`${t.participantId}: code/email`);
    if (!s?.consentedAt || s?.consentVersion !== 'sim' || !s?.deviceType) bad.push(`${t.participantId}: consent/device`);
    if (JSON.stringify(s?.questionnaire?.map(({ questionId, answer }) => ({ questionId, answer }))) !== JSON.stringify(t.questionnaire)) bad.push(`${t.participantId}: Q1–Q8`);
    return bad;
  });
  check('D4', 'Stored Q1–Q8, registration code, email, consent and device equal what was sent', 'none', firstBad(d4));

  const d5 = completedTruths.flatMap((t) => {
    const s = subById.get(t.submissionId);
    const r = s?.realisedRoundIndex;
    const expected = totalPayoutNtd(payoffPoints(s?.myDecisions?.[r], s?.opponentDecisions?.[r]));
    const bad = [];
    if (s?.myDecisions?.length !== s?.results.length) bad.push(`${t.participantId}: ${s?.myDecisions?.length} decisions for ${s?.results.length} answers`);
    if (s?.payoutNtd !== expected || s?.payoutNtd !== t.shownPayoutNtd) bad.push(`${t.participantId}: stored ${s?.payoutNtd}, rule ${expected}, shown ${t.shownPayoutNtd}`);
    if (!(s?.payoutNtd >= MIN_TOTAL_NTD && s?.payoutNtd <= MAX_TOTAL_NTD)) bad.push(`${t.participantId}: ${s?.payoutNtd} outside ${MIN_TOTAL_NTD}–${MAX_TOTAL_NTD}`);
    return bad;
  });
  check('D5', 'Every payout follows the payment rule and was the amount shown (REQ-408)', 'none', firstBad(d5));

  // D6 — research CSV vs DB
  const rowsBySub = new Map();
  for (const row of csv.rows) rowsBySub.set(row['Submission ID'], [...(rowsBySub.get(row['Submission ID']) ?? []), row]);
  const expectedRows = subs.reduce((n, s) => n + Math.max(1, s.results.length), 0);
  check('D6', 'Research CSV: one row per stored answer (+1 per submission without answers)', expectedRows, csv.rows.filter((r) => subById.has(r['Submission ID'])).length);
  const d6 = [];
  const required = ['Session ID', 'Participant ID', 'Scenario ID', 'Scenario Index', 'Edge States (JSON)', 'Cooperation Probability', 'Response Time (ms)', 'Answered At', 'Registration Code', 'Email', ...QUESTIONNAIRE.map((q) => q.id), 'Consented At', 'Consent Version', 'Device Type', 'Submission Completed At'];
  for (const col of required) if (!csv.header.includes(col)) d6.push(`missing column ${col}`);
  for (const s of subs) {
    for (const r of s.results) {
      const row = rowsBySub.get(String(s._id))?.find((x) => x['Scenario ID'] === r.scenarioId);
      if (!row) { d6.push(`${s.participantId}/${r.scenarioId}: no row`); continue; }
      if (Number(row['Cooperation Probability']) !== r.cooperationProbability) d6.push(`${s.participantId}: p ${row['Cooperation Probability']} ≠ ${r.cooperationProbability}`);
      if (Number(row['Response Time (ms)']) !== r.responseTime || row['Response Time (ms)'] === '') d6.push(`${s.participantId}: RT '${row['Response Time (ms)']}' ≠ ${r.responseTime}`);
      if (row['Submission Completed'] !== String(Boolean(s.isCompleted))) d6.push(`${s.participantId}: completed flag`);
      if (s.isCompleted) {
        if (row['Registration Code'] !== s.registrationCode) d6.push(`${s.participantId}: code '${row['Registration Code']}'`);
        for (const q of QUESTIONNAIRE) if (row[q.id] !== String(s.questionnaire?.find((a) => a.questionId === q.id)?.answer)) d6.push(`${s.participantId}: ${q.id}`);
        for (const col of required) if (csv.header.includes(col) && row[col] === '') d6.push(`${s.participantId}: empty ${col}`);
      }
    }
  }
  check('D6', 'Research CSV cells match the DB; required columns filled for completed submissions', 'none', firstBad(d6));
  // REQ-362 (2026-11-19): the research CSV carries the email next to the registration code
  const wrongEmail = completedTruths.filter((t) => (rowsBySub.get(t.submissionId) ?? []).some((row) => row['Email'] !== t.email)).map((t) => t.participantId);
  check('D6', 'Research CSV Email column equals the email sent (REQ-362)', 'none', firstBad(wrongEmail));

  // D7 — payment ledger
  const payable = subs.filter((s) => s.isCompleted && !s.isInvalid);
  const ledgerIds = ledger.rows.map((r) => r['Submission ID']).sort();
  check('D7', 'Payment ledger = completed, valid submissions (no drop-outs, no duplicates)', JSON.stringify(payable.map((s) => String(s._id)).sort()), JSON.stringify(ledgerIds));
  check('D7', 'Ledger total = Σ stored payouts (NTD)', payable.reduce((a, s) => a + s.payoutNtd, 0), ledger.rows.reduce((a, r) => a + Number(r['Total Payout (NTD)'] || 0), 0));

  // D8 — design coverage
  check('D8', 'Recruitment stopped because the group was full (GROUP_FULL)', true, full);
  check('D8', 'Group marked completed (REQ-309)', 'completed', group?.status);
  const completedAnswers = new Map();
  for (const s of subs.filter((x) => x.isCompleted)) for (const r of s.results) completedAnswers.set(r.scenarioId, (completedAnswers.get(r.scenarioId) ?? 0) + 1);
  const under = scenarios.filter((sc) => (completedAnswers.get(String(sc._id)) ?? 0) < sc.targetSize)
    .map((sc) => `${sc.activeEdgeIds.join('+')} #${sc.scenarioIndex}: ${completedAnswers.get(String(sc._id)) ?? 0}/${sc.targetSize} completed (responseCount ${sc.responseCount})`);
  check('D8', `Every scenario has ≥ target answers from completed submissions (${under.length}/${scenarios.length} short)`, 'none', firstBad(under));

  // A1/A2 — analysis from the CSV alone
  console.log('\nAnalysis checks (CSV only)');
  const done = csv.rows.filter((r) => r['Submission Completed'] === 'true' && r['Valid'] === 'true' && r['Cooperation Probability'] !== '');
  const xs = done.map((r) => giveShare(JSON.parse(r['Edge States (JSON)'] || '{}')));
  const ys = done.map((r) => Number(r['Cooperation Probability']));
  const condRows = completedTruths.filter((t) => ['conditional', 'retrier'].includes(t.persona)).reduce((n, t) => n + t.answers.length, 0);
  const expectedSlope = PLANTED_SLOPE * condRows / completedTruths.reduce((n, t) => n + t.answers.length, 0);
  const got = slope(xs, ys);
  check('A1', `Planted effect recovered: slope of p on 給予 share = ${round(expectedSlope)} ± 0.1`, round(expectedSlope), round(got), Math.abs(got - expectedSlope) <= 0.1);

  const flagged = { straightliner: [], speeder: [] };
  for (const [subId, rows] of rowsBySub) {
    const r = rows.filter((x) => x['Submission Completed'] === 'true' && x['Cooperation Probability'] !== '');
    if (!r.length) continue;
    const pid = r[0]['Participant ID'];
    if (r.length >= 3 && sd(r.map((x) => Number(x['Cooperation Probability']))) === 0) flagged.straightliner.push(pid);
    if (median(r.map((x) => Number(x['Response Time (ms)']))) < 2000) flagged.speeder.push(pid);
    void subId;
  }
  for (const kind of ['straightliner', 'speeder']) {
    const planted = completedTruths.filter((t) => t.persona === kind).map((t) => t.participantId).sort();
    check('A2', `${kind}s found from the CSV = planted (${planted.length})`, JSON.stringify(planted), JSON.stringify(flagged[kind].sort()));
  }

  console.log('\nObservations');
  const counts = scenarios.map((sc) => sc.responseCount);
  observe('Participants', `${truths.length} started, ${completedTruths.length} completed, ${truths.length - completedTruths.length} dropped out`);
  observe('Personas', Object.fromEntries(PERSONAS.map((p) => [p.name, truths.filter((t) => t.persona === p.name).length])));
  observe('Answers per scenario (responseCount) min / median / max', `${Math.min(...counts)} / ${median(counts)} / ${Math.max(...counts)} (target ${STUDY.targetSizePerScenario}, ${scenarios.length} scenarios)`);
  observe('Answers above target (oversampling)', counts.reduce((a, c) => a + Math.max(0, c - STUDY.targetSizePerScenario), 0));
  const byShare = {};
  xs.forEach((x, i) => { (byShare[round(x, 2)] ??= []).push(ys[i]); });
  observe('Mean p by 給予 share (completed rows)', Object.fromEntries(Object.entries(byShare).sort().map(([k, v]) => [k, `${round(v.reduce((a, b) => a + b, 0) / v.length, 2)} (n=${v.length})`])));
  observe('Median response time (ms, completed rows)', median(done.map((r) => Number(r['Response Time (ms)']))));
  observe('Payouts (NTD)', Object.fromEntries([...new Set(payable.map((s) => s.payoutNtd))].sort((a, b) => a - b).map((v) => [v, payable.filter((s) => s.payoutNtd === v).length])));
}

async function writeReport(meta) {
  const cell = (v) => String(typeof v === 'string' ? v : JSON.stringify(v)).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const failed = results.filter((r) => !r.pass);
  const lines = [
    `# Simulated pilot data check (NFR-9) — ${failed.length ? `FAILED (${failed.length})` : 'PASSED'}`,
    '',
    `Run ${stamp} · seed ${env('SIM_SEED', 1)} · study ${JSON.stringify(STUDY)} · concurrency ${CONCURRENCY} · group ${meta.groupId}`,
    '',
    '| Check | Result | What | Expected | Actual |',
    '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.id} | ${r.note ? 'ℹ' : r.pass ? '✓' : '✗'} | ${cell(r.label)} | ${cell(r.expected)} | ${cell(r.actual)} |`),
    '',
    'Files: `research.csv` and `payments.csv` (exported from the admin page), `ground-truth.json` (what each participant sent), `server.log`.',
  ];
  await fs.writeFile(path.join(OUT_DIR, 'report.md'), lines.join('\n') + '\n');
  return failed.length === 0;
}

async function main() {
  if (!existsSync(path.join(ROOT, 'dist/index.html'))) throw new Error('dist/ is missing — run `npm run sim:data` (it builds first)');
  await fs.mkdir(OUT_DIR, { recursive: true });
  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri('sim');
  const conn = await mongoose.createConnection(mongoUri).asPromise();
  const log = createWriteStream(path.join(OUT_DIR, 'server.log'));
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), MONGODB_URI: mongoUri, ADMIN_PASSWORD, JWT_SECRET: 'sim-secret', NODE_ENV: 'development', CLIENT_ORIGIN: BASE_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.pipe(log);
  server.stderr.pipe(log);
  let passed = false;
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(`${BASE_URL}/api/turnstile/status`)).ok) break; } catch { /* not up yet */ }
      if (i > 120) throw new Error('Server did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
    PARTICIPANT.Cookie = `turnstile_verified=${await turnstileCookieValue(BASE_URL)}`;
    const { token } = await (await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: ADMIN_PASSWORD }),
    })).json();
    const admin = { Authorization: `Bearer ${token}` };
    const { createMixedGroup: g } = await gql(
      'mutation($i: GroupConfigInput!, $n: String!) { createMixedGroup(input: $i, name: $n) { groupId totalScenarios estimatedSessions } }',
      { i: { ...STUDY, sampleSize: STUDY.targetSizePerScenario }, n: `Simulated pilot ${stamp}` }, admin);
    console.log(`Group ${g.groupId}: ${g.totalScenarios} scenarios, ~${g.estimatedSessions} participants needed`);

    const t0 = Date.now();
    const { truths, full } = await recruit(g.groupId);
    console.log(`Recruited ${truths.length} simulated participants in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    await fs.writeFile(path.join(OUT_DIR, 'ground-truth.json'), JSON.stringify(truths, null, 2));

    const files = await exportCsvs(g.groupId, token);
    await runChecks({ db: conn.db, groupId: g.groupId, truths, full, csv: files['research.csv'], ledger: files['payments.csv'] });
    passed = await writeReport({ groupId: g.groupId });
  } finally {
    server.kill();
    await conn.close();
    await mongo.stop();
  }
  console.log(`\n${passed ? 'SIM PASSED' : 'SIM FAILED'} — report: ${path.relative(ROOT, path.join(OUT_DIR, 'report.md'))}`);
  process.exitCode = passed ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
