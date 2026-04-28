# Development Tasks

Actionable checklist of development tasks, derived from `requirements.md` and `design.md`. Tasks are grouped by phase. Phases 1–5 capture the implemented baseline; Phases 6–9 capture forward work tied to open questions in `requirements.md`.

Format: `- [ ] TASK-NNN: [Verb] [action] — [context] [REQ-XXX]`

---

## Phase 1: Project Setup & Core Architecture (Baseline — Implemented)

- [x] TASK-001: Bootstrap Vite + React 19 + TypeScript frontend with TailwindCSS via CDN. [REQ-201]
- [x] TASK-002: Bootstrap Node 20 + Express 5 backend with `dotenv` config loader. [NFR-4]
- [x] TASK-003: Add Mongoose 8 connection module (`backend/db.js`) with `isDbConfigured` guard. [NFR-1]
- [x] TASK-004: Configure Apollo Server 5 (`@as-integrations/express5`) at `/graphql` with 50 MB body limit. [NFR-6]
- [x] TASK-005: Configure SPA fallback (`app.get(/^(?!/graphql).*$/)`) for client-side routing. [NFR-5]
- [x] TASK-006: Add Vite proxy rule for `/graphql` -> `localhost:3001` for local dev. [NFR-4]
- [x] TASK-007: Define core React Router v7 routes in `App.tsx` for admin and survey trees. [REQ-101, REQ-401]

## Phase 2: Database & Models (Baseline — Implemented)

- [x] TASK-101: Implement `SessionSetup` Mongoose schema with UUID `_id`, indexes on `groupId` and `createdAt`. [REQ-201, REQ-301]
- [x] TASK-102: Implement `Submission` Mongoose schema (results array, demographics, isCompleted). [REQ-402, REQ-403]
- [x] TASK-103: Implement `SessionGroup` schema with `completionPercentage` virtual + status enum. [REQ-301, REQ-302, REQ-304]
- [x] TASK-104: Implement `SessionReplay` schema with `chunkIndex` rolling at 2000 events. [REQ-411]

## Phase 3: GraphQL API (Baseline — Implemented)

- [x] TASK-201: Define GraphQL `typeDefs.js` with all types, queries, and mutations. [All data flows]
- [x] TASK-202: Implement `saveSessionSetup` / `sessionSetup` / `activeSessionSetup` / `allSessionSetups` resolvers. [REQ-201, REQ-202, REQ-311]
- [x] TASK-203: Implement `startSurveyEntry` resolver with Turnstile context guard. [REQ-102, REQ-401]
- [x] TASK-204: Implement `saveSurveyAnswer` resolver with `[0,1]` validation and per-`scenarioId` upsert. [REQ-402]
- [x] TASK-205: Implement `completeSurveyEntry` resolver setting `isCompleted=true`. [REQ-403]
- [x] TASK-206: Implement `submitSurvey` legacy one-shot mutation. [REQ-403]
- [x] TASK-207: Implement `createBatchSessions` resolver: validate, enumerate combos, design-matrix, `insertMany`. [REQ-301]
- [x] TASK-208: Implement `sessionGroup` / `allSessionGroups` / `sessionsByGroup` queries. [REQ-302, REQ-303]
- [x] TASK-209: Implement `updateSessionGroupStatus` / `deleteSessionGroup` (cascading) mutations. [REQ-304]
- [x] TASK-210: Implement `recentSubmissions(limit)` query. [REQ-321]
- [x] TASK-211: Implement `clearDatabase` mutation hard-blocked outside `NODE_ENV=production`. [REQ-322]
- [x] TASK-212: Implement `saveSessionEvents` / `getSessionReplay` for RRWeb chunks. [REQ-411, REQ-412]

## Phase 4: REST Endpoints & Auth (Baseline — Implemented)

- [x] TASK-301: Implement `POST /api/admin/login` against `ADMIN_PASSWORD`. [REQ-101]
- [x] TASK-302: Implement `POST /api/turnstile/verify` (siteverify + dev short-circuit) and set `turnstile_verified` cookie. [REQ-102]
- [x] TASK-303: Implement `GET /api/turnstile/status`. [REQ-102]
- [x] TASK-304: Implement `Login`, `ProtectedRoute`, and admin gate redirect. [REQ-101]

