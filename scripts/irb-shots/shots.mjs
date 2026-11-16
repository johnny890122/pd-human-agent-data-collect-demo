// Edit-part catalog and shot list for the IRB before/after report (NFR-7, docs/design.md Phase 40).
// capture.mjs takes every shot for both labels; build-report.mjs pairs them and checks coverage.

export const BASELINE_COMMIT = '934e945';

// App source that must be untouched for a valid "before" set
export const APP_SOURCE_PATHS = [
  'App.tsx', 'index.tsx', 'index.html', 'constants.ts', 'types.ts', 'server.js', 'vite.config.ts',
  'components', 'backend', 'utils',
];

export const IRB_COMMENTS = {
  1: '適度調整圖片尺寸及解析度，並補充相對應的說明，以利參與者理解欲傳達的訊息及內容。',
  2: '確認點數與實際報酬的換算。',
};

// Labelled by IRB comment (1-x, 2-x) in the report; `short` is the tag shown on each page.
// `req` keeps the traceability to requirements.md but is not printed in the advisor-facing report.
// `internal: true` marks admin-facing items: still captured for verification, left out of the report.
export const EDIT_PARTS = [
  { id: 'B1', irb: 1, label: '1-1', req: 'REQ-409.1', short: '圖例', title: '新增圖例：說明網絡圖中外框顏色、團體顏色、箭頭、「給予／不給予」標籤與「?」的意義' },
  { id: 'B2', irb: 1, label: '1-2', req: 'REQ-409.2', short: '圖說', title: '新增圖說：在實驗說明各頁的圖片下方，以文字說明圖片內容與參與者該做的事' },
  { id: 'B3', irb: 1, label: '1-3', req: 'REQ-409.3', short: '放大圖片元素', title: '放大圖片元素：「?」標記、正式回合的網絡圖、互動清單的文字與頭像' },
  { id: 'A1', irb: 2, label: '2-1', req: 'REQ-408.1', short: '報酬數字一致', title: '換算率、參與費與發放方式只設定一次，所有畫面顯示相同的數字' },
  { id: 'A2', irb: 2, label: '2-2', req: 'REQ-408.5', short: '報酬金額保存', title: '報酬金額在抽籤當下即計算並保存，參與者看到的金額就是實際發放的金額' },
  { id: 'A3', irb: 2, label: '2-3', req: 'REQ-408.6', short: '載入失敗不顯示金額', title: '結果無法載入時，顯示錯誤訊息與「重試」按鈕，不再顯示未保存的金額' },
  { id: 'A4', irb: 2, label: '2-4', req: 'REQ-408.2–408.4', short: '報酬說明一致', title: '說明頁、結果回顧頁與 Email 頁的報酬說明一致（換算率、範圍、電子禮券、寄送時程）' },
  { id: 'A5', irb: 2, label: '2-5', internal: true, req: 'REQ-408.7', short: '付款清單', title: '研究者可匯出完整的付款清單：每位完成實驗的參與者一列，列出應付金額' },
  { id: 'A6', irb: 2, label: '2-6', internal: true, req: 'REQ-408.8', short: 'Email 存取限制', title: '參與者的 Email 僅限研究者以管理者身分登入後查看' },
];

export const VIEWPORTS = {
  desktop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  },
  phone: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  },
};

