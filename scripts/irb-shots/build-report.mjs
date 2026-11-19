// Build the IRB before/after PDF report (NFR-7, docs/design.md Phase 40).
// The report is written in Traditional Chinese for the advisor and must be readable without the
// code: no commit hashes, file paths, code identifiers, requirement IDs or raw system output.
// Usage: npm run irb:report   (after capturing both labels with npm run irb:shots)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { BASELINE_COMMIT, EDIT_PARTS, EVIDENCE, IRB_COMMENTS, SHOTS, VIEWPORTS } from './shots.mjs';
import * as paymentModule from '../../utils/payment.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHOTS_DIR = path.join(ROOT, 'docs/irb/screenshots');
const REPORT_DIR = path.join(ROOT, 'docs/irb/report');
const IMG_DIR = path.join(REPORT_DIR, 'img');
const PDF_PATH = path.join(REPORT_DIR, 'irb-before-after-report.pdf');
// The fee under discussion with the PI (requirements.md Open Question #8)
const CANDIDATE_FEE_NTD = 100;
const PROVISIONAL_TIMELINE_TEXT = '實驗結束後盡快';

const IRB_COMMENT_NAMES = { 1: '審查意見一', 2: '審查意見二' };
const VIEWPORT_NAMES = { desktop: '電腦版畫面', phone: '手機版畫面' };

// Payments CSV column (as exported by the app) → column title shown to the advisor
const PAYMENT_COLUMNS = [
  ['Registration Code', '報名代碼'],
  ['Email', 'Email'],
  ['Realised Round', '抽中回合'],
  ['Points', '點數'],
  ['Participation Fee (NTD)', '參與費（元）'],
  ['Point Payout (NTD)', '點數報酬（元）'],
  ['Total Payout (NTD)', '合計（元）'],
  ['Completed At', '完成時間'],
];

// The report shows participant-facing changes only: items marked `internal` (admin-facing) are
// still captured for verification but left out
const isShown = (item) => !item.internal;
const REPORT_PARTS = EDIT_PARTS.filter(isShown);
const REPORT_EVIDENCE = EVIDENCE.filter(isShown);

// Shots are numbered as figures in report order (comment 1 first); appendices are lettered A, B, …
const ORDERED_SHOTS = [1, 2].flatMap((irb) => SHOTS.filter((shot) => shot.irb === irb && isShown(shot)));
const figureNumber = (id) => ORDERED_SHOTS.findIndex((shot) => shot.id === id) + 1;
const appendixName = (id) => `附錄 ${String.fromCharCode(65 + REPORT_EVIDENCE.findIndex((item) => item.id === id))}`;
const referenceName = (id) => (REPORT_EVIDENCE.some((item) => item.id === id) ? appendixName(id) : `圖 ${figureNumber(id)}`);

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const redactEmails = (text) => text.replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@/g, '$1***@');