## Phase 5: Admin Console UI (Baseline — Implemented)

- [x] TASK-401: Build `AdminView` tabbed layout (Setup / History / Groups). [REQ-200, REQ-300, REQ-310]
- [x] TASK-402: Build `SetupPanel` + `NetworkGraph` for single-session config and link generation. [REQ-201, REQ-202, REQ-203]
- [x] TASK-403: Build `BatchModeConfig` + `BatchConfirmModal` for batch launch UX. [REQ-301]
- [x] TASK-404: Build `GroupsTable` with status + completion % display. [REQ-302]
- [x] TASK-405: Build `GroupDetailView` (`/admin/groups/:groupId`) listing child sessions. [REQ-303]
- [x] TASK-406: Build `HistoryTable` for standalone sessions. [REQ-311]
- [x] TASK-407: Wire group lifecycle controls (status update, delete) into `GroupsTable`. [REQ-304]
- [x] TASK-408: Add dev-only DB clear control (already hidden in prod per commit `337b30b feat: hide delete db`). [REQ-322]

## Phase 6: Participant Survey Flow (Baseline — Implemented)

- [x] TASK-501: Implement `surveySession.ts` (`localStorage` get/set/clear keyed by `survey_session_<setupId>`). [REQ-404]
- [x] TASK-502: Implement Turnstile widget mount + verification flow in `SurveyView`. [REQ-102]
- [x] TASK-503: Build `SurveyWelcome`, `SurveyIntro`, scenario flow, and `SurveyOutro`. [REQ-401]
- [x] TASK-504: Build demographics form with completion submission. [REQ-403]
- [x] TASK-505: Implement "Session Full" gate when `submissionCount >= sampleSize` and no resumable entry. [REQ-405]
- [x] TASK-506: Implement session restoration with path-mismatch heuristic in `App.tsx`. [REQ-404]

## Phase 7: Session Replay (Baseline — Implemented; Removal Pending)

- [x] TASK-601: Integrate `rrweb.record` in `SessionRecorder` with 5 s flush interval. [REQ-411]
- [x] TASK-602: Build `/admin/replay/:sessionId` view with `rrweb-player`. [REQ-412]
- [x] TASK-603: Implement chunk roll-over at 2000 events to stay under 16 MB doc cap. [REQ-411, NFR-6]

---

## Phase 8: RRWeb Removal (Pending User Confirmation)

> Blocked on Open Question 1. Do not start until the admin confirms removal vs. retention.

- [ ] TASK-701: Confirm with admin whether to remove RRWeb subsystem and whether to retain existing `SessionReplay` data for archive. [REQ-413]
- [ ] TASK-702: Remove `SessionRecorder` mount from `App.tsx` and delete `components/SessionRecorder.tsx`. [REQ-413]
- [ ] TASK-703: Delete `components/SessionPlayback.tsx` and the `/admin/replay/:sessionId` route. [REQ-413]
- [ ] TASK-704: Remove `saveSessionEvents` and `getSessionReplay` from `typeDefs.js` and `resolvers.js`. [REQ-413]
- [ ] TASK-705: Remove `backend/models/SessionReplay.js` (or archive-tag depending on TASK-701 outcome). [REQ-413]
- [ ] TASK-706: Drop `rrweb` and `rrweb-player` from `package.json`; run `npm install`; verify `vite build`. [REQ-413]
- [ ] TASK-707: Remove "Session Replay" rows from `requirements.md` REQ-411..412 (mark deprecated in change log) and update `design.md` accordingly. [REQ-413]
- [ ] TASK-708: Reduce Express body limit from 50 MB to a sensible default (e.g., 1 MB) once chunks are gone. [NFR-6]
- [ ] TASK-709: Remove replay links from `HistoryTable` / `GroupDetailView` and any admin UI references. [REQ-413]
- [ ] TASK-710: Add Vitest coverage proving the survey flow still works without `SessionRecorder`. [REQ-401..REQ-405]

## Phase 9: i18n Hardening (Pending Locale Decisions)

> Blocked on Open Question 2. The `feat: i18n` infrastructure was merged but the locale list and switcher behavior need confirmation.