// steps: { action: 'revealAll' } clicks every "?" marker (limit caps how many),
//        { action: 'setSlider', value } sets the first range input like a user drag,
//        { action: 'clickButton', name } clicks a button by its accessible name.
// failDebrief: abort the FetchSubmission / DrawRealisedRound requests (S12).
export const SHOTS = [
  {
    id: 'S01', irb: 1, parts: ['B1', 'B2'], route: '/survey/intro/0',
    title: '說明頁：參與者的背景與角色',
    note: '新增圖說，說明頭像、團體顏色，以及「您」「搭檔」外框的意義，並附上圖例。',
  },
  {
    id: 'S02', irb: 1, parts: ['B1', 'B2', 'B3'], route: '/survey/intro/2',
    title: '說明頁：互動紀錄',
    note: '新增圖說，說明箭頭方向與「給予／不給予」標籤；新增圖例；互動清單的文字與頭像放大。',
  },
  {
    id: 'S03', irb: 1, parts: ['B2', 'B3'], route: '/survey/intro/3',
    title: '說明頁：實驗介面提示 1（點擊「?」之前）',
    note: '練習用的互動線放大，並新增圖說，說明灰色虛線與「?」的意義。',
  },
  {
    id: 'S04', irb: 1, parts: ['B2', 'B3'], route: '/survey/intro/3',
    title: '說明頁：實驗介面提示 1（點擊「?」之後）',
    steps: [{ action: 'revealAll' }],
    note: '同一練習畫面，點擊「?」之後的樣子。',
  },
  {
    id: 'S05', irb: 1, parts: ['B1', 'B2', 'B3'], route: '/survey/intro/4',
    title: '說明頁：實驗介面提示 2',
    note: '「?」標記放大；圖說提醒正式實驗每一回合都需先點開所有「?」才能作答；新增圖例。',
  },
  {
    id: 'S06', irb: 1, parts: ['B1', 'B2'], route: '/survey/intro/5',
    title: '說明頁：實驗介面提示 3（滑桿設定為 70）',
    steps: [{ action: 'setSlider', value: 70 }],
    note: '新增圖說，說明從「您」指向「搭檔」的決定線，以及滑桿數值代表給予點數的機率；新增圖例。',
  },
  {
    id: 'S07', irb: 2, parts: ['A1', 'A4'], route: '/survey/intro/7',
    title: '說明頁：點數兌換報酬說明',
    note: '列出換算率、四種結果對應的點數與金額、報酬的最低與最高金額、計算範例，以及以電子禮券寄送的方式與時程。',
  },
  {
    id: 'S08', irb: 1, parts: ['B1', 'B3'], route: '/survey/scenarios/0',
    title: '正式回合：尚未查看互動紀錄',
    note: '網絡圖欄位加寬、「?」標記放大，並在圖下方固定顯示完整圖例。',
  },
  {
    id: 'S09', irb: 1, parts: ['B1', 'B3'], route: '/survey/scenarios/0',
    title: '正式回合：已查看全部互動紀錄',
    steps: [{ action: 'revealAll' }],
    note: '全部互動紀錄已顯示，圖例說明「給予／不給予」標籤與箭頭方向。',
  },
  {
    id: 'S10', irb: 1, parts: ['B1', 'B3'], route: '/survey/scenarios/0',
    title: '正式回合：作答中（滑桿設定為 70）',
    steps: [{ action: 'revealAll' }, { action: 'clickButton', name: '開始決策' }, { action: 'setSlider', value: 70 }],
    note: '作答階段，圖例同樣顯示在網絡圖下方。',
  },
  {
    id: 'S11', irb: 2, parts: ['A1', 'A2', 'A3', 'A4'], route: '/survey/outro/2',
    title: '結果回顧（抽中第 2 回合：您不給、搭檔給，得 3 點）',
    note: '報酬卡片列出「點數 × 100」的算式與合計金額（新台幣）；若設定參與費，會另列一行。',
  },
  {
    id: 'S12', irb: 2, parts: ['A3'], route: '/survey/outro/2', failDebrief: true,
    title: '結果回顧：結果無法載入時',
    note: '修改前：畫面顯示在參與者裝置上產生的結果（此處為空白表格與「— 元」；其他情況下可能出現從未被記錄的隨機金額）。修改後：顯示錯誤訊息與「重試」按鈕，不顯示任何金額。',
  },
  {
    id: 'S13', irb: 2, parts: ['A4'], route: '/survey/outro/3',
    title: 'Email 填寫頁',
    note: '說明報酬金額、電子禮券與寄送時程，與說明頁一致（修改前只寫「現金禮券」與「盡快」）。',
  },
  {
    id: 'S14', irb: 2, parts: ['A5'], route: '/admin/view/batch/irb-fixture-group', admin: true, viewports: ['desktop'], internal: true,
    title: '研究者管理頁：實驗組別詳細資料',
    note: '列出該組別的所有參與者（修改前只載入全系統最新的 100 筆資料），並新增「Export Payments」（匯出付款清單）按鈕。',
  },
];

// Captured in the "after" run only, for the IRB packet (REQ-409.4); not compared
export const PACKET_ONLY = [
  { id: 'P01', route: '/survey/welcome', title: '歡迎頁' },
  { id: 'P02', route: '/survey/intro/1', title: '說明頁：遊戲點數' },
  { id: 'P03', route: '/survey/intro/6', title: '說明頁：理解測試' },
  { id: 'P04', route: '/survey/intro/8', title: '說明頁：準備開始' },
  { id: 'P05', route: '/survey/outro/1', title: '結束頁：報名代碼確認' },
  { id: 'P06', route: '/survey/outro/4', title: '結束頁：完成' },
];

export const EVIDENCE = [
  {
    id: 'E1', irb: 2, parts: ['A6'], internal: true,
    title: '未登入時查詢參與者資料',
    note: '在未以管理者身分登入的情況下，送出相同的參與者資料查詢。',
  },
  {
    id: 'E2', irb: 2, parts: ['A2', 'A5'], afterOnly: true, internal: true,
    title: '研究者匯出的付款清單',
    note: '每位完成且有效的參與者一列，合計金額與該參與者在結果回顧頁看到的金額相同。此清單在修改前並不存在。',
  },
];
