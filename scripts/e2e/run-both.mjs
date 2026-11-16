// One e2e report for PC and phone (NFR-8.3; docs/design.md Phase 50).
// Runs full-flow.mjs on a PC, then with every participant on a phone, and compares them in one report.
// Usage: npm run test:e2e   (builds dist/ first)
// Output: test-results/e2e/<timestamp>/ — report.html, report.pdf, pc/, phone/
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const p2 = (n) => String(n).padStart(2, '0');
const d = new Date();
const OUT = path.join(ROOT, 'test-results/e2e', `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`);
const DEVICES = [
  { key: 'pc', label: 'PC', env: {} },
  { key: 'phone', label: 'Phone', env: { E2E_DEVICE: 'mobile' } },
];

function runDevice({ key, label, env }) {
  console.log(`\n════════ ${label} ════════`);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts/e2e/full-flow.mjs')], {
      cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env, E2E_OUT: path.join(OUT, key) },
    });
    child.on('exit', resolve);
  });
}

async function load(key) {
  try { return JSON.parse(await fs.readFile(path.join(OUT, key, 'results.json'), 'utf8')); } catch { return null; }
}

// ── Report ──
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (v) => (v === undefined ? 'undefined' : typeof v === 'string' ? `"${v}"` : JSON.stringify(v));
const RANK = { fail: 4, broken: 4, observed: 3, 'not run': 2, pass: 1 };
const worst = (...rs) => rs.filter(Boolean).sort((a, b) => (RANK[b] ?? 0) - (RANK[a] ?? 0))[0] ?? 'not run';
const cls = (r) => `r-${String(r).replace(' ', '-')}`;
const badge = (r) => `<span class="t ${cls(r)}">${esc(String(r).toUpperCase())}</span>`;
const mark = (c) => (!c ? '<span class="muted">—</span>' : c.kind === 'note' ? '<span class="info">ℹ</span>' : c.pass ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>');
const shotId = (file) => file.replace(/^shots\/\d+-/, '').replace(/\.png$/, '');
const realChecks = (r) => r.steps.flatMap((s) => s.checks).filter((c) => c.kind === 'check');

function html(pc, phone) {
  const runs = [pc, phone];
  const labels = ['PC', 'Phone'];
  const passed = runs.every((r) => r?.passed);
  const score = (r) => (r ? `${realChecks(r).filter((c) => c.pass).length}/${realChecks(r).length}` : 'did not run');
  const ref = phone?.roadmap ?? pc?.roadmap ?? [];
  const ecOf = (r, id) => r?.edgeCases.find((e) => e.id === id);
  const stepOf = (r, id) => r?.steps.find((s) => s.id === id);
  const ecMeta = Object.fromEntries((pc ?? phone).edgeCases.map((e) => [e.id, e]));
  const counts = ['pass', 'observed', 'fail', 'not run'].map((k) => `${Object.keys(ecMeta).filter((id) => worst(ecOf(pc, id)?.result, ecOf(phone, id)?.result) === k).length} ${k}`).join(' · ');

  const roadmap = ref.map(([stage, happyId, ids], i) => {
    const happy = happyId ? runs.map((r) => stepOf(r, happyId)?.status ?? 'not run') : null;
    const dot = happy ? worst(...happy) : 'none';
    const chips = ids.map((id) => {
      const rs = runs.map((r) => ecOf(r, id)?.result ?? 'not run');
      return `<a class="chip ${cls(worst(...rs))}" href="#step-${esc(ecOf(pc, id)?.stepId ?? ecOf(phone, id)?.stepId ?? '')}" title="Expected: ${esc(ecMeta[id].expected)}"><b>${id}</b> ${esc(ecMeta[id].title)} ${rs.map((r, k) => `<i class="${cls(r)}">${labels[k]} ${esc(r.toUpperCase())}</i>`).join(' ')}</a>`;
    }).join('');
    return `<div class="stage"><div class="dot ${cls(dot)}">${i + 1}</div><div>
      <div class="stage-name">${esc(stage)} ${happy ? `<span class="happy">happy path ${happy.map((h, k) => `${labels[k]} ${badge(h)}`).join(' ')}</span>` : ''}</div>
      <div class="chips">${chips || '<span class="muted">no edge cases at this stage</span>'}</div></div></div>`;
  }).join('');

  const stepIds = [...new Set(runs.flatMap((r) => r?.steps.map((s) => s.id) ?? []))];
  const steps = stepIds.map((id) => {
    const [a, b] = runs.map((r) => stepOf(r, id));
    const title = (a ?? b).title;
    const labelsIn = [...new Set([...(a?.checks ?? []), ...(b?.checks ?? [])].map((c) => c.label))];
    const byLabel = (s, l) => s?.checks.find((c) => c.label === l);
    const rows = labelsIn.map((l) => {
      const [ca, cb] = [byLabel(a, l), byLabel(b, l)];
      const c = ca ?? cb;
      const actual = (x) => (!x ? '' : esc(x.kind === 'note' ? x.actual : fmt(x.actual)));
      return `<tr><td>${esc(c.ec ?? '')}</td><td>${esc(l)}</td><td>${c.kind === 'note' ? '<span class="muted">(observation)</span>' : esc(fmt(c.expected))}</td><td>${mark(ca)} ${actual(ca)}</td><td>${mark(cb)} ${actual(cb)}</td></tr>`;
    }).join('');
    // Admin pages are desktop-only: the phone run's desktop-width shots would just repeat the PC ones
    const phoneShots = (b?.shots ?? []).filter((x) => x.phone);
    const ids = [...new Set([...(a?.shots ?? []), ...phoneShots].map((x) => shotId(x.file)))];
    const fig = (dir, x) => (x ? `<figure class="${x.phone ? 'phone' : ''}"><img src="${dir}/${esc(x.file)}" alt="${esc(x.caption)}"><figcaption>${esc(x.caption)}</figcaption></figure>` : '<div class="muted">—</div>');
    const pairs = ids.map((sid) => {
      const [sa, sb] = [a?.shots.find((x) => shotId(x.file) === sid), phoneShots.find((x) => shotId(x.file) === sid)];
      if (!sb) return `<div class="pair"><div class="pc">${fig('pc', sa)}</div></div>`;
      return `<div class="pair"><div class="pc">${fig('pc', sa)}</div><div class="ph">${fig('phone', sb)}</div></div>`;
    }).join('');
    const errors = [a, b].map((s, k) => (s?.error ? `<pre class="${s.status === 'broken' ? 'bad' : 'muted'}">${labels[k]}: ${esc(s.error)}</pre>` : '')).join('');
    return `<section class="step" id="step-${esc(id)}"><h3>${esc(title)} <span class="happy">PC ${badge(a?.status ?? 'not run')} Phone ${badge(b?.status ?? 'not run')}</span></h3>${errors}
      ${rows ? `<table><tr><th>Case</th><th>Check</th><th>Expected</th><th>PC</th><th>Phone</th></tr>${rows}</table>` : ''}
      ${pairs ? `<div class="pair head"><div class="pc">PC</div>${phoneShots.length ? '<div class="ph">Phone</div>' : ''}</div>${pairs}` : ''}</section>`;
  }).join('');

  const observations = runs.flatMap((r, k) => (r?.steps ?? []).flatMap((s) => s.checks.filter((c) => c.kind === 'note').map((c) => ({ ...c, device: labels[k] }))));
  const trail = (pc ?? phone).trail.map(([where], i) => `<tr><td>${esc(where.replace(/\(\d.*\)/, '(…)'))}</td>${runs.map((r) => {
    const amount = r?.trail[i]?.[1];
    return `<td>${esc(amount)} ${mark({ kind: 'check', pass: amount !== undefined && amount === r?.debriefZ })}</td>`;
  }).join('')}</tr>`).join('');
  const ledger = (r, k) => (r?.ledger ? `<h3>${labels[k]} — ${esc(r.ledger.file)} · ${r.ledger.rows.length} row(s)</h3><table class="ledger"><tr>${r.ledger.header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${r.ledger.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : `<p class="muted">${labels[k]}: not exported.</p>`);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>E2E report — PC + phone</title><style>
  body{font:14px/1.5 -apple-system,"PingFang TC","Noto Sans TC",sans-serif;margin:0 auto;max-width:1100px;padding:24px;color:#111;background:#fff}
  h1{margin:0 0 4px} h2{margin-top:36px;border-bottom:2px solid #eee;padding-bottom:4px} h3{margin:24px 0 8px}
  table{border-collapse:collapse;width:100%;margin:8px 0} td,th{border:1px solid #ddd;padding:5px 8px;text-align:left;vertical-align:top} th{background:#f6f6f6}
  .banner{padding:14px 18px;border-radius:8px;font-size:20px;font-weight:700;color:#fff;margin:12px 0} .pass{background:#15803d} .failb{background:#b91c1c}
  .ok{color:#15803d;font-weight:700} .bad{color:#b91c1c;font-weight:700} .muted{color:#888} .info{color:#1d4ed8;font-weight:700}
  .t{font-weight:700;font-size:12px} .t.r-pass{color:#15803d} .t.r-fail,.t.r-broken{color:#b91c1c} .t.r-observed{color:#1d4ed8} .t.r-not-run{color:#888}
  pre{background:#f6f6f6;padding:8px;white-space:pre-wrap;font-size:12px} code{font-size:12px}
  .step{break-before:page} .ledger td,.ledger th{font-size:11px;word-break:break-all}
  .roadmap{position:relative;margin:12px 0} .roadmap:before{content:"";position:absolute;left:15px;top:16px;bottom:16px;width:2px;background:#ddd}
  .stage{display:flex;gap:14px;margin:0 0 14px;break-inside:avoid;position:relative} .stage-name{font-weight:700;margin:5px 0 6px}
  .dot{flex:none;width:32px;height:32px;border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;background:#9ca3af}
  .dot.r-pass{background:#15803d} .dot.r-fail,.dot.r-broken{background:#b91c1c}
  .happy{font-weight:400;font-size:12px;color:#555;margin-left:8px} .chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip{display:inline-block;padding:4px 10px;border-radius:14px;border:1px solid;font-size:12.5px;text-decoration:none;color:#111}
  .chip i{font-style:normal;font-size:10.5px;font-weight:700;margin-left:4px} .chip i.r-pass{color:#15803d} .chip i.r-fail{color:#b91c1c} .chip i.r-observed{color:#1d4ed8} .chip i.r-not-run{color:#888}
  .chip.r-pass{background:#ecfdf3;border-color:#86efac} .chip.r-fail{background:#fef2f2;border-color:#fca5a5} .chip.r-observed{background:#eff6ff;border-color:#93c5fd} .chip.r-not-run{background:#f6f6f6;border-color:#ddd}
  .pair{display:flex;gap:16px;align-items:flex-start;break-inside:avoid;margin:8px 0} .pair .pc{flex:1;min-width:0} .pair .ph{flex:none;width:260px}
  .pair.head{font-weight:700;color:#555;border-bottom:1px solid #eee;margin-bottom:4px}
  figure{margin:0 0 12px} figure img{width:100%;border:1px solid #ccc;border-radius:6px} figcaption{color:#444;font-size:12px;margin-top:4px}
  </style></head><body>
  <h1>E2E full-flow report — PC + phone</h1>
  <div class="muted">Admin launch → invite link → participant survey → debrief → payment ledger, plus edge cases EC-1…EC-13, run on a PC (1440×900) and with every participant on a phone (390×844, touch, Android Chrome; admin on desktop). NFR-8, NFR-8.1, NFR-8.3.</div>
  <div class="banner ${passed ? 'pass' : 'failb'}">${passed ? 'PASS' : 'FAIL'} — PC ${score(pc)} · Phone ${score(phone)} checks passed</div>

  <h2>Roadmap</h2>
  <p class="muted">Each chip is one edge case with its PC and phone result; its colour is the worse of the two. Hover for the expected behaviour, click to jump to the step. Edge cases: ${counts}.</p>
  <div class="roadmap">${roadmap}</div>

  <h2>Summary</h2>
  <table><tr><th></th><th>PC</th><th>Phone</th></tr>
  <tr><th>Result</th>${runs.map((r) => `<td>${badge(r ? (r.passed ? 'pass' : 'fail') : 'not run')}</td>`).join('')}</tr>
  <tr><th>Checks</th>${runs.map((r) => `<td>${score(r)} · ${r ? r.steps.flatMap((s) => s.checks).filter((c) => c.kind === 'note').length : 0} observations</td>`).join('')}</tr>
  <tr><th>Duration</th>${runs.map((r) => `<td>${r ? `${r.durationS} s` : ''}</td>`).join('')}</tr>
  <tr><th>Participant A payout</th>${runs.map((r) => `<td>${r ? `NT$${esc(r.debriefZ)} (round ${r.draw ? r.draw.round + 1 : '?'}, ${esc(r.draw?.realisedPoints)} 點)` : ''}</td>`).join('')}</tr>
  <tr><th>Steps</th>${runs.map((r) => `<td>${(r?.steps ?? []).map((s) => `${badge(s.status)} ${esc(s.title)}`).join('<br>')}</td>`).join('')}</tr>
  <tr><th>Folder</th><td><code>pc/</code></td><td><code>phone/</code></td></tr>
  </table>

  <h2>Edge cases</h2>
  <table><tr><th>ID</th><th>Case</th><th>Expected</th><th>PC</th><th>Phone</th></tr>
  ${Object.values(ecMeta).map((e) => `<tr><td>${e.id}</td><td>${esc(e.title)}</td><td>${esc(e.expected)}</td>${runs.map((r) => `<td>${badge(ecOf(r, e.id)?.result ?? 'not run')}</td>`).join('')}</tr>`).join('')}
  </table>

  <h2>Observations</h2>
  <p>Behaviour no requirement defines yet. These never fail the run; they need a decision.</p>
  ${observations.length ? `<table><tr><th>Device</th><th>Case</th><th>Observation</th><th>What happened</th></tr>${observations.map((o) => `<tr><td>${o.device}</td><td>${esc(o.ec ?? '')}</td><td>${esc(o.label)}</td><td>${esc(o.actual)}</td></tr>`).join('')}</table>` : '<p class="muted">None.</p>'}

  <h2>Money trail (participant A)</h2>
  <p>On each device every amount must equal what that participant was shown on the debrief.</p>
  <table><tr><th>Where</th><th>PC (NT$)</th><th>Phone (NT$)</th></tr>${trail}</table>

  <h2>Steps</h2>
  ${steps}

  <h2 class="step">Payment ledger (final exports)</h2>
  ${runs.map(ledger).join('')}

  <h2>Known issues</h2>
  <p><strong>BUG-008 — partner pairing never matches a real participant.</strong> The 搭檔 decision on the debrief is a 50/50 draw. Server log:</p>
  ${runs.map((r, k) => `<pre>${labels[k]}: ${esc(r?.pairingLine ?? '')}</pre>`).join('')}
  </body></html>`;
}

await fs.mkdir(OUT, { recursive: true });
for (const device of DEVICES) await runDevice(device);
const [pc, phone] = await Promise.all(DEVICES.map((x) => load(x.key)));
if (!pc && !phone) throw new Error('Neither run wrote results.json');
const reportPath = path.join(OUT, 'report.html');
await fs.writeFile(reportPath, html(pc, phone));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(pathToFileURL(reportPath).href, { waitUntil: 'load' });
await page.pdf({ path: path.join(OUT, 'report.pdf'), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
await browser.close();

const passed = pc?.passed && phone?.passed;
console.log(`\n${passed ? 'E2E PASSED (PC + phone)' : 'E2E FAILED'} — report: ${reportPath}`);
process.exitCode = passed ? 0 : 1;