- [ ] TASK-801: Confirm supported locales (e.g., zh-TW, en-US, others) and the canonical default. [REQ-501]
- [ ] TASK-802: Confirm language-switcher placement (admin header vs. survey header vs. both) and persistence strategy (`localStorage` vs. URL param vs. server-side). [REQ-501]
- [ ] TASK-803: Audit all hardcoded zh-TW strings (`「人數已滿」`, `「正在儲存您的結果...」`, scenario labels in `SurveyIntro`/`SurveyView`, edge labels `不給予`/`給予` in `constants.ts`) and route them through the i18n layer. [REQ-501]
- [ ] TASK-804: Add translation files for confirmed locales and document how to add a new locale. [REQ-501]
- [ ] TASK-805: Add a Vitest snapshot for at least one survey screen rendered in each locale. [REQ-501]
- [ ] TASK-806: Update `requirements.md` REQ-501 acceptance criteria once locales are confirmed; remove the TBD flag. [REQ-501]

## Phase 10: Performance & Data Hygiene (Backlog — Not Yet Scheduled)

> Tied to Open Questions 3 and 4. Schedule once batch sweeps stress current implementation.

- [ ] TASK-901: Wire `SessionGroupModel.updateCompletedCount` into `completeSurveyEntry` so `SessionGroup.completedSessions` reflects reality. Decide on transactional vs. eventually-consistent semantics. [REQ-302, Open Q4]
- [ ] TASK-902: Benchmark `allSessionSetups` + per-doc `countDocuments` at 500 / 1000 sessions; document p95 latency. [NFR-1]
- [ ] TASK-903: If TASK-902 shows degradation, denormalize `submissionCount` onto `SessionSetup` and update on submission lifecycle events. [NFR-1, Open Q3]
- [ ] TASK-904: Add `{ sessionId: 1 }` index on `Submission` once submission volume justifies it. [NFR-1]
- [ ] TASK-905: Wire `SessionGroup.status` auto-transition to `completed` when all child sessions reach `sampleSize`. [REQ-302, REQ-304]

## Phase 11: Admin Quality-of-Life (Out of Scope per requirements.md, Tracked for Future)

> All explicitly listed in requirements.md "Out of Scope". Move to Phase 10 only if user promotes them.

- [ ] TASK-A01: CSV export of submissions (`Submission` rows + `SessionSetup` metadata). [Out of scope today]
- [ ] TASK-A02: Real-time admin dashboard via subscriptions or polling. [Out of scope today]
- [ ] TASK-A03: Multi-user RBAC (replace shared `ADMIN_PASSWORD`). [Out of scope today]
- [ ] TASK-A04: Tenant / organization separation. [Out of scope today]
- [ ] TASK-A05: WCAG 2.1 AA accessibility audit. [Out of scope today]

---

## Notes

- All tasks are traceable back to `requirements.md` via `REQ-XXX` tags. `design.md` includes a Traceability Matrix that maps each REQ to its design sections — keep both updated together.
- Phase 8–10 tasks are blocked on the Open Questions in `requirements.md`. Resolve those questions before generating estimates or starting work.
- `plans/` (older feature design docs) is retained for historical context but is not the source of truth — `requirements.md` and `design.md` are.


## Phase 12: Scenario-Centric Data Model (Foundation)

> **Status**: Ready to implement
> **Estimated effort**: 4 days
> **Dependencies**: None (greenfield - no data migration needed)

- [ ] **TASK-1201**: Create `backend/models/Scenario.js` model
  - Define schema with UUID `_id`, experiment config fields, data collection tracking
  - Add indexes: `{ groupId: 1, status: 1, responseCount: 1 }`, `{ setupId: 1, scenarioIndex: 1 }`
  - [REQ-321]

- [ ] **TASK-1202**: Create `backend/models/Session.js` model (replacing SessionSetup)
  - Define schema with `scenarioIds: [String]` reference array
  - Add `metadata` field for Mixed Mode participant tracking
  - Configure virtual populate for `scenarios` field
  - Add indexes: `{ groupId: 1 }`, `{ 'metadata.participantId': 1 }`
  - [REQ-322]

