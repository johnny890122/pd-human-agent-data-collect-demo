# Requirements

This document is the single source of truth for the functional and non-functional requirements of the **PD Human-Agent Data Collect Demo** platform — a research tool that lets administrators configure Prisoner's Dilemma network experiments and collects participant cooperation-probability responses through a guided survey flow.

---

## Change Log

| Date | Change | Notes |
| :--- | :--- | :--- |
| 2026-04-28 | Initial spec-driven-dev baseline established | Captures all features currently implemented in the codebase as of commit `05b8cc2` (`feat: new bulk launch feature`). Numbered all requirements REQ-XXX for traceability. |
| 2026-04-28 | Documented batch launch / SessionGroup feature (REQ-301..REQ-304) | Reflects recently merged bulk launch capability. |
| 2026-04-28 | Documented i18n (REQ-501) | Reflects merged i18n commit `89a1e5d`. Specifics of supported locales TBD — flag for clarification. |
| 2026-04-28 | **MAJOR ARCHITECTURE CHANGE**: Scenario-centric data model refactor + Mixed Mode launch capability (REQ-305..REQ-309) | Bottom-up redesign: Scenario becomes the atomic unit, Session becomes a container. Enables unified handling of three launch modes without mode-specific branches. Database is clean slate — no backward compatibility required. |
| 2026-04-28 | **BACKEND REFACTOR COMPLETE** ✅ Phase 12-14 finished | All data models implemented and tested. GraphQL API refactored for Manual & Batch modes with new Scenario-centric architecture. 15/15 backend unit tests passing. REQ-321, REQ-322, REQ-323 fully implemented. Frontend integration pending (Phase 15-16). |
| 2026-04-29 | **LEGACY API REMOVAL COMPLETE** ✅ Phase 15-16 finished | All setupId-based legacy API removed. Manual & Batch modes now exclusively use new Session/Scenario API. URL format changed from `?setupId=` to `?sessionId=`. All frontend components updated. ~500 lines of legacy code removed. API tests passing. |
| 2026-04-29 | **MIXED MODE CORE COMPLETE** ✅ Backend + Frontend implementation done | createMixedGroup and startMixedSession resolvers implemented. Balanced selection strategy active. MixedModeConfig UI complete. App.tsx routing supports Mixed Mode URLs. 288 scenarios generated in tests. REQ-306, REQ-307, REQ-308, REQ-309 implemented. |
| 2026-05-04 | **BUG FIXES** NetworkGraph undefined error and incomplete submissions bug | Fixed NetworkGraph TypeError with defensive checks. Fixed SurveyOutro not calling completeSurvey mutation. All submissions now properly marked as complete. |
| 2026-05-04 | **SCHEMA REFINEMENT** Scenario model improvements | `scenarioIndex` now required for traceability. `status` enum simplified from `['active', 'completed', 'paused']` to `['active', 'inactive']` to explicitly control scenario availability without redundant completion states (already tracked by `responseCount >= targetSize`). |
| 2026-05-04 | **PARTICIPANT IDENTIFICATION ENHANCEMENT** Device fingerprinting for Mixed Mode (REQ-311) | Replace random participant ID with browser fingerprinting for more reliable duplicate detection. Addresses Open Question #5. |
| 2026-05-04 | **SCHEMA CONSTRAINT TIGHTENING** Mixed Mode config fields are now mandatory (REQ-312) | `SessionGroup.config.maxK`, `scenariosPerSession`, and `targetSizePerScenario` changed from `required: false` to `required: true` on the Mongoose schema. These three fields are the defining configuration of a Mixed Mode group and must always be present when a Mixed Mode group is created. This change has cascading impact on GraphQL input types, TypeScript types, and test fixtures — see REQ-312 and TASK-2401..TASK-2407. **Open conflict flagged**: Mongoose `required: true` applies collection-wide; Batch Mode groups do not have these fields. Resolution needed — see Open Questions #7. |
| 2026-05-04 | **UI ENHANCEMENT** Survey intro relationship structure display expanded (REQ-405.1) | The "關係結構" introduction step now displays ALL participant interactions (4 participants, 4 edges), not just interactions involving You and Opponent. This provides participants with a complete view of the network history before making decisions. |
| 2026-05-04 | **BUG IDENTIFIED & FIXED** Admin history view read-only mode shows 0 active edges (BUG-003) | When clicking session ID from history table to view in read-only setup panel, "Active Edges" section displays as empty despite history table showing correct edge count. Fixed by modifying `toSessionGraph` resolver to derive virtual `activeEdgeIds` field from first scenario. |
| 2026-05-05 | **UI CONSOLIDATION** Admin setup page now hosts both Manual and Mixed mode via inline `LaunchMode` selector (REQ-204, REQ-205) | The `/admin/setup` page exposes a two-button mode toggle ("Manual" / "Mixed") so administrators can choose their launch strategy without leaving the setup tab. Batch mode remains accessible via the Groups tab. `SetupPanel.tsx` `LaunchMode` type is `'manual' \| 'mixed'`. |
| 2026-05-05 | **URL DIFFERENTIATION** Admin setup mode is now reflected in the URL via `?mode=` query parameter (REQ-204, REQ-205, REQ-206) | `/admin/setup?mode=manual` and `/admin/setup?mode=mixed` open `SetupPanel` in the corresponding mode. Navigating to `/admin/setup` with no param defaults to Manual. Changing the toggle updates the URL in-place (replace, not push) via `useSearchParams`. Enables bookmarking and deep-linking to a specific mode. |
| 2026-05-06 | **ADMIN UI ENHANCEMENT** Submission progress tracking in history table (REQ-340) | Admins can now see detailed progress for each submission including answered questions count, completion percentage, and current stage (answering questions / demographics / completed). |
| 2026-05-06 | **DATA INTEGRITY** Enforce one submission per participant per session (REQ-313) | The system now records `participantId` on every Submission and rejects a second `startSurvey` call for the same `(sessionId, participantId)` pair. This ensures scenario `responseCount` values count distinct people, not repeat visits from the same participant. Three-layer fix: DB unique sparse index + resolver duplicate check + GraphQL/client participantId passing. |
| 2026-05-06 | **BUG IDENTIFIED** Mixed Mode session creation timing issue (BUG-004) | Mixed Mode creates session immediately on welcome page load, before user clicks "start". This differs from Manual Mode (which waits until intro complete) and causes duplicate sessions when page reloads or React StrictMode double-executes effects. |
| 2026-05-06 | **ADMIN CAPABILITY** Invalidate submission feature (REQ-350..REQ-353) | Admin can mark any submission as invalid (`isInvalid: true`). Invalid submissions are excluded from `submissionCount` (releasing the slot for a new participant) and from scenario `responseCount` (correcting Mixed Mode balanced selection). Admin can toggle a filter in the history/submission list to show or hide invalid submissions. |
| 2026-05-06 | **DATA EXPORT** Complete submission data CSV export (REQ-360..REQ-362) | Admin can export detailed submission data including all participant responses, scenario configurations, active edges, cooperation probabilities, demographics, and timestamps. The CSV format is designed for easy analysis and full data restoration. |
| 2026-05-06 | **UI ENHANCEMENT** Icon-based invalidation controls with confirmation (REQ-355..REQ-357) | Replace text-based "Invalidate"/"Restore" buttons with intuitive icon buttons. Add confirmation modal to prevent accidental invalidation. Replace inline "Invalid(1)" badge with tab-based view switching for cleaner UI. |
| 2026-06-15 | **UI ENHANCEMENT** Partner node peach-pink highlight color (REQ-406) | The partner node ("搭檔") in `NetworkGraph` now uses a vibrant peach-pink (#f472b6, pink-400) for its ring stroke, glow aura, and role badge fill — matching the visual prominence of the focal node's amber highlight. A new `rolePartnerHighlight` token is added to `COLORS` in `constants.ts`; the existing `roleOpponent` and `rolePartner` gray tokens are preserved for backward compatibility. |
| 2026-07-02 | **UI ENHANCEMENT** Decision slider randomized starting position + mandatory interaction gate (REQ-402.1) | The per-scenario `DecisionSlider` no longer defaults to a fixed 50% on every round. Its starting position is now randomized per scenario to reduce anchoring bias, and the participant must actively drag the slider at least once before the confirm button unlocks — a slider left untouched can no longer be submitted at whatever value it happened to render at. Frontend-only change, no backend/schema impact. |
| 2026-07-02 | **UI POLISH** Disabled confirm button visibly grayed out + glowing slider prompt (REQ-402.2) | Fixed a visual bug where the confirm button was functionally disabled (per REQ-402.1) but still rendered with the "enabled" black/glow styling. The button's gray-out styling now matches its `disabled` state. Additionally, `DecisionSlider` now pulses with a glow effect while `hasInteracted` is `false`, visually prompting the participant to drag it; the glow stops the moment they interact. The "決策分析" probability text below the slider is also grayed out (`text-gray-300`) until the participant interacts, then returns to normal color. |
| 2026-07-02 | **UI POLISH** Slider visually camouflaged to appear valueless until interacted (REQ-402.3) | `DecisionSlider`'s thumb and filled track now use `accent-gray-200` (matching the track background) while `hasInteracted` is `false`, making the underlying randomized starting value (REQ-402.1) visually imperceptible — the slider appears to have no position/value at all until the participant drags it, at which point it switches to `accent-indigo-600` and reveals the real value. The randomized numeric value still exists internally (native `<input type="range">` requires one); only the visual presentation is suppressed. |
| 2026-07-02 | **UI POLISH** Undecided-state copy on slider analysis text + neutral network graph decision edge (REQ-402.4) | Extends REQ-402.3's camouflage to the remaining two places the randomized-but-untouched slider value leaked through: (1) the "決策分析" text under `DecisionSlider` now shows "請點擊輸入您的決策" instead of a probability sentence while `hasInteracted` is `false`; (2) `NetworkGraph`'s decision edge (path, draggable bubble, arrow tip, dash animation speed) now renders in `COLORS.highlight` (the same amber/orange already used for the exact-50% "中立" case) with the bubble label reading "未決策" instead of "給予"/"不給予"/"中立", via a new `hasInteracted` prop threaded from `SurveyView.tsx` and `SurveyIntro.tsx`. |
| 2026-07-02 | **BEHAVIOR FIX + DATA MODEL** Debrief give/no-give outcome is now a persisted probabilistic draw, not a threshold (REQ-407.1) | `SurveyOutro`'s round table previously derived each round's "合作"/"不合作" outcome by comparing `cooperationProbability` to a 50% threshold (with an unpersisted client-side coin flip only for the exact-50% tie). This was replaced with a true Bernoulli draw (`Math.random() < p`) applied uniformly to every round's probability, for both the participant and the paired opponent. Because virtually every round is now a random draw (not just the 50% edge case), the outcome is drawn once server-side in `drawRealisedRound` and persisted on `Submission.myDecisions`/`Submission.opponentDecisions` (parallel boolean arrays alongside `realisedRoundIndex`/`opponentProbs`) so a page refresh cannot change the participant's realised cash payout. Per-row probability percentages and the "由系統隨機決定" 50%-only tooltip were also removed from the table — each row now shows only the 合作/不合作 badge, since every row's outcome is now equally a random draw. |
| 2026-10-01 | **IRB REVISION** Points → payment conversion disclosure + persisted payout ledger (REQ-408) | Responds to IRB comment 2「確認點數與實際報酬的換算」. All payment parameters move to one module (`utils/payment.js`): 1 點 = 新台幣 100 元, an optional participation fee (`PARTICIPATION_FEE_NTD`, default 0 — **pending PI confirmation**, Open Question #8), 電子禮券 by email, and a timeline text (Open Question #9). The intro, debrief and email steps now state the rate, an outcome table, the min–max range, a worked example, and the payment form and timing consistently (previously the intro said 現金報酬 while the email step said 現金禮券). `drawRealisedRound` persists `realisedPoints`/`payoutNtd`; the debrief shows only the persisted amount (the unpersisted client-side fallback draw is removed). Admins get a complete group-scoped submissions query and an「Export Payments」CSV; queries returning participant email now require the admin JWT. |
| 2026-10-01 | **IRB REVISION** Figure legibility — legend, captions, minimum sizes (REQ-409) | Responds to IRB comment 1「適度調整圖片尺寸及解析度，並補充相對應的說明，以利參與者理解欲傳達的訊息及內容」. A new `GraphLegend` explains every visual encoding of `NetworkGraph`; captions (圖說) are added under the intro figures; the "?" markers, scenario graph and intro interaction list are enlarged; 2× DPR screenshots with a caption index are produced for the IRB packet. |
| 2026-10-01 | **PROCESS** Before/after screenshot evidence report (NFR-7) | Every participant-facing edit made for the IRB is captured before and after the change from the same seeded fixture (seeded randomness, frozen animations, desktop + phone at 2× DPR) and compiled into a PDF report via `npm run irb:shots` / `npm run irb:report`. |
| 2026-10-01 | **ISSUES FOUND** Admin auth not enforced in resolvers (BUG-006); group view limited to 100 submissions (BUG-007) | Found during the IRB audit. BUG-007 is fixed by REQ-408.7; BUG-006 is partially addressed by REQ-408.8 (PII queries guarded) — admin mutations remain open. |
| 2026-11-15 | **PROCESS** Full-flow end-to-end test with a review report (NFR-8); partner pairing never matches (BUG-008); registration code lost on refresh (BUG-009) | `npm run test:e2e` runs admin launch → invite link → participant survey → debrief → payment ledger export against an in-memory MongoDB in real Chrome, and writes a screenshot report. Writing the test exposed BUG-008 (the 搭檔 decision is a 50/50 draw, not a real participant's answer); its first run found BUG-009 (a refresh after outro step 1 saves the registration code as `unknown`). |
| 2026-11-15 | **BUG FIX** Registration code survives a refresh (REQ-403.1, BUG-009) | The code entered on outro step 1 is kept in the browser per submission and restored after a refresh; the final submit never saves `unknown`. |
| 2026-11-15 | **PROCESS** E2E edge cases EC-1…EC-13 (NFR-8.1); full group never closes (BUG-010) | Leave/refresh/return/Back, attend twice, another device, full group, non-Chrome, unknown link, API misuse. 12 of 13 cases pass or are recorded as observations; EC-9 fails (BUG-010). Open Questions #10–#13 list the observations that need a decision. |
| 2026-11-15 | **PROCESS** Test-case roadmap at the top of the e2e report (NFR-8.2) | The report opens with the participant journey stage by stage, each stage's happy-path result and its edge cases coloured pass / fail / observed, so the reviewer sees coverage and failures at a glance. |
| 2026-11-16 | **BUG FIX + DECISIONS** Full Mixed group closes (BUG-010, REQ-309, REQ-405.1); confirmed answers are final (REQ-402.4); unknown invite link explained on arrival (REQ-405.2) | The group is marked completed once every scenario reaches its target and new visitors are turned away on arrival; participants already in progress may finish. A confirmed scenario answer can no longer be changed, by Back or through the API (resolves Open Questions #12, #13). An invite link to a group that does not exist shows 「找不到此實驗」 on the welcome page instead of failing after the whole intro (resolves Open Question #11). |
| 2026-11-16 | **PROCESS** One e2e report for PC and phone (NFR-8.3) | The full e2e journey and edge cases run on a PC and on an emulated phone, and one combined report shows both results for every case and the PC and phone screenshots side by side. |
| 2026-11-17 | **PROCESS** Simulated pilot data check (NFR-9) | `npm run sim:data` fills a local study with simulated participants of known behaviour (personas), exports the research CSV and the payment ledger from the admin page, and checks every value against what was sent, so data problems are found before real participants are recruited. |
| 2026-11-18 | **DATA CAPTURE** Consent checkbox and consent record (REQ-417); device type and browser recorded (REQ-418) | From the data review's 「not recorded」 list. The welcome page gets 「我已閱讀並同意參與本研究」; the submission stores when the participant consented and to which text version, and the device type (mobile / desktop) and user agent of the device that started it. |
| 2026-11-18 | **SCHEMA FIX** Registration code and email get their own fields (BUG-015); questionnaire answers stored as booleans (REQ-416) | `Submission.demographics` (`age` / `gender` / `education`) held the registration code in `gender`, the email in `education` and a number parsed from the code in `age`. It is replaced by `Submission.registrationCode` and `Submission.email`; `completeSurvey(submissionId, registrationCode, email, questionnaire)`. Each Q1–Q8 answer is now `answer: Boolean` (true = the first option: 同意 / 好 / 管制); the research CSV shows `true` / `false`. No data migration: the production database was empty. |
| 2026-11-19 | **DATA EXPORT** Email added to the research CSV (REQ-362); welcome footer reworded (REQ-417) | By the research team's decision the research CSV gets an 「Email」 column after 「Registration Code」 (reverses the 2026-11-17 choice to keep it only in the payment ledger). The welcome footer drops 「，不收集個資」, which was untrue now that an email and the user agent are collected. |
| 2026-11-19 | **SECURITY** Bot-check cookie is signed (BUG-016, REQ-102, NFR-3) | The `turnstile_verified` cookie held the plain value `true`, so any script could skip Turnstile by setting it (the production e2e did exactly this, so the real Cloudflare check was never exercised). The cookie now holds a server-signed token that expires after 2 h; a forged or expired cookie counts as not verified. The server refuses to start in production without `JWT_SECRET`. Test scripts obtain a real cookie from `POST /api/turnstile/verify`. |
| 2026-11-17 | **BUG FIX** Session kept in the URL after a quick first answer (BUG-014, REQ-404) | Found by the first production e2e run: a refresh after a fast first answer left the participant on 「載入中...」. |
| 2026-11-17 | **DATA CAPTURE** Response time recorded (REQ-402.5); a failed answer save keeps the participant on the scenario (REQ-402.6, BUG-013); research CSV columns relabelled and email removed (REQ-362) | From the production data review: `responseTime` existed in the schema and the CSV but was never sent, so the column was always empty. A failed `saveSurveyAnswer` used to move the participant on and lose that answer. The research CSV labelled the registration code 「Gender」 and the email 「Education」 and put the email next to the Q1–Q8 opinions; it now has 「Registration Code」, no Age and no Email (the email stays in the payment ledger, joined by Submission ID). |
| 2026-11-17 | **DATA SAFETY** Questionnaire data-capture review (BUG-011, BUG-012; REQ-402.4, REQ-403.2, REQ-408.8, REQ-416) | A failed final save no longer shows the done page or wipes the answers; it shows an error and keeps everything for a retry (BUG-011). A completed submission cannot be completed again (BUG-012). `completeSurvey` now requires all eight answers. The registration code and email are admin-only like the answers. Unsent answers are kept per tab (sessionStorage), not left on the device. |
| 2026-11-17 | **NEW FEATURE** Post-survey questionnaire Q1–Q8 (REQ-416) | Eight required single-choice attitude questions on a new outro page between the debrief and the email; saved with the submission, admin-only, exported in the submissions CSV. The outro now has 5 steps. Reviewed: Q2 typo 「曆史」→「歷史」 fixed; every question ends with a full-width 「？」. |
| 2026-11-16 | **UI CHANGE** 圖例 and 圖說 collapsed by default, open on tap (REQ-409.5) | The graph legend and figure captions took up most of a phone screen; they now open when tapped. Admin pages appear once (PC only) in the combined e2e report. |
| 2026-11-16 | **ADMIN CAPABILITY** Mixed Mode cost estimate (REQ-314) | The Mixed setup page shows the estimated total payout (est. participants × per-participant payout range) in the Setting Preview and the launch confirmation, so the admin can budget before launching. Uses the payment constants from `utils/payment.js` (REQ-408.1). |
| 2026-11-16 | **ADMIN CAPABILITY** Actual payout on the group page (REQ-408.9) | The group detail page (`/admin/view/batch/:groupId`) shows the total actually owed to participants so far — the sum of persisted `payoutNtd` over the same rows as the payment ledger — next to the Mixed Mode budget ceiling (REQ-314). |
| 2026-11-16 | **SCOPE CHANGE** Single-session history removed; nav renamed「View Sessions」(REQ-207, REQ-208) | The「View Single Session」page (`/admin/view/manual`), its read-only session view and the manual setup layout are removed; old URLs redirect to `/admin/view/batch` and `/admin/setup/mixed`.「View Batch Sessions」is renamed「View Sessions」. Participant `?sessionId=` links and the `createManualSession` / `allSessions` API stay. Supersedes REQ-315/316. |
| 2026-11-16 | **SCOPE CHANGE** Manual launch removed from the setup page (REQ-207) | The Launch Mode toggle and the Manual setup screen are removed; `/`, `/admin/setup` and the Setup nav open Batch (Mixed) setup. Existing single sessions keep working: the「View Single Session」history, its read-only view and their `?sessionId=` participant links are unchanged, and `createManualSession` stays on the API. Supersedes REQ-201, REQ-202, REQ-204–REQ-206 for new launches. |

---

## Overview

The platform supports two primary user roles cooperating around an experimental flow:

1. An **Administrator** designs a network topology (4 named/colored nodes, up to 12 directed edges), picks a focal node and an opponent node, sets a target sample size, and launches experiments in one of three modes:
   - **Manual Mode** (`/admin/setup?mode=manual`): Single session with fixed edges chosen on the network graph.
   - **Mixed Mode** (`/admin/setup?mode=mixed`): Cross-k sampling with scenario-level targeting. Admin picks maxK, scenariosPerSession, and targetSizePerScenario; the system generates a scenario pool and serves balanced sessions to each arriving participant. ✅ **COMPLETED 2026-04-29**
   - **Batch Mode** (`/admin/view/batch`): Multiple sessions, one per k-edge combination (complete factorial sweep). Accessible via the Groups tab, not the Setup tab.
   
   *2026-11-16 (REQ-207):* the setup page now launches Batch (Mixed) only; Manual Mode remains only for viewing past single sessions. Previously, Manual Mode and Mixed Mode shared the `/admin/setup` page and were selected with an inline two-button `LaunchMode` toggle. The active mode is always reflected in the URL as a `?mode=` query parameter, enabling bookmarking and direct links to each mode. Navigating to `/admin/setup` without the parameter defaults to Manual Mode. They distribute survey URLs and monitor responses at both session and scenario levels.

2. A **Participant** opens a survey URL, passes a Cloudflare Turnstile bot check, completes a sequence of cooperation-probability scenarios, fills demographics, and submits. Their progress is persisted.

The system is implemented as a React/Vite SPA backed by a Node/Express GraphQL API and MongoDB. **Architecture note**: The data model is **scenario-centric** — Scenario is the atomic unit, Session is a container that references scenarios. This unified design eliminates mode-specific code branches.

---

## User Roles

- **Administrator (Admin)** — Researchers and platform managers. Authenticated via a shared `ADMIN_PASSWORD`. Has full read/write access to sessions, groups, submissions, and (in dev mode only) database reset.
- **Participant** — Anonymous public user. Authenticated only by Cloudflare Turnstile cookie. Can only create and update their own `Submission`.

---

## User Stories

### Admin Stories

- **US-A1**: As an admin, I want to configure a single experimental session so that I can launch a tightly controlled experiment.
- **US-A2**: As an admin, I want to batch-launch every k-edge combination as a session group so that I can run a complete factorial sweep without configuring each session by hand.
- **US-A3**: As an admin, I want to launch a mixed-mode experiment that samples scenarios across multiple k values so that I can collect balanced data across the entire edge-space without requiring every participant to complete hundreds of scenarios. ✅ **IMPLEMENTED 2026-04-29**
- **US-A4**: As an admin, I want to monitor scenario-level completion status (not just session-level) so that I can identify under-sampled scenarios and adjust recruitment accordingly. ✅ **IMPLEMENTED 2026-04-29**
- **US-A5**: As an admin, I want to monitor real-time submission counts and completion percentages so that I know when a session or group has reached its target sample size.
- **US-A6**: As an admin in development, I want to clear the database so that I can iterate on the schema without leftover state.
- **US-A7**: As a researcher, I want a payment ledger listing each completed participant's drawn round, points and exact NT$ amount, so that what I pay always equals what the participant was shown.

### Participant Stories

- **US-P1**: As a participant, I want my survey to remember my progress so that I can refresh or briefly leave and resume.
- **US-P2**: As a participant, I want to be told clearly if a session is full so that I do not waste time on a closed experiment.
- **US-P3**: As a participant in a mixed-mode experiment, I want to complete a manageable number of scenarios (e.g., 20) sampled from a larger pool, so that my time commitment is reasonable while still contributing to balanced data collection. ✅ **IMPLEMENTED 2026-04-29**
- **US-P4**: As a participant, I want the survey UI in my preferred language (zh-TW today; future locales planned).
- **US-P5**: As a participant, I want to know before I start exactly how points convert to money (the rate, which round counts, the possible amounts, and how and when I am paid), so that I can make informed decisions.
- **US-P6**: As a participant, I want every diagram to be large enough to read and to explain what its colors, arrows and symbols mean, so that I understand the information I am deciding on.

---

## Functional Requirements

### REQ-100 — Authentication & Bot Protection

- **REQ-101 — Admin password login.** The system MUST gate every `/admin/*` route behind a password check against `ADMIN_PASSWORD`. Login state is held client-side after a successful `POST /api/admin/login`.
  - *Acceptance:* Submitting an incorrect password returns HTTP 401 with `{ success: false }`. Submitting the correct password returns HTTP 200 with `{ success: true }`. Direct navigation to `/admin/setup` while not authenticated redirects to `/login`.
  
- **REQ-102 — Cloudflare Turnstile gate.** Participants MUST pass Turnstile before any survey GraphQL mutation that creates or updates a submission. Verification is recorded as the `turnstile_verified` HTTP-only cookie (max age 2 h).
  - *Acceptance:* `startSurvey` resolver throws `Turnstile verification required before starting survey.` when the request lacks the cookie. In `NODE_ENV !== 'production'`, the test secret `1x0000000000000000000000000000000AA` short-circuits the Cloudflare round-trip.
  - **REQ-102.1 — The cookie cannot be forged.** 📋 **NEW 2026-11-19** (BUG-016) Only the server can create a valid `turnstile_verified` cookie, and only after a successful `POST /api/turnstile/verify`. Its value is a token signed with `JWT_SECRET` that expires 2 h after verification, independent of the browser's cookie expiry. A cookie that is missing, hand-written (e.g. `turnstile_verified=true`), tampered with, signed with another secret or expired is treated as not verified.
    - *Acceptance:* `GET /api/turnstile/status` with `Cookie: turnstile_verified=true` returns `verified: false`, and `startSurvey` with that cookie is rejected; the cookie returned by `POST /api/turnstile/verify` gives `verified: true`. In production the server does not start if `JWT_SECRET` is unset. Verified by EC-12 (NFR-8.1).

### REQ-200 — Single-Session Setup (`/admin/setup`)

- **REQ-201 — Configure a session.** ⛔ **SUPERSEDED 2026-11-16 by REQ-207** (no new single sessions from the UI) Admin selects (a) focal node, (b) opponent node, (c) active edge IDs from the 12 directed edges defined in `constants.ts`, and (d) target `sampleSize` (default 20).
  - *Acceptance:* `createManualSession` mutation creates independent `Scenario` documents and a `Session` document with UUID `_id`, `groupId = null`, and the supplied fields. Returns the session with `scenariosCreated` count.
  
- **REQ-202 — Generate a survey link.** ⛔ **SUPERSEDED 2026-11-16 by REQ-207** (existing links still work) After saving, the admin sees a shareable URL of the form `<origin>/survey/welcome?sessionId=<id>`.
  - *Acceptance:* Opening that link hydrates the session via `session(id)` query and starts the participant flow.
  
- **REQ-203 — Visualize the network graph.** The setup panel renders the 4-node directed graph with selectable edges and color-coded groups (Group A blue, Group B red).
  - *Acceptance:* Toggling an edge updates `activeEdgeIds`. Selecting focal/opponent nodes updates the corresponding fields.

- **REQ-204 — Mode toggle with URL synchronization.** ⛔ **SUPERSEDED 2026-11-16 by REQ-207** The `/admin/setup` page MUST expose a two-button toggle (labeled "Manual" and "Mixed") that selects the active launch strategy. The toggle state MUST be reflected in the URL as a `?mode=` query parameter at all times, so the current mode is always bookmarkable and shareable.
  - *Acceptance:*
    - Clicking "Manual" sets the URL to `/admin/setup?mode=manual` and renders the Manual Mode configuration UI.
    - Clicking "Mixed" sets the URL to `/admin/setup?mode=mixed` and renders the Mixed Mode configuration UI.
    - URL update MUST use history replace (not push), so toggling the mode does not add entries to the browser history stack.
    - A user who copies the URL `/admin/setup?mode=mixed` and opens it in a new tab MUST land directly in Mixed Mode.
    - A user who copies the URL `/admin/setup?mode=manual` and opens it in a new tab MUST land directly in Manual Mode.
    - The browser back button reflects natural navigation history, not toggling between modes.

- **REQ-205 — Default mode when param is absent or invalid.** ⛔ **SUPERSEDED 2026-11-16 by REQ-207** Navigating to `/admin/setup` without a `?mode=` parameter, or with an unrecognized value (e.g., `?mode=foo`), MUST default to Manual Mode. The URL MUST be corrected to `?mode=manual` immediately on load (via replace, not push).
  - *Acceptance:*
    - `GET /admin/setup` (no param) → renders Manual Mode; URL becomes `/admin/setup?mode=manual`.
    - `GET /admin/setup?mode=invalid` → renders Manual Mode; URL becomes `/admin/setup?mode=manual`.
    - No flash of the wrong mode is visible before the URL correction.

- **REQ-206 — Internal admin links preserve mode context.** ⛔ **SUPERSEDED 2026-11-16 by REQ-207** Any link within the admin console that navigates to `/admin/setup` MUST include a `?mode=` parameter. The default when generating such links programmatically (e.g., "go to setup" buttons) MUST be `?mode=manual`.
  - *Acceptance:*
    - No internal navigation produces a bare `/admin/setup` URL without a `?mode=` param.
    - Where the originating context already knows the target mode (e.g., "Edit in Mixed Mode" from a Mixed Mode group), the link uses `?mode=mixed`.

- **REQ-207 — Batch is the only launch mode.** 📋 **NEW 2026-11-16** The setup page launches Batch (Mixed Mode) groups only.
  - *Acceptance:*
    - `/admin/setup/mixed` shows no Launch Mode toggle; it opens directly on the Batch configuration.
    - `/`, `/admin/setup` and the「Setup」nav item go to `/admin/setup/mixed`.
    - Opening `/admin/setup/manual` redirects (replace) to `/admin/setup/mixed`.
    - *Amended 2026-11-16:* the「View Single Session」page and its read-only view of a past session are removed too (REQ-208); the manual setup layout no longer exists. Opening `/admin/view/manual` redirects (replace) to `/admin/view/batch`.
    - Existing single-session participant links (`/survey/welcome?sessionId=…`) and the `createManualSession` / `allSessions` API are unchanged.

- **REQ-208 — Admin navigation.** 📋 **NEW 2026-11-16** The admin sidebar lists exactly: 「Setup」(`/admin/setup/mixed`), 「View Sessions」(`/admin/view/batch`, renamed from「View Batch Sessions」), 「Clear Database」(development only) and「Logout」. There is no「View Single Session」item.
  - *Acceptance:* covered by `components/__tests__/AdminView.test.tsx`.

### REQ-300 — Batch Launch / Session Groups (`/admin/view/batch`)

- **REQ-301 — Create a SessionGroup.** ✅ **USES NEW API (2026-04-29)** Admin specifies `name`, optional `description`, `edgeCount` (k, 1–12), `focalNode`, `opponentNode`, `sampleSize`. The system enumerates **all** C(12, k) edge combinations, generates independent `Scenario` documents per combination, and inserts one `Session` per combination linked to the new `SessionGroup` via `groupId`.
  - *Acceptance:* `createBatchSessions` mutation rejects `edgeCount < 1`, `edgeCount > 12`, or combinations exceeding the 1000 cap. On success, returns `{ groupId, sessionsCreated, sessionIds[] }`. The group's status transitions from `creating` -> `active`. Verified with k=2: 66 sessions, 264 scenarios.
  
- **REQ-302 — Group monitoring table (`GroupsTable`).** Lists all `SessionGroup` documents with progress (`completedSessions / totalSessions`) and status (`creating | active | completed | archived`).
  - *Acceptance:* Completion percentage is derived consistently with `SessionGroup.completionPercentage` virtual field.
  
- **REQ-303 — Group detail view (`/admin/view/batch/:groupId`).** Lists every `Session` belonging to the group with per-session submission counts and survey links.
  - *Acceptance:* Sessions are loaded via `sessionsByGroup(groupId)` query and ordered by `createdAt` ascending. URLs use `?sessionId=` format.
  
- **REQ-304 — Group lifecycle controls.** Admin can update a group's status (via `updateSessionGroupStatus`) or delete a group (via `deleteSessionGroup`, which cascades and deletes all child `Session` and `Submission` documents).
  - *Acceptance:* `updateSessionGroupStatus` rejects any status not in the enum. `deleteSessionGroup` returns `true` only if the group existed and was removed.

### REQ-305 — Mixed Mode Launch (`/admin/mixed`) ✅ **IMPLEMENTED 2026-04-29**

- **REQ-306 — Create a Mixed Mode Group.** ✅ **COMPLETED** Admin specifies `name`, optional `description`, `maxK` (1–12), `scenariosPerSession` (S), `targetSizePerScenario`, `focalNode`, `opponentNode`. The system generates a **scenario pool** by enumerating all edge combinations for k=1 through k=maxK, generating a design matrix for each combination, and creating individual `Scenario` documents. Each scenario tracks its own `responseCount` vs `targetSize`.
  - *Acceptance:* `createMixedGroup` mutation validates `1 <= maxK <= 12` and `scenariosPerSession > 0`. Returns `{ groupId, totalScenarios, estimatedSessions, masterUrl }`. Scenarios are created with `status='active'` and `responseCount=0`. Group status transitions from `creating` -> `active`. **Tested**: maxK=2 generates 288 scenarios (12×2 + 66×4).
   
- **REQ-307 — Mixed Mode Participant Session Creation.** ✅ **COMPLETED** When a participant opens `/survey/welcome?groupId=<id>&mode=mixed`, the system dynamically creates a personalized `Session` by selecting S scenarios from the group's scenario pool using a **balanced selection strategy** (prioritizing scenarios with lower `responseCount`).
  - *Acceptance:* `startMixedSession(groupId, participantId)` mutation selects scenarios where `status='active'`, sorts by `responseCount` ascending, and samples S scenarios. Creates a new `Session` with `scenarioIds` referencing the selected scenarios, `metadata.participantId` set, `sampleSize=1`. Returns `{ sessionId, assignedScenarios[] }`. If the participant already has a session for this group (based on `participantId`), returns the existing session for resume capability. **Implemented**: Balanced selection strategy with 2S candidate pool.

- **REQ-308 — Scenario-Level Data Collection Tracking.** ✅ **COMPLETED** Each time a participant submits a response for a scenario (via `saveSurveyAnswer`), the system MUST atomically increment the scenario's `responseCount` using `$inc`.
  - *Acceptance:* After `saveSurveyAnswer`, the referenced `Scenario` document's `responseCount` field is incremented by 1. Concurrent submissions to the same scenario are handled safely via MongoDB atomic operations. **Implemented**: Uses `$inc` in saveSurveyAnswer resolver.

- **REQ-309 — Mixed Mode Completion Detection.** ✅ **COMPLETED** When all scenarios in a Mixed Mode group reach their `targetSize` (i.e., `responseCount >= targetSize`), the system automatically updates the group's status to `completed`.
  - *Acceptance:* After each submission completion, query `Scenario.countDocuments({ groupId, responseCount: { $lt: targetSize } })`. If count is 0, update `SessionGroup.status = 'completed'`. Admin UI displays completion progress as `(scenarios where responseCount >= targetSize) / totalScenarios × 100%`. **Implemented 2026-11-16 (BUG-010)**: `SessionGroup.status` (`active` | `completed`) is recomputed after every `completeSurvey` and after every invalidate/restore (REQ-350), so invalidating a submission that drops a scenario below target re-opens the group.

- **REQ-313 — One Submission Per Participant Per Session.** 📋 **NEW 2026-05-06** The system MUST ensure that each unique participant can only create one `Submission` per session, so that a scenario's `responseCount` reflects the number of distinct people who responded, not the number of times anyone visited.
  - *Rationale:* `Scenario.responseCount` drives the Mixed Mode balanced selection strategy and the group completion check (REQ-308, REQ-309). If one participant submits twice to the same session, `responseCount` would be overcounted, causing skewed scenario selection and false "completed" group status.
  - *Acceptance:*
    - `startSurvey(sessionId, participantId)` MUST accept a `participantId` argument.
    - If a `Submission` already exists for `(sessionId, participantId)` and `participantId` is non-null, the resolver MUST return the existing submission (resume) rather than creating a duplicate.
    - `Submission` schema MUST have a compound index `{ sessionId: 1, participantId: 1 }` with `unique: true, sparse: true`. `sparse: true` allows multiple `null` entries (Manual/Batch mode participants without fingerprinting).
    - The GraphQL `startSurvey` mutation signature is updated to `startSurvey(sessionId: String!, participantId: String): Submission`.
    - `SurveyWelcome.tsx` MUST call `getParticipantId()` and pass the result to `startSurvey`.
  - *Scope:* Applies to all three modes. Manual/Batch: `participantId` may be null (no fingerprinting enforced, but no duplicate submission possible either since the session full-check still applies). Mixed: `participantId` is always set via device fingerprinting (REQ-311).

- **REQ-312 — Mixed Mode Config Fields Are Mandatory.** 🔧 **IN PROGRESS** (2026-05-04) When creating a Mixed Mode `SessionGroup`, the three configuration fields `maxK`, `scenariosPerSession`, and `targetSizePerScenario` MUST be provided and MUST be valid positive integers. The system MUST reject any attempt to create a Mixed Mode group without all three fields.
  - *Rationale:* These fields are the complete definition of a Mixed Mode experiment. Without them, `createMixedGroup` cannot generate a scenario pool (`maxK`), cannot create personalized sessions (`scenariosPerSession`), and cannot track group completion (`targetSizePerScenario`). Previously they were `required: false` which allowed silent partial configurations that would fail at runtime.
  - *Acceptance:*
    - `SessionGroup.config.maxK` — Mongoose schema `required: true`, enforced range `min: 1, max: 12`
    - `SessionGroup.config.scenariosPerSession` — Mongoose schema `required: true`, value must be ≥ 1
    - `SessionGroup.config.targetSizePerScenario` — Mongoose schema `required: true`, value must be ≥ 1
    - `createMixedGroup` mutation rejects input where any of these three fields is missing or zero (existing resolver-level validation already covers this; the schema change adds a second layer of enforcement at the persistence layer)
    - GraphQL `GroupConfigInput` type declares these fields as non-nullable (`Int!`) so callers get a schema-level error before the resolver even runs
    - TypeScript `SessionGroup.config` interface declares `maxK`, `scenariosPerSession`, `targetSizePerScenario` as `number` (not `number | null`)
  - *Breaking change note:* Any existing `SessionGroup` document of Batch Mode (`config.edgeCount` is set, `config.maxK` is null) will fail Mongoose validation under strict `required: true` unless the constraint is scoped only to Mixed Mode documents. See Open Question #7.

- **REQ-314 — Mixed Mode Cost Estimate.** 📋 **NEW 2026-11-16** On `/admin/setup/mixed`, the admin MUST see the estimated total participant payout for the current configuration, updated live as `maxK`, `scenariosPerSession` and `targetSizePerScenario` change.
  - *Rationale:* Each participant is paid for one randomly drawn round (REQ-408), so the total cost scales with the number of participants. The admin needs the budget before launching a group.
  - *Acceptance:*
    - The Setting Preview shows an「Est. Cost」card: the budget ceiling `Est. Participants × MAX_TOTAL_NTD` as the headline (NT$, thousands separators), the range `Est. Participants × MIN_TOTAL_NTD` – ceiling, and the per-participant range `MIN_TOTAL_NTD`–`MAX_TOTAL_NTD`.
    - The「Confirm Batch Sessions」modal repeats the estimated cost range.
    - All amounts come from `utils/payment.js` (REQ-408.1); changing `PARTICIPATION_FEE_NTD` or `POINT_TO_NTD` changes the estimate with no other edit.
    - The card notes it is an estimate: participants already in progress when the group closes may still finish (REQ-405.1), and invalidated submissions are replaced by new participants (REQ-350), so the real count can exceed the estimate.

- **REQ-310 — Scenario Completion Visualization.** ⏸️ **DEFERRED** Admin UI for Mixed Mode groups MUST display a scenario-level completion heatmap showing which scenarios are under-sampled, at-target, or over-sampled.
  - *Acceptance:* `GroupDetailView` for Mixed Mode groups queries all scenarios via `scenarios(groupId)` and renders a visual matrix (e.g., D3 heatmap) where color intensity represents `responseCount / targetSize`. Clicking a cell shows scenario details (edge configuration, current count).

- **REQ-311 — Device Fingerprint Participant Identification.** 🔄 **IN PROGRESS** (2026-05-04) The system MUST use browser device fingerprinting instead of random IDs for participant identification in Mixed Mode to enhance duplicate detection and prevent repeat submissions.
  - *Rationale:* Random localStorage IDs can be easily cleared or bypassed. Device fingerprinting provides more stable identification across sessions while remaining privacy-friendly (no PII collection).
  - *Acceptance:*
    - Replace `utils/participantId.ts` random ID generation with fingerprinting library (e.g., FingerprintJS)
    - Generate participant ID from browser attributes: canvas fingerprint, WebGL, fonts, screen resolution, timezone, plugins
    - Fallback to random ID if fingerprinting fails (e.g., privacy-focused browsers)
    - Store fingerprint hash (not raw data) in `Session.metadata.participantId` and `Submission.participantId`
    - Participant ID should be stable across browser sessions but change if significant browser config changes
    - Display fingerprinting attribution notice in survey welcome page per library licensing requirements
  - *Technical Constraints:*
    - Must work in all major browsers (Chrome, Firefox, Safari, Edge)
    - Should not significantly impact page load time (<100ms)
    - Respect DNT (Do Not Track) headers - fallback to anonymous mode if DNT is enabled
    - Comply with privacy regulations (no biometric data, no cross-site tracking)

### REQ-315 — Session History (`/admin/view/manual`) ⛔ **REMOVED 2026-11-16 (REQ-207, REQ-208)** — URL redirects to `/admin/view/batch`

- **REQ-316 — List standalone sessions.** Shows every `Session` where `groupId == null`, with submission counts and links to the survey URL and raw data.
  - *Acceptance:* Backed by `allSessions(excludeGroupSessions: true)` query. URLs use `?sessionId=` format.

### REQ-320 — Scenario-Centric Data Model (Architecture Requirement) ✅ **IMPLEMENTED 2026-04-28** 🔧 **REFINED 2026-05-04**

- **REQ-321 — Scenario as Atomic Unit.** ✅ **IMPLEMENTED 2026-04-28** 🔧 **REFINED 2026-05-04** The system MUST model `Scenario` as an independent, first-class entity with its own collection, lifecycle, and tracking. Each scenario encapsulates: (a) experiment configuration (focalNode, opponentNode, activeEdgeIds), (b) specific state (edgeStates map), (c) data collection progress (responseCount vs targetSize), (d) status controlling selection availability.
  - *Acceptance:* ✅ `Scenario` collection exists with UUID primary keys. Can be queried independently of `Session`. Supports scenario-level analytics and filtering. Implemented in [`backend/models/Scenario.js`](../backend/models/Scenario.js). Tested in 15/15 backend unit tests.
  - *Schema Refinement (2026-05-04):*
    - `scenarioIndex` is now **required** (`required: true`) to ensure traceability to the original design matrix position for all scenarios.
    - `status` enum simplified to `['active', 'inactive']`. The `status` field now explicitly controls whether a scenario can be selected for new sessions (e.g., pausing problematic configurations), rather than redundantly tracking completion state already available via `responseCount >= targetSize` comparison. Previous values `'completed'` and `'paused'` are replaced by the simpler binary `'active'` (available for selection) vs `'inactive'` (excluded from selection).

- **REQ-322 — Session as Scenario Container.** ✅ **IMPLEMENTED 2026-04-28** `Session` MUST be a lightweight container that references scenarios via `scenarioIds: [String]` rather than embedding scenario data. Sessions define the participant experience (which scenarios in what order) but scenarios exist independently.
  - *Acceptance:* ✅ `Session` documents contain only IDs, not full scenario objects. GraphQL queries populate scenarios on-demand via `toSessionGraph` helper. Implemented in [`backend/models/Session.js`](../backend/models/Session.js). Verified with unit tests.

- **REQ-323 — Unified Survey Flow.** ✅ **IMPLEMENTED 2026-04-28** The survey completion logic MUST be identical across all three modes (Manual, Batch, Mixed). No mode-specific conditional branches in resolvers or UI components.
  - *Acceptance:* ✅ `startSurvey`, `saveSurveyAnswer`, `completeSurvey` resolvers handle all modes without checking a `launchMode` field. Mode differences are emergent from session composition, not explicit switches. Implemented in [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js). Tested with unified survey flow tests.

### REQ-330 — Submissions and Database Control

- **REQ-331 — Recent submissions feed.** `recentSubmissions(limit)` query returns the most recent submissions across all sessions for admin review.
  - *Acceptance:* Default `limit` 20, sorted by `createdAt` descending.
  
- **REQ-332 — Database clear (dev only).** `clearDatabase` mutation wipes all collections.
  - *Acceptance:* Throws `Action denied: You cannot clear the database in production.` when `NODE_ENV === 'production'`.

### REQ-340 — Submission Progress Tracking (Admin UI)

- **REQ-341 — Detailed progress display in submission list.** 📋 **NEW 2026-05-06** The admin history table MUST display granular progress information for each submission beyond just the binary `isCompleted` status. This enables admins to identify participants who are stuck at specific stages and understand drop-off patterns.
  - *Acceptance:* For each submission in the expanded submission list ([`HistoryTable.tsx`](../components/HistoryTable.tsx) lines 172-209), display:
    - Progress fraction: `N / M` where N = number of answered scenarios (`submission.results.length`) and M = total scenarios (`session.scenarios.length` or derived from `session.scenarioIds.length`)
    - Progress percentage: `(N / M) × 100%` displayed as a visual progress bar
    - Current stage indicator:
      - **"答題中 (N/M)"** — when `isCompleted = false` and not every scenario is answered
      - **"Outro"** — when `isCompleted = false` and every scenario is answered (the participant is on the debrief / questionnaire / email pages). *2026-11-18 (BUG-015):* was 「填寫人口統計」/ Demographics, keyed on the removed `demographics` field.
      - **"已完成 ✓"** — when `isCompleted = true`
    - The progress display MUST be visible in the expanded row below each session entry, alongside the existing submission detail table (ID, Status, Start Time, End Time)
  - *Technical note:* No backend changes required. All data is already available in the `Submission` model (`results[]`, `isCompleted`) and can be correlated with the session's total scenario count.

- **REQ-342 — Visual progress bar for incomplete submissions.** 📋 **NEW 2026-05-06** Incomplete submissions MUST display a visual progress indicator to help admins quickly assess how far each participant progressed.
  - *Acceptance:*
    - Progress bar shows filled portion corresponding to `(results.length / total scenarios) × 100%`
    - Color coding:
      - Green (`emerald-500`) for completed submissions
      - Amber (`amber-500`) for in-progress submissions (>= 50% complete)
      - Red (`red-500`) for low-progress submissions (< 50% complete)
    - Progress bar is NOT shown for completed submissions (redundant with green checkmark)

- **REQ-343 — Sortable by progress.** ⏸️ **DEFERRED** Admins should be able to sort submissions by completion percentage to identify struggling participants.
  - *Acceptance:* Clicking a "Progress" column header sorts submissions by `results.length / total scenarios` ascending or descending.
  - *Status:* Deferred to future iteration. Current implementation focuses on read-only progress display.

### REQ-350 — Submission Invalidation

- **REQ-351 — Admin can mark a submission as invalid.** 📋 **NEW 2026-05-06** An administrator MUST be able to mark any `Submission` document as invalid by toggling an `isInvalid` flag. Once marked, the submission is treated as if it never counted toward the session's filled capacity or toward any scenario's response count.
  - *Rationale:* Research datasets may contain fraudulent, test, or erroneous submissions that must be excluded from analysis without permanently deleting the raw data (for audit purposes). Invalidating frees the participant slot so a legitimate replacement can respond.
  - *Acceptance:*
    - `Submission` schema MUST have a new Boolean field `isInvalid` (default `false`).
    - A new GraphQL mutation `invalidateSubmission(submissionId: ID!, isInvalid: Boolean!): Submission` MUST be available to authenticated admins.
    - The mutation updates `Submission.isInvalid` to the supplied value and returns the updated document.
    - Only admins may call this mutation; the resolver MUST check admin authentication (same pattern as `clearDatabase`).
    - The mutation is **reversible**: calling it with `isInvalid: false` restores the submission to valid status.

- **REQ-352 — Invalid submissions are excluded from submissionCount.** 📋 **NEW 2026-05-06** The session's `submissionCount` field (used for the "Session Full" gate in REQ-405) MUST only count submissions where `isInvalid` is `false` (or absent/null, for backward compatibility).
  - *Rationale:* `submissionCount` drives the capacity gate. If invalid submissions count toward capacity, a session may appear full while actually having slots available for legitimate participants.
  - *Acceptance:*
    - When `invalidateSubmission` is called with `isInvalid: true`, the parent session's `submissionCount` MUST be decremented by 1.
    - When `invalidateSubmission` is called with `isInvalid: false` (re-validating), the parent session's `submissionCount` MUST be incremented by 1, provided the submission's `isCompleted` is true (only completed submissions contribute to the count).
    - The `completeSurvey` resolver and any other place that increments `submissionCount` MUST continue to use the same field; no separate counter is needed.
    - For Mixed Mode: when a submission is invalidated, the corresponding scenario's `responseCount` values MUST also be decremented by 1 for each unique scenario answered in `Submission.results`. This ensures the balanced selection strategy (REQ-307) and group completion detection (REQ-309) remain accurate.
    - *Edge case:* If a submission is already `isInvalid: true` and `invalidateSubmission(isInvalid: true)` is called again, the resolver MUST be idempotent (no double-decrement).

- **REQ-353 — Admin can filter invalid submissions in the history view.** 📋 **NEW 2026-05-06** The admin submission list (currently `HistoryTable.tsx` expanded rows) MUST provide a toggle to show or hide invalid submissions so that administrators can focus on valid data while retaining the ability to review invalidated records.
  - *Acceptance:*
    - A filter control (e.g., a checkbox labeled "顯示無效的提交" / "Show invalid submissions") MUST appear in the submission list UI.
    - By default (on first load), invalid submissions are **hidden** (filter is off).
    - When the filter is enabled, invalid submissions appear with a distinct visual treatment (e.g., a red "無效" badge and reduced opacity row) to distinguish them from valid entries.
    - The filter state is local UI state only — it does not affect the underlying data or any backend query.
    - Invalid submissions still appear in the count shown to the admin (e.g., "3 submissions (1 invalid)") when the filter is off, so admins know they exist.
    - The filter applies per-session (each expanded session row has its own filter toggle), not globally.

- **REQ-354 — Invalid submissions are excluded from Mixed Mode scenario responseCount.** 📋 **NEW 2026-05-06** For Mixed Mode groups, when a submission is invalidated, the `responseCount` on each `Scenario` that was answered by that submission MUST be decremented so that the balanced selection strategy and group completion check remain accurate.
  - *Rationale:* Mixed Mode balanced selection (REQ-307) and group completion detection (REQ-309) both depend on `Scenario.responseCount`. If an invalid submission's answers are still counted, the system will under-sample affected scenarios and may falsely mark a group as completed.
  - *Acceptance:*
    - `invalidateSubmission(isInvalid: true)` iterates over `Submission.results[]` and for each unique `scenarioId`, atomically decrements `Scenario.responseCount` by 1 (using `$inc: { responseCount: -1 }`), with a floor of 0 (no negative counts).
    - `invalidateSubmission(isInvalid: false)` (re-validation) iterates over `Submission.results[]` and for each unique `scenarioId`, atomically increments `Scenario.responseCount` by 1.
    - Idempotency: if a submission is already invalid and the mutation is called again with `isInvalid: true`, the resolver MUST detect the no-op and skip decrement.
    - After decrement, if the group's `status` was `completed` and now some scenario has `responseCount < targetSize`, the group status MUST be reset to `active`.

### REQ-360 — Submission Data Export

- **REQ-361 — Export complete submission data as CSV.** 📋 **NEW 2026-05-06** The admin MUST be able to export all submission data for a session group (or standalone session) as a comprehensive CSV file that includes every response, scenario configuration, and participant metadata needed for analysis and data restoration.
  - *Rationale:* Researchers need to export collected data for statistical analysis in tools like R, Python pandas, or Excel. The current export (REQ-300 "sessions.csv") only contains session-level metadata, not the actual participant responses. A complete data export must include: (a) each participant's cooperation probability answers, (b) the complete scenario configuration (focal/opponent nodes, active edges, edge states), (c) demographics, (d) timestamps, and (e) validity flags.
  - *Acceptance:*
    - A new "Export CSV" button appears in the `GroupDetailView` component where submission data is displayed.
    - Clicking the button triggers a client-side CSV generation that includes ALL submissions for the group/session.
    - The CSV MUST be UTF-8 with BOM (for Excel compatibility with Chinese characters).
    - Invalid submissions (where `isInvalid: true`) MUST be included in the export but clearly marked in a dedicated column.
    - The export is disabled (button grayed out) when `submissions.length === 0`.
    - A toast notification confirms successful export: "CSV 已匯出" or "CSV exported".

- **REQ-362 — CSV format specification for submission export.** 📋 **NEW 2026-05-06** The exported CSV file MUST follow a standardized row-per-answer format where each row represents one participant's response to one scenario. This "long format" enables easy filtering, grouping, and statistical analysis.
  - *CSV Column Specification:*
    1. **Group Name** — `SessionGroup.name` (or "Standalone Session" if `groupId` is null)
    2. **Group ID** — `SessionGroup._id` (or empty if standalone)
    3. **Session ID** — `Session._id`
    4. **Submission ID** — `Submission._id`
    5. **Participant ID** — `Submission.participantId` (may be null for Manual Mode)
    6. **Scenario ID** — `Scenario._id`
    7. **Scenario Index** — `Scenario.scenarioIndex` (position in design matrix)
    8. **Focal Node** — `Scenario.focalNode` (e.g., "KMT1")
    9. **Opponent Node** — `Scenario.opponentNode` (e.g., "DPP3")
    10. **Active Edges** — `Scenario.activeEdgeIds.join('; ')` (e.g., "KMT1→DPP3; KMT2→DPP4")
    11. **Edge Count (k)** — `Scenario.activeEdgeIds.length`
    12. **Edge States (JSON)** — `JSON.stringify(Scenario.edgeStates)` (e.g., `{"KMT1→DPP3":"give","KMT2→DPP4":"not give"}`)
    13. **Cooperation Probability** — `SurveyResult.cooperationProbability` (0.0 to 1.0)
    14. **Response Time (ms)** — `SurveyResult.responseTime` (REQ-402.5)
    15. **Answered At** — `SurveyResult.answeredAt` (ISO timestamp)
    16. **Registration Code** — `Submission.registrationCode` (same value repeated for all rows of one submission)
    17. **Email** — `Submission.email` (2026-11-19)
    18. **Q1 … Q8** — `Submission.questionnaire` answer as `true` / `false` (true = first option, REQ-416); empty when not answered
    19. **Consented At**, **Consent Version** — `Submission.consentedAt` (ISO timestamp), `Submission.consentVersion` (REQ-417)
    20. **Device Type**, **User Agent** — `Submission.deviceType`, `Submission.userAgent` (REQ-418)
    21. **Submission Completed** — `Submission.isCompleted` (true/false)
    22. **Valid** — `!Submission.isInvalid` (true/false)
    23. **Submission Created At** — `Submission.createdAt` (ISO timestamp)
    24. **Submission Completed At** — `Submission.completedAt` (ISO timestamp, may be null)
  - *2026-11-17:* the former Age (a number parsed from the code), Gender (actually the code) and Education (actually the email) columns are replaced by 「Registration Code」. The email is NOT in the research CSV, so the political opinions (Q1–Q8) are not stored next to an email; the payment ledger (REQ-408.7) has the email, joined by Submission ID. *2026-11-19: reversed by the research team — the research CSV has an 「Email」 column (17). The file is then identifying (email next to Q1–Q8) and must be stored and shared like the payment ledger.*
  - *Acceptance:*
    - Column headers MUST be in English for cross-tool compatibility (R, Python, SQL imports expect ASCII headers).
    - Each row represents **one answer to one scenario** (not one submission). A submission with 20 scenarios generates 20 rows.
    - If a submission has no results (`results.length === 0`), it generates a single row with scenario fields empty, so the submission metadata is still recorded.
    - CSV values MUST be properly escaped: wrap fields containing commas or quotes in double quotes, escape internal quotes by doubling them (`"` → `""`).
    - The filename format is `{group_name}_submissions_{timestamp}.csv` where timestamp is `YYYYMMDD_HHmmss`.

- **REQ-363 — Export must include scenario details for data restoration.** 📋 **NEW 2026-05-06** The CSV export MUST include complete scenario configuration data (focal node, opponent node, active edges, edge states) so that researchers can reconstruct the experimental condition for each response without querying the database.
  - *Rationale:* Raw `scenarioId` references are useless outside the database. Researchers analyzing the CSV in R/Python need to know which network configuration was shown to each participant. Including the full scenario details makes the CSV self-contained.
  - *Acceptance:*
    - The export logic MUST load full `Scenario` documents (via populate or explicit query) for every scenario referenced in `Submission.results[]`.
    - If a scenario is missing (e.g., deleted scenario), the row MUST still be generated with `Scenario ID` filled but scenario detail fields marked as "DELETED" or empty.
    - Edge names (e.g., "KMT1→DPP3") MUST be derived from `constants.ts` edge definitions (using source/target IDs) for consistency with the admin UI.

### REQ-355 — Icon-Based Action Controls (UI Enhancement)

- **REQ-356 — Replace text buttons with icon buttons for invalidation actions.** 📋 **NEW 2026-05-06** The "Invalidate" and "Restore" action buttons in the submission list MUST be replaced with icon-only buttons to save horizontal space and improve visual clarity.
  - *Rationale:* Current text buttons ("Invalidate" / "Restore") consume valuable horizontal space in dense submission tables. Icon-based controls are standard in modern admin interfaces (GitHub, Linear, Notion) and improve scannability while maintaining clear affordance through consistent icon semantics.
  - *Acceptance:*
    - **Invalidate action** (marking a valid submission as invalid):
      - Icon: Ban/prohibition symbol (⊘) or trash icon
      - SVG path: Use Heroicons `XCircleIcon` or similar
      - Color: Red (`text-red-600`, `hover:text-red-700`, `hover:bg-red-50`)
      - Tooltip: "Mark as invalid" (via `title` attribute)
      - Button is visible when row is hovered or submission has focus
    - **Restore action** (marking an invalid submission as valid):
      - Icon: Arrow-path/restore symbol (↺) or check-circle icon
      - SVG path: Use Heroicons `ArrowPathIcon` or `CheckCircleIcon`
      - Color: Green (`text-green-600`, `hover:text-green-700`, `hover:bg-green-50`)
      - Tooltip: "Restore to valid" (via `title` attribute)
    - Icon buttons MUST be consistently sized: `w-8 h-8` clickable area with `w-5 h-5` icon inside
    - Buttons MUST have proper focus states for keyboard navigation (`focus:ring-2 focus:ring-offset-1`)
    - Loading state (during mutation) shows a spinner icon in place of the action icon
    - Both Mixed Mode and Batch Mode submission lists use identical icon buttons

- **REQ-357 — Add confirmation modal for invalidation actions.** 📋 **NEW 2026-05-06** Clicking the invalidate or restore icon button MUST open a confirmation modal to prevent accidental data state changes.
  - *Rationale:* Invalidation affects data integrity (removes submission from counts, affects Mixed Mode balanced selection). Accidental clicks can corrupt experiment state. A confirmation step is standard UX for destructive or state-changing actions.
  - *Acceptance:*
    - **Invalidate confirmation modal**:
      - Title: "Mark Submission as Invalid?"
      - Message: "This will exclude this submission from all counts and free the participant slot. This action is reversible."
      - Confirm button: "Mark Invalid" (red, `confirmColor='red'`)
      - Cancel button: "Cancel" (gray)
    - **Restore confirmation modal**:
      - Title: "Restore Submission?"
      - Message: "This will include this submission in counts again. Make sure this is a legitimate response."
      - Confirm button: "Restore" (green, `confirmColor='green'`)
      - Cancel button: "Cancel" (gray)
    - Modal MUST use existing [`ConfirmationModal`](../components/ConfirmationModal.tsx) component for consistency
    - Modal MUST be dismissible via ESC key or clicking backdrop
    - After confirmation, mutation executes and modal closes automatically
    - Success/error feedback via toast notification (already implemented in `handleInvalidate`)
    - Modal state managed by React `useState`: `confirmModalState: { isOpen: boolean, submissionId: string | null, action: 'invalidate' | 'restore' }`

- **REQ-358 — Replace inline invalid count badge with tab-based view.** 📋 **NEW 2026-05-06** The current inline "Invalid (N)" button that toggles visibility MUST be replaced with a tab-based interface that allows switching between "Valid" and "Invalid" views.
  - *Rationale:* Current design shows "Invalid (1)" as a toggle button next to "Export CSV" (line 589-600 in [`GroupDetailView.tsx`](../components/GroupDetailView.tsx:589-600)), which is visually inconsistent (looks like a filter badge, not a clear tab). Tab-based filtering is a standard pattern in admin interfaces (e.g., GitHub Issues: Open/Closed tabs, Gmail: Primary/Social/Promotions) and provides clearer affordance for view switching while keeping the export action visually distinct.
  - *Acceptance:*
    - Add a two-tab selector **above the submission table**, below the "All Submission (N)" header and "Export CSV" button
    - **Tab 1**: "Valid" with count badge (e.g., "Valid (45)")
    - **Tab 2**: "Invalid" with count badge (e.g., "Invalid (3)")
    - Visual design:
      - Active tab: purple bottom border (`border-b-2 border-purple-600`) and bold text (`font-bold text-purple-700`)
      - Inactive tab: gray text (`text-gray-500`) with hover effect (`hover:text-gray-700`)
      - Tab bar has subtle bottom border divider (`border-b border-gray-200`)
    - Clicking a tab filters the displayed submissions (does NOT affect the underlying GraphQL query)
    - Tab counts update in real-time after invalidation/restoration actions
    - If there are 0 invalid submissions, the "Invalid" tab is still visible but shows "Invalid (0)" and renders an empty state when selected:
      - Empty state message: "No invalid submissions" with gray icon
    - Default view: "Valid" tab is active on page load (`showInvalid: false`)
    - Tab state is local React state (not persisted in URL or localStorage)
    - Remove the existing toggle button (lines 589-600) entirely
    - Tab design is consistent with the two-button `LaunchMode` toggle in [`SetupPanel.tsx`](../components/SetupPanel.tsx) (Material UI `ButtonGroup` pattern)

---

### REQ-400 — Participant Survey Flow

- **REQ-401 — Sequential routing.** ✅ **UPDATED 2026-04-29** A participant opening `/survey/welcome?sessionId=<id>` (Manual/Batch modes) or `/survey/welcome?groupId=<id>&mode=mixed` (Mixed mode) is guided through `welcome` -> `intro/:step` -> `scenarios/:scenarioIdx` -> `outro`.
  - *Acceptance:* Direct navigation to a step out of order (e.g., `scenarios/3` with no resumable session) creates an entry from the start and saves session state. Mixed mode URLs first create/retrieve a personalized session via `startMixedSession`. All URLs now use `sessionId` format (setupId deprecated).
   
- **REQ-402 — Per-scenario response capture.** ✅ **UPDATED 2026-04-28** Each scenario captures one `cooperationProbability` in `[0, 1]`. Answers are upserted by `scenarioId` (UUID reference to `Scenario._id`), with latest write wins per scenario.
  - *Acceptance:* `saveSurveyAnswer(submissionId, scenarioId, probability)` rejects values outside `[0, 1]` with the error `cooperationProbability must be between 0 and 1`. The mutation updates both `Submission.results` and atomically increments `Scenario.responseCount`.

- **REQ-402.1 — Decision slider randomized starting position + mandatory interaction gate.** 📋 **NEW 2026-07-02** The decision-phase slider MUST NOT default to a fixed neutral value (previously always 50) on every scenario. Its initial position MUST be randomized on each new scenario, and the participant MUST interact with (drag) the slider at least once during the decision phase before they can confirm their answer and advance.
  - *Rationale:* A fixed 50% default risks anchoring participants toward the midpoint and makes it impossible to distinguish "the participant deliberately chose 50%" from "the participant never touched the slider." Randomizing the start position and requiring interaction ensures every recorded `cooperationProbability` reflects an intentional choice.
  - *Acceptance:*
    - On each scenario change, the slider's initial value is a pseudo-random integer in `[0, 100]` (via `Math.random()`), not a hardcoded constant.
    - The "確認並前往下一題" / "確認並送出" confirm button remains disabled while in the decision phase until the participant has dragged the slider at least once (existing `hasInteracted` flag), in addition to the pre-existing requirement that all edges be revealed.
    - Purely a frontend behavior change in `SurveyView.tsx` / `SurveyShared.tsx` — no changes to the `cooperationProbability` data contract, GraphQL schema, or persistence layer. The stored value is still `sliderValue / 100`.

- **REQ-402.4 — Confirmed answers are final.** 📋 **NEW 2026-11-16** (resolves Open Questions #12, #13; EC-6) Once the participant confirms a scenario, that answer cannot be changed.
  - *Rationale:* The payout is drawn from the recorded answers (REQ-408), and the balanced selection counts each answer once (REQ-308). Letting a participant revise an answer after seeing later scenarios, or after seeing the debrief, would change the data the payment was based on.
  - *Acceptance:*
    - Browser Back on the scenarios or outro keeps the participant on the current page (the existing Back trap in `SurveyView`) and now shows the toast 「已確認的答案無法修改。」
    - Opening an earlier scenario's URL returns the participant to where they were, with the same toast.
    - `saveSurveyAnswer` rejects a *different* value for a scenario the submission has already answered (`ANSWER_LOCKED`). Re-sending the *same* value succeeds without changes, so a network retry is harmless.
    - *2026-11-17 (BUG-012):* a completed submission is final too. `completeSurvey` on a submission that is already completed is rejected (`ALREADY_COMPLETED`) and changes nothing: not the code, email or questionnaire answers, not `completedAt`, and the session's `submissionCount` is not counted twice. The check is part of the database update itself, so two simultaneous calls cannot both succeed.
    - `saveSurveyAnswer` rejects any change to a completed submission (`ANSWER_LOCKED`).

- **REQ-402.5 — Response time is recorded.** 📋 **NEW 2026-11-17** Every saved answer MUST carry `responseTime`: the milliseconds from the moment the scenario page is shown to the click on 確認並前往下一題 / 確認並送出 (edge reveals and the slider included).
  - `saveSurveyAnswer` requires `responseTime` (a non-negative integer); anything else is rejected and nothing is saved. A same-value retry (REQ-402.4) keeps the first recorded time.
  - A page reload restarts the clock for that scenario (the answer was not confirmed yet, EC-4).
  - Exported in the research CSV column 「Response Time (ms)」 (REQ-362).

- **REQ-402.6 — A failed answer save keeps the participant on the scenario.** 📋 **NEW 2026-11-17** (BUG-013) If `saveSurveyAnswer` fails, the participant MUST stay on the same scenario with their slider value and see 「儲存失敗，請再按一次。」; only a successful save moves on to the next scenario or the outro.

- **REQ-403 — Completion.** ✅ **BUG FIXED 2026-05-04** On the final step the participant submits the registration code (outro step 1), the questionnaire (step 3) and the email (step 4) with `completeSurvey`. The system stores them as `Submission.registrationCode`, `Submission.questionnaire` and `Submission.email`, marks `Submission.isCompleted = true` and shows the done page. *2026-11-18 (BUG-015):* previously sent as `demographics: { age, gender, education }`; no demographics are collected.
  - The server rejects an empty registration code and an email that is not `x@y.z` (`INVALID_CONTACT`), before any write.
  - *Acceptance:* `completeSurvey` returns the updated submission. On success, the local survey-session cache for that session is cleared. In Mixed Mode, this triggers a check for group completion status (REQ-309). **Bug Fix**: SurveyOutro now properly calls `completeSurvey` mutation when user submits email and code.
   
- **REQ-403.1 — Registration code survives a refresh.** ✅ **IMPLEMENTED 2026-11-15** (BUG-009) The registration code entered on outro step 1 MUST be kept until `completeSurvey` succeeds, across page refreshes on outro steps 2 and 3, and MUST NOT be replaced by a placeholder.
  - *Acceptance:* The code is stored in `localStorage[survey_code_<submissionId>]` when entered and restored when the outro mounts; it is removed after `completeSurvey` succeeds. If the code is missing at the final submit, the participant is sent back to step 1 and nothing is saved — `demographics.gender` is never `unknown`. Verified by the NFR-8 e2e test, which reloads the debrief before submitting.

- **REQ-403.2 — A failed final save keeps the data.** 📋 **NEW 2026-11-17** (BUG-011) If `completeSurvey` fails on 送出 (network error, server error), the participant MUST stay on the email step and see 「提交失敗，請稍後再試」; the registration code, the email and the questionnaire answers MUST be kept so that 送出 can be retried. The done page (step 5) is shown only after the save succeeded.
  - *Retry after a lost response:* if the first 送出 was saved but its response never arrived, the retry gets `ALREADY_COMPLETED` (REQ-402.4). The client treats that as success and shows the done page.

- **REQ-404 — Session persistence (resume).** Refreshing the browser or returning to the URL must restore `submissionId` and route from `localStorage[survey_session_<sessionId>]`.
  - *Acceptance:* If the stored `path` is meaningfully different from the current URL (e.g., user landed on `/survey/scenarios/0` but session was at `scenarios/2`), the app navigates back to the stored path; mismatch heuristic logs a warning and falls back to a fresh entry.
   
- **REQ-405 — "Session full" gate.** When the live `submissionCount` for a session reaches `sampleSize` and the participant has no resumable entry, the system MUST display 「人數已滿」 instead of the survey UI. For Mixed Mode groups, the gate closes when all scenarios reach `targetSize`.
  - *Acceptance:* Already-started entries (those holding a `restoredSubmissionId`) MAY continue to completion even after the gate closes.
  - **REQ-405.1 — Mixed group full (2026-11-16, BUG-010).** When the group's `status` is `completed` (REQ-309), a visitor without an existing session sees 「無法參與實驗」 on arrival, before the intro. `startMixedSession` refuses to create a new session for a completed group (`GROUP_FULL`); a visitor whose intro was already open when the group filled sees the same message instead of the scenarios. A participant who already has a session may still resume and finish.
  - **REQ-405.2 — Unknown invite link (2026-11-16, resolves Open Question #11; EC-11).** When the invite link names a group that does not exist, the welcome page shows 「找不到此實驗」 with 「此邀請連結無效或實驗已結束，請向研究人員確認連結是否正確。」 on arrival and offers no way to start. A network error while checking does not show this message (the participant is not told the link is wrong when the server is merely unreachable).

### REQ-407 — Post-Experiment Debrief Screen

- **REQ-407 — Debrief screen displaying per-round decisions and realised payment.** ✅ **UPDATED 2026-07-02** After the participant completes all scenarios and confirms their registration code (SurveyOutro step 1), the system MUST display a debrief screen (step 2) before the email collection step. The debrief screen reveals each round's give/no-give outcome and communicates the randomly selected "實現回合" that determines the participant's cash reward.

  - *Rationale:* Transparency about the random incentive mechanism (one randomly drawn round pays out at 點數 × 100 NTD) is required for research ethics. Participants must see which round was drawn and how the reward is calculated before providing contact information.

  - *Acceptance:*
    - The debrief screen appears as SurveyOutro **step 2** (inserted between the current code step and the email step). Old step 2 becomes step 3; old step 3 becomes step 4.
    - A round table MUST display one row per scenario answered, with the following columns:
      1. **回合** — round index (1-based)
      2. **您** — a qualitative "合作"/"不合作" badge only. The underlying `cooperationProbability` percentage is NOT displayed in this table (privacy/simplicity — the number was removed 2026-07-02; see below).
      3. **搭檔** — the opponent's give/no-give badge, styled identically.
      4. **點數** — payoff points for that round based on the PD outcome matrix (both give → 2, you withhold/they give → 3, you give/they withhold → 0, neither → 1).
    - One row MUST be randomly selected as the **實現回合** (realised round). Selection is made once, server-side, and MUST NOT re-randomise on re-render or page refresh (see persistence rule below). The selected row is visually highlighted with a distinct accent (amber background band + left border).
    - A payment summary card MUST appear below the table showing which round was drawn, its point value, and the cash equivalent (**點數 × 100 新台幣**).
    - A "繼續" button advances to the email step (step 3).
    - **Opponent pairing (backend-wired):** The "搭檔" decision for each round is drawn from a real paired participant's answer, not a synthetic opponent. `drawRealisedRound` (`backend/graphql/resolvers.js`) finds `Scenario` documents from the opposite node group (same `scenarioIndex`, mirrored `focalNode`) within the same `SessionGroup`, collects `cooperationProbability` answers from completed, valid `Submission`s that answered those scenarios, and randomly samples one per round. Falls back to `Math.random()` for a round when no group/opponent context exists or no partner has answered yet.
    - **Give/no-give determination — probabilistic draw, not a threshold (REQ-407.1):** For every round, both the participant's own outcome and the opponent's outcome are decided by treating `cooperationProbability` as a literal probability `p` and drawing `give` with probability `p` via `Math.random() < p` (a Bernoulli trial) — **not** by comparing `p` against a 50% threshold. This applies uniformly to every probability value, including exactly 50%; there is no special-cased "coin flip" behavior distinct from any other value.
    - **Server-side persistence (REQ-407.1):** Because the outcome is now a random draw for effectively every round (not just the previous 50%-exact edge case), it MUST be drawn exactly once and persisted, so a page refresh on the debrief screen cannot change the participant's realised payout. `Submission.myDecisions: [Boolean]` and `Submission.opponentDecisions: [Boolean]` store the drawn outcome per round, populated by `drawRealisedRound` alongside the existing `realisedRoundIndex`/`opponentProbs`, and reused on subsequent loads (idempotent). Legacy submissions that have `realisedRoundIndex`/`opponentProbs` but predate this field are migrated in place the next time `drawRealisedRound` is called for them.
    - *Superseded:* The original 2026-06 version of this requirement described a frontend-only placeholder (opponent data as "—", threshold-based ≥50% labeling, a 50%-only client-side coin flip that was not persisted across refreshes, and probability percentages shown per row). All of that has been replaced by the above.
    - *Amended 2026-10-01 (REQ-408):* The payment summary card shows the server-persisted `payoutNtd` (points × `POINT_TO_NTD` + `PARTICIPATION_FEE_NTD`) together with the explicit formula, instead of a client-computed `points × 100`. If the debrief data cannot be loaded, the screen shows an error with a retry button instead of a locally drawn, unpersisted result.

### REQ-408 — Points → Payment Conversion Disclosure & Persisted Payout (IRB comment 2) ✅ **IMPLEMENTED 2026-10-01** (fee and timing values pending — Open Questions #8, #9)

- **REQ-408.1 — Single source of truth for payment parameters.** All payment parameters MUST live in `utils/payment.js` and be imported by both the backend and the frontend. No component or resolver may hard-code the rate or the fee.
  - *Rationale:* The rate was hard-coded in two components (`SurveyIntro`「1點 = 100元台幣」and `SurveyOutro` `selPoints * 100`) and nowhere on the server. The IRB asked the team to confirm the conversion, which requires one number in one place.
  - *Acceptance:*
    - `utils/payment.js` exports `POINT_TO_NTD` (100), `PARTICIPATION_FEE_NTD` (0 until confirmed — Open Question #8), `PAYMENT_METHOD_TEXT` ('電子禮券'), `PAYMENT_TIMELINE_TEXT` (Open Question #9), `payoffPoints(myGive, oppGive)`, `pointPayoutNtd(points)`, `totalPayoutNtd(points, fee?)`, `MIN_TOTAL_NTD` and `MAX_TOTAL_NTD`.
    - `payoffPoints` returns 2 (both give), 0 (you give, partner withholds), 3 (you withhold, partner gives) and 1 (neither gives) — identical to `PayoffMatrix` and the comprehension quiz.
    - Changing `PARTICIPATION_FEE_NTD` changes every participant-facing amount, the persisted payout and the payment ledger with no other code edits.

- **REQ-408.2 — Payment explanation before the experiment (intro step 7「點數兌換報酬說明」).** The page MUST state: (a) that one round is drawn at random after all rounds; (b) the rate 1 點 = 新台幣 100 元; (c) a table of all four outcomes with the participant's points and NT$ amount; (d) the minimum–maximum total; (e) a worked example; (f) the payment form (電子禮券 sent to the email given at the end) and timing (`PAYMENT_TIMELINE_TEXT`). When `PARTICIPATION_FEE_NTD > 0`, the page MUST also show the fee, state that it is paid to participants who complete the experiment, and add a 合計 column that includes it. When the fee is 0, no fee wording appears.
  - *Acceptance:* Every number on the page is computed from `utils/payment.js`. With fee 0 the range reads 新台幣 0–300 元; with fee 100 it reads 新台幣 100–400 元.

- **REQ-408.3 — Debrief payment card shows the formula and the persisted total.** The card on outro step 2 MUST show the drawn round, its points, the explicit formula「X 點 × 100 = 新台幣 Y 元」, a 參與費 line only when the fee is greater than 0, and **合計 新台幣 Z 元**, where Z is the server-persisted `payoutNtd`. Amounts always carry the 新台幣 label.

- **REQ-408.4 — Email step repeats the amount, form and timing.** Outro step 3 MUST state the amount (新台幣 Z 元), the payment form (電子禮券) and the timing, consistent with the intro. This replaces the old「現金禮券」/「盡快」wording that contradicted the intro's「現金報酬」.

- **REQ-408.5 — Payout persisted server-side.** `drawRealisedRound` MUST compute `realisedPoints = payoffPoints(myDecisions[r], opponentDecisions[r])` and `payoutNtd = totalPayoutNtd(realisedPoints)` for the realised round r, and persist both on `Submission` together with the existing draw fields. Repeat calls return the persisted values; submissions drawn before this change are backfilled on next access.
  - *Acceptance:* The `Submission` and `DebriefResult` GraphQL types expose `realisedPoints: Int` and `payoutNtd: Int`. Refreshing the debrief never changes the amount.

- **REQ-408.6 — No unrecorded amounts.** If the debrief data cannot be fetched or drawn, the screen MUST show「讀取結果失敗」with a「重試」button and MUST NOT display any amount. The previous client-side fallback draw (random and unpersisted) is removed.

- **REQ-408.7 — Payment ledger export.** The group detail view MUST load every submission of the group through a new admin query `submissionsByGroup(groupId: ID!)` (replacing the `recentSubmissions(limit: 100)` feed, which silently dropped older participants — BUG-007) and MUST offer an「Export Payments」button that produces a CSV with one row per completed, valid submission.
  - *CSV columns:* Submission ID, Participant ID, Registration Code, Email, Realised Round (1-based), Points, Participation Fee (NTD), Point Payout (NTD), Total Payout (NTD), Completed At.
  - *Acceptance:* UTF-8 with BOM; filename `{group_name}_payments_{YYYYMMDD_HHmmss}.csv`. Completed submissions without a persisted draw are listed with empty payout fields and reported in a warning toast. The research CSV (REQ-362) is unchanged.
  - *Note:* The registration code and email are stored in `Submission.registrationCode` and `Submission.email` (2026-11-18, BUG-015; before that in `demographics.gender` / `demographics.education`).

- **REQ-408.8 — Participant contact data requires admin authentication.** `recentSubmissions` and `submissionsByGroup` return participant email and MUST reject requests without a valid admin JWT (`context.isAdmin`). Participant-facing operations (`session`, `submission(id)`, `startSurvey`, `saveSurveyAnswer`, `drawRealisedRound`, `completeSurvey`) are unchanged. *2026-11-17:* the registration code and email (`registrationCode`, `email` since 2026-11-18; `demographics` before) return `null` without an admin login wherever a Submission is returned, including `submission(id)` and the `completeSurvey` result — the same rule as the questionnaire answers (REQ-416). No participant page reads it.
  - *Acceptance:* An unauthenticated `recentSubmissions` query returns the error `Unauthorized`; the admin UI, which sends `Authorization: Bearer <token>`, keeps working. Admin mutations remain unguarded and are tracked as BUG-006.

- **REQ-408.9 — Actual payout on the group page.** 📋 **NEW 2026-11-16** The group detail page MUST show an「Actual Payout」card with the total NT$ owed so far.
  - *Acceptance:*
    - Total = sum of `payoutNtd` over completed, valid submissions of the group — exactly the rows and amounts of the「Export Payments」CSV (REQ-408.7), so the card equals the ledger's「Total Payout (NTD)」column sum.
    - The card also shows how many participants are paid and the average per participant.
    - Completed, valid submissions without a persisted payout are not counted and are listed as「N 筆無報酬紀錄」(same case the ledger warns about).
    - Mixed Mode groups also show the budget ceiling from REQ-314 (`Est. Participants × MAX_TOTAL_NTD`) for comparison.
    - Invalidating or restoring a submission (REQ-350) updates the total without a reload.

### REQ-406 — Partner Node Peach-Pink Visual Highlight

- **REQ-406 — Vibrant peach-pink color for the partner node in NetworkGraph.** The partner node (displayed as "搭檔" via its role badge) in `NetworkGraph.tsx` MUST use a peach-pink color (`#f472b6`, Tailwind `pink-400`) for all of its emphasis visual effects, replacing the current dark-gray colors. This makes the partner node as visually prominent as the focal node ("您"), which uses amber (`#f59e0b`).
  - *Rationale:* The current partner node ring stroke (`#374151`, gray-700) and glow aura (`#374151`) are nearly invisible against dark backgrounds, and the badge fill (`#6b7280`, gray-500) fails to draw the participant's eye to the counterpart node they are evaluating. The focal node uses a vivid amber highlight; the partner node should be equally eye-catching so participants immediately identify both key nodes.
  - *Acceptance:*
    - A new color token `rolePartnerHighlight: '#f472b6'` is added to the `COLORS` constant in `constants.ts`.
    - The existing tokens `roleOpponent: '#374151'` and `rolePartner: '#6b7280'` are preserved unchanged for backward compatibility.
    - In `NetworkGraph.tsx`, the partner node ring stroke (`strokeColor` assignment at the `isOpponent` branch) uses `COLORS.rolePartnerHighlight` instead of `COLORS.roleOpponent`.
    - The partner node pulsing glow aura (`<circle stroke={...}>` animated element) uses `COLORS.rolePartnerHighlight` instead of `COLORS.roleOpponent`.
    - The partner node role badge fill (`roleFill` assignment) uses `COLORS.rolePartnerHighlight` instead of `COLORS.rolePartner`.
    - No other visual elements or logic are changed — only the three color references described above.
    - The focal node amber highlight is unaffected.
  - *Scope:* Frontend only — one constant file and one component file. No backend, data model, or GraphQL changes.

### REQ-409 — Figure Legibility & Explanations (IRB comment 1) ✅ **IMPLEMENTED 2026-10-01** (caption copy pending PI approval)

- **REQ-409.1 — Graph legend.** A `GraphLegend` component MUST explain every visual encoding used by `NetworkGraph`, drawing its swatches from the same `COLORS` tokens as the graph: 您 (amber ring), 搭檔 (pink ring), 國民黨 / 民進黨 (avatar colors), 給予 (dark label; the arrow points from the person who decided to the person who received), 不給予 (light label), 「?」 (a record not yet viewed; click to reveal), and 您的決定 (the animated line from 您 to 搭檔 that follows the slider).
  - *Acceptance:* Shown on intro steps 0, 2, 4 and 5 (only the rows relevant to each figure) and, in compact form, under the graph on every scenario page, in the same position every round.

- **REQ-409.2 — Captions (圖說).** Intro steps 0, 2, 3, 4 and 5 MUST have a caption directly under the figure explaining what the figure shows and what the participant should do with it. The copy is listed in design.md Phase 42 and MUST be approved by the PI before deployment.

- **REQ-409.3 — Minimum sizes.**
  - "?" reveal marker: radius ≥ 13 SVG units, 18px glyph, hit-area radius ≥ 20.
  - Scenario graph: up to 520px wide on `xl` screens (the graph column takes 3/5 of the grid).
  - Intro interaction list: text ≥ 14px (`text-sm`), 24px avatars; the invalid `white-*` Tailwind classes are fixed.
  - Intro tip-1 demo edge: up to 360px wide.
  - *Acceptance:* Verified at 1440×900 and 390×844 in the before/after report (NFR-7).

- **REQ-409.5 — Legend and captions open on tap.** 📋 **NEW 2026-11-16** The 圖例 (REQ-409.1) and every 圖說 (REQ-409.2) MUST be collapsed by default and open when the participant taps their header, because together they take up most of a phone screen. The header shows 圖例 / 圖說 with 「點擊展開」 while closed and 「收合」 while open; the content is unchanged.
  - *Acceptance:* On intro steps 0, 2–5 and every scenario, the legend and captions render closed; tapping the header opens them and tapping again closes them; keyboard (Enter/Space) works; nothing else on the page moves when they are closed.
  - *IRB note:* REQ-409.1/409.2 were added in response to IRB comment 1 and were visible by default; collapsing them should be mentioned to the IRB if the approved materials show them open.

- **REQ-409.4 — High-resolution screenshots for the IRB packet.** Every participant-facing screen MUST be available as a 2× DPR PNG (desktop 1440×900 and phone 390×844), with a caption index `docs/irb/figures.md` (figure number → screen → caption).

### REQ-415 — Chrome-Only Browser Enforcement

- **REQ-417 — Consent is given and recorded.** 📋 **NEW 2026-11-18** The welcome page MUST show a checkbox 「我已閱讀並同意參與本研究」 below the study text; 開始實驗 stays disabled until it is ticked (and, as before, in a non-Chrome browser).
  - Ticking it and clicking 開始實驗 records the consent in the browser tab (`sessionStorage`): the click time and `CONSENT_VERSION`, a label of the consent text the participant saw (changed whenever that text changes).
  - `startSurvey` sends it; the server stores `Submission.consentedAt` (Date) and `Submission.consentVersion` when it creates the submission, and refuses to create one without them (`CONSENT_REQUIRED`). Resuming an existing submission does not need it again.
  - Admin-only (like REQ-408.8); exported in the research CSV as 「Consented At」 and 「Consent Version」.
  - *Note:* adds participant-facing text — check with the IRB whether an amendment is needed.
  - *Footer (2026-11-19):* the welcome footer reads 「本研究使用瀏覽器指紋技術防止重複提交」 (was 「本研究使用瀏覽器指紋技術防止重複提交，不收集個資。」, untrue now that an email (REQ-408) and the user agent (REQ-418) are collected).

- **REQ-418 — Device type and browser are recorded.** 📋 **NEW 2026-11-18** When the server creates a submission it stores, from that request: `Submission.userAgent` (the browser's `User-Agent` header, which names the browser, version and OS) and `Submission.deviceType` = `mobile` if Chrome's `Sec-CH-UA-Mobile` header is `?1` or the user agent contains Mobi / Android / iPhone / iPad, otherwise `desktop`.
  - Recorded once, at creation (a participant on another device gets another submission, REQ-311). Admin-only; exported in the research CSV as 「Device Type」 and 「User Agent」.

- **REQ-416 — Post-survey questionnaire (Q1–Q8).** 📋 **NEW 2026-11-17** After the debrief and before the email step, the participant MUST answer eight single-choice attitude questions on their own page.
  - *Placement:* the outro becomes 1 registration code → 2 debrief → **3 questionnaire** → 4 email → 5 done (`/survey/outro/1..5`).
  - *Questions (verbatim, in this order; two options each, single choice):*

    | ID | Question | Options |
    |---|---|---|
    | Q1 | 有人說金馬獎是「兩岸電影人開展交流的平台，應該開放中國電影人及電影報名參賽。」請問您同意不同意這樣的說法？ | 同意 / 不同意 |
    | Q2 | 有人說我們應該在中小學課程中增加中國大陸歷史文化的教材，請問您同不同意這樣的說法？ | 同意 / 不同意 |
    | Q3 | 整體來說，過去台灣政府處理新冠肺炎疫情表現好不好？ | 好 / 不好 |
    | Q4 | 有人說高中的國文學科降低文言文比例，才有更多空間加入有台灣特色的文學作品。請問您同意不同意這樣的說法？ | 同意 / 不同意 |
    | Q5 | 有人說開放中國人民來台觀光，帶動臺灣旅遊業的發展，有效促進臺灣經濟。請問您同意不同意這樣的說法？ | 同意 / 不同意 |
    | Q6 | 中國歌唱綜藝節目讓台灣觀眾有全新的視覺體驗，應該多多引進播放。請問您同意不同意這樣的說法？ | 同意 / 不同意 |
    | Q7 | 中國的電影、音樂、和書籍對我們的本土文化會有一定程度的傷害。請問您同意不同意這樣的說法？ | 同意 / 不同意 |
    | Q8 | 台灣目前大約有超過59萬人的中國大陸及東南亞籍外籍配偶，其中大陸、港澳配偶占64.67%。請問您認為政府未來應該管制，還是開放大陸、港澳配偶移民來台灣？ | 管制 / 開放 |

  - *Layout (2026-11-17):* the page uses the same design as the 理解測試 quiz (intro step 6): wide card, large title with the indigo underline bar, amber instruction panel with a white inner panel, bold numbered question rows. On screens ≥ 640px each question's options sit to the right of its text, on the same row; on a phone they sit below it.
  - *Required:* 下一步 stays disabled until all eight are answered; the page shows 「已回答 n / 8」. A participant who reaches the email step without all eight answers (e.g. a direct URL) is sent back to step 3 on 送出.
  - *Refresh:* answers are kept in the browser tab per submission (`sessionStorage`) and restored after a refresh until the survey is submitted. *2026-11-17:* not `localStorage`, so the political opinions of a participant who leaves without submitting do not stay on a shared device after the tab is closed; a participant who closes the tab and returns answers the eight questions again.
  - *Storage:* the answers are sent with `completeSurvey` and saved as `Submission.questionnaire` = `[{ questionId, answer }]`. *2026-11-18:* `answer` is a Boolean — `true` = the question's first option (同意 / 好 / 管制), `false` = the second (不同意 / 不好 / 開放); the mapping comes from the option order in `utils/questionnaire.js`. (Was the option text.) *2026-11-17:* `completeSurvey` requires the questionnaire — a completion without all eight valid answers is rejected and nothing is saved. The server rejects missing, unknown and duplicate question IDs and answers that are not a Boolean.
  - *Privacy:* the answers are political opinions. They MUST be readable only with an admin login: the `questionnaire` field returns null for anyone else, including through the public `submission(id)` query.
  - *Export:* the submissions CSV (Export CSV) gets columns Q1–Q8 with `true` / `false` (2026-11-18; was the answer text).
  - *Wording:* as supplied, with two corrections confirmed 2026-11-17: 「曆史」 → 「歷史」 in Q2, and every question ends with a full-width 「？」. Page title 「問卷」 and intro line approved. A new instrument (political attitudes) likely needs IRB approval before deployment.

- **REQ-415 — Chrome browser required for participants.** The survey welcome page (`SurveyWelcome.tsx`) MUST detect the participant's browser on page load. If the browser is not Google Chrome (or a Chromium-based browser that identifies as Chrome, such as Brave), the page MUST display a prominent blocking warning and prevent the participant from proceeding.
  - *Rationale:* The experiment relies on browser-specific APIs (canvas fingerprinting, WebGL, specific rendering behavior) that behave inconsistently across browsers. Requiring Chrome ensures reproducible experimental conditions and consistent device fingerprint quality (REQ-311).
  - *Acceptance:*
    - On page load, `SurveyWelcome.tsx` detects the browser using `navigator.userAgent`.
    - Chrome detection rule: `userAgent` contains `"Chrome/"` AND does NOT contain `"Edg/"` (Microsoft Edge) AND does NOT contain `"OPR/"` (Opera).
    - If a non-Chrome browser is detected, a full-width warning banner MUST appear above the main card with a clear message in Traditional Chinese instructing the user to switch to Chrome.
    - The "開始實驗" button MUST be visually disabled (`disabled` attribute set, `opacity-50 cursor-not-allowed` styling) and non-clickable when a non-Chrome browser is detected.
    - If Chrome is detected, the page renders and behaves exactly as before (no visible change).
    - The check runs entirely client-side with no backend involvement.
  - *Warning message (zh-TW):* 「請使用 Google Chrome 瀏覽器開啟本頁面。本實驗僅支援 Chrome，使用其他瀏覽器可能導致實驗無法正常運行。」
  - *Note:* Brave browser identifies as Chrome in its `userAgent` and will pass this check, which is acceptable behavior.

### REQ-500 — Internationalization

- **REQ-501 — Multi-language UI.** The survey and admin UIs MUST support multiple display languages. The default participant experience is Traditional Chinese (zh-TW) as evidenced by hardcoded strings such as 「人數已滿」 and 「正在儲存您的結果...」, with i18n infrastructure recently merged (commit `89a1e5d feat: i18n`).
  - *Acceptance:* TBD — the exact list of supported locales, the language-switcher placement, and persistence strategy (localStorage vs. URL param) need confirmation. Flagged in Open Questions.

---

## Non-Functional Requirements

- **NFR-1 — Performance:** Batch creation MUST handle up to 1000 combinations in a single `insertMany` call (currently capped via `validateBatchParams`). Submission count aggregation runs per-query via `countDocuments` rather than denormalized — acceptable for hundreds of sessions, may need indexing review at scale.
- **NFR-2 — Resilience:** Frontend MUST surface backend failures in a non-blocking banner (`backendNotice`) rather than crashing. Survey progress survives full-page reload (REQ-404).
- **NFR-3 — Security:** Admin password and Turnstile secret are read from environment only. Turnstile cookie is `httpOnly`, `sameSite=lax`, `secure` in production, and holds a server-signed, expiring token (REQ-102.1). `JWT_SECRET` is required in production; the server refuses to start without it. The `clearDatabase` mutation is hard-blocked outside production via env check.
- **NFR-4 — Deployment:** Single-Procfile deploy (`web: npm start`) on Heroku-class platforms, Node 20.x. Static assets served from `dist/` after `vite build`.
- **NFR-5 — Compatibility:** SPA must handle deep links (server falls back to `index.html` for any non-`/graphql` route).
- **NFR-6 — Body size:** GraphQL endpoint accepts JSON payloads (standard size limits after RRWeb removal).
- **NFR-7 — Reproducible visual evidence for IRB-driven changes:** Participant-facing changes made in response to IRB comments MUST be documented with before/after screenshots of every edited screen, produced from a deterministic fixture (the same seeded database, seeded `Math.random`, frozen animations, desktop + phone at 2× DPR) and compiled into a PDF report (`npm run irb:shots -- --label before|after`, then `npm run irb:report`). The "before" set MUST be captured from app source identical to the pre-change commit, and the capture metadata MUST record this. The report MUST also contain a payment-rules page (報酬規則說明) explaining the conversion rate, participation fee, total formula, how the paid round and its points are decided, how the payout is persisted, and how it is delivered — with every number taken from the payment settings used in the "after" capture. The report is written in Traditional Chinese for the advisor/PI and must be readable without access to the code: no commit hashes, file paths, function or variable names, requirement IDs, or raw system output. It shows participant-facing changes only: admin-facing changes (the payment ledger export and admin-only access to participant email) are still captured for internal verification but are omitted from the report.
- **NFR-8 — Full-flow end-to-end test:** One command (`npm run test:e2e`) MUST run the whole experiment as a real study does — the admin logs in and launches a Mixed Mode group, a participant opens the invite link in Chrome and completes the intro, every scenario, the debrief and the email step, and the admin exports the payment ledger — against an isolated in-memory MongoDB, with no manual steps.
  - *Acceptance:*
    - The amount shown on the debrief, the persisted `Submission.payoutNtd` and the ledger's「Total Payout (NTD)」are the same number, and that number equals `totalPayoutNtd(payoffPoints(myDecisions[r], opponentDecisions[r]))` for the persisted realised round `r` (US-A7, REQ-408.3, REQ-408.5, REQ-408.7). Reloading the debrief does not change it.
    - Recorded answers, registration code and email match what the participant entered; the answered scenarios' `responseCount` and the session's `submissionCount` are incremented.
    - A second participant who stops mid-survey is absent from the ledger.
    - Every run writes `test-results/e2e/<timestamp>/` with one screenshot per checkpoint, `report.html` + `report.pdf` (summary, money trail, per-step screenshots and checks, ledger, known issues), the downloaded `payments.csv` and `server.log`. The report is written even when a step fails; the command exits non-zero if any check fails.
    - Not covered: real partner pairing (BUG-008), visual layout (NFR-7).
  - *Edge cases (NFR-8.1, added 2026-11-15):* the same run MUST also cover the cases below, each judged against the requirement named. Where no requirement defines the behaviour, the run records an **observation** (shown in the report, not pass/fail) for the team to decide.

    | ID | Case | Expected |
    |---|---|---|
    | EC-1 | Wrong comprehension-quiz answers first | Hint shown, 下一步 stays disabled until the quiz is retried correctly |
    | EC-2 | Empty registration code; malformed email | 下一步 disabled; email error shown and 送出 disabled (REQ-403) |
    | EC-3 | Participant leaves during the intro | No session or submission is created (REQ-307, BUG-004) |
    | EC-4 | Refresh mid-scenario before confirming | Same scenario shown again; the unconfirmed answer is not saved (REQ-404) |
    | EC-5 | Close the tab, come back via the invite link | Resumes at the next unanswered scenario with the same session and submission (REQ-313, REQ-404) |
    | EC-6 | Browser Back to a confirmed scenario | Stays on the next unanswered scenario with the 「已確認的答案無法修改。」 toast; the confirmed answer and `responseCount` unchanged; changing it through the API is rejected (REQ-402.4) |
    | EC-7 | Come back after completing (same device) | 「無法參與實驗」 on arrival; no new session/submission; payout and code unchanged (REQ-313, REQ-405) |
    | EC-8 | Same person on another device, same registration code | Observation: accepted as a new participant and listed twice in the ledger. Invalidating the duplicate removes it from the ledger (REQ-350, REQ-408.7) |
    | EC-9 | Every scenario of the group reached its target | Group marked completed (REQ-309); a new visitor sees 「無法參與實驗」 on arrival and gets no session; `startMixedSession` refuses (REQ-405.1) |
    | EC-10 | Non-Chrome browser | 開始實驗 disabled with the Chrome notice (REQ-415) |
    | EC-11 | Invite link with an unknown group | 「找不到此實驗」 on arrival, no 開始實驗, no session (REQ-405.2) |
    | EC-12 | Direct API misuse | Probability outside [0, 1] rejected (REQ-402); starting without Turnstile, or with a hand-written `turnstile_verified=true` cookie, rejected (REQ-100, REQ-102.1); participant data without admin login rejected (REQ-408.8); changing an answer of a completed submission, or completing it again, rejected (REQ-402.4, BUG-012); completing without the questionnaire rejected (REQ-416) |
    | EC-13 | No participant has completed yet | Export Payments disabled (REQ-408.7) |
  - *Roadmap (NFR-8.2, added 2026-11-15):* the report MUST open with a roadmap that shows every test case on the participant journey at a glance: one row per stage (admin setup → invite link → intro → scenarios → outro & debrief → coming back → payment ledger → direct API), the happy-path result for that stage, and each edge case as a chip coloured by its result (pass / fail / observed / not run). Each chip links to the step that ran it. A case added to the catalogue but not placed on the roadmap fails the run.
  - *PC + phone (NFR-8.3, added 2026-11-16):* `npm run test:e2e` runs the journey and every edge case twice — on a PC (1440×900) and with every participant on a phone (390×844, touch, mobile Chrome user agent; the admin stays on desktop) — and writes **one** report, `test-results/e2e/<timestamp>/report.html` + `report.pdf`, that compares the two: the roadmap and edge-case table show a PC and a phone result for every case, every check shows both results, and each participant screenshot is shown next to its phone counterpart (admin pages are desktop-only, so they are shown once, PC only). The run passes only if both pass. `npm run test:e2e:pc` / `npm run test:e2e:mobile` run one device on its own.

- **NFR-9 — Simulated pilot data check:** 📋 **NEW 2026-11-17** Before real participants are recruited, one command (`npm run sim:data`) MUST fill a study with simulated participants and prove that the data the researcher will analyse is complete, correct and analysable. It runs locally against an isolated in-memory MongoDB, with no manual steps.
  - *Study:* the admin launches a Mixed Mode group (defaults: max k 2, 10 scenarios per participant, target 2 per scenario, focal 國民黨 KMT1, partner 民進黨 DPP4; each settable by an env var). Simulated participants keep arriving, several at a time, until the server turns them away (group full, REQ-405.1), as a real recruitment would.
  - *Participants:* each goes through the same API calls as the survey page (`startMixedSession` → `startSurvey` → `saveSurveyAnswer` per scenario with `responseTime` → `drawRealisedRound` → `completeSurvey` with a registration code, email and Q1–Q8). Each is given a **persona** with a known behaviour (seeded, so a run can be repeated):
    | Persona | Share | Behaviour |
    |---|---|---|
    | Conditional | 55% | Cooperation rises with the share of 給予 edges in the scenario: p = 0.2 + 0.6 × share + noise; ~8 s per answer |
    | Cooperator | 10% | p ≈ 0.9 regardless of the scenario |
    | Defector | 10% | p ≈ 0.1 regardless of the scenario |
    | Straight-liner | 5% | The same p (0.5) for every scenario, ~3 s per answer |
    | Speeder | 5% | Random p, under 1.5 s per answer |
    | Retrier | 5% | Conditional, but every answer is sent twice (a network retry) |
    | Drop-out | 10% | Conditional, stops after some scenarios and never completes |
  - *Data checks (each fails the run):*
    - D1 — A completed submission has exactly one answer per assigned scenario, no duplicates, none outside its session.
    - D2 — Every stored answer (probability, response time) equals what was sent and has `answeredAt`.
    - D3 — `Scenario.responseCount` equals the number of stored answers to that scenario (a retry is not counted twice).
    - D4 — The stored Q1–Q8 answers, registration code and email equal what was sent.
    - D5 — Every payout follows the payment rule (REQ-408): the realised round's points from the stored decisions × NT$100 + fee, within the min–max range.
    - D6 — The research CSV exported from the group page (REQ-362) has one row per stored answer (plus one row per submission without answers), every cell matches the database, required columns are never empty for a completed submission, and the 「Email」 column equals the stored email (2026-11-19; before that: no email anywhere in the file).
    - D7 — The payment ledger (REQ-408.7) has exactly one row per completed, valid submission, no drop-outs, and its total equals the sum of the stored payouts.
    - D8 — Once recruitment stops, the group is completed (REQ-309) and every scenario has at least its target number of answers from completed submissions.
  - *Analysis checks (each fails the run):*
    - A1 — The planted effect is recoverable from the research CSV alone: the slope of cooperation probability on the 給予 share, over completed rows, is within ±0.1 of the slope the persona mix implies.
    - A2 — Straight-liners (one value for every answer) and speeders (median response time under 2 s) found from the CSV alone are exactly the planted ones.
  - *Observations (shown, never fail):* answers above a scenario's target (participants already in progress when it filled), answers per scenario (min / median / max), mean cooperation by 給予 share, response-time median, persona counts.
  - *Output:* `test-results/sim/<timestamp>/` — `report.md` (every check with expected vs actual), `research.csv`, `payments.csv`, `ground-truth.json` (what each simulated participant sent, with its persona), `server.log`. Exit code 0 only if every check passes.
  - *Scope:* the participants use the API, not the browser (NFR-8 covers the pages); the two CSVs are exported through the real admin page in Chrome.

---

## Known Issues

### Active Issues

| Issue ID | Description | Severity | Reported |
|----------|-------------|----------|----------|
| BUG-004 | Mixed Mode creates session too early (on welcome page load) | High | 2026-05-06 |
| BUG-006 | GraphQL resolvers never check `context.isAdmin`; admin mutations can be called without logging in | High | 2026-10-01 |
| BUG-008 | Partner pairing never matches a real participant; every 搭檔 decision is a 50/50 draw | High | 2026-11-15 |

**BUG-004**: Mixed Mode session creation timing inconsistency

- **Symptom**: When opening `/survey/welcome?groupId=xxx&mode=mixed` URL, the system creates a session **immediately** on page load, before the user sees the welcome screen or clicks "開始實驗". Additionally, React StrictMode's double-execution of effects causes **two sessions** to be created when only one browser tab is opened.

- **Root Cause**: [`App.tsx:87-171`](../App.tsx:87-171) `hydrateSession` useEffect calls `startMixedSession` immediately when detecting `groupId + mode=mixed` URL parameters, then redirects to `?sessionId=xxx`. This is inconsistent with Manual Mode, which delays submission creation until user progresses past intro.

- **Comparison with Manual Mode**:
  - **Manual Mode** flow: `/survey/welcome?sessionId=xxx` → load session data (no creation) → user clicks "開始實驗" → `/survey/intro/0` → user completes intro → `/survey/scenarios/0` → **first call to `startSurvey`** creates submission
  - **Mixed Mode** current flow: `/survey/welcome?groupId=xxx&mode=mixed` → **immediately calls `startMixedSession`** creates session → redirects to `?sessionId=xxx`
  - **Expected Mixed Mode flow**: Should delay `startMixedSession` until after intro completion, matching Manual Mode behavior

- **Impact**:
  1. **Early session creation**: Sessions appear in database before user even sees welcome text
  2. **Duplicate sessions**: React StrictMode double-execution creates 2 sessions per page load
  3. **Inconsistent UX**: Mixed Mode and Manual Mode have different creation timing
  4. **Data pollution**: Abandoned sessions (user closes tab on welcome page) still exist in database

- **Proposed Fix**: Move `startMixedSession` call from `App.tsx` page-load effect to lazy execution when user transitions from intro to scenarios, matching Manual Mode's `startSurvey` timing. Store `groupId` + `mode` in URL/state until session creation.

**BUG-006**: Admin authentication is not enforced by any resolver

- **Symptom**: `server.js` verifies the admin JWT and puts `isAdmin` in the GraphQL context, but no resolver reads it. Anyone who can reach `/graphql` can run admin operations such as `deleteSessionGroup` or `invalidateSubmission`, and could read participant email through `recentSubmissions`.
- **Partial fix (2026-10-01, REQ-408.8)**: The queries that return participant email (`recentSubmissions`, `submissionsByGroup`) now require `context.isAdmin`.
- **Remaining**: Guard every admin-only mutation and query with the same `requireAdmin(context)` helper. Also make sure `JWT_SECRET` is set in production — `server.js` otherwise signs and verifies tokens with the literal `'fallback_secret'`.


**BUG-008**: Partner pairing never matches a real participant

- **Symptom**: On the debrief, the 搭檔 decision of every round comes from `Math.random()`, not from a paired participant's answer as REQ-407 states. The server log prints `opponentProbs matched=0/N fallback=N` for every participant.
- **Root Cause**: `createMixedGroup` gives every scenario of a group the group's single `focalNode`. `drawRealisedRound` looks for partner scenarios whose `focalNode` is in the opposite party **within the same `groupId`**, so it never finds any. Its match key, `scenarioIndex`, is also only the row index within one edge combination's design matrix, so even a reachable match would pair unrelated scenarios.
- **Impact**: Payouts are still drawn once, persisted, shown and exported consistently (NFR-8 verifies this), but they depend on a fair coin instead of real partner behaviour. If the consent form tells participants they are paired with a real person, this is an undisclosed deviation — the PI should be informed.
- **Proposed Fix**: To be designed separately — decide how partners are matched across groups (e.g. a KMT-focal and a DPP-focal group linked to each other) and match on a scenario identity that is the same for both perspectives (mirrored edge set + edge states), not `scenarioIndex`.


**BUG-009**: Registration code lost on refresh — ✅ **FIXED 2026-11-15** (REQ-403.1)

- **Symptom**: If the participant refreshes the page on outro step 2 (debrief) or step 3 (email), the submission is saved with `demographics.gender = 'unknown'` and the payment ledger's「Registration Code」reads `unknown`, so the researcher cannot match the payment to the registered participant. Found by the NFR-8 e2e test (it reloads the debrief to verify the payout does not change); without the reload the code is saved correctly.
- **Root Cause**: `SurveyOutro` keeps the code only in component state (`codeValue`); nothing persists it, and `handleFinalSubmit` falls back to `codeValue || 'unknown'`. The outro step lives in the URL precisely so a refresh resumes it (REQ-404), but the code does not survive.
- **Fix**: `SurveyOutro` stores the code in `localStorage[survey_code_<submissionId>]`, restores it on mount, removes it after `completeSurvey` succeeds, and sends the participant back to step 1 instead of saving `unknown` when it is missing.


**BUG-010**: Full Mixed Mode group never closes

- **Symptom**: After every scenario of a group has reached `targetSizePerScenario`, a new visitor still sees the welcome page, completes the whole intro and gets a session — made of scenarios that are already at target (18 of 18 in the NFR-8.1 run, EC-9). The group is never marked completed. Each such participant is oversampling that the researcher would still have to pay.
- **Root Cause**: REQ-309 is marked completed but is not implemented: `SessionGroup` has no `status` field, and `completeSurvey` counts the scenarios below target and only logs the number. `startMixedSession` and the welcome page never check whether the group is full, so the REQ-405 gate for Mixed groups does not exist.
- **Fix (2026-11-16)**: `SessionGroup.status` added and recomputed in `completeSurvey` and on invalidate/restore (REQ-309); `startMixedSession` refuses new sessions for a completed group (`GROUP_FULL`); the welcome page reads the group's status on arrival and shows 「無法參與實驗」 (REQ-405.1). Participants already in progress may finish.

**BUG-011**: A failed final save showed the done page and wiped the answers

- **Symptom**: If `completeSurvey` failed on 送出 (e.g. the network dropped), the participant still saw the done page; the submission stayed incomplete, so it had no questionnaire answers, no email and no payment-ledger row, and the copies kept in the browser were deleted. Found in the 2026-11-17 data-capture review.
- **Root Cause**: `App.handleSurveyComplete` caught the error, set a notice and navigated to step 5 anyway. It never rethrew, so `SurveyOutro.handleFinalSubmit` treated the save as successful and cleared the stored code and answers; its 「提交失敗」 alert could never run.
- **Fix (2026-11-17, REQ-403.2)**: `handleSurveyComplete` rethrows and navigates only on success; `ALREADY_COMPLETED` counts as success.

**BUG-012**: A completed submission could be completed again

- **Symptom**: Calling `completeSurvey` again on a completed submission overwrote the questionnaire answers and the email (redirecting the payment), reset `completedAt` and counted the session's `submissionCount` a second time. Only `saveSurveyAnswer` checked `isCompleted`.
- **Fix (2026-11-17, REQ-402.4)**: the update only matches a submission that is not completed yet; otherwise `ALREADY_COMPLETED`.

**BUG-013**: A failed answer save moved the participant on and lost the answer

- **Symptom**: When `saveSurveyAnswer` failed (network drop, server error), the participant still went to the next scenario (or the outro); that answer was never stored, and the submission could be completed with fewer answers than scenarios. Found in the 2026-11-17 production data review.
- **Root Cause**: `App.handleSaveAnswer` returns `false` on failure, but `SurveyView.handleNext` ignored the return value and navigated anyway.
- **Fix (2026-11-17, REQ-402.6)**: `handleNext` stops on `false`, keeps the slider value and shows a toast.

**BUG-014**: A quick first answer dropped the session from the URL; a later refresh hung on 「載入中...」

- **Symptom**: On production, a participant who confirmed scenario 1 within ~1.7 s of it appearing continued with URLs that had no `?sessionId=` (`/survey/scenarios/2`, …, `/survey/outro/2`). Answers were still saved, but a refresh on any later page had nothing to restore from: the debrief stayed on 「載入中...」 forever (both devices of the 2026-11-17 production e2e run). Locally it never showed, because the app repairs the URL within milliseconds there.
- **Root Cause**: `SurveyView.navigateWithSession` used the `sessionId` / `groupId` read at render time. 進入測驗 creates the session and puts `?sessionId=` in the URL while the click handler from the older render is still running; that handler then navigated to `/survey/scenarios/0?groupId=…&mode=mixed`, and the app needed a full restore round trip (fingerprint + 2 requests) to put the session back. A confirm in that window navigated from the broken URL and lost both parameters.
- **Fix (2026-11-17, REQ-404)**: `navigateWithSession` and the resume path saved by `handleNext` read `window.location.search` when they run. The e2e checks that the first scenario URL already carries the session.

**BUG-015**: Registration code and email stored under demographic field names

- **Symptom**: The database stored the registration code in `demographics.gender`, the email in `demographics.education`, and `demographics.age` = a number parsed from the code (usually 0). Anyone reading the database or an old export would take them for demographics. Found in the 2026-11-17 data review.
- **Root Cause**: The outro reused the `completeSurvey(demographics)` payload of an earlier demographics form that is no longer shown.
- **Fix (2026-11-18, REQ-403)**: `Submission.registrationCode` and `Submission.email` replace `demographics`; the GraphQL `Demographics` / `DemographicsInput` types are removed; `completeSurvey(submissionId, registrationCode, email, questionnaire)`.

---

## Known Issues (Fixed)

### Fixed Issues

| Issue ID | Description | Fix Date | Status |
|----------|-------------|----------|--------|
| BUG-001 | NetworkGraph TypeError: Cannot read properties of undefined (reading 'includes') | 2026-05-04 | ✅ Fixed |
| BUG-002 | SurveyOutro not calling completeSurvey, causing all submissions to show as incomplete | 2026-05-04 | ✅ Fixed |
| BUG-003 | Admin history view: clicking session ID shows 0 active edges in read-only setup panel | 2026-05-04 | ✅ Fixed |
| BUG-009 | A page refresh after outro step 1 lost the registration code; the ledger showed `unknown` | 2026-11-15 | ✅ Fixed |
| BUG-010 | A full Mixed group never closed; new visitors still got sessions of already-full scenarios | 2026-11-16 | ✅ Fixed |
| BUG-011 | A failed final save showed the done page and wiped the code, email and questionnaire answers | 2026-11-17 | ✅ Fixed (REQ-403.2) |
| BUG-012 | `completeSurvey` on a completed submission overwrote its answers and email and double-counted it | 2026-11-17 | ✅ Fixed (REQ-402.4) |
| BUG-013 | A failed answer save moved the participant on and lost that answer | 2026-11-17 | ✅ Fixed (REQ-402.6) |
| BUG-014 | A quick first answer dropped `?sessionId=` from the URL; a later refresh hung on 「載入中...」 (production only) | 2026-11-17 | ✅ Fixed (REQ-404) |
| BUG-015 | Registration code and email stored as `demographics.gender` / `demographics.education` | 2026-11-18 | ✅ Fixed (REQ-403) |
| BUG-016 | The bot-check cookie was the plain value `true`; any script could set it and skip Turnstile | 2026-11-19 | ✅ Fixed (REQ-102.1) |
| BUG-007 | Group detail view and research CSV only see the 100 most recent submissions across all sessions | 2026-10-01 | ✅ Fixed (REQ-408.7) |

**BUG-001**: [`NetworkGraph.tsx`](../components/NetworkGraph.tsx) had multiple locations where `activeEdges` could be undefined, causing crashes. Fixed by adding defensive checks: `scenario?.activeEdgeIds || setup?.activeEdgeIds || []`.

**BUG-002**: [`SurveyOutro.tsx`](../components/SurveyOutro.tsx) never called `completeSurvey` mutation, causing all submissions to remain `isCompleted: false`. Fixed by passing `onComplete` and `entryId` props and calling `completeSurvey` when user submits email/code. A repair script [`scripts/fix-incomplete-submission.mjs`](../scripts/fix-incomplete-submission.mjs) is available for fixing historical data.

**BUG-003**: Read-only setup view displays zero active edges despite history table showing correct edge count.
- **Symptom**: In [`/admin/view/manual`](../components/HistoryTable.tsx), the "Active Edges" column correctly displays edge list (e.g., 3 edges with names). When clicking the session ID to enter read-only setup view ([`/admin/setup`](../components/SetupPanel.tsx)), the "Setting Preview" section shows "Active Edges" as empty (k=0), and the Network Graph shows no highlighted edges.
- **Root Cause - Multi-Layer Issue**:
  1. **GraphQL Schema**: `Session` type didn't declare `activeEdgeIds` field
  2. **GraphQL Resolver**: [`toSessionGraph`](../backend/graphql/resolvers.js:41) didn't populate the virtual field
  3. **Frontend Query**: [`fetchAllSessions`](../utils/graphqlClient.ts:88) didn't request `activeEdgeIds` field
  4. **Frontend Mapping**: [`AdminView.tsx`](../components/AdminView.tsx:47) tried to derive from scenarios array
- **Impact**: Admins cannot properly view and verify historical session configurations in read-only mode. The complexity check shows incorrect values (k=0, scenarios=1 instead of actual values).
- **Fix Applied - Four-Layer Solution**:
  1. **Schema**: Added `activeEdgeIds: [String!]!` to [`Session` type](../backend/graphql/typeDefs.js:31)
  2. **Resolver**: Modified [`toSessionGraph`](../backend/graphql/resolvers.js:56-67) to derive virtual field from first scenario
  3. **Query**: Updated [`fetchAllSessions`](../utils/graphqlClient.ts:88) GraphQL query to request `activeEdgeIds`
  4. **Component**: Simplified [`AdminView.tsx:47`](../components/AdminView.tsx:47) to use `session.activeEdgeIds` directly

**BUG-007**: `GroupDetailView` loaded submissions through `recentSubmissions(limit: 100)`, which returns the 100 newest submissions across **all** sessions and groups, and then filtered them client-side by the group's session IDs. Once the database held more than 100 submissions, older participants silently disappeared from the group's submission list and from the research CSV export. Fixed by the group-scoped admin query `submissionsByGroup(groupId)` (REQ-408.7).

---

## Out of Scope (Explicitly Not Required)

- Role-based access control beyond a single shared admin password (backlog candidate).
- Participant accounts, login, or returning-user profiles.
- Real-time admin dashboards (current views are query-on-load).
- Multi-tenancy / organization separation.
- A11y certification (no formal WCAG target set).
- Session replay functionality (RRWeb removed due to network blocking issues).

---

## Open Questions

1. **REQ-501 i18n details.** Which locales are in scope? Where does the language switcher live? How is the choice persisted?
2. **REQ-310 Scenario heatmap.** UI design and implementation priority for scenario completion visualization in Mixed Mode groups.
3. **Mixed Mode design matrix size.** How many scenarios does each edge combination's design matrix contain? This affects `totalScenarios` calculation and estimated participant count.
4. **Mixed Mode balanced selection tuning.** Current strategy: sort by `responseCount`, take top 2S, random sample S. Should we adjust the candidate pool size or use different strategy?
5. **~~Mixed Mode duplicate participation.~~** ~~Should the system enforce `participantId` uniqueness per group more strictly? Via cookie, email requirement, or other method?~~ → **RESOLVED** via REQ-311 (device fingerprinting)
6. **Fingerprinting library choice.** Should we use open-source FingerprintJS, commercial Fingerprint Pro, or implement custom fingerprinting? Trade-offs: accuracy vs cost vs privacy.
7. **REQ-312 Mongoose `required: true` scope conflict.** Making `maxK`, `scenariosPerSession`, and `targetSizePerScenario` unconditionally `required: true` in the Mongoose schema will cause validation failures when creating Batch Mode or Manual Mode `SessionGroup` documents, which legitimately do not have these fields. Two resolution options: (a) keep `required: false` at the Mongoose level and rely exclusively on resolver-level validation + GraphQL type-system enforcement (`Int!`) to enforce presence for Mixed Mode — the schema-level constraint only applies when the resolver itself writes the document; (b) use a Mongoose conditional validator (`required: function() { return !!this.config?.maxK; }`) so the constraint applies only to Mixed Mode documents. The tasks in Phase 24 implement option (b) as it provides the deepest enforcement while remaining non-breaking for other modes. Confirm preferred approach before implementation.
8. **REQ-408 base participation fee (pending PI).** Does the IRB-approved consent form (受試者同意書) promise a guaranteed participation fee? NT$100 has been mentioned. It is implemented as `PARTICIPATION_FEE_NTD` in `utils/payment.js`, defaulting to 0 (the behavior before 2026-10-01). If confirmed, set it to 100; the fee is then paid only to participants who complete the experiment, and the participant copy, debrief, persisted payout and payment ledger all pick it up automatically.
9. **REQ-408 payout timeline (pending PI).** Within how many days after the experiment is the 電子禮券 emailed? `PAYMENT_TIMELINE_TEXT` keeps the original「盡快」wording until the PI confirms a number of days.
10. **Same person on two devices (EC-8).** A second device with an already-used registration code is accepted as a new participant and appears in the payment ledger twice. Should `completeSurvey` reject (or flag) a registration code already used in the group, or is manual invalidation by the researcher (REQ-350) enough?
11. **Invite link to an unknown or deleted group (EC-11).** The participant sees the normal welcome page, completes the whole intro, and only then gets「無法建立測驗連線，請重試。」, which invites a pointless retry. Should the welcome page check the group first and show a clear message? **Resolved 2026-11-16 → REQ-405.2.**
12. **Completed submissions can be edited through the API (EC-12).** `saveSurveyAnswer` accepts changes to a submission that is already completed (and paid from). Should it refuse once `isCompleted` is true? **Resolved 2026-11-16 → REQ-402.4.**
13. **Browser Back during the scenarios (EC-6).** Back after confirming a scenario is redirected to the next unanswered one, so a confirmed answer cannot be changed. Is that the intended rule (it protects the data), or should Back allow revising? **Resolved 2026-11-16 → REQ-402.4 (confirmed answers are final).**