const formatTaipeiTime = (value) => (value
  ? new Date(value).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })
  : '');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const body = text.replace(/^﻿/, '');
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (quoted) {
      if (char === '"' && body[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// Every edit part must be shown by at least one shot or piece of evidence, and every part in the
// report by something that is itself in the report
function checkCoverage() {
  const check = (parts, items, problem) => {
    const covered = new Set(items.flatMap((item) => item.parts));
    const uncovered = parts.filter((part) => !covered.has(part.id));
    if (uncovered.length) throw new Error(`${problem}: ${uncovered.map((part) => part.id).join(', ')}`);
  };
  check(EDIT_PARTS, [...SHOTS, ...EVIDENCE], 'Edit parts without a before/after shot or evidence');
  check(REPORT_PARTS, [...ORDERED_SHOTS, ...REPORT_EVIDENCE], 'Report parts without a figure or appendix in the report');
}

// JPEG copies keep the PDF small; the PNG masters stay in docs/irb/screenshots for the IRB packet
function reportImage(label, viewport, id) {
  const source = path.join(SHOTS_DIR, label, viewport, `${id}.png`);
  if (!existsSync(source)) throw new Error(`Missing screenshot: ${path.relative(ROOT, source)}`);
  const target = path.join(IMG_DIR, `${label}-${viewport}-${id}.jpg`);
  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', source, '--out', target], { stdio: 'ignore' });
    return path.relative(REPORT_DIR, target);
  } catch {
    return path.relative(REPORT_DIR, source); // sips is macOS-only; fall back to the PNG
  }
}

function partTags(parts) {
  return REPORT_PARTS.filter((part) => parts.includes(part.id))
    .map((part) => `<span class="tag">${part.label} ${escapeHtml(part.short)}</span>`)
    .join(' ');
}

function shotPages(shot) {
  const viewports = shot.viewports || Object.keys(VIEWPORTS);
  return viewports.map((viewport) => `
      <section class="page shot">
        <header>
          <h2>圖 ${figureNumber(shot.id)}｜${escapeHtml(shot.title)} <span class="viewport">${VIEWPORT_NAMES[viewport]}</span></h2>
          <div class="tags">${partTags(shot.parts)}</div>
          <p class="note">${escapeHtml(shot.note)}</p>
        </header>
        <div class="pair ${viewport}">
          <figure><figcaption class="before">修改前</figcaption><img src="${reportImage('before', viewport, shot.id)}"></figure>
          <figure><figcaption class="after">修改後</figcaption><img src="${reportImage('after', viewport, shot.id)}"></figure>
        </div>
      </section>`).join('\n');
}

// Plain-language result of the unauthenticated query (E1)
async function describeAccessCheck(label) {
  const file = path.join(SHOTS_DIR, label, 'evidence', 'E1.json');
  if (!existsSync(file)) return '（未擷取）';
  const { body } = await readJson(file);
  if (body.errors?.length) return '系統拒絕查詢（未授權），沒有回傳任何參與者資料。';
  const records = body.data?.recentSubmissions ?? [];
  const emails = records.map((record) => record.email).filter(Boolean);
  return `系統回傳 ${records.length} 筆參與者資料，其中包含 ${emails.length} 個 Email`
    + (emails.length ? `（${emails.map(redactEmails).join('、')}；本報告已遮蔽部分內容）` : '')
    + '。';
}

// Appendix pages for the evidence included in the report (none while E1/E2 are internal)
async function evidencePages() {
  const pages = [];
  for (const item of REPORT_EVIDENCE) {
    pages.push(item.id === 'E1' ? await accessCheckPage(item) : await ledgerPage(item));
  }
  return pages.join('\n');
}

async function accessCheckPage(item) {
  return `
    <section class="page">
      <h2>${appendixName(item.id)}｜${escapeHtml(item.title)}</h2>
      <div class="tags">${partTags(item.parts)}</div>
      <p class="note">${escapeHtml(item.note)}</p>
      <div class="pair">
        <div class="verdict"><p class="before">修改前</p><p>${escapeHtml(await describeAccessCheck('before'))}</p></div>
        <div class="verdict"><p class="after">修改後</p><p>${escapeHtml(await describeAccessCheck('after'))}</p></div>
      </div>
    </section>`;
}

async function ledgerPage(item) {
  const csvFile = path.join(SHOTS_DIR, 'after', 'evidence', 'E2.csv');
  let ledger = '<p>（未擷取）</p>';
  if (existsSync(csvFile)) {
    const [header, ...rows] = parseCsv(await fs.readFile(csvFile, 'utf8'));
    const cell = (row, column) => row[header.indexOf(column)] ?? '';
    const format = (row, column) => {
      const value = cell(row, column);
      if (column === 'Email') return redactEmails(value);
      if (column === 'Realised Round') return value ? `第 ${value} 回合` : '';
      if (column === 'Completed At') return formatTaipeiTime(value);
      return value;
    };
    ledger = `<table class="ledger">
        <thead><tr>${PAYMENT_COLUMNS.map(([, title]) => `<th>${escapeHtml(title)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${PAYMENT_COLUMNS.map(([column]) => `<td>${escapeHtml(format(row, column))}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
  }

  return `
    <section class="page">
      <h2>${appendixName(item.id)}｜${escapeHtml(item.title)}</h2>
      <div class="tags">${partTags(item.parts)}</div>
      <p class="note">${escapeHtml(item.note)}以下為測試資料的匯出結果；匯出的檔案另含系統內部的紀錄編號，此處省略。</p>
      ${ledger}
    </section>`;
}

// 報酬規則說明: every number comes from the payment settings the "after" screenshots were taken with
function paymentRulesPage(after) {
  const settings = after.payment ?? paymentModule;
  const rate = settings.POINT_TO_NTD;
  const fee = settings.PARTICIPATION_FEE_NTD;
  const method = settings.PAYMENT_METHOD_TEXT;
  const timeline = settings.PAYMENT_TIMELINE_TEXT;
  const total = (points, participationFee) => points * rate + participationFee;
  const feePending = fee === 0;
  const timelinePending = timeline === PROVISIONAL_TIMELINE_TEXT;
  const { MIN_POINTS: minPoints, MAX_POINTS: maxPoints, payoffPoints } = paymentModule;

  const rows = [[false, false], [true, false], [false, true], [true, true]].map(([myGive, oppGive]) => {
    const points = payoffPoints(myGive, oppGive);
    return `<tr><td>${myGive ? '給' : '不給'}</td><td>${oppGive ? '給' : '不給'}</td><td>${points}</td>`
      + `<td>${total(points, 0)}</td><td>${total(points, CANDIDATE_FEE_NTD)}</td></tr>`;
  }).join('');

  const range = `所以目前報酬範圍是新台幣 ${total(minPoints, fee)}–${total(maxPoints, fee)} 元`
    + (feePending
      ? `；若確認有 ${CANDIDATE_FEE_NTD} 元參與費，則為 ${total(minPoints, CANDIDATE_FEE_NTD)}–${total(maxPoints, CANDIDATE_FEE_NTD)} 元。`
      : '。');

  return `
    <section class="page rules">
      <h2>報酬規則說明 <span class="viewport">修改後的版本中，參與者的報酬如何計算與發放</span></h2>
      <div class="rules-grid">
        <div>
          <h3>規則本身</h3>
          <ul>
            <li><strong>換算率：</strong>1 點 = 新台幣 ${escapeHtml(rate)} 元。</li>
            <li><strong>參與費：</strong>${feePending
              ? `目前設定為 0 元，為暫定值，待確認受試者同意書後決定；若同意書有承諾參與費，將改為 ${CANDIDATE_FEE_NTD} 元。`
              : `新台幣 ${escapeHtml(fee)} 元。`}參與費只發給完成實驗的參與者，因為 Email 在實驗的最後一步才收集。</li>
            <li><strong>總報酬：</strong>抽中回合的點數 × ${escapeHtml(rate)} 元 + 參與費。</li>
          </ul>
          <h3>哪一回合計酬、點數怎麼決定</h3>
          <ul>
            <li>所有回合結束後，系統從參與者已作答的回合中，以相同的機率隨機抽出一回合計酬。</li>
            <li>每一回合「給／不給」都依填答的機率隨機決定。參與者的機率就是他在滑桿上設定的數值，例如設定 70，就有 70% 的機率為「給」。</li>
            <li>搭檔的機率取自一位真實配對參與者在對應情境中的作答；若該情境還沒有其他參與者作答，則由系統隨機產生。</li>
            <li>抽中回合的點數依右表計算。</li>
          </ul>
        </div>
        <div>
          <table class="payoff">
            <thead><tr><th>您</th><th>搭檔</th><th>點數</th><th>新台幣（無參與費）</th><th>新台幣（參與費 ${CANDIDATE_FEE_NTD} 元）</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="range">${escapeHtml(range)}</p>
          <h3>保存方式</h3>
          <p>抽籤當下，系統即保存抽中的回合、點數與報酬金額。重新整理頁面不會改變結果，已保存的金額也不會重新計算。結果回顧頁與 Email 頁顯示的都是同一個已保存的金額，研究者實際發放的金額也以此為準。</p>
          <h3>發放方式</h3>
          <p>以${escapeHtml(method)}寄送到參與者在實驗最後填寫的 Email。寄送時程${timelinePending
            ? `目前暫定為「${escapeHtml(timeline)}」，待確認後更新。`
            : `為「${escapeHtml(timeline)}」。`}</p>
        </div>
      </div>
    </section>`;
}

function coverPage(after) {
  const settings = after.payment ?? paymentModule;
  const feePending = settings.PARTICIPATION_FEE_NTD === 0;
  const timelinePending = settings.PAYMENT_TIMELINE_TEXT === PROVISIONAL_TIMELINE_TEXT;
  return `
    <section class="page cover">
      <h1>IRB 修正前後對照報告<br><small>回應 IRB 審查意見之實驗畫面修改</small></h1>
      <p class="lede">本報告以「修改前／修改後」的截圖對照，逐項呈現為回應 IRB 審查意見而對實驗畫面所做的修改。</p>
      <p class="date">報告日期：${escapeHtml(new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }))}</p>
      <table class="facts">
        <tr><th>${IRB_COMMENT_NAMES[1]}</th><td>${escapeHtml(IRB_COMMENTS[1])}</td></tr>
        <tr><th>${IRB_COMMENT_NAMES[2]}</th><td>${escapeHtml(IRB_COMMENTS[2])}</td></tr>
        <tr><th>報酬設定（修改後）</th><td>1 點 = 新台幣 ${escapeHtml(settings.POINT_TO_NTD)} 元；參與費新台幣 ${escapeHtml(settings.PARTICIPATION_FEE_NTD)} 元${feePending ? '（暫定，待確認）' : ''}；以${escapeHtml(settings.PAYMENT_METHOD_TEXT)}寄送至參與者填寫的 Email；寄送時程「${escapeHtml(settings.PAYMENT_TIMELINE_TEXT)}」${timelinePending ? '（暫定，待確認）' : ''}。詳見「報酬規則說明」頁。</td></tr>
        <tr><th>截圖方式</th><td>兩個版本皆以 Google Chrome 在電腦版與手機版的畫面尺寸截圖，並使用相同的測試資料（共 3 回合；結果回顧頁抽中第 2 回合：您不給、搭檔給，得 3 點）。兩版的網絡圖排列相同、動畫已暫停，因此畫面上的差異都來自本次修改。</td></tr>
        <tr><th>閱讀方式</th><td>每一頁左側為<span class="before">修改前</span>、右側為<span class="after">修改後</span>。圖片為高解析度，可放大檢視細節。頁首的標籤（例如「1-1 圖例」）對應「修改摘要」中的項目。</td></tr>
      </table>
    </section>`;
}

function summaryPage() {
  const rows = [1, 2].flatMap((irb) => REPORT_PARTS.filter((part) => part.irb === irb)).map((part) => {
    const references = [...ORDERED_SHOTS, ...REPORT_EVIDENCE]
      .filter((item) => item.parts.includes(part.id))
      .map((item) => referenceName(item.id));
    return `<tr><td>${IRB_COMMENT_NAMES[part.irb]}</td><td><strong>${part.label}</strong></td>`
      + `<td>${escapeHtml(part.title)}</td><td>${references.join('、')}</td></tr>`;
  }).join('');
  return `
    <section class="page">
      <h2>修改摘要</h2>
      <table class="summary">
        <thead><tr><th>審查意見</th><th>項目</th><th>修改內容</th><th>對照頁</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>尚待處理的事項（本次未修改）</h3>
      <ul class="open">
        <li>參與費與寄送時程目前為暫定值，待確認受試者同意書後更新；確認後，實驗畫面與本報告可隨即更新。</li>
      </ul>
    </section>`;
}

const STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "PingFang TC", "Heiti TC", "Noto Sans TC", system-ui, sans-serif; color: #1f2937; font-size: 10.5pt; }
  .page { page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: auto; }
  h1 { font-size: 24pt; margin: 18mm 0 4mm; line-height: 1.3; }
  h1 small { font-size: 13pt; color: #6b7280; font-weight: 500; }
  h2 { font-size: 13pt; margin: 0 0 2mm; }
  h3 { font-size: 11pt; margin: 6mm 0 2mm; }
  .lede { font-size: 12pt; color: #374151; margin-bottom: 2mm; }
  .date { color: #6b7280; margin: 0 0 6mm; }
  .viewport { font-size: 9pt; color: #6b7280; font-weight: 500; margin-left: 2mm; }
  .tags { margin-bottom: 1.5mm; }
  .tag { display: inline-block; background: #eef2ff; color: #3730a3; border-radius: 3mm; padding: 0.5mm 2.5mm; font-size: 8.5pt; margin: 0 1mm 1mm 0; }
  .note { margin: 0 0 3mm; color: #374151; line-height: 1.6; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  figure { margin: 0; text-align: center; }
  figcaption { font-weight: 700; font-size: 10pt; margin-bottom: 1.5mm; text-align: left; }
  .before { color: #b45309; font-weight: 700; }
  .after { color: #047857; font-weight: 700; }
  /* A shot page is exactly one sheet: the image pair takes whatever height the header leaves */
  .page.shot { height: 188mm; display: flex; flex-direction: column; overflow: hidden; }
  .page.shot .pair { flex: 1; min-height: 0; }
  .page.shot figure { display: flex; flex-direction: column; min-height: 0; }
  .page.shot img { flex: 1; min-height: 0; width: 100%; object-fit: contain; object-position: top center; background: #f3f4f6; border-radius: 1mm; }
  .verdict { border: 0.3mm solid #e5e7eb; border-radius: 2mm; padding: 4mm 5mm; background: #f9fafb; font-size: 11.5pt; line-height: 1.7; }
  .verdict p { margin: 0 0 2mm; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 0.3mm solid #e5e7eb; padding: 1.8mm 2.5mm; text-align: left; vertical-align: top; }
  th { background: #f9fafb; }
  .facts th { width: 36mm; }
  .summary td:first-child { white-space: nowrap; }
  table.ledger th, table.ledger td { text-align: center; }
  ul.open li { margin-bottom: 1.5mm; line-height: 1.6; }
  .rules { font-size: 10.5pt; line-height: 1.6; }
  .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 3mm; }
  .rules h3 { margin: 0 0 2mm; padding-bottom: 1mm; border-bottom: 0.3mm solid #e5e7eb; }
  .rules ul { margin: 0 0 5mm; padding-left: 5mm; }
  .rules li { margin-bottom: 1.8mm; }
  .rules p { margin: 0 0 4mm; }
  .rules table.payoff { margin-bottom: 3mm; }
  .rules table.payoff th, .rules table.payoff td { text-align: center; }
  .rules .range { font-weight: 700; color: #1f2937; }
`;

async function main() {
  checkCoverage();
  const beforeMeta = await readJson(path.join(SHOTS_DIR, 'before', 'meta.json'));
  const afterMeta = await readJson(path.join(SHOTS_DIR, 'after', 'meta.json'));
  if (!beforeMeta.appSourceMatchesBaseline) {
    console.warn(`⚠️  The "before" set was not captured from source identical to ${BASELINE_COMMIT}.`);
  }

  await fs.rm(REPORT_DIR, { recursive: true, force: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const commentSection = (irb) => `
  <section class="page"><h1>${IRB_COMMENT_NAMES[irb]}<br><small>${escapeHtml(IRB_COMMENTS[irb])}</small></h1></section>
  ${irb === 2 ? paymentRulesPage(afterMeta) : ''}
  ${ORDERED_SHOTS.filter((shot) => shot.irb === irb).map(shotPages).join('\n')}`;

  const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>IRB 修正前後對照報告</title><style>${STYLES}</style></head>
<body>
  ${coverPage(afterMeta)}
  ${summaryPage()}
  ${commentSection(1)}
  ${commentSection(2)}
  ${await evidencePages()}
</body></html>`;
  const htmlPath = path.join(REPORT_DIR, 'report.html');
  await fs.writeFile(htmlPath, html);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: PDF_PATH, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }

  const { size } = await fs.stat(PDF_PATH);
  console.log(`Report → ${path.relative(ROOT, PDF_PATH)} (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