- [ ] **TASK-1203**: Update `backend/models/SessionSetup.js` Submission schema
  - Change `results[].scenarioId` from Number to String (UUID reference)
  - Add `participantId` field (String, optional)
  - Add `responseTime` field to results
  - Update indexes: `{ sessionId: 1, participantId: 1 }`
  - [REQ-402]

- [ ] **TASK-1204**: Simplify `backend/models/SessionGroup.js`
  - Remove `batchMode`, `completedSessions` fields
  - Replace with unified `config` object
  - Add `totalScenarios` field
  - [REQ-306]

- [ ] **TASK-1205**: Update `constants.ts` and type definitions
  - Add TypeScript types for `Scenario`, updated `Session`, `SessionGroup`
  - Update `types.ts` to reflect new data model
  - [REQ-320]

- [ ] **TASK-1206**: Add helper functions to `utils/mathBackend.js`
  - `calculateTotalScenarios(maxK)`: estimate scenario pool size
  - Update `generateDesignMatrix` if needed for Scenario creation
  - [REQ-306]

## Phase 13: GraphQL API - Core Refactor

> **Status**: Blocked by Phase 12
> **Estimated effort**: 5 days
> **Dependencies**: Phase 12 complete

- [ ] **TASK-1301**: Update `backend/graphql/typeDefs.js`
  - Add `Scenario` type with all fields
  - Rename `SessionSetup` → `Session`, update fields
  - Update `Submission` type (scenarioId as ID)
  - Update `SessionGroup` type (add config, mode)
  - Add new queries: `scenario`, `scenarios`, `scenarioStats`
  - Add new mutations: `createManualSession`, `createMixedGroup`, `startMixedSession`
  - [REQ-321, REQ-306]

- [ ] **TASK-1302**: Implement Mode 1 (Manual) resolvers
  - `createManualSession`: generate scenarios → create session
  - Refactor existing `saveSessionSetup` logic
  - [REQ-201]

- [ ] **TASK-1303**: Implement Mode 2 (Batch) resolvers
  - Refactor `createBatchSessions`: create independent Scenario documents
  - Maintain existing behavior, new data structure
  - [REQ-301]

- [ ] **TASK-1304**: Implement Mode 3 (Mixed) resolvers
  - `createMixedGroup`: generate scenario pool for k=1..maxK
  - `startMixedSession`: balanced scenario selection + session creation
  - [REQ-306, REQ-307]

- [ ] **TASK-1305**: Implement unified survey flow resolvers
  - `startSurvey`: works with sessionId (all modes)
  - `saveSurveyAnswer`: update Submission + increment Scenario.responseCount
  - `completeSurvey`: mark complete + check Mixed Mode group completion
  - [REQ-401, REQ-402, REQ-403, REQ-308, REQ-309]

- [ ] **TASK-1306**: Implement Scenario query resolvers
  - `scenario(id)`: single scenario lookup
  - `scenarios(groupId, status, limit)`: list with filters
  - `scenarioStats(groupId)`: aggregation for admin dashboard
  - [REQ-310]

- [ ] **TASK-1307**: Implement Session query resolvers
  - Rename `sessionSetup` → `session`
  - Rename `allSessionSetups` → `allSessions`
  - Add populate logic for `session.scenarios` virtual field
  - [REQ-322]

- [ ] **TASK-1308**: Add field resolvers
  - `Session.scenarios`: virtual populate
  - `Scenario.completionRate`: computed field
  - `SessionGroup.mode`: computed from config
  - [REQ-321, REQ-322]

## Phase 14: Utils and Helpers

> **Status**: Blocked by Phase 13
> **Estimated effort**: 2 days
> **Dependencies**: Phase 13 complete

- [ ] **TASK-1401**: Create `utils/scenarioSelection.js`
  - `balancedSelect(scenarios, count)`: priority to low responseCount
  - `randomSelect(scenarios, count)`: pure random
  - Add configurable strategy switching
  - [REQ-307]

- [ ] **TASK-1402**: Update `utils/graphqlClient.ts`
  - Update TypeScript types for new API
  - Add `Scenario` queries
  - Update `Session` queries (renamed from SessionSetup)
  - [REQ-320]

- [ ] **TASK-1403**: Update `utils/combinations.ts`
  - Ensure compatibility with new Scenario generation
  - Add tests for edge cases
  - [REQ-301, REQ-306]

- [ ] **TASK-1404**: Add `utils/participantId.ts`
  - Generate stable participant IDs (cookie-based or fingerprint)
  - Handle Mixed Mode uniqueness checks
  - [REQ-307]

## Phase 15: Frontend - Admin UI

> **Status**: Blocked by Phase 14
> **Estimated effort**: 4 days
> **Dependencies**: Phase 14 complete

- [ ] **TASK-1501**: Update `components/SetupPanel.tsx` (Mode 1)
  - Call `createManualSession` instead of `saveSessionSetup`
  - Update URL generation
  - UI remains mostly unchanged
  - [REQ-201]

- [ ] **TASK-1502**: Update `components/BatchModeConfig.tsx` (Mode 2)
  - Call updated `createBatchSessions`
  - Verify behavior unchanged
  - [REQ-301]

- [ ] **TASK-1503**: Create `components/MixedModeConfig.tsx` (Mode 3)
  - Form: maxK, scenariosPerSession, targetSizePerScenario
  - Real-time estimates: totalScenarios, estimatedParticipants
  - Call `createMixedGroup` mutation
  - Display master URL
  - [REQ-306]

- [ ] **TASK-1504**: Update `components/AdminView.tsx`
  - Add "Mixed Mode" tab
  - Update routing
  - Add mode detection logic
  - [REQ-306]

- [ ] **TASK-1505**: Update `components/GroupsTable.tsx`
  - Display mode badge (Manual/Batch/Mixed)
  - Show appropriate progress metrics per mode
  - [REQ-302, REQ-310]

- [ ] **TASK-1506**: Update `components/GroupDetailView.tsx`
  - Detect mode: check `group.config.maxK` vs `group.config.edgeCount`
  - Route to appropriate detail component
  - [REQ-303, REQ-310]

- [ ] **TASK-1507**: Create `components/MixedGroupDetailView.tsx`
  - Display master URL (single URL for all participants)
  - Show progress: `(completedScenarios / totalScenarios) × 100%`
  - List dynamically created sessions
  - [REQ-310]

- [ ] **TASK-1508**: Create `components/ScenarioHeatmap.tsx`
  - D3 visualization: scenarios grouped by edge combination
  - Color coding: undersampled (red), at-target (green)
  - Click to show scenario details
  - [REQ-310]

- [ ] **TASK-1509**: Update `components/HistoryTable.tsx`
  - Rename to `SessionsTable.tsx`
  - Show mode badges for all sessions
  - Update queries to use `allSessions`
  - [REQ-316]

## Phase 16: Frontend - Survey Flow

> **Status**: Blocked by Phase 15
> **Estimated effort**: 4 days
> **Dependencies**: Phase 15 complete

- [ ] **TASK-1601**: Update `App.tsx` routing logic
  - Detect `?sessionId=<id>` (Manual/Batch) vs `?groupId=<id>&mode=mixed` (Mixed)
  - For Mixed: call `startMixedSession` to get/create personalized session
  - Pass resolved `sessionId` to `SurveyView`
  - [REQ-401]

- [ ] **TASK-1602**: Verify `components/SurveyView.tsx` compatibility
  - Confirm no changes needed (should work with populated `session.scenarios`)
  - Test with all three modes
  - [REQ-323]

- [ ] **TASK-1603**: Update `utils/surveySession.ts`
  - Change storage key from `survey_session_<setupId>` to `survey_session_<sessionId>`
  - Update session state interface if needed
  - [REQ-404]

- [ ] **TASK-1604**: Update Turnstile integration
  - Verify compatibility with Mixed Mode flow
  - Test `startMixedSession` requires Turnstile cookie
  - [REQ-102]

- [ ] **TASK-1605**: Update "Session Full" gate logic
  - Manual/Batch: check `session.submissionCount >= session.sampleSize`
  - Mixed: check all scenarios in group >= targetSize
  - [REQ-405]

- [ ] **TASK-1606**: Add participant ID tracking
  - Generate/retrieve `participantId` for Mixed Mode
  - Store in localStorage or cookie
  - Pass to `startMixedSession`
  - [REQ-307]

- [ ] **TASK-1607**: Update progress indicators
  - Show `N / session.scenarios.length` for all modes
  - Add scenario-specific metadata if needed
  - [REQ-401]

- [ ] **TASK-1608**: Test session resume logic
  - Verify localStorage restore works with new sessionId-based keys
  - Test across all three modes
  - [REQ-404]

## Phase 17: Testing & Documentation

> **Status**: Blocked by Phase 16
> **Estimated effort**: 3 days
> **Dependencies**: Phase 16 complete

- [ ] **TASK-1701**: Unit tests - Scenario model
  - Schema validation
  - Index queries
  - Status transitions
  - [REQ-321]

- [ ] **TASK-1702**: Unit tests - Session model
  - Virtual populate
  - Scenario references
  - Metadata handling
  - [REQ-322]

- [ ] **TASK-1703**: Unit tests - scenarioSelection helpers
  - Balanced strategy fairness
  - Random strategy coverage
  - Edge cases (empty pool, insufficient scenarios)
  - [REQ-307]

- [ ] **TASK-1704**: Integration tests - Mode 1 (Manual)
  - `createManualSession` → survey flow → completion
  - Verify scenario creation and references
  - [REQ-201, REQ-323]

- [ ] **TASK-1705**: Integration tests - Mode 2 (Batch)
  - `createBatchSessions` → multiple sessions
  - Verify scenario count matches C(12,k) × design matrix size
  - [REQ-301, REQ-323]

- [ ] **TASK-1706**: Integration tests - Mode 3 (Mixed)
  - `createMixedGroup` → scenario pool creation
  - `startMixedSession` × 10 participants → verify balanced selection
  - Multiple completions → verify responseCount increments
  - Group completion detection
  - [REQ-306, REQ-307, REQ-308, REQ-309, REQ-323]

- [ ] **TASK-1707**: E2E tests - Complete Mixed Mode flow
  - Admin creates mixed group
  - 5 participants complete surveys (Playwright)
  - Verify scenario-level data collection
  - Verify heatmap updates
  - [REQ-306..REQ-310]

- [ ] **TASK-1708**: E2E tests - Session resume
  - Start survey → refresh page → verify resume
  - Test across all three modes
  - [REQ-404]

- [ ] **TASK-1709**: Performance tests
  - Scenario populate query with 500+ scenarios
  - Balanced selection with 1000+ scenarios
  - Concurrent submissions (scenario responseCount atomicity)
  - [NFR-1]

- [ ] **TASK-1710**: Update `README.md`
  - Document three launch modes
  - Update architecture overview
  - Add Mixed Mode usage examples
  - [REQ-306..REQ-310]

- [ ] **TASK-1711**: Update API documentation
  - Generate GraphQL schema docs
  - Document new queries/mutations
  - Add code examples for each mode
  - [REQ-320]

- [ ] **TASK-1712**: Create `docs/examples/mixed-mode-walkthrough.md`
  - Step-by-step guide for creating Mixed Mode experiments
  - Explain balanced selection strategy
  - Show how to interpret heatmap
  - [REQ-306..REQ-310]

---

## Notes (Updated)

- **No data migration required** — starting with a clean database per user confirmation.
- All tasks are traceable back to `requirements.md` via `REQ-XXX` tags.
- `design.md` has been completely rewritten to reflect the scenario-centric architecture.
- Phase 12-17 implement the unified data model that eliminates mode-specific branches.
- Estimated total effort: **22 days** (4.5 weeks) for one engineer, or **~11 days** with two engineers working in parallel.
- Phases can be parallelized after Phase 13 (frontend and testing can proceed together).

## Implementation Strategy

**Week 1**: Complete Phase 12-13 (data models + core API)
- Milestone: Can create scenarios and sessions via GraphQL, all three modes work at API level

**Week 2**: Complete Phase 14-15 (utils + admin UI)
- Milestone: Admin can create experiments in all three modes via UI

**Week 3**: Complete Phase 16 (survey flow)
- Milestone: Participants can complete surveys in all three modes

**Week 4**: Complete Phase 17 (testing + docs)
- Milestone: Production-ready with comprehensive test coverage