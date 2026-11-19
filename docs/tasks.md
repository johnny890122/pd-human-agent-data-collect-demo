# Development Tasks

Actionable checklist of development tasks, derived from [`requirements.md`](requirements.md) and [`design.md`](design.md). Tasks are grouped by phase.

Format: `- [x/] TASK-NNN: [Verb] [action] — [context] [REQ-XXX]`

**Status Legend**: `[x]` Complete | `[-]` In Progress | `[ ]` Pending | `[⏸]` Deferred

---

## Implementation Status Summary

| Phase | Status | Completion Date | Notes |
|-------|--------|-----------------|-------|
| Phase 1-11 | ✅ Complete | 2026-04-28 | Baseline features |
| Phase 12 | ✅ Complete | 2026-04-28 | Data models |
| Phase 13 | ✅ Complete | 2026-04-28 | GraphQL API |
| Phase 14 | ✅ Complete | 2026-04-28 | Utils layer |
| Phase 15 | ✅ Complete | 2026-04-29 | Admin UI |
| Phase 16 | ✅ Complete | 2026-04-29 | Survey flow |
| Phase 17 | 🟡 Partial | Ongoing | Testing done, heatmap deferred |
| Bug Fixes | ✅ Complete | 2026-05-04 | NetworkGraph ✅, SurveyOutro ✅, Admin history view ✅ |
| Schema Refinement | 🔧 In Progress | 2026-05-04 | Scenario model improvements |
| Phase 24 | 📋 Planned | 2026-05-04 | Mixed Mode config fields mandatory (REQ-312) |
| Phase 25 | 📋 Planned | 2026-05-04 | Survey intro complete network history (REQ-405.1) |
| Phase 26 | 📋 Planned | 2026-05-05 | URL-level mode differentiation for `/admin/setup` (REQ-204, REQ-205, REQ-206) |
| Phase 27 | 📋 Planned | 2026-05-06 | Submission progress tracking in admin history table (REQ-340..342) |
| Phase 28 | ✅ Complete | 2026-05-06 | Fix Mixed Mode session creation timing (BUG-004) |
| Phase 29 | ✅ Complete | 2026-05-06 | Survey resume: Navigate to last answered question (BUG-005) |
| Phase 30 | 📋 Planned | — | Submission invalidation (REQ-350..354) |
| Phase 31 | 📋 Planned | — | Complete submission data CSV export (REQ-360..363) |
| Phase 32 | 📋 Planned | — | Icon-based invalidation UI with confirmation (REQ-355..358) |
| Phase 34 | 📋 Planned | — | Partner node peach-pink highlight (REQ-406) |
| Phase 35 | ✅ Complete | 2026-07-02 | Debrief screen with realised round, real opponent pairing, and persisted probabilistic payment (REQ-407, REQ-407.1) |
| Phase 36 | 📋 Planned | 2026-07-02 | Decision slider randomized default + mandatory interaction gate (REQ-402.1) |
| Phase 37 | 📋 Planned | 2026-07-02 | Disabled confirm button gray-out + slider glow prompt (REQ-402.2) |
| Phase 38 | 📋 Planned | 2026-07-02 | Slider visual camouflage — appears valueless until interacted (REQ-402.3) |
| Phase 39 | 📋 Planned | 2026-07-02 | Undecided-state copy on analysis text + neutral network graph decision edge (REQ-402.4) |
| Phase 40 | ✅ Complete | 2026-10-01 | IRB before/after capture tooling + baseline screenshots (NFR-7) |
| Phase 41 | ✅ Complete | 2026-10-01 | IRB comment 2 — payment conversion disclosure, persisted payout, payment ledger (REQ-408) |
| Phase 42 | ✅ Complete | 2026-10-01 | IRB comment 1 — figure legend, captions, minimum sizes (REQ-409) |
| Phase 43 | ✅ Complete | 2026-10-01 | IRB after screenshots + before/after PDF report + packet caption index (NFR-7, REQ-409.4) |
| Phase 44 | ✅ Complete | 2026-11-15 | Full-flow e2e test with screenshot review report (NFR-8) |
| Phase 45 | ✅ Complete | 2026-11-15 | Registration code survives a refresh (REQ-403.1, BUG-009) |
| Phase 46 | ✅ Complete | 2026-11-15 | E2E edge cases: return, attend twice, full group, guards (NFR-8.1) |
| Phase 47 | ✅ Complete | 2026-11-15 | Test-case roadmap at the top of the e2e report (NFR-8.2) |
| Phase 48 | ✅ Complete | 2026-11-16 | Full group closes (BUG-010), confirmed answers final (EC-6), unknown invite link (EC-11) |
| Phase 49 | ✅ Complete | 2026-11-16 | Phone version of the e2e run and report (NFR-8.3) |
| Phase 50 | ✅ Complete | 2026-11-16 | One combined PC + phone e2e report (NFR-8.3) |
| Phase 51 | ✅ Complete | 2026-11-16 | 圖例/圖說 open on tap (REQ-409.5); admin pages PC-only in the combined report |
| Phase 52 | ✅ Complete | 2026-11-17 | Post-survey questionnaire Q1–Q8 (REQ-416) |

---

## Phase 1: Project Setup & Core Architecture (Baseline — Implemented)

- [x] TASK-001: Bootstrap Vite + React 19 + TypeScript frontend with TailwindCSS via CDN. [REQ-201]
- [x] TASK-002: Bootstrap Node 20 + Express 5 backend with `dotenv` config loader. [NFR-4]
- [x] TASK-003: Add Mongoose 8 connection module (`backend/db.js`) with `isDbConfigured` guard. [NFR-1]
- [x] TASK-004: Configure Apollo Server 5 (`@as-integrations/express5`) at `/graphql`. [NFR-6]
- [x] TASK-005: Configure SPA fallback for client-side routing. [NFR-5]
- [x] TASK-006: Add Vite proxy rule for `/graphql` -> `localhost:3001` for local dev. [NFR-4]
- [x] TASK-007: Define core React Router v7 routes in `App.tsx` for admin and survey trees. [REQ-101, REQ-401]

## Phase 2: Database & Models (Baseline — Implemented)

- [x] TASK-101: Implement `SessionSetup` Mongoose schema (later refactored to Session). [REQ-201, REQ-301]
- [x] TASK-102: Implement `Submission` Mongoose schema. [REQ-402, REQ-403]
- [x] TASK-103: Implement `SessionGroup` schema. [REQ-301, REQ-302, REQ-304]

## Phase 3: GraphQL API (Baseline — Implemented, Later Refactored)

- [x] TASK-201: Define initial GraphQL `typeDefs.js`. [All data flows]
- [x] TASK-202: Implement initial session setup resolvers (later refactored). [REQ-201, REQ-202]
- [x] TASK-203: Implement survey entry resolvers (later refactored). [REQ-102, REQ-401]
- [x] TASK-204: Implement survey answer resolvers (later refactored). [REQ-402]
- [x] TASK-205: Implement survey completion resolvers. [REQ-403]
- [x] TASK-206: Implement batch sessions creation. [REQ-301]
- [x] TASK-207: Implement session group queries. [REQ-302, REQ-303]
- [x] TASK-208: Implement group management mutations. [REQ-304]
- [x] TASK-209: Implement recent submissions query. [REQ-331]
- [x] TASK-210: Implement clearDatabase mutation. [REQ-332]

## Phase 4: REST Endpoints & Auth (Baseline — Implemented)

- [x] TASK-301: Implement `POST /api/admin/login` against `ADMIN_PASSWORD`. [REQ-101]
- [x] TASK-302: Implement `POST /api/turnstile/verify` and set cookie. [REQ-102]
- [x] TASK-303: Implement `GET /api/turnstile/status`. [REQ-102]
- [x] TASK-304: Implement `Login`, `ProtectedRoute` components. [REQ-101]

## Phase 5: Admin Console UI (Baseline — Implemented)

- [x] TASK-401: Build `AdminView` tabbed layout. [REQ-200, REQ-300]
- [x] TASK-402: Build `SetupPanel` + `NetworkGraph`. [REQ-201, REQ-202, REQ-203]
- [x] TASK-403: Build batch mode configuration UI. [REQ-301]
- [x] TASK-404: Build `GroupsTable`. [REQ-302]
- [x] TASK-405: Build `GroupDetailView`. [REQ-303]
- [x] TASK-406: Build `HistoryTable`. [REQ-316]
- [x] TASK-407: Wire group lifecycle controls. [REQ-304]
- [x] TASK-408: Add dev-only DB clear control. [REQ-332]

## Phase 6: Participant Survey Flow (Baseline — Implemented)

- [x] TASK-501: Implement `surveySession.ts` localStorage persistence. [REQ-404]
- [x] TASK-502: Implement Turnstile widget mount + verification. [REQ-102]
- [x] TASK-503: Build `SurveyWelcome`, `SurveyIntro`, scenario flow, `SurveyOutro`. [REQ-401]
- [x] TASK-504: Build demographics form with completion submission. [REQ-403]
- [x] TASK-505: Implement "Session Full" gate. [REQ-405]
- [x] TASK-506: Implement session restoration with path-mismatch heuristic. [REQ-404]

---

## Phase 12: Scenario-Centric Data Model (Foundation)

**Status**: ✅ **COMPLETED 2026-04-28**

- [x] **TASK-1201**: Create `backend/models/Scenario.js` model ✅
  - Define schema with UUID `_id`, experiment config fields, data collection tracking
  - Add indexes: `{ groupId: 1, status: 1, responseCount: 1 }`, `{ setupId: 1, scenarioIndex: 1 }`
  - [REQ-321]

- [x] **TASK-1202**: Create `backend/models/Session.js` model (replacing SessionSetup) ✅
  - Define schema with `scenarioIds: [String]` reference array
  - Add `metadata` field for Mixed Mode participant tracking
  - Configure virtual populate for `scenarios` field
  - Add indexes: `{ groupId: 1 }`, `{ 'metadata.participantId': 1 }`
  - [REQ-322]

- [x] **TASK-1203**: Update `backend/models/Submission.js` schema ✅
  - Change `results[].scenarioId` from Number to String (UUID reference)
  - Add `participantId` field (String, optional)
  - Add `responseTime` field to results
  - Update indexes: `{ sessionId: 1, participantId: 1 }`
  - [REQ-402]

- [x] **TASK-1204**: Simplify `backend/models/SessionGroup.js` ✅
  - Replace separate fields with unified `config` object
  - Add `totalScenarios` field
  - Add `mode` virtual field for automatic detection
  - [REQ-306]

- [x] **TASK-1205**: Update `constants.ts` and type definitions ✅
  - Add TypeScript types for `Scenario`, updated `Session`, `SessionGroup`
  - Update `types.ts` to reflect new data model
  - [REQ-320]

- [x] **TASK-1206**: Verify `utils/mathBackend.js` compatibility ✅
  - Confirmed `generateDesignMatrix` works with new Scenario model
  - No changes needed
  - [REQ-306]

## Phase 13: GraphQL API - Core Refactor

**Status**: ✅ **COMPLETED 2026-04-28**

- [x] **TASK-1301**: Update `backend/graphql/typeDefs.js` ✅
  - Add `Scenario` type with all fields
  - Rename `SessionSetup` → `Session`, update fields
  - Update `Submission` type (scenarioId as ID)
  - Update `SessionGroup` type (add config, mode)
  - Add new queries: `scenario`, `scenarios`
  - Add new mutations: `createManualSession`, `createBatchSessions` (refactored)
  - [REQ-321, REQ-306]

- [x] **TASK-1302**: Implement Mode 1 (Manual) resolvers ✅
  - `createManualSession`: generate scenarios → create session
  - Returns `{ session, scenariosCreated }`
  - [REQ-201]

- [x] **TASK-1303**: Implement Mode 2 (Batch) resolvers ✅
  - Refactored `createBatchSessions`: create independent Scenario documents
  - Creates scenarios + sessions for all C(12,k) combinations
  - Verified: k=2 generates 66 sessions, 264 scenarios
  - [REQ-301]

- [x] **TASK-1304**: Implement Mode 3 (Mixed) resolvers ✅
  - `createMixedGroup`: generate scenario pool for k=1..maxK
  - `startMixedSession`: balanced scenario selection + session creation
  - Verified: maxK=2 generates 288 scenarios
  - [REQ-306, REQ-307]

- [x] **TASK-1305**: Implement unified survey flow resolvers ✅
  - `startSurvey`: works with sessionId (all modes)
  - `saveSurveyAnswer`: update Submission + atomically increment Scenario.responseCount
  - `completeSurvey`: mark complete + update session submissionCount
  - [REQ-401, REQ-402, REQ-403, REQ-308]

- [x] **TASK-1306**: Implement Scenario query resolvers ✅
  - `scenario(id)`: single scenario lookup
  - `scenarios(groupId, status, limit)`: list with filters
  - [REQ-310]

- [x] **TASK-1307**: Implement Session query resolvers ✅
  - Added new queries: `session`, `allSessions`, `sessionsByGroup`
  - Added populate logic for `session.scenarios` virtual field
  - [REQ-322]

- [x] **TASK-1308**: Add field resolvers ✅
  - `Session.scenarios`: populated in toSessionGraph helper
  - `Scenario.completionRate`: virtual field in model
  - `SessionGroup.mode`: virtual field in model
  - [REQ-321, REQ-322]

## Phase 14: Utils and Helpers

**Status**: ✅ **COMPLETED 2026-04-28**

- [x] **TASK-1401**: Create `utils/scenarioSelection.js` ✅
  - `balancedSelect(scenarios, count)`: priority to low responseCount
  - `randomSelect(scenarios, count)`: pure random
  - Add configurable strategy switching
  - [REQ-307]

- [x] **TASK-1402**: Update `utils/graphqlClient.ts` ✅
  - Updated TypeScript types for new API
  - Added Scenario query functions
  - Added Session query functions
  - Added `createManualSession` for Manual Mode
  - Updated `createBatchSessions` signature
  - Added unified survey flow functions
  - [REQ-320]

- [x] **TASK-1403**: Verify `utils/combinations.ts` compatibility ✅
  - Confirmed compatibility with new Scenario generation
  - No changes needed
  - [REQ-301, REQ-306]

- [x] **TASK-1404**: Add `utils/participantId.ts` ✅
  - Generate stable participant IDs (localStorage-based)
  - Handle Mixed Mode uniqueness checks
  - [REQ-307]

## Phase 14.5: Testing Suite

**Status**: ✅ **COMPLETED 2026-04-28**

- [x] **TASK-1451**: Create backend unit test suite ✅
  - Created `backend/__tests__/new-data-model.test.js` with 15 test cases
  - All tests passing (15/15)
  - Coverage: Scenario model, Session model, Manual mode, Batch mode, Unified survey flow
  - [REQ-321, REQ-322, REQ-201, REQ-301, REQ-323]

- [x] **TASK-1452**: Configure Vitest ✅
  - Updated `vitest.config.ts` with environment matching
  - Backend tests use Node environment
  - Frontend tests use jsdom environment
  - [NFR-1]

- [x] **TASK-1453**: Create testing documentation ✅
  - Created `docs/testing-guide.md` with manual GraphQL test examples
  - Created `backend/__tests__/README.md` with test execution guide
  - [REQ-320]

## Phase 15: Frontend - Admin UI

**Status**: ✅ **COMPLETED 2026-04-29**

- [x] **TASK-1501**: Update `components/SetupPanel.tsx` (Mode 1) ✅
  - Call `createManualSession` instead of legacy API
  - Generate URL with sessionId format
  - [REQ-201]

- [x] **TASK-1502**: Verify `components/BatchModeConfig.tsx` (Mode 2) ✅
  - Confirmed using new `createBatchSessions` API
  - Behavior verified with E2E test (66 sessions, 264 scenarios)
  - All session URLs use sessionId format
  - [REQ-301]

- [x] **TASK-1503**: Create `components/MixedModeConfig.tsx` (Mode 3) ✅
  - Form: maxK, scenariosPerSession, targetSizePerScenario
  - Real-time estimates: totalScenarios, estimatedParticipants
  - Integrated into SetupPanel
  - [REQ-306]

- [x] **TASK-1504**: Update `components/SetupPanel.tsx` for Mixed Mode ✅
  - Add "Mixed Mode" launch option (3-way selector)
  - Add Mixed Mode state management
  - Implement handleMixedLaunch()
  - [REQ-306]

- [ ] **TASK-1505**: Update `components/GroupsTable.tsx`
  - Display mode badge (Manual/Batch/Mixed)
  - Show appropriate progress metrics per mode
  - [REQ-302, REQ-310]

- [ ] **TASK-1506**: Update `components/GroupDetailView.tsx`
  - Detect mode: check `group.config.maxK` vs `group.config.edgeCount`
  - Route to appropriate detail component
  - [REQ-303, REQ-310]

- [⏸] **TASK-1507**: Create `components/MixedGroupDetailView.tsx` (DEFERRED)
  - Display master URL (single URL for all participants)
  - Show progress: `(completedScenarios / totalScenarios) × 100%`
  - List dynamically created sessions
  - [REQ-310]

- [⏸] **TASK-1508**: Create `components/ScenarioHeatmap.tsx` (DEFERRED)
  - D3 visualization: scenarios grouped by edge combination
  - Color coding: undersampled (red), at-target (green)
  - Click to show scenario details
  - [REQ-310]

- [ ] **TASK-1509**: Update `components/HistoryTable.tsx`
  - Show mode badges for all sessions
  - Update queries to use new API
  - [REQ-316]

## Phase 16: Frontend - Survey Flow

**Status**: ✅ **COMPLETED 2026-04-29**

- [x] **TASK-1601**: Update `App.tsx` routing logic ✅
  - Removed setupId support completely
  - Only supports `?sessionId=<id>` (Manual/Batch modes)
  - Added Mixed Mode support: `?groupId=<id>&mode=mixed`
  - Simplified session hydration logic
  - Removed all legacy API calls
  - [REQ-401]

- [x] **TASK-1602**: Update `components/SurveyView.tsx` ✅
  - Updated all setupId → sessionId references
  - Works with populated `session.scenarios`
  - Tested with new API
  - [REQ-323]

- [x] **TASK-1603**: Confirm `utils/surveySession.ts` ✅
  - Already uses sessionId-based storage keys
  - No changes needed
  - [REQ-404]

- [x] **TASK-1604**: Verify Turnstile integration ✅
  - Confirmed compatibility with Mixed Mode flow
  - `startMixedSession` requires Turnstile cookie
  - [REQ-102]

- [ ] **TASK-1605**: Update "Session Full" gate logic
  - Manual/Batch: check `session.submissionCount >= session.sampleSize`
  - Mixed: check all scenarios in group >= targetSize
  - [REQ-405]

- [x] **TASK-1606**: Add participant ID tracking ✅
  - Generate/retrieve `participantId` for Mixed Mode
  - Store in localStorage
  - Pass to `startMixedSession`
  - [REQ-307]

- [x] **TASK-1607**: Verify progress indicators ✅
  - Show `N / session.scenarios.length` for all modes
  - [REQ-401]

- [x] **TASK-1608**: Test session resume logic ✅
  - Verify localStorage restore works with sessionId-based keys
  - Works across all three modes
  - [REQ-404]

## Phase 17: Testing & Documentation

**Status**: 🟡 **PARTIAL** - Testing complete, heatmap deferred

- [x] **TASK-1701**: Unit tests - Scenario model ✅
  - Schema validation, index queries, status transitions
  - [REQ-321]

- [x] **TASK-1702**: Unit tests - Session model ✅
  - Virtual populate, scenario references, metadata handling
  - [REQ-322]

- [x] **TASK-1703**: Unit tests - scenarioSelection helpers ✅
  - Balanced strategy fairness, random strategy coverage
  - [REQ-307]

- [x] **TASK-1704**: Integration tests - Mode 1 (Manual) ✅
  - `createManualSession` → survey flow → completion
  - Verified scenario creation and references
  - [REQ-201, REQ-323]

- [x] **TASK-1705**: Integration tests - Mode 2 (Batch) ✅
  - `createBatchSessions` → multiple sessions
  - Verified 66 sessions, 264 scenarios for k=2
  - [REQ-301, REQ-323]

- [x] **TASK-1706**: Integration tests - Mode 3 (Mixed) ✅
  - `createMixedGroup` → scenario pool creation (288 scenarios for maxK=2)
  - `startMixedSession` × participants → verify balanced selection
  - Multiple completions → verify responseCount increments
  - Group completion detection
  - [REQ-306, REQ-307, REQ-308, REQ-309, REQ-323]

- [x] **TASK-1707**: API tests - Complete flows ✅
  - Created test scripts for Manual, Batch, Mixed modes
  - All E2E API tests passing
  - [REQ-306..REQ-310]

- [x] **TASK-1708**: Test session resume ✅
  - Start survey → refresh page → verify resume
  - Works across all three modes
  - [REQ-404]

- [ ] **TASK-1709**: Performance tests
  - Scenario populate query with 500+ scenarios
  - Balanced selection with 1000+ scenarios
  - Concurrent submissions (scenario responseCount atomicity)
  - [NFR-1]

- [x] **TASK-1710**: Update `README.md` ✅
  - Document three launch modes
  - Update architecture overview
  - [REQ-306..REQ-310]

- [x] **TASK-1711**: Update API documentation ✅
  - Document new queries/mutations
  - [REQ-320]

- [x] **TASK-1712**: Create implementation documentation ✅
  - Step-by-step guides for all modes
  - Explain balanced selection strategy
  - [REQ-306..REQ-310]

---

## Phase 18: Legacy API Removal

**Status**: ✅ **COMPLETED 2026-04-29**

- [x] **TASK-1801**: Remove legacy GraphQL types ✅
  - Removed SessionSetup backward compatibility alias
  - Removed SurveyAnswer, Demographic legacy types
  - [Architecture cleanup]

- [x] **TASK-1802**: Remove legacy GraphQL queries ✅
  - Removed activeSessionSetup, sessionSetup, allSessionSetups
  - [Architecture cleanup]

- [x] **TASK-1803**: Remove legacy GraphQL mutations ✅
  - Removed saveSessionSetup, startSurveyEntry, saveSurveyAnswerLegacy, completeSurveyEntry, submitSurvey
  - [Architecture cleanup]

- [x] **TASK-1804**: Remove legacy frontend code ✅
  - Removed setupId URL parameter support from App.tsx
  - Removed legacy API imports from graphqlClient.ts (~180 lines)
  - Updated all components to use sessionId
  - [Architecture cleanup]

- [x] **TASK-1805**: Update all URLs to sessionId format ✅
  - GroupDetailView, HistoryTable, SurveyWelcome, SurveyView
  - All survey links now use `?sessionId=` format
  - [Architecture cleanup]

- [x] **TASK-1806**: Verify API test coverage ✅
  - Created test scripts for new API
  - All tests passing (15/15 backend + 5/5 API integration)
  - [Architecture cleanup]

---

## Phase 19: Bug Fixes

**Status**: ✅ **COMPLETED 2026-05-04**

- [x] **TASK-1901**: Fix NetworkGraph undefined error ✅
  - Added defensive checks for activeEdges at 5 locations
  - Changed from ternary to OR chain: `scenario?.activeEdgeIds || setup?.activeEdgeIds || []`
  - Prevents TypeError when reading 'includes' on undefined
  - [BUG-001]

- [x] **TASK-1902**: Fix SurveyOutro incomplete submissions bug ✅
  - Updated SurveyOutro to accept `onComplete` and `entryId` props
  - Added `handleFinalSubmit` function that calls `completeSurvey`
  - Updated SurveyView to pass these props
  - All submissions now properly marked as complete
  - [BUG-002]

- [x] **TASK-1903**: Create repair script for historical data ✅
  - Created `scripts/fix-incomplete-submission.mjs`
  - Can check and fix incomplete submissions that have complete results
  - [BUG-002]

- [x] **TASK-1904**: Fix admin history read-only view showing 0 active edges ✅
  - **Problem**: Clicking session ID from history table loads read-only setup with empty activeEdgeIds (k=0)
  - **Root Cause**: Multi-layer missing data flow - schema didn't declare field, resolver didn't populate it, query didn't request it, component tried to derive incorrectly
  - **Solution Applied**: Four-layer complete fix addressing entire data pipeline
  - **Implementation**:
    1. **Schema**: Added `activeEdgeIds: [String!]!` to [`Session` type](../backend/graphql/typeDefs.js:31)
    2. **Resolver**: Modified `toSessionGraph` in [`backend/graphql/resolvers.js:56-67`](../backend/graphql/resolvers.js) to derive virtual field from first scenario
    3. **Query**: Updated [`fetchAllSessions`](../utils/graphqlClient.ts:88) to explicitly request `activeEdgeIds` field
    4. **Component**: Simplified [`AdminView.tsx:47`](../components/AdminView.tsx) to use `session.activeEdgeIds` directly with null coalescing
  - **Result**: Admin can now properly view and verify historical session configurations with correct edge count, edge names, and network graph visualization
  - **Files Modified**: 4 files (1 schema, 1 resolver, 1 query utility, 1 component)
  - [BUG-003]

---

## Phase 20: Documentation Consolidation

**Status**: ✅ **COMPLETED 2026-05-04**

- [x] **TASK-2001**: Update requirements.md ✅
  - Integrated all implementation reports
  - Added change log entries for phases 12-16
  - Added bug fix documentation
  - Marked completed requirements with status
  - [Documentation]

- [x] **TASK-2002**: Update design.md ✅
  - Added implementation status summary
  - Updated architecture diagrams
  - Added bug fixes section
  - Updated traceability matrix
  - [Documentation]

- [x] **TASK-2003**: Update tasks.md ✅
  - Marked all completed tasks
  - Added new phases (18-20)
  - Added status summaries
  - [Documentation]

- [x] **TASK-2004**: Consolidate docs directory ✅
  - Keep 3 core files: requirements.md, design.md, tasks.md
  - Archive detailed implementation reports
  - Clean up redundant planning documents
  - [Documentation]

---

## Phase 24: Mixed Mode Config Fields — Mandatory Enforcement (REQ-312)

**Status**: 📋 **Planned** (2026-05-04)

**Objective**: Enforce that `maxK`, `scenariosPerSession`, and `targetSizePerScenario` are always present and valid when a Mixed Mode `SessionGroup` is created. Changes span four layers: Mongoose schema, GraphQL type definitions, TypeScript types, and test fixtures.

**Prerequisite decision**: Confirm Open Question #7 (whether to use conditional Mongoose validators or rely on GraphQL layer enforcement only). Tasks below assume conditional validators (option b) — adjust TASK-2401 if option a is chosen.

---

### Layer 1 — Mongoose Schema (`backend/models/SessionGroup.js`)

- [ ] **TASK-2401**: Tighten `SessionGroup.config` required constraints — `backend/models/SessionGroup.js` lines 19-21 [REQ-312]
  - Change `maxK`, `scenariosPerSession`, and `targetSizePerScenario` from `required: false` to conditional validators so the constraint fires only on Mixed Mode documents (those where `config.maxK` is truthy):
    ```js
    maxK: {
      type: Number,
      min: 1,
      max: 12,
      required: function() { return this.config && !!this.config.maxK; }
    },
    scenariosPerSession: {
      type: Number,
      required: function() { return this.config && !!this.config.maxK; }
    },
    targetSizePerScenario: {
      type: Number,
      required: function() { return this.config && !!this.config.maxK; }
    }
    ```
  - **Risk**: If the simpler `required: true` approach is chosen instead, Batch Mode and Manual Mode `SessionGroup` documents will fail validation — all existing tests and the `createBatchSessions` / `createManualSession` flows must then be updated to supply dummy values or the batch/manual paths must be restructured.
  - *Verification*: `SessionGroupModel.create({ name: 'Mixed', config: { maxK: 2, focalNode: 'A1', opponentNode: 'A2', sampleSize: 1 } })` MUST fail Mongoose validation with a meaningful error. `SessionGroupModel.create({ name: 'Batch', config: { edgeCount: 2, focalNode: 'A1', opponentNode: 'A2', sampleSize: 20 } })` MUST still succeed.

---

### Layer 2 — GraphQL Type Definitions (`backend/graphql/typeDefs.js`)

- [ ] **TASK-2402**: Make `maxK`, `scenariosPerSession`, `targetSizePerScenario` non-nullable in `GroupConfigInput` — `backend/graphql/typeDefs.js` [REQ-312]
  - Change the `GroupConfigInput` input type from:
    ```graphql
    input GroupConfigInput {
      edgeCount: Int
      maxK: Int
      scenariosPerSession: Int
      targetSizePerScenario: Int
      focalNode: String!
      opponentNode: String!
      sampleSize: Int!
    }
    ```
    to:
    ```graphql
    input GroupConfigInput {
      edgeCount: Int
      maxK: Int!
      scenariosPerSession: Int!
      targetSizePerScenario: Int!
      focalNode: String!
      opponentNode: String!
      sampleSize: Int!
    }
    ```
  - **Impact**: The `createMixedGroup` mutation (the only consumer of `GroupConfigInput`) already requires these fields via resolver guards. Promoting them to `Int!` moves enforcement to the GraphQL schema layer, so clients receive a type error before the resolver runs.
  - **Risk**: `GroupConfigInput` is shared with any future mutations that use the same input type. If a Batch Mode mutation is ever added using this type, it would need to supply dummy values or a separate input type. Consider whether a dedicated `MixedGroupConfigInput` is preferable long-term.
  - *Verification*: Sending `createMixedGroup` without `maxK` MUST return a GraphQL schema validation error (not a resolver error).

- [ ] **TASK-2403**: Make `maxK`, `scenariosPerSession`, `targetSizePerScenario` non-nullable in the `GroupConfig` return type — `backend/graphql/typeDefs.js` [REQ-312]
  - Change:
    ```graphql
    type GroupConfig {
      edgeCount: Int
      maxK: Int
      scenariosPerSession: Int
      targetSizePerScenario: Int
      ...
    }
    ```
    to:
    ```graphql
    type GroupConfig {
      edgeCount: Int
      maxK: Int!
      scenariosPerSession: Int!
      targetSizePerScenario: Int!
      ...
    }
    ```
  - **Risk**: `GroupConfig` is also returned for Batch Mode groups (`toGroupGraph` helper). Batch Mode groups have `maxK: undefined / null`, so marking the return type as `Int!` will cause Apollo to return null-violation errors on every `sessionGroup` and `allSessionGroups` query for Batch Mode groups. Safest resolution: keep the return type fields nullable (`Int`) and only enforce non-nullability on the input side (`GroupConfigInput`). Alternatively, create a discriminated union or separate types per mode.
  - **Recommendation**: Skip this task or scope it only to the input type (TASK-2402). Document the asymmetry: input is strict (`Int!`), output is permissive (`Int`) because the output serves all modes. Revisit when/if Batch Mode is removed or mode-specific return types are introduced.

---

### Layer 3 — Resolver (`backend/graphql/resolvers.js`)

- [ ] **TASK-2404**: Remove dead fallback in `startMixedSession` resolver — `backend/graphql/resolvers.js` line 428 [REQ-312]
  - Current code: `const scenariosPerSession = config.scenariosPerSession || 20;`
  - With `scenariosPerSession` now required and validated before document creation, `config.scenariosPerSession` will always be a positive integer at this point. The `|| 20` fallback is dead code and masks the absence of the field (which should now be impossible).
  - Change to: `const scenariosPerSession = config.scenariosPerSession;`
  - Add a defensive throw if somehow it is still falsy (belt-and-suspenders for bad pre-existing DB data):
    ```js
    const scenariosPerSession = config.scenariosPerSession;
    if (!scenariosPerSession) {
      throw new Error('SessionGroup is missing required config.scenariosPerSession');
    }
    ```
  - *Verification*: `startMixedSession` with a group that has `scenariosPerSession=5` MUST use exactly 5, not 20.

---

### Layer 4 — TypeScript Types (`types.ts`)

- [ ] **TASK-2405**: Remove nullability from Mixed Mode config fields in the `SessionGroup` interface — `types.ts` lines 93-95 [REQ-312]
  - Change:
    ```typescript
    config: {
      maxK?: number | null;           // Mixed mode
      scenariosPerSession?: number | null;  // Mixed mode
      targetSizePerScenario?: number | null;  // Mixed mode
      focalNode: string;
      opponentNode: string;
      sampleSize: number;
    };
    ```
    to:
    ```typescript
    config: {
      edgeCount?: number | null;      // Batch mode only
      maxK: number;                   // Mixed mode — required, non-nullable
      scenariosPerSession: number;    // Mixed mode — required, non-nullable
      targetSizePerScenario: number;  // Mixed mode — required, non-nullable
      focalNode: string;
      opponentNode: string;
      sampleSize: number;
    };
    ```
  - **Risk**: Frontend components that access `group.config.maxK`, `group.config.scenariosPerSession`, or `group.config.targetSizePerScenario` currently guard with `|| 0` or `|| 1` patterns (visible in `GroupDetailView.tsx` line 198). After this change, those guards become unnecessary (but are not harmful — TypeScript will report them as redundant). More importantly, any code that checks `if (group.config.maxK)` to detect Mixed Mode will still work because the value is 0 for non-mixed groups only if they somehow set it — but it should be `undefined`/absent for Batch Mode groups. Review all call sites before removing guards.
  - *Call sites to inspect*:
    - `components/GroupDetailView.tsx` lines 148, 162, 174, 197, 198
    - `components/MixedModeConfig.tsx` (reads from state, not DB type — not affected)
    - `components/SetupPanel.tsx` (writes to mutation, not reads from DB type — not affected)
    - `utils/graphqlClient.ts` lines 337-339, 368-370 (fragment field selections — not typed directly, OK)

---

### Layer 5 — Test Fixtures (`backend/__tests__/new-data-model.test.js`)

- [ ] **TASK-2406**: Add Mixed Mode SessionGroup creation test that validates all three fields are required — `backend/__tests__/new-data-model.test.js` [REQ-312]
  - Add a new `describe('SessionGroup Mixed Mode required config fields')` block with tests:
    1. Creating a SessionGroup with all three fields present MUST succeed
    2. Creating a Mixed Mode SessionGroup without `scenariosPerSession` MUST fail Mongoose validation (expects `ValidationError`)
    3. Creating a Mixed Mode SessionGroup without `targetSizePerScenario` MUST fail Mongoose validation
    4. Creating a Mixed Mode SessionGroup without `maxK` — this is the degenerate case where none of the conditional validators would fire; discuss whether this case needs a separate guard
  - *Note*: If TASK-2401 uses simple `required: true` instead of conditional validators, also add a test confirming Batch Mode group creation still works (to prevent regression).

- [ ] **TASK-2407**: Verify existing Batch Mode test fixtures still pass after TASK-2401 — `backend/__tests__/new-data-model.test.js` [REQ-312]
  - Examine the two `SessionGroupModel.create(...)` calls in the `Batch Mode (createBatchSessions)` describe block (lines 264-275 and 357-366). Both create groups without `maxK`, `scenariosPerSession`, or `targetSizePerScenario`.
  - If conditional validators are used (TASK-2401 option b), these tests MUST continue to pass without modification.
  - If unconditional `required: true` is used (option a), these test fixtures MUST be updated to include the three fields (e.g., provide `maxK: null` explicitly, or restructure fixtures to reflect mode separation).
  - Run the full test suite (`npx vitest run backend/__tests__/new-data-model.test.js`) and confirm all 15+ tests pass before marking this task complete.

---

**Acceptance Criteria for Phase 24**:
- Sending `createMixedGroup` without `maxK` returns a GraphQL schema error (not a resolver error) — enforced by `Int!` in `GroupConfigInput`
- Attempting `SessionGroupModel.create({ name: 'x', config: { maxK: 2, focalNode: 'A1', opponentNode: 'A2', sampleSize: 1 } })` without `scenariosPerSession` throws `ValidationError` — enforced by Mongoose conditional validator
- `startMixedSession` no longer uses the `|| 20` fallback — fails explicitly if `scenariosPerSession` is absent
- Frontend TypeScript `SessionGroup.config.maxK` is typed as `number` (not `number | null`) — compile-time enforcement
- All existing backend tests continue to pass (no regression on Batch/Manual Mode group creation)

---

## Phase 26: URL-Level Mode Differentiation for Admin Setup (REQ-204, REQ-205, REQ-206)

**Status**: 📋 **Planned** (2026-05-05)

**Objective**: Sync the `LaunchMode` toggle in `SetupPanel.tsx` with a `?mode=` URL query parameter so that each mode (`manual` / `mixed`) is bookmarkable, shareable, and deep-linkable without a full page reload.

**Scope**: Frontend only — no backend changes, no data model changes.

**Key design constraint**: All URL writes MUST use `{ replace: true }` (history replace, not push) so mode toggling does not pollute the browser history stack.

---

- [ ] **TASK-2601**: Read `?mode=` from search params in `SetupPanel.tsx` — replace any `useState` holding `launchMode` with a value derived from `useSearchParams()` [REQ-204, REQ-205]
  - Import `useSearchParams` from `react-router-dom`.
  - Derive `launchMode: LaunchMode` by reading `searchParams.get('mode')` and validating it against `'manual' | 'mixed'`.
  - Any value that is `null`, empty, or not one of the two valid strings MUST resolve to `'manual'`.
  - Remove any existing `useState<LaunchMode>` that held this value, since URL params become the single source of truth.
  - *Acceptance:* `SetupPanel` re-renders with the correct mode when the URL `?mode=` param changes (e.g., via browser history navigation).

- [ ] **TASK-2602**: Correct absent or invalid `?mode=` param on mount — add a `useEffect` that replaces the URL when the param is stale [REQ-205]
  - On first render, compare `rawMode` (the raw string from the URL) to the validated `launchMode`.
  - If they differ (param was absent or invalid), call `setSearchParams({ mode: launchMode }, { replace: true })` once.
  - This ensures `/admin/setup` (no param) immediately corrects to `/admin/setup?mode=manual` without a visible flash and without adding a history entry.
  - *Acceptance:* Navigating to `/admin/setup` (bare) in the browser address bar results in the URL changing to `/admin/setup?mode=manual` within the same render cycle, with no observable mode mismatch displayed to the user.

- [ ] **TASK-2603**: Sync mode toggle click to URL via `setSearchParams` — wire the two-button toggle so clicking a button calls `setSearchParams({ mode: newMode }, { replace: true })` [REQ-204]
  - Remove any `setState` call that previously updated a local `launchMode` state variable.
  - The mode is now exclusively set by writing to the URL; the component re-derives it from `useSearchParams` on each render.
  - *Acceptance:* Clicking "Manual" updates the address bar to `?mode=manual`. Clicking "Mixed" updates it to `?mode=mixed`. The browser back button does not cycle between the two modes.

- [ ] **TASK-2604**: Verify deep links open `SetupPanel` in the correct mode — manual end-to-end check [REQ-204, REQ-205]
  - Open `/admin/setup?mode=mixed` directly in a fresh browser tab (not via in-app navigation). Confirm that Mixed Mode UI is rendered immediately, with no flash of Manual Mode first.
  - Open `/admin/setup?mode=manual` directly. Confirm Manual Mode UI renders.
  - Open `/admin/setup` (no param). Confirm Manual Mode renders and URL corrects to `?mode=manual`.
  - Open `/admin/setup?mode=bogus`. Confirm Manual Mode renders and URL corrects to `?mode=manual`.
  - Confirm that bookmarking `/admin/setup?mode=mixed` and reopening it later lands in Mixed Mode.
  - *Acceptance:* All four cases above behave as specified, verified manually across Chrome and at least one other browser.

- [ ] **TASK-2605**: Audit and update internal links to `/admin/setup` to include a `?mode=` param [REQ-206]
  - Search the codebase for any strings or template literals that produce a bare `/admin/setup` URL (without `?mode=`): check `App.tsx`, `AdminView.tsx`, `HistoryTable.tsx`, `GroupDetailView.tsx`, and any other component that renders a link or calls `navigate('/admin/setup')`.
  - Update each occurrence to append `?mode=manual` (or `?mode=mixed` where the target mode is known from context).
  - In particular: if any "view in setup" or "edit configuration" link targets `/admin/setup`, it MUST include the mode param.
  - *Acceptance:* A global search for `"/admin/setup"` (bare, without `?mode`) in `.tsx` / `.ts` source files returns zero results.

---

**Acceptance Criteria for Phase 26**:
- `/admin/setup?mode=mixed` opens directly in Mixed Mode (no flash, no redirect loop). [REQ-204]
- `/admin/setup?mode=manual` opens directly in Manual Mode. [REQ-204]
- `/admin/setup` (no param) defaults to Manual Mode and corrects the URL to `?mode=manual`. [REQ-205]
- `/admin/setup?mode=bogus` defaults to Manual Mode and corrects the URL to `?mode=manual`. [REQ-205]
- Clicking the toggle writes to the URL (`replace` not `push`); browser back button is unaffected. [REQ-204]
- No internal link in the admin console navigates to bare `/admin/setup` without `?mode=`. [REQ-206]
- No new backend changes required. All changes are confined to `SetupPanel.tsx` and any files that link to `/admin/setup`.

---

## Phase 27: Submission Progress Tracking (REQ-340..342)

**Status**: 📋 **Planned** (2026-05-06)

**Objective**: Enhance the admin history table to display detailed progress information for each submission, enabling admins to quickly identify participants at different stages and understand completion patterns.

**Scope**: Frontend only — no backend or data model changes needed.

**Priority**: 🟡 Medium (improves admin UX, non-blocking)

**Estimated Effort**: 0.5-1 day

---

### Tasks

- [ ] **TASK-2701**: Add progress calculation helper function
  - **Location**: [`components/HistoryTable.tsx`](../components/HistoryTable.tsx) — add before component definition
  - **Function signature**:
    ```typescript
    interface StageInfo {
      stage: 'completed' | 'demographics' | 'answering';
      label: string;
      color: 'green' | 'amber' | 'red';
      progress?: number;  // 0-1
    }
    
    function getSubmissionStage(
      submission: Submission,
      totalScenarios: number
    ): StageInfo
    ```
  - **Logic**: Implement stage detection as per design.md specification
  - **Acceptance**: Function correctly identifies all three stages and calculates progress percentage
  - [REQ-341]

- [ ] **TASK-2702**: Add "Progress" column header to submission table
  - **Location**: [`components/HistoryTable.tsx`](../components/HistoryTable.tsx) lines ~177-184 (thead)
  - **Change**: Insert `<th className="px-3 py-2 font-medium text-gray-600">Progress</th>` between "Status" and "Start Time" columns
  - **Acceptance**: Column header displays with proper styling matching existing columns
  - [REQ-341]

- [ ] **TASK-2703**: Add progress cell to submission table body
  - **Location**: [`components/HistoryTable.tsx`](../components/HistoryTable.tsx) lines ~188-209 (tbody)
  - **Implementation**:
    ```typescript
    {submissions
      .filter((sub) => sub.sessionId === s._id)
      .map((sub) => {
        const totalScenarios = s.scenarios?.length || s.scenarioIds?.length || 0;
        const answeredCount = sub.results?.length || 0;
        const stageInfo = getSubmissionStage(sub, totalScenarios);
        
        return (
          <tr key={sub._id}>
            {/* ... existing ID and Status cells ... */}
            
            {/* NEW: Progress Cell */}
            <td className="px-3 py-2">
              <div className="flex flex-col gap-1">
                {/* Stage label */}
                <span className="text-xs font-medium text-gray-700">
                  {stageInfo.label}
                </span>
                
                {/* Progress bar (only for incomplete) */}
                {!sub.isCompleted && stageInfo.progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {answeredCount}/{totalScenarios}
                    </span>
                    <div className="flex-1 min-w-[80px] bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          stageInfo.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(stageInfo.progress * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {(stageInfo.progress * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </td>
            
            {/* ... existing Start Time and End Time cells ... */}
          </tr>
        );
      })}
    ```
  - **Acceptance**: Progress column displays stage label and progress bar for all submissions
  - [REQ-341, REQ-342]

- [ ] **TASK-2704**: Implement color coding for progress bars
  - **Location**: Within TASK-2703 implementation
  - **Color rules**:
    - Green: `isCompleted === true` (show checkmark only, no bar)
    - Amber: `progress >= 0.5` and `!isCompleted`
    - Red: `progress < 0.5` and `!isCompleted`
  - **Acceptance**: Progress bars display correct colors based on completion percentage
  - [REQ-342]

- [ ] **TASK-2705**: Handle edge cases
  - **Location**: Within `getSubmissionStage` function
  - **Edge cases to handle**:
    1. `totalScenarios === 0` → display "N/A" or "0/0"
    2. `answeredCount > totalScenarios` (data inconsistency) → cap at 100%
    3. `demographics !== null` but `answeredCount < totalScenarios` → show "填寫人口統計" with actual progress
    4. Missing `scenarios` and `scenarioIds` fields → fallback to "Unknown"
  - **Acceptance**: No crashes on edge cases, graceful degradation
  - [REQ-341]

- [ ] **TASK-2706**: Visual regression testing
  - **Test scenarios**:
    1. Session with all completed submissions
    2. Session with mixed completion states (0%, 30%, 70%, 100% complete)
    3. Session with submissions in demographics stage
    4. Edge case: Session with zero submissions (expanded row should still work)
  - **Browsers**: Chrome, Firefox
  - **Acceptance**: UI renders correctly in all scenarios and browsers
  - [REQ-341, REQ-342]

- [ ] **TASK-2707**: Responsive layout testing
  - **Verify**:
    - Progress column doesn't cause horizontal scroll on small screens
    - Progress bars scale appropriately with viewport width
    - Text truncation works correctly if needed
  - **Screen sizes**: Desktop (1920x1080), Tablet (768x1kB), Mobile (375x667 may need scroll)
  - **Acceptance**: Layout remains usable on all target screen sizes
  - [REQ-341]

- [ ] **TASK-2708**: Performance verification
  - **Test**: Load session with 50+ submissions
  - **Measure**:
    - Time to expand row and display submission table
    - Re-render performance when toggling expand/collapse
  - **Acceptance**: No noticeable lag (<100ms for expand)
  - [NFR-1]

- [ ] **TASK-2709**: Update TypeScript types if needed
  - **Check**: `Submission` interface in [`types.ts`](../types.ts)
  - **Verify**: `results[]`, `demographics`, `isCompleted` are all typed correctly
  - **Action**: If types are missing or incorrect, update them
  - **Acceptance**: No TypeScript errors in HistoryTable.tsx
  - [Architecture]

- [ ] **TASK-2710**: Documentation update
  - **Files**:
    - Inline code comments explaining stage detection logic
    - Optional: Update [`docs/testing-guide.md`](../docs/testing-guide.md) with manual testing steps
  - **Acceptance**: Code is well-commented for future maintainers
  - [Documentation]

---

### Acceptance Criteria for Phase 27

✅ **Progress Display**: All submissions in expanded history rows show:
  - Stage label: "已完成 ✓" / "填寫人口統計" / "答題中 (N/M)"
  - Progress fraction (N/M) for incomplete submissions
  - Progress bar with correct color coding

✅ **Color Coding**:
  - Completed: Green checkmark, no bar
  - High progress (≥50%): Amber bar
  - Low progress (<50%): Red bar

✅ **Responsive**: Layout works on desktop, tablet, mobile

✅ **Performance**: No lag when expanding rows with many submissions

✅ **Edge Cases**: Handles missing data gracefully, no crashes

---

### Testing Checklist

```bash
# 1. Setup: Create test sessions
# In Admin panel, create sessions with varying scenarios count (5, 10, 15)

# 2. Create test submissions with different progress levels
# Use scripts or manual survey completion:
npm run test-manual-mode-e2e  # Creates various submission states

# 3. Verify in Admin History View
# Navigate to: /admin/view/manual

# Visual verification checklist:
☐ Completed submission shows "已完成 ✓" (no progress bar)
☐ Partial submission (3/10) shows amber bar at 30%
☐ Low progress submission (2/10) shows red bar at 20%
☐ Demographics stage (10/10 answered, not completed) shows "填寫人口統計"
☐ Progress bars are aligned and sized correctly
☐ Percentages are accurate (30%, 70%, 100%)
☐ Column headers are properly aligned

# Edge case verification:
☐ Session with 0 submissions doesn't crash when expanded
☐ Session with 1 scenario shows correct N/1 format
☐ Session with missing scenarios field shows fallback

# Browser compatibility:
☐ Chrome: Works correctly
☐ Firefox: Works correctly
☐ Safari (if available): Works correctly

# Responsive check:
☐ Desktop: All columns visible, progress bars readable
☐ Tablet: Layout adapts, minor horizontal scroll acceptable
☐ Mobile: May need horizontal scroll, but no layout break
```

---

### Implementation Summary

| Aspect | Details |
|--------|---------|
| **Files changed** | 1 file ([`components/HistoryTable.tsx`](../components/HistoryTable.tsx)) |
| **New functions** | 1 helper function (`getSubmissionStage`) |
| **Lines added** | ~60 lines (helper + progress column) |
| **Breaking changes** | None |
| **Data model changes** | None |
| **API changes** | None |
| **Dependencies** | None (uses existing data) |

---

### Rollback Plan

If issues arise:
1. Revert changes to `HistoryTable.tsx` (single file)
2. No database changes to rollback
3. No API changes to rollback
4. Zero downtime — deploy during low-traffic window

---

### Future Enhancements (Out of Scope for Phase 27)

- [ ] Sortable progress column (REQ-343) — deferred
- [ ] Filter by completion stage ("show only incomplete")
- [ ] Export progress data to CSV
- [ ] Real-time progress updates (WebSocket)
- [ ] Progress analytics dashboard (average completion rate, drop-off analysis)

---

## Phase 30: Submission Invalidation (REQ-350..354)

**Status**: 📋 **Planned** (2026-05-06)

**Objective**: Allow admins to mark individual submissions as invalid (`isInvalid: true`), freeing participant slots and correcting `Scenario.responseCount` for Mixed Mode accuracy. Provide a UI filter so admins can show/hide invalid submissions in the history view.

**Scope**: Backend data model + GraphQL API + frontend admin UI.

**Priority**: 🔴 High — data integrity and participant slot management.

**Estimated Effort**: 1.5–2 days.

---

### P30-Layer 1 — Data Model (`backend/models/Submission.js`)

- [ ] **TASK-3001**: Add `isInvalid` field to `Submission` schema — `backend/models/Submission.js` [REQ-351]
  - Add `isInvalid: { type: Boolean, default: false }` to the Mongoose schema.
  - Add a compound index `{ sessionId: 1, isInvalid: 1 }` for efficient valid-only queries.
  - `default: false` ensures backward compatibility — all existing submissions are treated as valid without a migration.
  - *Verification*: `new SubmissionModel({ sessionId: 'x', ... }).isInvalid` is `false` without explicitly setting it.

---

### P30-Layer 2 — GraphQL Type Definitions (`backend/graphql/typeDefs.js`)

- [ ] **TASK-3002**: Add `isInvalid` field to `Submission` GraphQL type — `backend/graphql/typeDefs.js` [REQ-351]
  - Add `isInvalid: Boolean` to the `Submission` type (nullable; `null` and `false` are both treated as valid).
  - *Verification*: Existing queries that return `Submission` now include the `isInvalid` field.

- [ ] **TASK-3003**: Add `invalidateSubmission` mutation to GraphQL schema — `backend/graphql/typeDefs.js` [REQ-351]

  Add to `type Mutation`:

  ```graphql
  invalidateSubmission(submissionId: ID!, isInvalid: Boolean!): Submission
  ```

  *Verification*: Schema compiles without error; GraphQL playground exposes the mutation.

---

### P30-Layer 3 — Resolver (`backend/graphql/resolvers.js`)

- [ ] **TASK-3004**: Implement `invalidateSubmission` resolver — `backend/graphql/resolvers.js` [REQ-351, REQ-352, REQ-354]
  - Check admin authentication (`context.isAdmin`); throw if unauthenticated.
  - Load `Submission` by `submissionId`; throw `Submission not found` if missing.
  - **Idempotency guard**: if `submission.isInvalid === isInvalid`, return early (no side-effects).
  - Update `submission.isInvalid = isInvalid` and save.
  - **`submissionCount` adjustment** (REQ-352): if `submission.isCompleted`, apply `$inc: { submissionCount: isInvalid ? -1 : 1 }` to the parent `Session`.
  - **`responseCount` adjustment** (REQ-354): for each entry in `submission.results`, apply a MongoDB aggregation pipeline update to atomically adjust `Scenario.responseCount` with a floor of 0. Example:

    ```js
    await Scenario.findByIdAndUpdate(result.scenarioId, [
      { $set: { responseCount: { $max: [0, { $add: ['$responseCount', delta] }] } } }
    ]);
    ```

    where `delta = isInvalid ? -1 : 1`.
  - **Group status reversion** (REQ-354, re-validation path): if `!isInvalid` and the parent session belongs to a Mixed Mode group with `status === 'completed'`, re-check whether any scenario is now below `targetSize` and reset group to `'active'` if so.
  - Return the updated `Submission` document.
  - *Verification*: See acceptance criteria for Phase 30.

---

### P30-Layer 4 — Frontend GraphQL Client (`utils/graphqlClient.ts`)

- [ ] **TASK-3005**: Add `isInvalid` field to all `Submission` GraphQL query fragments — `utils/graphqlClient.ts` [REQ-351]
  - Identify every query/fragment that fetches `Submission` fields (e.g., `recentSubmissions`, submission list in session detail).
  - Add `isInvalid` to each selection set so the frontend receives the flag.
  - *Verification*: `console.log(submission.isInvalid)` in the admin UI shows `false` for existing submissions.

- [ ] **TASK-3006**: Add `invalidateSubmission` mutation function — `utils/graphqlClient.ts` [REQ-351]

  Add a new exported async function with this signature:

  ```typescript
  export async function invalidateSubmission(
    submissionId: string,
    isInvalid: boolean
  ): Promise<Submission>
  ```

  Using the following GraphQL mutation string:

  ```graphql
  mutation InvalidateSubmission($submissionId: ID!, $isInvalid: Boolean!) {
    invalidateSubmission(submissionId: $submissionId, isInvalid: $isInvalid) {
      _id
      isInvalid
      isCompleted
    }
  }
  ```

  *Verification*: Function can be called from a component and returns the updated `Submission`.

---

### P30-Layer 5 — TypeScript Types (`types.ts`)

- [ ] **TASK-3007**: Add `isInvalid` to `Submission` TypeScript interface — `types.ts` [REQ-351]
  - Add `isInvalid?: boolean` to the `Submission` interface (optional for backward compatibility with existing code that may not yet pass this field).
  - *Verification*: No TypeScript errors in components that read `submission.isInvalid`.

---

### P30-Layer 6 — Admin UI (`components/HistoryTable.tsx`)

- [ ] **TASK-3008**: Add per-session "show invalid" filter state — `components/HistoryTable.tsx` [REQ-353]
  - Add `showInvalidMap` state: `Record<string, boolean>` keyed by session `_id`, default all `false`.
  - Add `toggleShowInvalid(sessionId: string)` handler that flips the boolean for that key.
  - *Verification*: Filter state is per-session and does not affect other sessions' display.

- [ ] **TASK-3009**: Add filter toggle UI control above submission table — `components/HistoryTable.tsx` [REQ-353]
  - Render above each expanded submission table:
    - A count line: "N 筆提交 (M 無效)" where M is derived from local filter (no extra query needed).
    - A checkbox labeled "顯示無效的提交" / "Show invalid submissions".
    - If `invalidCount === 0`, hide the checkbox entirely (no clutter when there are no invalid entries).
  - *Verification*: Checkbox renders only when at least one invalid submission exists in the session.

- [ ] **TASK-3010**: Filter submission list by `isInvalid` flag — `components/HistoryTable.tsx` [REQ-353]
  - Apply `filter(sub => showInvalidMap[sessionId] ? true : !sub.isInvalid)` before rendering rows.
  - *Verification*: Invalid submissions are hidden by default; checking the box reveals them.

- [ ] **TASK-3011**: Apply visual treatment to invalid submission rows — `components/HistoryTable.tsx` [REQ-353]
  - Add `className={sub.isInvalid ? 'opacity-50 bg-red-50' : ''}` to `<tr>`.
  - Replace the "Status" badge with a distinct "無效" badge (red) for invalid rows.
  - *Verification*: Invalid rows are visually distinguishable from valid rows when filter is on.

- [ ] **TASK-3012**: Add "標記無效" / "恢復" action button to each submission row — `components/HistoryTable.tsx` [REQ-351, REQ-353]
  - Add an action column to the submission table with a button per row:
    - If `sub.isInvalid === false` (valid): red-tinted "標記無效" button.
    - If `sub.isInvalid === true` (invalid): gray "恢復" button.
  - On click, call `invalidateSubmission(sub._id, !sub.isInvalid)` from `graphqlClient.ts`.
  - On success, refetch (or optimistically update) the submission list.
  - Disable the button while the mutation is in flight to prevent double-clicks.
  - *Verification*: Clicking "標記無效" marks the submission and decrements visible `submissionCount`; clicking "恢復" restores it.

- [ ] **TASK-3013**: Reflect updated `submissionCount` in session row after invalidation — `components/HistoryTable.tsx` [REQ-352]
  - After a successful `invalidateSubmission` call, refetch the sessions list (or update local state optimistically) so the submission count shown in the parent session row reflects the new valid-only count.
  - *Verification*: Invalidating a completed submission decrements the count visible in the session row by 1; restoring increments it.

---

### P30-Layer 7 — Testing

- [ ] **TASK-3014**: Add backend unit tests for `invalidateSubmission` resolver — `backend/__tests__/` [REQ-351, REQ-352, REQ-354]
  - Test cases:
    1. Invalidate a completed submission → `isInvalid: true`, `submissionCount` decremented, `Scenario.responseCount` decremented.
    2. Invalidate an incomplete submission → `isInvalid: true`, `submissionCount` unchanged (was never incremented), `Scenario.responseCount` decremented.
    3. Re-validate a submission → `isInvalid: false`, reverse side-effects applied.
    4. Idempotency: invalidate an already-invalid submission → no change, no double-decrement.
    5. Idempotency: validate an already-valid submission → no change, no double-increment.
    6. `responseCount` floor: if `responseCount` is already 0, invalidating does not produce negative value.
    7. Group status reversion: invalidate then re-validate a submission in a Mixed Mode group that reached `completed` status — group reverts to `active` after re-validation.
  - *Verification*: All test cases pass.

- [ ] **TASK-3015**: Manual E2E test — admin invalidation flow [REQ-351, REQ-352, REQ-353, REQ-354]
  - Create a session, complete a submission.
  - From admin history view, click "標記無效".
  - Verify: session `submissionCount` decreases by 1.
  - Open survey URL: verify session slot is available again (was previously full).
  - Verify: scenario `responseCount` decremented for all answered scenarios.
  - Click "恢復" to re-validate.
  - Verify: all counts restored.
  - *Browsers*: Chrome, Firefox.

---

### Acceptance Criteria for Phase 30

- [ ] `Submission` schema has `isInvalid: Boolean` field with `default: false`.
- [ ] `invalidateSubmission(submissionId, isInvalid)` mutation is available and admin-gated.
- [ ] Calling the mutation with `isInvalid: true` on a **completed** submission decrements `Session.submissionCount` by 1.
- [ ] Calling the mutation with `isInvalid: true` on an **incomplete** submission does NOT decrement `submissionCount`.
- [ ] Calling the mutation with `isInvalid: true` decrements each answered `Scenario.responseCount` by 1, with floor 0.
- [ ] Mutation is idempotent: calling it twice with the same value produces the same result as calling it once.
- [ ] Calling the mutation with `isInvalid: false` reverses all side-effects; if the Mixed Mode group was `completed` and scenario counts drop below `targetSize`, group status reverts to `active`.
- [ ] Admin history UI hides invalid submissions by default.
- [ ] A per-session "顯示無效的提交" checkbox reveals hidden invalid rows.
- [ ] Invalid rows display a red "無效" badge, reduced opacity, and a "恢復" button.
- [ ] Valid rows display a "標記無效" button.
- [ ] Session submission count in the history list updates after invalidation.
- [ ] All existing backend tests continue to pass (no regression).

---

## Phase 31: Complete Submission Data CSV Export (REQ-360..363)

**Status**: 📋 Planned | **Priority**: High | **Requirements**: REQ-361, REQ-362, REQ-363

### Overview
Replace the current session-level CSV export with a comprehensive submission data export that includes all participant responses, complete scenario configurations, demographics, and validity flags in a row-per-answer format optimized for statistical analysis.

### Backend Tasks

- [ ] **TASK-3101**: Check if `scenarios(ids: [ID!]!): [Scenario]` query exists in GraphQL schema
  - Location: [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js)
  - If missing, add query definition: `scenarios(ids: [ID!]!): [Scenario]`
  - Add corresponding resolver in [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js)
  - Resolver should: `Scenario.find({ _id: { $in: ids } })`
  - *Acceptance*: Query returns array of scenarios matching provided IDs
  - [REQ-363]

### Frontend Tasks — GroupDetailView.tsx

- [ ] **TASK-3102**: Add GraphQL query for fetching scenarios by IDs
  - Location: [`utils/graphqlClient.ts`](../utils/graphqlClient.ts) or inline in component
  - Query definition:
    ```graphql
    query GetScenariosForExport($ids: [ID!]!) {
      scenarios(ids: $ids) {
        _id
        scenarioIndex
        focalNode
        opponentNode
        activeEdgeIds
        edgeStates
      }
    }
    ```
  - Export as `fetchScenariosByIds(ids: string[]): Promise<Scenario[]>`
  - [REQ-363]

- [ ] **TASK-3103**: Implement CSV data preparation logic in `handleExportCSV`
  - Location: [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:187-215)
  - Replace existing implementation with new row-per-answer format
  - Steps:
    1. Extract all unique `scenarioId` values from `submissions[].results[]`
    2. Call `fetchScenariosByIds(uniqueScenarioIds)`
    3. Build `scenariosMap = new Map(scenarios.map(s => [s._id, s]))`
    4. For each submission, for each result, generate one CSV row
    5. Handle edge cases: empty submissions, deleted scenarios
  - *Acceptance*: Generates array of row objects with 22 columns matching spec
  - [REQ-362]

- [ ] **TASK-3104**: Implement CSV formatting and escaping
  - Location: Same function as TASK-3103
  - Escape rules:
    - Wrap fields containing commas, quotes, or newlines in double quotes
    - Escape internal quotes by doubling: `"` → `""`
    - Convert booleans to strings: `true` → `"true"`
  - Column headers: English names (exactly as specified in REQ-362)
  - UTF-8 BOM: Prepend `\uFEFF` for Excel compatibility
  - *Acceptance*: CSV opens correctly in Excel with Chinese characters rendering
  - [REQ-362]

- [ ] **TASK-3105**: Implement edge name formatting
  - Location: Same function as TASK-3103
  - Edge IDs are already in format `"{source}→{target}"` (e.g., "KMT1→DPP3")
  - Join multiple edges with semicolon: `activeEdgeIds.join('; ')`
  - No additional transformation needed (already human-readable)
  - *Acceptance*: "Active Edges" column displays like "KMT1→DPP3; KMT2→DPP4"
  - [REQ-363]

- [ ] **TASK-3106**: Implement filename generation with timestamp
  - Location: Same function as TASK-3103
  - Format: `{group_name}_submissions_{YYYYMMDD}_{HHmmss}.csv`
  - Sanitize group name: replace non-alphanumeric (except `-_`) with `_`
  - Use `new Date()` for timestamp in local timezone
  - Example: `政治網絡實驗_2026_05_submissions_20260506_133045.csv`
  - *Acceptance*: Filename is valid across Windows/Mac/Linux filesystems
  - [REQ-361]

- [ ] **TASK-3107**: Implement Blob creation and download trigger
  - Location: Same function as TASK-3103
  - Create Blob with UTF-8 BOM: `new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })`
  - Trigger download: `URL.createObjectURL`, create link element, set `download` attribute, click, cleanup
  - *Acceptance*: File downloads automatically when button clicked
  - [REQ-361]

- [ ] **TASK-3108**: Handle empty submissions edge case
  - Location: Same function as TASK-3103
  - If `submission.results.length === 0`, generate 1 row with:
    - Submission metadata fields filled (ID, participantId, timestamps, demographics)
    - Scenario detail fields empty (Scenario ID, Index, Focal Node, etc.)
  - *Acceptance*: Empty submissions appear in export with identifiable metadata
  - [REQ-362, REQ-363]

- [ ] **TASK-3109**: Handle deleted scenario edge case
  - Location: Same function as TASK-3103
  - If `scenariosMap.get(result.scenarioId)` returns undefined:
    - Generate row with `Scenario ID` = `result.scenarioId`
    - Set detail fields to "DELETED": Focal Node, Opponent Node
    - Log warning to console: `Scenario ${result.scenarioId} referenced but not found`
  - *Acceptance*: Deleted scenarios marked clearly, don't crash export
  - [REQ-363]

- [ ] **TASK-3110**: Update button disabled state
  - Location: [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:396)
  - Change from: `disabled={sessions.length === 0}`
  - Change to: `disabled={sessions.length === 0 || submissions.length === 0}`
  - Rationale: No point exporting if there's no submission data
  - *Acceptance*: Button grayed out when no submissions exist
  - [REQ-361]

- [ ] **TASK-3111**: Update toast notification
  - Location: Same function, after download triggered
  - Change from: `toast.success('CSV exported')`
  - Change to: `toast.success(\`CSV 已匯出: ${filename}\`)`
  - Show actual filename for user confirmation
  - *Acceptance*: Toast displays correct filename after export
  - [REQ-361]

### Testing Tasks

- [ ] **TASK-3112**: Test CSV export from Manual Mode session
  - Create test session with 3 submissions, 5 scenarios each
  - Export CSV
  - Verify:
    - Row count = 15 (3 × 5)
    - All 22 columns present
    - Group Name = "Standalone Session"
    - Group ID = empty
  - [REQ-362]

- [ ] **TASK-3113**: Test CSV export from Batch Mode group
  - Create test group with 2 sessions, 2 submissions per session, 3 scenarios each
  - Export CSV
  - Verify:
    - Row count = 12 (2 × 2 × 3)
    - Group Name = actual group name
    - Group ID = actual group ID
    - Multiple Session IDs present
  - [REQ-362]

- [ ] **TASK-3114**: Test CSV export from Mixed Mode group
  - Create test Mixed Mode group, 2 submissions with 20 scenarios each
  - Export CSV
  - Verify:
    - Row count = 40 (2 × 20)
    - Edge Count (k) varies across rows (Mixed Mode samples different k values)
    - Participant ID is populated (fingerprinting)
  - [REQ-362]

- [ ] **TASK-3115**: Test empty submission handling
  - Create submission with `results = []`
  - Export CSV
  - Verify:
    - 1 row generated for that submission
    - Submission ID, participantId, demographics present
    - Scenario fields empty
  - [REQ-363]

- [ ] **TASK-3116**: Test deleted scenario handling
  - Create submission referencing a scenario
  - Delete the scenario from database
  - Export CSV
  - Verify:
    - Row generated with Scenario ID
    - Focal Node, Opponent Node = "DELETED"
    - Console warning logged
  - [REQ-363]

- [ ] **TASK-3117**: Test invalid submission inclusion
  - Mark a submission as invalid (`isInvalid: true`)
  - Export CSV
  - Verify:
    - Invalid submission included in export
    - `Submission Invalid` column = `true` for those rows
  - [REQ-362]

- [ ] **TASK-3118**: Test CSV encoding with Chinese characters
  - Create group with Chinese name: "政治網絡實驗"
  - Export CSV
  - Open in Excel
  - Verify:
    - Chinese characters render correctly (not garbled)
    - BOM present at file start
  - [REQ-361, REQ-362]

- [ ] **TASK-3119**: Test CSV import in R/Python
  - Export real test data
  - Import in R: `read.csv("file.csv", encoding="UTF-8")`
  - Import in Python: `pd.read_csv("file.csv")`
  - Verify:
    - All rows parsed correctly
    - No missing values in required fields
    - Cooperation probabilities in [0, 1] range
    - Timestamps parseable as ISO format
  - [REQ-362]

- [ ] **TASK-3120**: Test edge name formatting
  - Export CSV with various edge counts (k=1, k=5, k=12)
  - Verify "Active Edges" column format:
    - k=1: Single edge "KMT1→DPP3"
    - k=2: "KMT1→DPP3; KMT2→DPP4"
    - Semicolon-space separator consistent
  - [REQ-363]

- [ ] **TASK-3121**: Test filename sanitization
  - Create group with special chars: "實驗/測試 (2026) #1"
  - Export CSV
  - Verify:
    - Filename valid on Windows/Mac/Linux
    - Special chars replaced with underscores
    - Timestamp appended correctly
  - [REQ-361]

### Documentation Tasks

- [ ] **TASK-3122**: Update inline code comments in `handleExportCSV`
  - Add JSDoc explaining:
    - Function purpose
    - Output format (row-per-answer, 22 columns)
    - Edge cases handled
  - [Good practice]

- [ ] **TASK-3123**: Add CSV column reference comment
  - At top of `handleExportCSV`, add comment block listing all 22 column names
  - Helps future maintainers understand output structure
  - [Good practice]

### Acceptance Criteria for Phase 31

- [ ] Export button generates CSV with exactly 22 columns matching REQ-362 specification
- [ ] Each row represents one participant answer to one scenario (long format)
- [ ] Demographics (age, gender, education) correctly repeated for all rows of one submission
- [ ] Invalid submissions (`isInvalid: true`) are included and marked in dedicated column
- [ ] Edge names are human-readable format (e.g., "KMT1→DPP3; KMT2→DPP4")
- [ ] Edge states preserved as JSON string for programmatic parsing
- [ ] CSV opens correctly in Excel with Chinese characters rendering (UTF-8 BOM present)
- [ ] Filename includes group name (sanitized) and timestamp: `{name}_submissions_{date}_{time}.csv`
- [ ] Toast notification displays: "CSV 已匯出: {filename}"
- [ ] Export works correctly for Manual Mode (standalone sessions)
- [ ] Export works correctly for Batch Mode (session groups)
- [ ] Export works correctly for Mixed Mode (dynamic sessions, 1:1 session-participant)
- [ ] Empty submissions (no answers) generate 1 row with submission metadata only
- [ ] Deleted scenarios handled gracefully with "DELETED" marker, don't crash export
- [ ] Button disabled when `sessions.length === 0` OR `submissions.length === 0`
- [ ] CSV imports successfully into R (`read.csv`) and Python (`pandas.read_csv`)
- [ ] All cooperation probabilities are in range [0.0, 1.0]
- [ ] All timestamps are valid ISO 8601 format
- [ ] Row count equals sum of `submission.results.length` across all submissions

---

## Phase 32: Icon-Based Invalidation UI with Confirmation (REQ-355..358)

**Status**: 📋 Planned | **Priority**: High | **Requirements**: REQ-356, REQ-357, REQ-358

### Overview
Replace text-based "Invalidate"/"Restore" buttons with intuitive icon buttons, add confirmation modals to prevent accidental state changes, and implement tab-based view switching for clean visual hierarchy.

### Frontend Tasks — GroupDetailView.tsx

- [ ] **TASK-3201**: Add confirmation modal state management
  - Location: [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:78-79)
  - Add state after existing `invalidatingId` state:
    ```typescript
    interface ConfirmModalState {
      isOpen: boolean;
      submissionId: string | null;
      action: 'invalidate' | 'restore';
    }
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
      isOpen: false,
      submissionId: null,
      action: 'invalidate'
    });
    ```
  - *Acceptance*: State properly typed and initialized
  - [REQ-357]

- [ ] **TASK-3202**: Add modal helper functions
  - Location: Same component, after state declarations
  - Add functions:
    ```typescript
    function openConfirmModal(submissionId: string, action: 'invalidate' | 'restore') {
      setConfirmModal({ isOpen: true, submissionId, action });
    }
    
    function closeConfirmModal() {
      setConfirmModal({ isOpen: false, submissionId: null, action: 'invalidate' });
    }
    
    async function handleConfirmAction() {
      if (!confirmModal.submissionId) return;
      const newIsInvalid = confirmModal.action === 'invalidate';
      await handleInvalidate(confirmModal.submissionId, newIsInvalid);
      closeConfirmModal();
    }
    ```
  - *Acceptance*: Modal opens, closes, and executes action correctly
  - [REQ-357]

- [ ] **TASK-3203**: Replace inline toggle button with tab-based selector
  - Location: [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:589-600)
  - Remove existing "Invalid (N)" toggle button code (lines 589-600)
  - Add tab selector below the header, above the table:
    ```tsx
    <div className="border-b border-gray-200 px-6 py-3">
      <div className="flex gap-6">
        <button
          onClick={() => setShowInvalid(false)}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            !showInvalid
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Valid ({submissions.filter(s => !s.isInvalid).length})
        </button>
        <button
          onClick={() => setShowInvalid(true)}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            showInvalid
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Invalid ({submissions.filter(s => s.isInvalid).length})
        </button>
      </div>
    </div>
    ```
  - *Acceptance*: Tabs switch views correctly, counts update dynamically
  - [REQ-358]

- [ ] **TASK-3204**: Add empty state for Invalid tab
  - Location: Inside the table rendering section, after tab selector
  - Add conditional rendering:
    ```tsx
    {showInvalid && submissions.filter(s => s.isInvalid).length === 0 && (
      <div className="px-6 py-12 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 text-sm">No invalid submissions</p>
      </div>
    )}
    ```
  - *Acceptance*: Empty state shows when Invalid tab is selected with 0 invalid submissions
  - [REQ-358]

- [ ] **TASK-3205**: Replace text button with icon button (Invalidate action)
  - Location: [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:728-738) (Mixed Mode table)
  - Also: Batch Mode table equivalent (around line 990)
  - Replace with:
    ```tsx
    {submission && !submission.isInvalid && (
      <button
        onClick={() => openConfirmModal(submission._id, 'invalidate')}
        disabled={invalidatingId === submission._id}
        title="Mark as invalid"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
      >
        {invalidatingId === submission._id ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    )}
    ```
  - *Acceptance*: Icon button visible for valid submissions, shows spinner when loading
  - [REQ-356]

- [ ] **TASK-3206**: Replace text button with icon button (Restore action)
  - Location: Same as TASK-3205
  - Replace with:
    ```tsx
    {submission && submission.isInvalid && (
      <button
        onClick={() => openConfirmModal(submission._id, 'restore')}
        disabled={invalidatingId === submission._id}
        title="Restore to valid"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
      >
        {invalidatingId === submission._id ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
      </button>
    )}
    ```
  - *Acceptance*: Icon button visible for invalid submissions, uses restore/arrow-path icon
  - [REQ-356]

- [ ] **TASK-3207**: Import ConfirmationModal component
  - Location: Top of [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx:3)
  - Add import:
    ```typescript
    import ConfirmationModal from './ConfirmationModal';
    ```
  - *Acceptance*: Component imported without errors
  - [REQ-357]

- [ ] **TASK-3208**: Render ConfirmationModal at component bottom
  - Location: End of component JSX, before closing `</div>`
  - Add modal rendering:
    ```tsx
    <ConfirmationModal
      isOpen={confirmModal.isOpen}
      onClose={closeConfirmModal}
      onConfirm={handleConfirmAction}
      title={confirmModal.action === 'invalidate' ? 'Mark Submission as Invalid?' : 'Restore Submission?'}
      message={
        confirmModal.action === 'invalidate'
          ? 'This will exclude this submission from all counts and free the participant slot. This action is reversible.'
          : 'This will include this submission in counts again. Make sure this is a legitimate response.'
      }
      confirmText={confirmModal.action === 'invalidate' ? 'Mark Invalid' : 'Restore'}
      cancelText="Cancel"
      confirmColor={confirmModal.action === 'invalidate' ? 'red' : 'green'}
    />
    ```
  - *Acceptance*: Modal appears when icon button clicked, shows correct message for each action
  - [REQ-357]

### Testing Tasks

- [ ] **TASK-3209**: Test tab switching
  - Navigate to Mixed Mode group detail view
  - Default view should show Valid tab active
  - Click "Invalid" tab
  - Verify:
    - Tab switches to Invalid
    - Only invalid submissions displayed
    - Count badges update correctly
  - [REQ-358]

- [ ] **TASK-3210**: Test empty Invalid tab state
  - Create group with no invalid submissions
  - Click "Invalid" tab
  - Verify:
    - Empty state message displays: "No invalid submissions"
    - Checkmark icon shows
    - Layout is centered vertically
  - [REQ-358]

- [ ] **TASK-3211**: Test icon button hover states
  - Hover over invalidate icon (red X-circle)
  - Verify:
    - Background changes to red-50
    - Icon color intensifies to red-700
    - Tooltip displays "Mark as invalid"
  - Hover over restore icon (green arrow-path)
  - Verify:
    - Background changes to green-50
    - Icon color intensifies to green-700
    - Tooltip displays "Restore to valid"
  - [REQ-356]

- [ ] **TASK-3212**: Test invalidate confirmation modal
  - Click invalidate icon button for a valid submission
  - Verify modal opens with:
    - Title: "Mark Submission as Invalid?"
    - Message about excluding from counts
    - Red "Mark Invalid" button
    - Gray "Cancel" button
  - Click "Cancel" → modal closes, no change
  - Click icon again → click "Mark Invalid"
  - Verify:
    - Modal closes
    - Submission marked as invalid
    - Toast: "Marked as invalid"
    - Icon switches to green restore icon
  - [REQ-357]

- [ ] **TASK-3213**: Test restore confirmation modal
  - Click restore icon button for an invalid submission
  - Verify modal opens with:
    - Title: "Restore Submission?"
    - Message about including in counts
    - Green "Restore" button
    - Gray "Cancel" button
  - Click "Restore"
  - Verify:
    - Modal closes
    - Submission restored to valid
    - Toast: "Restored"
    - Icon switches to red invalidate icon
  - [REQ-357]

- [ ] **TASK-3214**: Test loading state during mutation
  - Click invalidate icon
  - Confirm action
  - During mutation execution, verify:
    - Icon button shows animated spinner
    - Button is disabled (opacity-50)
    - Cannot click button again
  - After mutation completes:
    - Spinner disappears
    - Icon updates to reflect new state
    - Button re-enables
  - [REQ-356]

- [ ] **TASK-3215**: Test keyboard navigation
  - Use Tab key to navigate to icon buttons
  - Verify:
    - Focus ring appears (ring-2 ring-{color}-500)
    - Enter key opens modal
    - ESC key closes modal
  - [REQ-356, REQ-357]

- [ ] **TASK-3216**: Test modal backdrop click
  - Open confirmation modal
  - Click on dark backdrop outside modal
  - Verify:
    - Modal closes
    - No action executed
  - [REQ-357]

- [ ] **TASK-3217**: Test consistency across modes
  - Test in Mixed Mode group
  - Test in Batch Mode group
  - Verify:
    - Icon buttons identical in both modes
    - Confirmation modals identical
    - Tab selector works in both
  - [REQ-356, REQ-357, REQ-358]

### Visual QA Tasks

- [ ] **TASK-3218**: Verify icon alignment
  - Check that icon buttons align vertically in action column
  - Check that icons are centered within button area (w-8 h-8)
  - Check consistent spacing between columns
  - [REQ-356]

- [ ] **TASK-3219**: Verify color consistency
  - Invalidate: red-600 hover:red-700, hover:bg-red-50
  - Restore: green-600 hover:green-700, hover:bg-green-50
  - Focus rings match button colors
  - Tab active: purple-600 border, purple-700 text
  - [REQ-356, REQ-358]

- [ ] **TASK-3220**: Verify responsive behavior
  - Test on narrow viewport (mobile width)
  - Verify:
    - Tabs don't overflow or wrap awkwardly
    - Icon buttons visible and tappable
    - Modal fits on screen
  - [REQ-356, REQ-357, REQ-358]

### Acceptance Criteria for Phase 32

- [ ] Text-based "Invalidate"/"Restore" buttons completely removed
- [ ] Icon buttons use Heroicons XCircleIcon (invalidate) and ArrowPathIcon (restore)
- [ ] Icon buttons are exactly w-8 h-8 with w-5 h-5 icons inside
- [ ] Hover states show appropriate background color (red-50 / green-50)
- [ ] Focus states show 2px ring for keyboard navigation
- [ ] Loading state shows spinner animation instead of action icon
- [ ] Tooltip shows on hover: "Mark as invalid" / "Restore to valid"
- [ ] Clicking icon button opens confirmation modal (does NOT execute immediately)
- [ ] Confirmation modal uses existing ConfirmationModal component
- [ ] Invalidate modal: red button, appropriate warning message
- [ ] Restore modal: green button, appropriate confirmation message
- [ ] Modal dismisses via Cancel button, ESC key, or backdrop click
- [ ] Modal Submit button executes the action and closes modal
- [ ] Toast notification shows after action completes
- [ ] Tab selector replaces inline toggle button
- [ ] Valid tab is default/active on page load
- [ ] Tab counts update in real-time after invalidation/restoration
- [ ] Empty state displays when Invalid tab selected with 0 invalid submissions
- [ ] Both Mixed Mode and Batch Mode tables use identical icon buttons
- [ ] UI changes are frontend-only (no backend modifications)
- [ ] All existing functionality preserved (filtering, progress display, etc.)

---

## Phase 34: Partner Node Peach-Pink Visual Highlight (REQ-406)

**Status**: 📋 Planned (2026-06-15)

**Objective**: Replace the three dark-gray color references used for the partner node ("搭檔") in `NetworkGraph.tsx` with a new vibrant peach-pink token, making it as visually prominent as the focal node's amber highlight.

**Scope**: Frontend only — one constant and one component. No backend, GraphQL, or data model changes.

**Estimated Effort**: < 1 hour.

---

- [ ] **TASK-3401**: Add `rolePartnerHighlight` color token to `COLORS` in `constants.ts` — [REQ-406]
  - **File**: [`constants.ts`](../constants.ts) — the `COLORS` export object, after the existing `rolePartner` entry (line 48)
  - **Change**: Insert the following line:
    ```typescript
    rolePartnerHighlight: '#f472b6', // pink-400 — partner node emphasis (ring, glow, badge)
    ```
  - Do NOT remove or alter `roleOpponent: '#374151'` or `rolePartner: '#6b7280'` — preserve them for backward compatibility.
  - *Acceptance*: `COLORS.rolePartnerHighlight` resolves to `'#f472b6'` at runtime with no TypeScript errors.

- [ ] **TASK-3402**: Update partner node ring stroke in `NetworkGraph.tsx` to use `COLORS.rolePartnerHighlight` — [REQ-406]
  - **File**: [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) (~line 646)
  - **Change**:
    ```typescript
    // Before:
    strokeColor = COLORS.roleOpponent; strokeWidth = 4;

    // After:
    strokeColor = COLORS.rolePartnerHighlight; strokeWidth = 4;
    ```
  - *Acceptance*: The partner node's outer ring renders in `#f472b6` (pink-400), matching the visual weight of the focal node's amber ring.

- [ ] **TASK-3403**: Update partner node pulsing glow aura stroke in `NetworkGraph.tsx` to use `COLORS.rolePartnerHighlight` — [REQ-406]
  - **File**: [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) (~line 742)
  - **Change**:
    ```typescript
    // Before:
    stroke={COLORS.roleOpponent}

    // After:
    stroke={COLORS.rolePartnerHighlight}
    ```
  - *Acceptance*: The animated glow aura radiating from the partner node renders in `#f472b6`, not the previous near-invisible dark gray.

- [ ] **TASK-3404**: Update partner node role badge fill in `NetworkGraph.tsx` to use `COLORS.rolePartnerHighlight` — [REQ-406]
  - **File**: [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) (~line 771)
  - **Change**:
    ```typescript
    // Before:
    roleFill = COLORS.rolePartner; // gray-500

    // After:
    roleFill = COLORS.rolePartnerHighlight;
    ```
  - *Acceptance*: The "搭檔" role badge background renders in `#f472b6`, clearly distinguishing it from other nodes while maintaining readability of the white badge text.

---

**Acceptance Criteria for Phase 34**:
- `COLORS.rolePartnerHighlight` exists in `constants.ts` with value `'#f472b6'`.
- `COLORS.roleOpponent` and `COLORS.rolePartner` remain unchanged at their existing gray values.
- All three partner node visual elements (ring stroke, glow aura, badge fill) render in `#f472b6` on the network graph.
- The focal node ("您") amber highlight is unaffected.
- No TypeScript compile errors introduced.
- No backend changes, no GraphQL changes, no data model changes.

---

## Backlog / Future Enhancements

### Features (Out of Scope Today)

- [ ] **TASK-A02**: Real-time admin dashboard
  - WebSocket or polling for live updates
  - Real-time submission counts
  - [Backlog]

- [ ] **TASK-A03**: Multi-user RBAC
  - Replace shared ADMIN_PASSWORD
  - Role-based permissions
  - [Backlog]

- [ ] **TASK-A04**: Enhanced participant uniqueness
  - Email verification
  - Browser fingerprinting
  - [Backlog]

- [ ] **TASK-A05**: Scenario heatmap visualization
  - Complete implementation of REQ-310
  - D3-based visualization for Mixed Mode
  - [Deferred from Phase 17]

### Technical Debt

- [ ] **TASK-T01**: Frontend test updates
  - Update existing tests for new API
  - Ensure all frontend tests pass
  - [Technical Debt]

- [ ] **TASK-T02**: Performance optimization
  - Add pagination for large scenario lists
  - Optimize scenario populate queries
  - [Technical Debt]

- [ ] **TASK-T03**: Enhanced error handling
  - Better error messages for users
  - Retry logic for failed requests
  - [Technical Debt]

---

## Notes

- All tasks are traceable back to [`requirements.md`](requirements.md) via `REQ-XXX` tags
- [`design.md`](design.md) includes a Traceability Matrix that maps each REQ to its design sections
- Phase 12-17 completed the Scenario-Centric architecture refactor
- Phase 18 removed all legacy API code (~500 lines)
- Phase 19 fixed critical bugs (NetworkGraph, SurveyOutro)
- Phase 20 consolidated documentation

**Current Status**: System is production-ready with all three modes (Manual, Batch, Mixed) fully functional. Bug fixes applied. Documentation synchronized with codebase.

---

## Implementation Strategy (Completed)

**Week 1** ✅: Complete Phase 12-13 (data models + core API)
- Milestone: Can create scenarios and sessions via GraphQL, all three modes work at API level

**Week 2** ✅: Complete Phase 14-15 (utils + admin UI)
- Milestone: Admin can create experiments in all three modes via UI

**Week 3** ✅: Complete Phase 16 (survey flow)
- Milestone: Participants can complete surveys in all three modes

**Week 4** ✅: Complete Phase 17-18 (testing + legacy removal)
- Milestone: Production-ready with comprehensive test coverage

**Week 5** ✅: Bug fixes and documentation consolidation
- Milestone: All known issues fixed, documentation synchronized

---

## Phase 21: Device Fingerprinting - Core Implementation (REQ-311)

**Status**: 📋 **Planned** (2026-05-04)

**Objective**: Replace random localStorage-based participant IDs with browser device fingerprinting to provide stable identification and prevent duplicate submissions in Mixed Mode experiments.

### Tasks

- [ ] **TASK-2101**: Install and configure FingerprintJS library
  - Run `npm install @fingerprintjs/fingerprintjs`
  - Verify library compatibility with Vite build
  - Check bundle size impact (should be <50KB)
  - [REQ-311]

- [ ] **TASK-2102**: Refactor `utils/participantId.ts` for fingerprinting
  - Replace random ID generation with `generateFingerprint()` async function
  - Implement FingerprintJS initialization with privacy-safe config
  - Add DNT (Do Not Track) header detection and fallback
  - Create hybrid ID for low-confidence fingerprints
  - Add error handling with fallback to random ID
  - Update `getParticipantId()` to be async (returns `Promise<string>`)
  - Maintain backward compatibility with existing random IDs
  - [REQ-311]

- [ ] **TASK-2103**: Update all `getParticipantId()` call sites for async
  - Update `App.tsx` to use `await getParticipantId()`
  - Update any other components that call this function
  - Handle loading state while fingerprint generates
  - [REQ-311]

- [ ] **TASK-2104**: Add privacy disclosure notice
  - Update `components/SurveyWelcome.tsx` to display fingerprinting notice
  - Add bilingual notice (zh-TW and English)
  - Include explanation of what data is collected (browser config only)
  - Clarify no PII, no biometric data, no cross-site tracking
  - [REQ-311, Privacy Compliance]

- [ ] **TASK-2105**: Add fingerprint storage layer
  - Store fingerprint hash in localStorage (`pd_fingerprint_v1`)
  - Implement fingerprint comparison logic (reuse ID if fingerprint matches)
  - Add migration logic for existing random IDs
  - [REQ-311]

- [ ] **TASK-2106**: Configure fingerprint components for privacy
  - Exclude invasive components (sessionStorage, IndexedDB)
  - Include only stable, non-invasive components (canvas, WebGL, fonts, timezone)
  - Disable FingerprintJS telemetry
  - Test compliance with DNT headers
  - [REQ-311, Privacy Compliance]

## Phase 22: Device Fingerprinting - Testing & Validation

**Status**: 📋 **Planned** (2026-05-04)

**Objective**: Ensure fingerprinting works reliably across browsers and scenarios, with proper fallbacks and performance.

### Tasks

- [ ] **TASK-2201**: Test fingerprint stability
  - Open survey in same browser, verify same ID across sessions
  - Clear localStorage, verify fingerprint regenerates correctly
  - Test in incognito/private mode
  - Test across browser restarts
  - [REQ-311]

- [ ] **TASK-2202**: Test browser compatibility
  - Test in Chrome (latest 2 versions)
  - Test in Firefox (latest 2 versions)
  - Test in Safari (latest 2 versions)
  - Test in Edge (latest version)
  - Document any browser-specific issues
  - [REQ-311]

- [ ] **TASK-2203**: Test fallback scenarios
  - Test with DNT enabled (should use `dnt-` prefixed random ID)
  - Test with FingerprintJS load failure (should use `fallback-` ID)
  - Test with low confidence score (should use hybrid ID)
  - Test in browsers with fingerprint blocking (Brave, Tor Browser)
  - [REQ-311]

- [ ] **TASK-2204**: Performance testing
  - Measure fingerprint generation time (should be <100ms)
  - Test impact on page load time
  - Test with slow network conditions
  - Verify no blocking of UI rendering
  - [REQ-311, NFR-1]

- [ ] **TASK-2205**: Test Mixed Mode duplicate prevention
  - Create Mixed Mode group
  - Complete survey with fingerprint ID
  - Attempt to start new session with same browser (should detect existing session)
  - Clear localStorage but keep browser config (should generate same fingerprint)
  - Change browser config significantly (should generate new fingerprint)
  - [REQ-311, REQ-307]

- [ ] **TASK-2206**: Test migration of existing random IDs
  - Create session with old random ID
  - Verify migration to fingerprint-based ID
  - Ensure old submissions still linked correctly
  - [REQ-311]

- [ ] **TASK-2207**: Update unit tests
  - Mock FingerprintJS in tests
  - Test async `getParticipantId()` function
  - Test fingerprint generation and fallback logic
  - Test DNT header detection
  - [REQ-311]

- [ ] **TASK-2208**: Update E2E tests
  - Update Mixed Mode test scripts to handle async participant ID
  - Verify `scripts/test-mixed-mode-e2e.mjs` still passes
  - [REQ-311]

## Phase 23: Device Fingerprinting - Monitoring & Documentation

**Status**: 📋 **Planned** (2026-05-04)

**Objective**: Add monitoring capabilities and comprehensive documentation for the fingerprinting feature.

### Tasks

- [ ] **TASK-2301**: Add fingerprint analytics (optional)
  - Add stats query: count of fingerprint vs fallback IDs
  - Add collision detection: multiple participants with same fingerprint
  - Add DNT opt-out rate tracking
  - Display in Admin UI as info metrics
  - [REQ-311]

- [ ] **TASK-2302**: Create debugging utilities
  - Add `getParticipantIdDebug()` function that returns fingerprint components
  - Add console logging for fingerprint generation (dev mode only)
  - Create admin tool to view participant ID details
  - [REQ-311]

- [ ] **TASK-2303**: Update documentation
  - Add fingerprinting section to `docs/README.md`
  - Document privacy implications and compliance
  - Document troubleshooting for common issues
  - Add FAQ about fingerprinting vs random IDs
  - [REQ-311]

- [ ] **TASK-2304**: Update `docs/testing-guide.md`
  - Add fingerprinting test scenarios
  - Document how to test with DNT enabled
  - Document browser-specific testing requirements
  - [REQ-311]

- [ ] **TASK-2305**: Add privacy policy template (optional)
  - Create sample privacy disclosure text for researchers
  - Include explanation of fingerprinting technology
  - Include data retention and usage policies
  - [REQ-311, Privacy Compliance]

---

## Phase 19: Scenario Schema Refinement (2026-05-04)

**Status**: 🔧 **In Progress**

**Objective**: Simplify and clarify the Scenario model by making `scenarioIndex` required for traceability and simplifying the `status` enum to better reflect its actual purpose (selection availability control).

### Tasks

- [ ] **TASK-1901**: Update `backend/models/Scenario.js` schema
  - Change `scenarioIndex` from `required: false` to `required: true`
  - Change `status` enum from `['active', 'completed', 'paused']` to `['active', 'inactive']`
  - Update schema comments to clarify that 'active' = available for selection, 'inactive' = excluded
  - [REQ-321]

- [ ] **TASK-1902**: Update all scenario creation code to ensure `scenarioIndex` is always provided
  - Review `createManualSession` resolver
  - Review `createBatchSessions` resolver
  - Review `createMixedGroup` resolver
  - Verify all scenarios are created with valid `scenarioIndex`
  - [REQ-201, REQ-301, REQ-306]

- [ ] **TASK-1903**: Update status-related logic in GraphQL resolvers
  - Review and update any code that checks for 'completed' or 'paused' status
  - Ensure Mixed Mode selection only uses 'active' scenarios
  - Remove any redundant status updates (completion should be checked via `responseCount >= targetSize`)
  - [REQ-307, REQ-309]

- [ ] **TASK-1904**: Update GraphQL type definitions
  - Update `Scenario` type in `typeDefs.js` to reflect new status enum
  - Ensure `scenarioIndex` is marked as non-nullable (`Int!`)
  - [REQ-321]

- [ ] **TASK-1905**: Update test files
  - Update `backend/__tests__/new-data-model.test.js` to use new status values
  - Ensure all test scenario creations include `scenarioIndex`
  - Verify tests still pass
  - [All tests]

- [ ] **TASK-1906**: Update documentation and scripts
  - Review and update `scripts/test-*.mjs` files if they reference old status values
  - Update `docs/testing-guide.md` if it contains status-related examples
  - [Documentation]

**Acceptance Criteria**:
- All scenarios created through the system MUST have a valid `scenarioIndex`
- Status field only uses 'active' or 'inactive' values
- Mixed Mode balanced selection correctly filters by `status='active'`
- No code references 'completed' or 'paused' status values
- All existing tests pass with the new schema
- New validation prevents scenarios without scenarioIndex

---

## Summary: Device Fingerprinting Implementation

**Total Estimated Effort**: 3-4 days

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 21 | 6 tasks (Core implementation) | 1-2 days | 🔴 High |
| Phase 22 | 8 tasks (Testing & validation) | 1 day | 🟡 Medium |
| Phase 23 | 5 tasks (Monitoring & docs) | 0.5-1 day | 🟢 Low |

**Key Dependencies**:
- Must complete Phase 21 before Phase 22
- Phase 23 can be done in parallel with or after Phase 22

**Risk Mitigation**:
- Fingerprinting failures are handled with fallbacks (no service disruption)
- Async changes may require UI loading states
- Browser compatibility testing is critical for production use
- Privacy compliance review recommended before deployment

---

## Phase 25: Survey Intro Complete Network History Display (REQ-405.1)

**Status**: 📋 **PLANNED 2026-05-04**

**Objective**: Enhance the "關係結構" introduction step to display ALL participant interactions (4 edges) instead of only those involving You/Opponent (2 edges), providing participants with complete network context.

**Priority**: 🟢 Low (UI enhancement, non-breaking)

**Estimated Effort**: 0.5 day (UI-only change)

---

### Tasks

- [ ] **TASK-2501**: Remove edge filter in SurveyIntro history legend 🎨
  - **File**: [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx)
  - **Location**: Lines 336-339 (introStep 2, history legend)
  - **Change**: Remove `.filter()` condition that restricts to edges involving `focalNode` or `opponentNode`
  - **Before**:
    ```typescript
    {networkDemoSetup.activeEdgeIds.filter(edgeId => {
      const [source, target] = edgeId.split('-');
      return source === setup.focalNode || target === setup.focalNode
          || source === setup.opponentNode || target === setup.opponentNode;
    }).map(edgeId => {
    ```
  - **After**:
    ```typescript
    {networkDemoSetup.activeEdgeIds.map(edgeId => {
    ```
  - **Impact**: History legend will show 4 records instead of 2
  - **Testing**: Navigate to `/survey/intro/2?sessionId=<any>` and verify 4 interaction records are displayed
  - [REQ-405.1]

- [ ] **TASK-2502**: Verify participant labeling logic 🔍
  - **File**: [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx)
  - **Location**: Lines 344-351 (`getName` function)
  - **Verify**: Current logic already handles all four participants correctly:
    - `focalNode` → "您"
    - `opponentNode` → "搭檔"
    - Others → "參與者 [group]" (e.g., "參與者 KMT", "參與者 DPP")
  - **Action**: Confirm no changes needed, existing logic is correct
  - **Testing**: Verify labels are displayed correctly for all 4 edges
  - [REQ-405.1]

- [ ] **TASK-2503**: Visual regression testing 📸
  - **Test**: Open survey intro on multiple browser sizes
  - **Verify**:
    - History legend scrolls correctly with 4 records (max-height + overflow-y-auto)
    - Card layout remains intact with increased content
    - Text colors and badges display correctly for all records
    - Responsive layout works on mobile (grid-cols-1)
  - **Browsers**: Chrome, Firefox, Safari
  - **Screen sizes**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
  - [REQ-405.1]

- [ ] **TASK-2504**: Content verification and translation check ✅
  - **Verify**: Explanation text on "關係結構" page still accurate
  - **Current text**: "下面這張圖展示的是四位參與者彼此之間的**互動記錄**"
  - **Action**: Text is already correct (mentions "四位參與者"), no change needed
  - **Header text**: "歷史紀錄說明" remains appropriate
  - [REQ-405.1]

- [ ] **TASK-2505**: Update test fixtures if needed 🧪
  - **Check**: Review existing test files for SurveyIntro component
  - **File**: [`components/__tests__/SurveyIntro.test.tsx`](../components/__tests__/SurveyIntro.test.tsx)
  - **Action**:
    - If test counts number of history records, update expectation from 2 to 4
    - If test checks specific edge IDs, ensure all 4 are covered
  - **Acceptance**: All tests pass with new display logic
  - [REQ-405.1]

- [ ] **TASK-2506**: Documentation update 📝
  - **File**: [`docs/testing-guide.md`](../docs/testing-guide.md) or inline comments
  - **Action**: Add note that "關係結構" step displays complete network (4 edges)
  - **Update**: Component docstring or inline comments if helpful for future maintainers
  - **Optional**: Screenshot for documentation
  - [REQ-405.1]

---

### Implementation Summary

| Aspect | Details |
|--------|---------|
| **Files changed** | 1 file ([`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx)) |
| **Lines modified** | ~4 lines (remove filter condition) |
| **Breaking changes** | None (UI-only enhancement) |
| **Data model impact** | None |
| **API changes** | None |
| **Test updates** | Minimal (adjust expectations if tests check record count) |
| **Deployment risk** | 🟢 Very low (cosmetic change) |

---

### Acceptance Criteria

✅ **TASK-2501 Complete**: History legend displays 4 interaction records (all `activeEdgeIds`)

✅ **TASK-2502 Complete**: All 4 participants are labeled correctly:
- "您" for focal participant
- "搭檔" for opponent
- "參與者 KMT" / "參與者 DPP" for others

✅ **Visual Quality**: Layout remains clean and readable with 4 records

✅ **Responsive**: Works on mobile, tablet, desktop

✅ **Tests Passing**: No regression in existing tests

---

### Testing Checklist

```bash
# 1. Start dev server
npm run dev

# 2. Create a test session (any mode)
# Navigate to Admin → Setup → Manual Mode
# Configure and create session

# 3. Open survey intro
# Navigate to: /survey/intro/2?sessionId=<session-id>

# 4. Visual verification
☐ History legend shows 4 interaction records
☐ Labels are correct: "您", "搭檔", "參與者 [group]", "參與者 [group]"
☐ Each record shows source → target with decision badge
☐ Badges display "給予" or "不給予" correctly
☐ Layout is clean and scrollable if needed
☐ Graph visualization matches the history records

# 5. Cross-browser check
☐ Chrome: Display correct
☐ Firefox: Display correct
☐ Safari: Display correct

# 6. Responsive check
☐ Desktop (1920x1080): Good
☐ Tablet (768x1024): Good
☐ Mobile (375x667): Good
```

---

### Rollback Plan

If issues arise:
1. Revert the single line change (restore `.filter()` condition)
2. No database migration needed
3. No API changes to rollback
4. Zero downtime deployment

---

### Priority Rationale

**Priority: 🟢 Low** — This is a UI enhancement that improves participant understanding but does not affect data collection functionality. It can be deployed independently without coordinating with other phases.

**Effort: 0.5 day** — Single file change with minimal testing overhead.

---

## Phase 27 — One Submission Per Participant Per Session (REQ-313)

**Goal**: Ensure `Scenario.responseCount` counts distinct participants, not repeat visits.  
**Priority**: 🔴 High — data integrity issue.  
**Effort**: ~1 day.

### TASK-2701 — Submission model: replace non-unique index with unique sparse index

**File**: [`backend/models/Submission.js`](../backend/models/Submission.js)

- [ ] Remove the existing plain index `{ sessionId: 1, participantId: 1 }` (line 39)
- [ ] Add `{ sessionId: 1, participantId: 1 }, { unique: true, sparse: true }` in its place
- [ ] `sparse: true` is required so that rows where `participantId` is `null` are not compared for uniqueness (Manual/Batch participants without fingerprinting)

### TASK-2702 — GraphQL typeDefs: add participantId arg to startSurvey

**File**: [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js)

- [ ] Update `startSurvey` mutation signature from `startSurvey(sessionId: String!): Submission` to `startSurvey(sessionId: String!, participantId: String): Submission`

### TASK-2703 — startSurvey resolver: record participantId and resume on duplicate

**File**: [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js)

- [ ] Accept `participantId` from mutation args (second destructured field after `sessionId`)
- [ ] After the session-full check and before `Submission.create`, if `participantId` is non-null, query `Submission.findOne({ sessionId, participantId })` — if found, return it (resume path)
- [ ] Pass `participantId: participantId || null` into `Submission.create`

### TASK-2704 — graphqlClient.ts: pass participantId to startSurvey

**File**: [`utils/graphqlClient.ts`](../utils/graphqlClient.ts)

- [ ] Find the `startSurvey` GraphQL mutation string and add `$participantId: String` variable + `participantId: $participantId` argument
- [ ] Find the call site(s) that invoke `startSurvey` and ensure `participantId` is passed from the device fingerprint (`getParticipantId()`)

### TASK-2705 — SurveyWelcome: pass participantId when calling startSurvey

**File**: [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx)

- [ ] Import `getParticipantId` from `utils/participantId`
- [ ] Before calling `startSurvey`, await `getParticipantId()` and store in local state
- [ ] Pass `participantId` into the `startSurvey` mutation variables

### Phase 27 Acceptance Criteria

- Calling `startSurvey` twice with the same `(sessionId, participantId)` returns the same `Submission` document (no duplicate created)
- `Submission` collection has compound unique sparse index on `(sessionId, participantId)`
- `Submission.participantId` is populated for fingerprinted participants (Mixed Mode)
- Manual/Batch participants with `participantId: null` are not affected by the unique constraint

**Risk: Very Low** — Cosmetic change only, no backend dependencies.

---

## Phase 28 — Fix Mixed Mode Session Creation Timing (BUG-004)

**Status**: ✅ **COMPLETED 2026-05-06**

**Objective**: Fix Mixed Mode session creation timing to match Manual Mode behavior and prevent duplicate sessions from React StrictMode double-execution.

**Problem Summary**: Mixed Mode was creating sessions immediately on `/survey/welcome?groupId=xxx&mode=mixed` page load, before user saw welcome screen or clicked "開始實驗". This caused:
1. Premature session creation (before user engagement)
2. Duplicate sessions from React StrictMode double-execution
3. Inconsistent behavior vs Manual Mode (which delays until after intro)

**Fix Strategy**: Defer `startMixedSession` call from page-load effect to `handleSurveyStart` (after intro completion), matching Manual Mode timing.

### TASK-2801 — Store pending Mixed Mode groupId in App state

**File**: [`App.tsx`](../App.tsx)

- [x] Add `pendingMixedGroupId` state variable
- [x] In `hydrateSession` useEffect, detect `groupId + mode=mixed` URL
- [x] Store `groupId` in `pendingMixedGroupId` state instead of calling `startMixedSession`
- [x] Set `isLoading = false` and return early (no session creation yet)

### TASK-2802 — Defer session creation to handleSurveyStart

**File**: [`App.tsx`](../App.tsx)

- [x] In `handleSurveyStart`, check for `pendingMixedGroupId && !sessionIdFromUrl`
- [x] If true, call `startMixedSession(pendingMixedGroupId, participantId)`
- [x] Update URL to `?sessionId=xxx` after session creation
- [x] Fetch session data and populate `setup` state
- [x] Create submission and save to local storage
- [x] Clear `pendingMixedGroupId` state

### TASK-2803 — Preserve Mixed Mode URL params through intro

**File**: [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx)

- [x] Extract `groupId` and `mode` from URL searchParams
- [x] Modify `handleStart` to preserve `?groupId=xxx&mode=mixed` when navigating to intro
- [x] Add conditional: if `groupId && mode === 'mixed'`, navigate with those params

### TASK-2804 — Update navigation helper in SurveyView

**File**: [`components/SurveyView.tsx`](../components/SurveyView.tsx)

- [x] Extract `groupId` and `mode` from URL searchParams
- [x] Modify `navigateWithSession` to preserve Mixed Mode params during intro
- [x] Add conditional: if `groupId && mode === 'mixed' && !sessionId`, use those params
- [x] Otherwise use `sessionId` (after session creation)

### Phase 28 Acceptance Criteria

- Opening `/survey/welcome?groupId=xxx&mode=mixed` does NOT create a session immediately
- Session is created only after user completes intro and clicks "開始實驗！"
- React StrictMode double-execution does NOT create duplicate sessions
- Mixed Mode timing matches Manual Mode timing (both defer creation until after intro)
- URL transitions: `?groupId=xxx&mode=mixed` → (through intro) → `?sessionId=xxx` (after creation)
- No premature session records in database for users who close tab on welcome page

### Testing

- [x] Open Mixed Mode URL in browser
- [x] Verify no session created before clicking "開始實驗"
- [x] Complete intro, verify session created after clicking "開始實驗！"
- [x] Verify only ONE session created (not two from StrictMode)
- [x] Verify URL transitions correctly from groupId to sessionId

**Completion Date**: 2026-05-06
**Related Issues**: BUG-004
**Related Requirements**: REQ-307 (startMixedSession timing), REQ-401 (survey flow consistency)

---

## Phase 29 — Survey Resume: Navigate to Last Answered Question (BUG-005)

**Status**: ✅ **COMPLETED 2026-05-06**

**Objective**: Fix survey resume functionality to automatically navigate users to their last answered question when returning to a partially completed survey.

**Problem Summary**:
When users filled out a survey partially and closed the browser, upon returning:
1. System correctly detected existing submission via fingerprint ID
2. `startSurvey` resolver returned existing submission with `results` array
3. But frontend always navigated to question 0, losing progress
4. Users had to manually re-answer questions they already completed

**Root Cause**:
[`App.tsx:handleSurveyStart`](../App.tsx:179) hardcoded navigation to `/survey/scenarios/0` without checking `submission.results.length` to determine actual progress.

**Fix Strategy**:
Calculate `nextScenarioIndex` from `submission.results.length` and navigate to that index instead of always starting at 0.

### TASK-2901 — Calculate resume progress in handleSurveyStart

**File**: [`App.tsx`](../App.tsx)

- [x] In `handleSurveyStart`, after calling `startSurvey()`, extract `submission.results`
- [x] Calculate `answeredCount = submission.results?.length || 0`
- [x] Calculate `nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1)`
- [x] Log resume information when `answeredCount > 0`
- [x] Update path to `/survey/scenarios/${nextScenarioIndex}` instead of hardcoded `/survey/scenarios/0`

### TASK-2902 — Apply resume logic to Mixed Mode session creation

**File**: [`App.tsx`](../App.tsx)

- [x] In Mixed Mode branch of `handleSurveyStart`, after `startSurvey()` is called
- [x] Calculate progress using `submission.results?.length` and `fetchedSession.scenarios.length`
- [x] Navigate to calculated `nextScenarioIndex` instead of 0
- [x] Add console log for Mixed Mode resume

### TASK-2903 — Apply resume logic to restored submission path

**File**: [`App.tsx`](../App.tsx)

- [x] In `restoredSubmissionId` branch, call `startSurvey()` to get latest submission state
- [x] Calculate progress from returned `submission.results`
- [x] Update saved path to correct scenario index
- [x] Ensure resume works even when localStorage has stale path

### Implementation Details

**Key Changes in [`App.tsx:179-254`](../App.tsx:179)**:

```typescript
// Mixed Mode
const submission = await startSurvey(result.sessionId, participantId);
const answeredCount = submission.results?.length || 0;
const totalScenarios = fetchedSession?.scenarios?.length || 0;
const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);

if (answeredCount > 0) {
  console.log(`[Resume] Mixed Mode: 已答 ${answeredCount}/${totalScenarios} 題，繼續從第 ${nextScenarioIndex + 1} 題`);
}

const path = `/survey/scenarios/${nextScenarioIndex}?sessionId=${result.sessionId}`;
saveSession(result.sessionId, submission._id, path);

// Manual/Batch Mode
const submission = await startSurvey(currentId, pid);
const answeredCount = submission.results?.length || 0;
const totalScenarios = setup.scenarios?.length || 0;
const nextScenarioIndex = Math.min(answeredCount, totalScenarios - 1);

if (answeredCount > 0) {
  console.log(`[Resume] 偵測到既有進度：已答 ${answeredCount}/${totalScenarios} 題，繼續從第 ${nextScenarioIndex + 1} 題`);
}

const path = `/survey/scenarios/${nextScenarioIndex}?sessionId=${currentId}`;
saveSession(currentId, submission._id, path);
```

### Phase 29 Acceptance Criteria

- ✅ User fills 5 out of 10 questions and closes browser
- ✅ User returns to survey URL (same fingerprint ID)
- ✅ `startSurvey` returns existing submission with 5 results
- ✅ Frontend automatically navigates to question 6 (index 5)
- ✅ User continues from where they left off
- ✅ Works for all three modes: Manual, Batch, Mixed
- ✅ Console logs show resume information for debugging
- ✅ localStorage path is updated to correct scenario index

### Testing Scenarios

**Test 1: Manual Mode Resume**
1. Create manual session with 10 scenarios
2. Answer questions 0-4 (5 questions)
3. Close browser tab
4. Reopen survey URL
5. Verify navigation to question 5 (6th question)

**Test 2: Mixed Mode Resume**
1. Start Mixed Mode survey with 20 scenarios
2. Answer questions 0-9 (10 questions)
3. Close browser
4. Reopen with same groupId URL
5. Verify existing session detected
6. Verify navigation to question 10 (11th question)

**Test 3: Edge Case - All Questions Answered**
1. Complete all scenarios except last one
2. Close browser before demographics
3. Reopen survey
4. Verify navigation to last question (not beyond array bounds)

**Test 4: New User (No Resume)**
1. Fresh browser / cleared cookies
2. Start survey
3. Verify navigation to question 0 (normal flow)

### Related Code

**Backend Resume Support** (already implemented):
- [`backend/graphql/resolvers.js:546`](../backend/graphql/resolvers.js:546) - `startSurvey` returns existing submission
- [`backend/models/Submission.js:39`](../backend/models/Submission.js:39) - Unique index on `(sessionId, participantId)`

**Frontend Integration**:
- [`utils/participantId.ts:134`](../utils/participantId.ts:134) - Generates stable fingerprint ID
- [`utils/graphqlClient.ts:411`](../utils/graphqlClient.ts:411) - `startSurvey` query includes `results` field
- [`utils/surveySession.ts:8`](../utils/surveySession.ts:8) - Saves session state to localStorage

**Completion Date**: 2026-05-06
**Related Issues**: BUG-005
**Related Requirements**: REQ-313 (one submission per participant), REQ-311 (device fingerprinting)

---

## Phase 33: Chrome-Only Browser Enforcement (REQ-415)

**Status**: 📋 **Planned** (2026-05-30)

**Objective**: Detect non-Chrome browsers on the survey welcome page and block participants from proceeding until they switch to Chrome.

**Scope**: Frontend only — 1 file, no backend changes.

---

- [ ] **TASK-3301**: Add browser detection state and `useEffect` to `SurveyWelcome.tsx` — [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx) [REQ-415]
  - Add `const [isChrome, setIsChrome] = useState<boolean>(true);`
  - Add `useEffect` that sets `isChrome` based on `navigator.userAgent`:
    - `true` if UA contains `"Chrome/"` AND does NOT contain `"Edg/"` AND does NOT contain `"OPR/"`
    - `false` otherwise
  - Default to `true` to avoid a warning flash on Chrome browsers during initial render.

- [ ] **TASK-3302**: Render blocking warning banner when non-Chrome browser detected — [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx) [REQ-415]
  - Above the main card, conditionally render an amber warning banner with a warning triangle icon.
  - Banner text: **「請使用 Google Chrome 瀏覽器」** (bold) + 「本實驗僅支援 Chrome，使用其他瀏覽器可能導致實驗無法正常運行。請複製網址並在 Chrome 中開啟。」
  - Banner only appears when `!isChrome`.

- [ ] **TASK-3303**: Disable "開始實驗" button for non-Chrome browsers — [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx) [REQ-415]
  - Add `disabled={!isChrome}` to the button element.
  - Apply `opacity-50 cursor-not-allowed` classes when `!isChrome`, replacing hover/transform effects.
  - Chrome users see no visual change to the button.

**Acceptance Criteria for Phase 33**:
- Opening the page in Firefox/Safari/Edge shows the amber warning banner and a grayed-out disabled button
- Opening the page in Chrome (or Brave) shows no warning and a fully functional button
- The `handleStart` function cannot be triggered from a non-Chrome browser (button is `disabled`)
- No backend calls or data model changes required

---

## Phase 35: Debrief Screen with Realised Round, Real Opponent Pairing, and Persisted Payment (REQ-407, REQ-407.1)

**Status**: ✅ **Complete** (2026-07-02)

**Goal**: Insert a debrief step into `SurveyOutro` between the code step and the email step, showing each round's give/no-give outcome and highlighting the randomly drawn 實現回合 with its cash reward (點數 × 100 NTD), paired against a real opponent participant, with the outcome persisted so it survives page refresh.

- [x] **TASK-3501**: Renumber existing steps in `SurveyOutro.tsx` — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407]
  - `if (step === 2)` is the debrief; the email block moved to `step === 3`; completion card is `step === 4`.

- [x] **TASK-3502**: Draw and persist `realisedRoundIndex` server-side — [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js) `drawRealisedRound` [REQ-407]
  - Uniform random draw over answered rounds, persisted on `Submission.realisedRoundIndex`, idempotent on repeat calls.

- [x] **TASK-3503**: Pair each round with a real opponent submission — `drawRealisedRound` [REQ-407]
  - Match same `scenarioIndex` in the mirrored `focalNode` group within the session's `groupId`; sample a `cooperationProbability` from completed, valid `Submission`s that answered the mirrored scenario; fall back to `Math.random()` when no group/opponent context or no partner data exists yet. Persisted as `Submission.opponentProbs`.

- [x] **TASK-3504**: Build the debrief step 2 UI — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407]
  - Round table (回合 / 您 / 搭檔 / 點數), selected-round amber highlight, payment summary card, 繼續 button.

- [x] **TASK-3505**: Replace threshold-based give/no-give with a persisted Bernoulli draw — [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js), [`backend/models/Submission.js`](../backend/models/Submission.js), [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js) [REQ-407.1]
  - Added `Submission.myDecisions: [Boolean]` and `Submission.opponentDecisions: [Boolean]`.
  - `drawRealisedRound` now draws `myDecisions[i] = Math.random() < results[i].cooperationProbability` and `opponentDecisions[i] = Math.random() < opponentProbs[i]` for every round — a true probabilistic draw, not a `>= 0.5` comparison — and persists both arrays once, alongside `realisedRoundIndex`/`opponentProbs`.
  - Idempotent path migrates legacy submissions (those with `realisedRoundIndex`/`opponentProbs` but no `myDecisions`/`opponentDecisions`) in place on next access.
  - `DebriefResult` GraphQL type and `drawRealisedRound`/`fetchSubmission` queries updated to return the new fields ([`utils/graphqlClient.ts`](../utils/graphqlClient.ts), [`types.ts`](../types.ts)).

- [x] **TASK-3506**: Remove client-side threshold/coin-flip logic and per-row probability display — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407.1]
  - Removed `randomDecisions` (unpersisted `useMemo` coin flip), `myAtFifty`/`oppAtFifty` branches, the 50%-only "由系統隨機決定" tooltip, and the per-row probability percentage. Each row now shows only the 合作/不合作 badge, sourced directly from persisted `myDecisions[i]`/`opponentDecisions[i]`.

- [x] **TASK-3507**: Verify step flow and persistence end-to-end [REQ-407, REQ-407.1]
  - `npx tsc --noEmit` passes with no new errors.
  - Step 1 (code) → step 2 (debrief) shows 合作/不合作 badges (no percentages), correct payoff points, correct amber-highlighted realised round, and a stable reward amount across a manual page refresh (served from the idempotent cached `Submission` fields, not re-drawn).
  - Click 繼續 → step 3 (email). Submit email → step 4 (completion). No regressions.

**Acceptance Criteria for Phase 35**:
- Debrief screen is shown after code entry and before email collection.
- One and only one round is highlighted as the realised round; selection does not change on re-render or page refresh.
- 搭檔 column reflects a real paired participant's answer for the mirrored scenario when one exists, falling back to a random draw only when no partner data is available.
- Give/no-give for both 您 and 搭檔 is a Bernoulli draw on the stated probability (not a 50% threshold), drawn once server-side and persisted — refreshing the page cannot change the outcome or payout.
- Payment card shows the correct round number, points, and cash amount, computed from the persisted decisions.
- All downstream steps (email → completion) still function correctly.

---

## Phase 36: Decision Slider Randomized Default + Mandatory Interaction Gate (REQ-402.1)

**Status**: 📋 Planned (2026-07-02)

**Objective**: Stop defaulting the per-scenario decision slider to a fixed 50%, and prevent participants from advancing past the decision phase without ever touching the slider.

**Scope**: Frontend only — one file, one `useEffect` and one `disabled` expression. No backend, GraphQL, or data model changes.

**Estimated Effort**: < 30 minutes.

---

- [ ] **TASK-3601**: Randomize `sliderValue` initial value per scenario — [REQ-402.1]
  - **File**: [`components/SurveyView.tsx`](../components/SurveyView.tsx) (~line 236-241)
  - **Change**:
    ```typescript
    // Before:
    useEffect(() => {
      setRevealedEdgeIds(new Set());
      setIsDecisionPhase(false);
      setHasInteracted(false);
      setSliderValue(50);
    }, [scenarioIdx]);

    // After:
    useEffect(() => {
      setRevealedEdgeIds(new Set());
      setIsDecisionPhase(false);
      setHasInteracted(false);
      setSliderValue(Math.floor(Math.random() * 101)); // random integer in [0, 100]
    }, [scenarioIdx]);
    ```
  - *Acceptance*: Reloading/advancing between scenarios shows a different slider starting position across runs (not always the midpoint).

- [ ] **TASK-3602**: Gate the confirm button on `hasInteracted` during the decision phase — [REQ-402.1]
  - **File**: [`components/SurveyView.tsx`](../components/SurveyView.tsx) (~line 601-607)
  - **Change**:
    ```typescript
    // Before:
    disabled={!allRevealed}

    // After:
    disabled={!allRevealed || (isDecisionPhase && !hasInteracted)}
    ```
  - Do not introduce a new state variable — reuse the existing `hasInteracted` flag already set by `DecisionSlider`'s `onChange`.
  - *Acceptance*: After entering the decision phase, the confirm button (「確認並前往下一題」/「確認並送出」) is visibly disabled until the participant drags the slider at least once; it enables immediately on first interaction and stays enabled afterward for that scenario.

- [ ] **TASK-3603**: Verify end-to-end — manual browser test [REQ-402.1]
  - Navigate to `/survey/scenarios/0?sessionId=<any>`, reveal all edges, click 開始決策.
  - Confirm slider does not start at 50% on at least one of several scenario reloads.
  - Confirm the button stays disabled with the untouched slider; dragging the slider (even back to its own starting value) enables the button.
  - Confirm submission still persists `cooperationProbability: sliderValue / 100` correctly (no change to save payload).
  - No regressions to `PayoffMatrix` display or the `NetworkGraph` decision-edge visualization, which both continue to read the same `sliderValue`.

---

**Acceptance Criteria for Phase 36**:
- `sliderValue` is no longer hardcoded to `50`; it is randomized per scenario via `Math.random()`.
- Confirm button is disabled whenever `isDecisionPhase && !hasInteracted`, on top of the existing `!allRevealed` condition.
- No backend, GraphQL, schema, or data-contract changes — the stored `cooperationProbability` format is unchanged.

---

## Phase 37: Disabled Confirm Button Gray-Out + Slider Glow Prompt (REQ-402.2)

**Status**: 📋 Planned (2026-07-02)

**Objective**: Fix a visual mismatch where the confirm button was functionally disabled (per Phase 36 / REQ-402.1) but still rendered with "enabled" black/glow styling. Also add a glowing visual prompt on the decision slider while it remains untouched, to invite interaction rather than just silently blocking the button.

**Scope**: Frontend only — two files, className/style changes. No backend, GraphQL, or data model changes.

**Estimated Effort**: < 30 minutes.

---

- [ ] **TASK-3701**: Gray out the confirm button whenever it is `disabled` — [REQ-402.2]
  - **File**: [`components/SurveyView.tsx`](../components/SurveyView.tsx) (~line 604)
  - **Change**:
    ```typescript
    // Before:
    className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all transform ${!allRevealed
      ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
      : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:translate-y-0 animate-glow-indigo'
      }`}

    // After:
    className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all transform ${!allRevealed || (isDecisionPhase && !hasInteracted)
      ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
      : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-1 active:translate-y-0 animate-glow-indigo'
      }`}
    ```
  - *Acceptance*: The className condition matches the `disabled` expression exactly; the button is visibly gray (`bg-gray-300 text-gray-400`) any time it cannot be clicked, including the new `isDecisionPhase && !hasInteracted` case.

- [ ] **TASK-3702**: Add a glowing pulse to `DecisionSlider` while `hasInteracted` is `false` — [REQ-402.2]
  - **File**: [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (`DecisionSlider` component, ~line 90-109)
  - **Change**: Add a local `<style>` block (self-contained, mirrors the `animate-glow-indigo` pattern already in `SurveyView.tsx`) defining `@keyframes glow-slider-pulse` and `.animate-glow-slider`, rendered only when `!hasInteracted`. Apply the `animate-glow-slider` class to the `<input type="range">` conditionally on `!hasInteracted`.
  - Do not gate this on a new prop — reuse the existing `hasInteracted` prop so both the real decision slider (`SurveyView.tsx`) and the intro practice slider (`SurveyIntro.tsx`) get the same affordance.
  - *Acceptance*: The slider track visibly pulses with an indigo glow until the participant drags it once; the glow stops immediately on the first `onChange` (when `hasInteracted` flips to `true`) and does not resume for that scenario.

- [ ] **TASK-3703**: Gray out the "決策分析" probability text until interacted — [REQ-402.2]
  - **File**: [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (`DecisionSlider` component, ~line 130-131)
  - **Change**:
    ```typescript
    // Before:
    <p>您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。</p>

    // After:
    <p className={`transition-colors duration-300 ${!hasInteracted ? 'text-gray-300' : ''}`}>您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。</p>
    ```
  - *Acceptance*: The paragraph renders dimmed (`text-gray-300`) while `hasInteracted` is `false`, and smoothly transitions back to normal text color on first slider interaction.

- [ ] **TASK-3704**: Verify end-to-end — manual browser test [REQ-402.2]
  - Navigate to `/survey/scenarios/0?sessionId=<any>`, reveal all edges, click 開始決策.
  - Confirm the slider glows before any interaction, the confirm button is visibly gray (not black), and the "決策分析" text is dimmed — all at the same time.
  - Drag the slider — glow stops immediately, button turns black and resumes its `animate-glow-indigo` pulse, and the analysis text returns to normal color.
  - Repeat on the intro tutorial slider (`/survey/intro/...`) to confirm the same behavior appears there before first interaction.
  - No regressions to slider value display, `PayoffMatrix`, or `NetworkGraph` decision-edge visualization.

---

**Acceptance Criteria for Phase 37**:
- Confirm button's visual gray-out state always matches its `disabled` attribute — no case where it looks clickable but isn't (or vice versa).
- `DecisionSlider` glows while `hasInteracted` is `false` and stops glowing once interacted, in both `SurveyView.tsx` and `SurveyIntro.tsx` usages.
- No backend, GraphQL, schema, or data-contract changes.

---

## Phase 38: Slider Visual Camouflage — Appears Valueless Until Interacted (REQ-402.3)

**Status**: 📋 Planned (2026-07-02)

**Objective**: Make `DecisionSlider` visually present as if it has no value/position at all until the participant drags it, without rewriting it as a custom (non-native) slider component. The randomized starting value from Phase 36 (REQ-402.1) still exists internally; only its visual presentation is suppressed pre-interaction.

**Scope**: Frontend only — one className expression in one file. No backend, GraphQL, or data model changes.

**Estimated Effort**: < 15 minutes.

---

- [ ] **TASK-3801**: Camouflage the slider thumb/fill color to match the track background until interacted — [REQ-402.3]
  - **File**: [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (`DecisionSlider`, `<input type="range">` className, ~line 120)
  - **Change**:
    ```typescript
    // Before:
    className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'animate-glow-slider' : ''}`}

    // After:
    className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'accent-gray-200 animate-glow-slider' : 'accent-indigo-600'}`}
    ```
  - Relies on this being a Chrome-only application (REQ-415) — no cross-browser `accent-color` fallback needed.
  - *Acceptance*: Before interaction, the slider track shows no visible thumb or colored fill (blends into `bg-gray-200`). On first drag, the thumb and filled track immediately render in `accent-indigo-600`.

- [ ] **TASK-3802**: Verify end-to-end — manual browser test [REQ-402.3]
  - Navigate to `/survey/scenarios/0?sessionId=<any>`, reveal all edges, click 開始決策, reload/re-enter a few times.
  - Confirm the slider appears to have no visible thumb or value indication pre-interaction, even though a random value is set internally (verify via React DevTools or by checking `決策分析` text becomes accurate immediately upon first drag).
  - Drag the slider — thumb and fill appear instantly in indigo, at the value corresponding to drag position.
  - Repeat on the intro tutorial slider (`/survey/intro/...`).
  - No regressions to `PayoffMatrix`, `NetworkGraph` decision-edge visualization, or the confirm-button/glow/text gray-out behaviors from Phase 37.

---

**Acceptance Criteria for Phase 38**:
- `DecisionSlider`'s thumb and filled track are visually camouflaged (same color as the untouched track) while `hasInteracted` is `false`.
- The randomized starting value (REQ-402.1) is unchanged internally — only presentation is suppressed.
- Thumb/fill switch to `accent-indigo-600` immediately on first interaction.
- No backend, GraphQL, schema, or data-contract changes.

---

## Phase 39: Undecided-State Copy on Analysis Text + Neutral Network Graph Decision Edge (REQ-402.4)

**Status**: 📋 Planned (2026-07-02)

**Objective**: Close the remaining two places the randomized-but-untouched slider value was still visible: the "決策分析" text under the slider, and `NetworkGraph`'s decision edge (path, draggable bubble, arrow tip, dash speed), which continued to color/label itself from the raw value even before the participant interacted.

**Scope**: Frontend only — 4 files. No backend, GraphQL, or data model changes.

**Estimated Effort**: < 45 minutes.

---

- [ ] **TASK-3901**: Show call-to-action copy instead of the probability sentence pre-interaction — [REQ-402.4]
  - **File**: [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (`DecisionSlider`, analysis paragraph)
  - **Change**:
    ```typescript
    <p className={`transition-colors duration-300 ${!hasInteracted ? 'text-gray-300' : ''}`}>
      {hasInteracted
        ? <>您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。</>
        : '請點擊輸入您的決策'}
    </p>
    ```
  - *Acceptance*: Paragraph reads "請點擊輸入您的決策" (dimmed) while `!hasInteracted`, and switches to the probability sentence in normal color on first interaction.

- [ ] **TASK-3902**: Add a `hasInteracted` prop to `NetworkGraph` — [REQ-402.4]
  - **File**: [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) — `NetworkGraphProps` interface and component destructure
  - **Change**: Add `hasInteracted?: boolean;` to the props interface; destructure with default `hasInteracted = true` (so existing admin/preview callers that never pass it keep current behavior).

- [ ] **TASK-3903**: Render the decision edge (path, bubble, arrow tip) as neutral amber until interacted — [REQ-402.4]
  - **File**: [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) — all 3 decision-edge render sites (Layer 2 path, Layer 6 bubble, arrow-tip marker)
  - **Change**: In each site's `decisionColor`/`edgeOpacity` computation, add a leading branch:
    ```typescript
    if (!hasInteracted) {
      decisionColor = COLORS.highlight;
      edgeOpacity = 0.5;
    } else if (visualDecision > 50) {
      ...
    ```
  - Update the bubble label: `{!hasInteracted ? '未決策' : visualDecision > 50 ? '給予' : visualDecision < 50 ? '不給予' : '中立'}`
  - Update the dash animation timing so it doesn't leak the value either: `const dashSpeed = hasInteracted ? 1 - (decision / 100) * 0.6 : 0.7;`
  - `COLORS.highlight` (amber-500, `#f59e0b`) is the same color already used for the exact-50% "中立" case — chosen over `COLORS.neutral` (gray) so the undecided state matches the existing neutral/中立 accent rather than looking disabled. Its arrow marker already exists — no new tokens needed.
  - *Acceptance*: Before interaction, the decision edge path, bubble, and arrow tip all render in `COLORS.highlight` amber, the bubble reads "未決策", and the dash animation runs at a fixed neutral speed regardless of the underlying random value.

- [ ] **TASK-3904**: Wire `hasInteracted` through from callers — [REQ-402.4]
  - **File**: [`components/SurveyView.tsx`](../components/SurveyView.tsx) — pass `hasInteracted={hasInteracted}` to its `<NetworkGraph>` (alongside the existing `decision={sliderValue}`).
  - **File**: [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx) — pass `hasInteracted={introSliderInteracted}` to the interactive practice-slider `<NetworkGraph>` (the one paired with `DecisionSlider` and `introSliderValue`), for the same undecided-state behavior in the tutorial.
  - *Acceptance*: Both real and practice decision graphs show the neutral/undecided state until their respective slider is first dragged.

- [ ] **TASK-3905**: Verify end-to-end — manual browser test [REQ-402.4]
  - Navigate to `/survey/scenarios/0?sessionId=<any>`, reveal all edges, click 開始決策.
  - Confirm: analysis text reads "請點擊輸入您的決策"; network graph decision edge (line, bubble, arrow) is amber with "未決策" label; dash animation runs at a fixed speed.
  - Drag the slider — analysis text, network graph color/label, and dash speed all switch to value-driven output immediately and simultaneously.
  - Repeat on the intro tutorial slider (`/survey/intro/...`).
  - No regressions to `PayoffMatrix`, admin-mode `NetworkGraph` rendering (which never passes `hasInteracted` and must be unaffected), or the confirm-button/glow/slider-camouflage behaviors from Phases 37–38.

---

**Acceptance Criteria for Phase 39**:
- "決策分析" text shows the call-to-action copy while `hasInteracted` is `false`, and the probability sentence once interacted.
- `NetworkGraph`'s decision edge (path, bubble, arrow tip, dash speed) renders neutral/gray with a "未決策" label until `hasInteracted` is `true`.
- `hasInteracted` defaults to `true` on `NetworkGraph`, so admin/preview usages that don't pass it are unaffected.
- No backend, GraphQL, schema, or data-contract changes.

---

## Phase 40: IRB Before/After Capture Tooling + Baseline Screenshots (NFR-7)

**Status**: ✅ Complete (2026-10-01)

**Objective**: Build deterministic screenshot tooling and capture the "before" set while the app source is still identical to commit `934e945`, so every IRB-driven edit can be shown before and after. See design.md Phase 40.

**Scope**: Dev tooling only (`scripts/irb-shots/`, `package.json`, `.gitignore`). No app code changes in this phase.

- [x] **TASK-4001**: Add tooling dependencies and scripts — [`package.json`](../package.json), [`.gitignore`](../.gitignore) [NFR-7]
  - devDependencies `playwright-core` (drives the installed Google Chrome) and `mongodb-memory-server` (throwaway DB).
  - Scripts `irb:shots` → `node scripts/irb-shots/capture.mjs`, `irb:report` → `node scripts/irb-shots/build-report.mjs`.
  - Ignore `docs/irb/screenshots/` and `docs/irb/report/`.

- [x] **TASK-4002**: Create the fixed fixture — `scripts/irb-shots/fixture.mjs` [NFR-7]
  - 1 SessionGroup, 1 Session (KMT1 vs DPP3), 3 Scenarios, submissions `irb-fixture-sub-live` (in progress; draw round 2 = 不給/給 → 3 點) and `irb-fixture-sub-done` (completed; code `A1B2C3`, email `participant@example.com`).
  - `seedFixture()` inserts through the app's own Mongoose models; no `realisedPoints`/`payoutNtd` (the "after" run backfills them).
  - *Acceptance*: Seeding twice produces identical documents; the app's `session(id)` query returns the 3 scenarios.

- [x] **TASK-4003**: Define the edit-part catalog and shot list — `scripts/irb-shots/shots.mjs` [NFR-7]
  - Edit parts A1–A6 (payment) and B1–B3 (figures) with IRB comment, REQ and one-line change note.
  - Shots S01–S14 and evidence E1–E2 exactly as in design.md, plus packet-only screens.

- [x] **TASK-4004**: Implement the capture script — `scripts/irb-shots/capture.mjs` [NFR-7]
  - Start in-memory MongoDB (or `IRB_SHOTS_MONGODB_URI`), seed, spawn `node server.js` on port 3100 with its own `ADMIN_PASSWORD`/`JWT_SECRET`.
  - Per shot: Turnstile cookie + `survey_session_*` localStorage, seeded `Math.random`, frozen CSS/SVG animations, setup steps, full-page PNG at DPR 2 for desktop 1440×900 and phone 390×844.
  - Evidence E1 (unauthenticated `recentSubmissions`), E2 (Payments CSV download, "after" only).
  - `meta.json`: git SHA, dirty flag, `appSourceMatchesBaseline`, payment settings, timestamp.

- [x] **TASK-4005**: Implement the report builder — `scripts/irb-shots/build-report.mjs` [NFR-7]
  - HTML (cover, summary table, per-IRB-comment sections with Before | After pairs, appendices) → PDF via `page.pdf()`, A4 landscape.
  - Fail the build when an edit part has no shot or evidence; JPEG copies via `sips` keep the PDF small.

- [x] **TASK-4006**: Capture the baseline — `npm run build && npm run irb:shots -- --label before` [NFR-7]
  - *Acceptance*: `docs/irb/screenshots/before/meta.json` shows `appSourceMatchesBaseline: true`; every shot exists for both viewports (S14 desktop only).

**Acceptance Criteria for Phase 40**:
- The "before" set is complete and provably taken from unmodified app source.
- Running the capture twice produces visually identical images.
- The study database is never touched.

---

## Phase 41: IRB Comment 2 — Points → Payment Conversion (REQ-408)

**Status**: ✅ Complete (2026-10-01)

**Objective**: One source of truth for the conversion, a payout computed and persisted on the server, consistent participant copy, and a payment ledger for the researcher. See design.md Phase 41.

- [x] **TASK-4101**: Create the payment module — `utils/payment.js` [REQ-408.1]
  - `POINT_TO_NTD`, `PARTICIPATION_FEE_NTD` (0, Open Question #8), `PAYMENT_METHOD_TEXT`, `PAYMENT_TIMELINE_TEXT` (Open Question #9), `payoffPoints`, `pointPayoutNtd`, `totalPayoutNtd(points, fee)`, `MIN_TOTAL_NTD`, `MAX_TOTAL_NTD`.
  - Unit tests `utils/__tests__/payment.test.ts`: the 4 outcomes; totals at fee 0 (0–300) and fee 100 (100–400).

- [x] **TASK-4102**: Persist payout fields — [`backend/models/Submission.js`](../backend/models/Submission.js), [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js), `toSubmissionGraph` in [`resolvers.js`](../backend/graphql/resolvers.js) [REQ-408.5]
  - `realisedPoints`, `payoutNtd` (Number, default null) on the model; `Int` on `Submission`, `Int!` on `DebriefResult`.

- [x] **TASK-4103**: Compute, persist and backfill the payout in `drawRealisedRound` [REQ-408.5]
  - First draw: `$set` `realisedPoints`/`payoutNtd` with the other draw fields. Idempotent path: backfill when missing; never recompute an existing `payoutNtd`.

- [x] **TASK-4104**: Guard participant PII and add the group query — [`resolvers.js`](../backend/graphql/resolvers.js), [`typeDefs.js`](../backend/graphql/typeDefs.js) [REQ-408.7, REQ-408.8]
  - `requireAdmin(context)` helper; applied to `recentSubmissions` and the new `submissionsByGroup(groupId)`.

- [x] **TASK-4105**: Update the client API and types — [`utils/graphqlClient.ts`](../utils/graphqlClient.ts), [`types.ts`](../types.ts) [REQ-408.5, REQ-408.7]
  - `realisedPoints`/`payoutNtd` in `fetchSubmission` and `drawRealisedRound`; new `fetchSubmissionsByGroup(groupId)`.

- [x] **TASK-4106**: Rework the debrief and email steps — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-408.3, REQ-408.4, REQ-408.6]
  - Load on steps 2 and 3 (loading / ready / error); remove the local random fallback; error card with「重試」.
  - Payment card with formula, conditional 參與費 line and 合計 from `payoutNtd`; email sentence with amount, 電子禮券 and timeline.

- [x] **TASK-4107**: Rewrite the payment explanation — intro step 7 in [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx) [REQ-408.2]
  - Rate badge, outcome table (合計 column only when fee > 0), range, worked example, payment form and timing — all from `utils/payment.js`.

- [x] **TASK-4108**: Complete group data + Export Payments — [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx) [REQ-408.7]
  - Replace both `fetchRecentSubmissions()` calls with `fetchSubmissionsByGroup(groupId)`; add the「Export Payments」CSV.

- [x] **TASK-4109**: Verify payment behavior [REQ-408]
  - `npm run test:run` (new tests pass; no new failures vs. the baseline), `npx tsc --noEmit` clean.
  - An unauthenticated `recentSubmissions` request returns `Unauthorized`; the admin group page still loads.
  - Refreshing the debrief keeps the same amount; the debrief total equals the Payments CSV total.

**Acceptance Criteria for Phase 41**:
- No component or resolver hard-codes the rate or fee.
- The amount a participant sees is the persisted `payoutNtd`, and no screen shows an unrecorded amount.
- Intro, debrief and email step state the same rate, range, form and timing.
- The payment ledger lists every completed, valid submission of the group.

---

## Phase 42: IRB Comment 1 — Figure Legibility (REQ-409)

**Status**: ✅ Complete (2026-10-01)

**Objective**: Make every figure explain itself and be large enough to read. See design.md Phase 42.

- [x] **TASK-4201**: Build `GraphLegend` — [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) [REQ-409.1]
  - Seven legend items drawn with `COLORS` tokens; `items` and `compact` props. Test: renders exactly the requested rows.

- [x] **TASK-4202**: Add captions and legends to the intro — [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx) [REQ-409.1, REQ-409.2]
  - Captions under the figures of steps 0, 2, 3, 4, 5; legends on steps 0, 2, 4, 5 per the design placement table.

- [x] **TASK-4203**: Enlarge the "?" marker and the graph cap — [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) [REQ-409.3]
  - r 13, `fontSize={18}`, transparent hit circle r 20; `lg:max-w-[520px]`.

- [x] **TASK-4204**: Widen the scenario graph and add the compact legend — [`components/SurveyView.tsx`](../components/SurveyView.tsx) [REQ-409.1, REQ-409.3]
  - `xl:grid-cols-[3fr_2fr]`; `GraphLegend compact` with all seven items under the graph, above the reveal prompt.

- [x] **TASK-4205**: Fix intro sizes and invalid classes — [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx) [REQ-409.3]
  - Interaction list `text-sm` + 24px avatars; `white-*` classes → valid gray/white classes; tip-1 demo `max-w-[360px]`; graph containers `h-[380px] md:h-[480px]`.

- [x] **TASK-4206**: Repair the stale intro test — [`components/__tests__/SurveyIntro.test.tsx`](../components/__tests__/SurveyIntro.test.tsx) [REQ-409.2]
  - Wrap in `MemoryRouter`; assert the step-0 caption and legend instead of the removed "You"/"Partner" cards.

**Acceptance Criteria for Phase 42**:
- Every graph encoding is explained next to the figure that uses it.
- Sizes meet REQ-409.3 at 1440×900 and 390×844.
- No change to the scenario data, the decision logic or the recorded values.

---

## Phase 43: IRB After Screenshots + Before/After PDF Report (NFR-7, REQ-409.4)

**Status**: ✅ Complete (2026-10-01)

- [x] **TASK-4301**: Capture the "after" set — `npm run build && npm run irb:shots -- --label after` [NFR-7]
- [x] **TASK-4302**: Build the report — `npm run irb:report` → `docs/irb/report/irb-before-after-report.pdf` [NFR-7]
  - *Acceptance*: every edit part has before/after pairs at both viewports (S14 desktop only); E1 shows the query rejected after the change; E2 total matches S11.
- [x] **TASK-4303**: Write the packet caption index — `docs/irb/figures.md` [REQ-409.4]
- [x] **TASK-4304**: Hand over — report path, pending items (Open Questions #8, #9), and the rerun command for when the fee or timeline is confirmed.
- [x] **TASK-4305**: Add the 報酬規則說明 page to the report — `scripts/irb-shots/build-report.mjs` [NFR-7, REQ-408]
  - Placed at the start of the IRB comment 2 section; every number is generated from the "after" capture's payment settings and `payoffPoints`, so it updates when the fee or timing is confirmed and the report is rebuilt.
- [x] **TASK-4306**: Rewrite the report in Traditional Chinese for the advisor — `scripts/irb-shots/build-report.mjs`, `shots.mjs`, `fixture.mjs` [NFR-7]
  - Remove commit hashes, file paths, code identifiers, requirement IDs and raw JSON; label edit parts 1-1…2-6 and shots 圖 1…; describe evidence E1/E2 in plain language.
  - Replace the English fixture description and participant IDs visible on the admin screenshot, and recapture S14 for both sets.
- [x] **TASK-4307**: Limit the advisor report to participant-facing changes — `scripts/irb-shots/shots.mjs`, `build-report.mjs` [NFR-7]
  - Mark A5, A6, S14, E1 and E2 `internal` (still captured, not shown); drop the before/after rows from the cover; keep only the fee/timing item in the open items.
  - Payment rules page: state that the researcher pays the saved amount without referring to the admin export.

**Acceptance Criteria for Phase 43**:
- The PDF opens, is readable when zoomed, and contains every pair listed in design.md.
- Re-running steps 1–2 after changing `PARTICIPATION_FEE_NTD` regenerates a consistent report.

**Implementation notes (2026-10-01)**:
- **Verification**: `npx tsc --noEmit` clean; `npm run build` passes. Tests: 21 passed / 3 failed / 15 skipped, against a baseline of 1 passed / 5 failed / 15 skipped. New: `utils/__tests__/payment.test.ts` (5), `backend/__tests__/payout.test.js` (6, own in-memory MongoDB), `components/__tests__/SurveyOutro.test.tsx` (5); `SurveyIntro.test.tsx` repaired (4). Still failing, unchanged and out of scope: the 3 stale `AdminView.test.tsx` tests and `new-data-model.test.js` (needs a MongoDB on localhost).
- **Baseline from a clean checkout**: the "before" set was captured from a git worktree of `934e945` via `capture.mjs --app <dir>` (design.md Phase 40), so `meta.json` records a clean, baseline-identical source.
- **Randomness fix**: the Tailwind CDN runtime also calls `Math.random`, which shifted the shuffled node positions between runs. The capture now gives the app bundle its own seeded stream; both sets were recaptured afterwards.
- **Found and fixed while repairing the intro test**: `MiniAvatar` gave every avatar of the same person the same clipPath id (`mini-avatar-<agent>`), producing duplicate DOM ids; ids are now unique per instance.
- **Capture hardening**: the Tailwind CDN runtime is cached and served locally, each shot has a 120-second limit, and page loads retry once. Two runs stalled for ~17 minutes at a time with almost no CPU use — the Mac was sleeping, not the tooling hanging.
- **Fixture replay**: the capture replays the completed participant's debrief visit (one idempotent `drawRealisedRound`) so the payment ledger shows a real payout, as it would for every real finisher.
- **Pending PI decisions**: `PARTICIPATION_FEE_NTD` (Open Question #8), `PAYMENT_TIMELINE_TEXT` (#9), and approval of the caption and payment copy.

---

## Phase 44: Full-Flow E2E Test with Review Report (NFR-8)

**Status**: ✅ Complete (2026-11-15)

**Objective**: One command runs admin launch → invite link → participant survey → debrief → payment ledger and writes a screenshot report. See design.md Phase 44.

- [x] **TASK-4401**: Add NFR-8 and BUG-008 (partner pairing never matches) — [`docs/requirements.md`](requirements.md) [NFR-8]
- [x] **TASK-4402**: Write the Phase 44 design — [`docs/design.md`](design.md) [NFR-8]
- [x] **TASK-4403**: Build the harness — [`scripts/e2e/full-flow.mjs`](../scripts/e2e/full-flow.mjs) [NFR-8]
  - In-memory MongoDB, spawned `server.js` (`CLIENT_ORIGIN` = base URL), Chrome, cached Tailwind route, Turnstile stub, teardown in `finally`.
- [x] **TASK-4404**: Drive the journey — admin launch (UI) → participant A (full) → participant B (partial) → DB checks [NFR-8]
- [x] **TASK-4405**: Check the ledger — download Export Payments, parse it, compare with the DB and the debrief; add `npm run test:e2e` and ignore `test-results/` [NFR-8, REQ-408.7]
- [x] **TASK-4406**: Write the report — `shot()`/`check()` recorders, `report.html` (summary, money trail, steps, ledger, known issues) and `report.pdf` [NFR-8]

**Acceptance Criteria for Phase 44**:
- `npm run test:e2e` exits 0 (40/40 after Phase 45), and the money trail shows the same amount at every stage.
- Breaking the ledger amount makes it exit 1, and the report still contains every screenshot and marks the failed check.

**Implementation notes (2026-11-15)**:
- **Result**: 38/40 checks pass in ~45 s. Debrief = after reload = email step = DB `payoutNtd` = recomputed payout = ledger total. The 2 failures are the registration code (`unknown`) in the DB and in the ledger → **BUG-009**, which the debrief reload triggers. A probe run without the reload passed 40/40.
- **BUG-008 confirmed** by the server log: `opponentProbs matched=0/5 fallback=5`.
- **Deviations from the plan**: (1) The admin UI's minimum for scenarios/participant is 5, so A answers 5 scenarios, not 2. (2) The intro's「開始實驗！」always opens the Turnstile modal, so the Cloudflare script is stubbed and the real dev `/api/turnstile/verify` sets the cookie (no cookie injection). (3) B gets a different `timezoneId`/`locale`; otherwise both contexts share one FingerprintJS ID and B would resume A's session.
- **Legend "?"**: the graph legend draws a permanent sample "?", so `revealAll` stops once a click reveals nothing, and the check uses the「開始決策」button instead of counting markers.

---

## Phase 45: Registration Code Survives a Refresh (REQ-403.1, BUG-009)

**Status**: ✅ Complete (2026-11-15)

- [x] **TASK-4501**: Add REQ-403.1 and mark BUG-009 fixed — [`docs/requirements.md`](requirements.md) [REQ-403.1]
- [x] **TASK-4502**: Write the Phase 45 design — [`docs/design.md`](design.md) [REQ-403.1]
- [x] **TASK-4503**: Persist, restore and clear the code; never save `unknown` — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-403.1]
- [x] **TASK-4504**: Unit tests (restore after remount, empty code → step 1) — [`components/__tests__/SurveyOutro.test.tsx`](../components/__tests__/SurveyOutro.test.tsx) [REQ-403.1]
- [x] **TASK-4505**: Run `npm run test:e2e` → 40/40 [NFR-8]

**Implementation notes (2026-11-15)**:
- **Verification**: `npm run test:e2e` → PASS 40/40 (exit 0). Unit suite 23 passed / 3 failed / 15 skipped; the failures are the pre-existing stale `AdminView.test.tsx` tests and `new-data-model.test.js` (needs a local MongoDB). Both new `SurveyOutro` tests fail against the pre-fix component. `npx tsc --noEmit` clean.
- **Test environment**: Node 26 shadows jsdom's `localStorage` with its own global, which is undefined without `--localstorage-file`, so the new tests stub it. This also exercised the no-storage fallback (no crash; in-memory only).
- **Found, not fixed**: `App.handleSurveyComplete` catches a failed `completeSurvey` and still shows the done screen, so a participant whose save failed is told they are finished but is missing from the payment ledger. Candidate for its own BUG entry.

---

## Phase 46: E2E Edge Cases (NFR-8.1)

**Status**: ✅ Complete (2026-11-15) — green since Phase 48 fixed BUG-010 (2026-11-16)

- [x] **TASK-4601**: Add the EC-1…EC-13 catalogue to NFR-8 — [`docs/requirements.md`](requirements.md) [NFR-8.1]
- [x] **TASK-4602**: Write the Phase 46 design — [`docs/design.md`](design.md) [NFR-8.1]
- [x] **TASK-4603**: Step dependencies (`needs`) and observation checks in the harness/report [NFR-8.1]
- [x] **TASK-4604**: EC-1, EC-2, EC-13 in the existing admin and participant A steps [NFR-8.1]
- [x] **TASK-4605**: Participant C: leave, refresh, return, Back, finish (EC-3…EC-6) and return after completing (EC-7) [NFR-8.1]
- [x] **TASK-4606**: Another device with the same code + admin invalidation + ledger re-export (EC-8) [NFR-8.1]
- [x] **TASK-4607**: Full group (EC-9), non-Chrome and unknown link (EC-10, EC-11), API guards (EC-12) [NFR-8.1]
- [x] **TASK-4608**: Run, log every failure as a BUG with its root cause [NFR-8.1]

**Implementation notes (2026-11-15)**:
- **Result**: 73/76 checks, 10 observations, ~100 s. Pass: EC-1, 2, 3, 4, 5, 7, 8, 10, 12, 13. Observed: EC-6 (Back is redirected forward), EC-11. Fail: EC-9, three checks → **BUG-010** (group never marked completed; new visitor gets an 18-scenario session of already-full scenarios; no 「無法參與實驗」).
- **Observations needing a decision**: requirements.md Open Questions #10–#13 (duplicate code from a second device, unknown-link UX, completed submissions editable through the API, Back behaviour).
- **Harness**: steps declare `needs`, so a broken step only skips the steps that depend on it; observations (ℹ) are shown but never fail the run; the report has an Edge cases table and an Observations table.

## Phase 47: Test-Case Roadmap (NFR-8.2)

**Status**: ✅ Complete (2026-11-15)

- [x] **TASK-4701**: Add NFR-8.2 (roadmap) to requirements.md [NFR-8.2]
- [x] **TASK-4702**: Write the Phase 47 design [NFR-8.2]
- [x] **TASK-4703**: `ROADMAP` stage table + guard that every EC is placed exactly once [NFR-8.2]
- [x] **TASK-4704**: Render the roadmap section (rail, happy-path badge, linked EC chips, legend, counts) and anchor step sections as `#step-<id>` [NFR-8.2]
- [x] **TASK-4705**: Re-run `npm run test:e2e` and check the roadmap in report.html and report.pdf [NFR-8.2]

## Phase 48: Full Group Closes, Final Answers, Unknown Link (BUG-010, REQ-402.4, REQ-405.1, REQ-405.2)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-4801**: Requirements: REQ-309 note, REQ-402.4, REQ-405.1, REQ-405.2, EC-6/9/11/12 expectations, BUG-010 fixed, Open Questions #11–#13 resolved
- [x] **TASK-4802**: Design: Phase 48
- [x] **TASK-4803**: `SessionGroup.status` (model, typeDef, `toGroupGraph`, client query, `types.ts`) [REQ-309]
- [x] **TASK-4804**: `refreshGroupStatus` in `completeSurvey` and `invalidateSubmission`; `startMixedSession` refuses a completed group [REQ-309, REQ-405.1]
- [x] **TASK-4805**: `saveSurveyAnswer` locks answered scenarios and completed submissions, same-value retry idempotent [REQ-402.4]
- [x] **TASK-4806**: `App.tsx` entry gate (`full` / `unknown`) on arrival and on `GROUP_FULL` at intro end [REQ-405.1, REQ-405.2]
- [x] **TASK-4807**: Toast on the existing Back trap (`SurveyView`) + earlier-scenario URL guard (`App.tsx`) [REQ-402.4]
- [x] **TASK-4808**: Backend unit tests (status, GROUP_FULL, ANSWER_LOCKED); e2e EC-6/9/11/12 as checks; re-run [NFR-8.1]

**Implementation notes (2026-11-16)**:
- **Result**: `npm run test:e2e` PASS, 89/89 checks, 3 observations (EC-3 intro restarts, EC-8 duplicate code ×2 — Open Question #10 still open), ~80 s. Backend `group-closing.test.js` 5/5.
- **Back was already trapped**: `SurveyView` pushes a duplicate `'blocked'` history entry, so Back never left the page; the gap was only the missing explanation. The toast was added there; the `App.tsx` guard covers opening an earlier scenario's URL.
- **E2E flake fixed**: `setSlider` now steps through a neighbouring value first — when the random start (REQ-402.1) equalled the target value, React saw no change and the confirm button stayed locked (1 in 101 per scenario).

## Phase 49: Mixed Mode Cost Estimate (REQ-314)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-4901**: Requirements: REQ-314 + change log
- [x] **TASK-4902**: Design: Phase 49
- [x] **TASK-4903**: `SetupPanel.tsx`: `minCost`/`maxCost` in `mixedStats` from `MIN_TOTAL_NTD`/`MAX_TOTAL_NTD` [REQ-314]
- [x] **TASK-4904**: 「Est. Cost」card in the Mixed Setting Preview + cost line in the confirm modal [REQ-314]
- [x] **TASK-4905**: `tsc` + check the card on `/admin/setup/mixed` [REQ-314]


## Phase 50: Actual Payout on the Group Page (REQ-408.9)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-5001**: Requirements: REQ-408.9 + change log
- [x] **TASK-5002**: Design: Phase 50
- [x] **TASK-5003**: `GroupDetailView.tsx`: share the ledger's `payable` filter, compute total / avg / missing / budget [REQ-408.9]
- [x] **TASK-5004**:「Actual Payout」card in the Statistics Cards grid [REQ-408.9]
- [x] **TASK-5005**: `tsc` + check the card against the Export Payments CSV on a group with completed submissions [REQ-408.9]

## Phase 51: Batch Is the Only Launch Mode (REQ-207)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-5101**: Requirements: REQ-207, REQ-201/202/204–206 superseded, overview + change log
- [x] **TASK-5102**: Design: Phase 51
- [x] **TASK-5103**: `SetupPanel.tsx`: remove the toggle and the manual launch path; `launchMode` from `readOnly` [REQ-207]
- [x] **TASK-5104**: `App.tsx` / `AdminView.tsx`: default routes and Setup nav → `/admin/setup/mixed`; redirect bare `/admin/setup/manual`; drop unused state [REQ-207]
- [x] **TASK-5105**: `tsc`; check `/admin/setup/mixed`, `/admin/setup`, `/admin/setup/manual` redirect, and the history read-only view; `npm run test:e2e` [REQ-207]

## Phase 52: Remove Single-Session History; Rename「View Sessions」(REQ-207 amended, REQ-208)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-5201**: Requirements: REQ-207 amended, REQ-208, REQ-315 removed, change log
- [x] **TASK-5202**: Design: Phase 52
- [x] **TASK-5203**: `App.tsx`: redirect `/admin/setup/manual` and `/admin/view/manual`; drop `onSave` [REQ-207]
- [x] **TASK-5204**: `AdminView.tsx`: remove the history tab and read-only view; rename nav to「View Sessions」[REQ-208]
- [x] **TASK-5205**: `SetupPanel.tsx`: delete the manual layout; delete `HistoryTable.tsx` and `fetchAllSessions` [REQ-207]
- [x] **TASK-5206**: Rewrite `AdminView.test.tsx`; `tsc`; vitest; browser check; `npm run test:e2e` [REQ-207, REQ-208]

**Notes**: `backend/__tests__/new-data-model.test.js` has 3 failures (`createBatchSessions` ×2, session full gate) that also fail on the previous commit `3286f31`; unrelated to this phase.

## Phase 49: Phone Run of the E2E Test (NFR-8.3)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-4901**: Requirements NFR-8.3; design Phase 49
- [x] **TASK-4902**: `E2E_DEVICE=mobile` profile for participant contexts; admin stays desktop; mobile Firefox for EC-10
- [x] **TASK-4903**: `-mobile` output folder and report title; `test:e2e:mobile` npm script
- [x] **TASK-4904**: Run it and fix anything that only fails on the phone


**Implementation notes (2026-11-16)**:
- **Result**: phone run PASS 91/91 checks, 3 observations, 42 screenshots (`test-results/e2e/20261116_214702-mobile/`); desktop re-run PASS.
- **Two phone-only test fixes**: (1) the EC-6 toast covers the graph on a phone for 2 s, so the next tap hit the toast — the test now waits for it to fade (a real participant just taps again); (2) the EC-10 Firefox device shared A's timezone and locale, and on a phone that gives the same fingerprint as A, so it was treated as "A again" — it now has its own timezone. No app change was needed.

## Phase 50: One Report for PC and Phone (NFR-8.3)

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-5001**: Requirements NFR-8.3 (combined report); design Phase 50
- [x] **TASK-5002**: `full-flow.mjs`: `E2E_OUT` override + `results.json`
- [x] **TASK-5003**: `run-both.mjs`: run PC then phone, combined `report.html` + `report.pdf`, exit code
- [x] **TASK-5004**: npm scripts `test:e2e` (both), `test:e2e:pc`, `test:e2e:mobile`; run and review


**Implementation notes (2026-11-16)**:
- **Result**: `npm run test:e2e` PASS — PC 91/91, phone 91/91, 13/13 edge cases pass on both, ~3 min in total. One combined report: `test-results/e2e/20261116_215351/report.pdf` (39 pages); each device's own report stays in `pc/` and `phone/`.

## Phase 51: Legend and Captions Open on Tap (REQ-409.5); Admin Pages PC-Only in the Report

**Status**: ✅ Complete (2026-11-16)

- [x] **TASK-5101**: Requirements REQ-409.5 (+ IRB note), NFR-8.3 wording; design Phase 51
- [x] **TASK-5102**: `GraphLegend` / `FigureCaption` as `<details>` closed by default [REQ-409.5]
- [x] **TASK-5103**: Unit test: closed by default, opens on click [REQ-409.5]
- [x] **TASK-5104**: E2E check on intro step 4 [REQ-409.5]
- [x] **TASK-5105**: Combined report: drop desktop-width shots from the phone run; PC full width when unpaired [NFR-8.3]


**Implementation notes (2026-11-16)**:
- **Result**: `npm run test:e2e` PASS — PC 94/94, phone 94/94 (`test-results/e2e/20261116_220348/report.pdf`). On a phone the scenario screen now fits the graph, the closed 圖例 and the slider in one screen.
- **E2E fix**: `revealAll` now ignores the legend's sample "?" (`svg:not(details svg) text`); inside the closed `<details>` it is hidden and can no longer be clicked.
- **Not re-run**: the IRB screenshot set (`npm run irb:shots`) still shows the legend/captions open; re-capture if the IRB packet must show the new closed state.

## Phase 52: Post-Survey Questionnaire Q1–Q8 (REQ-416)

**Status**: ✅ Complete (2026-11-17) — reviewed; Q2 typo and question marks fixed

- [x] **TASK-5201**: Requirements REQ-416; design Phase 52
- [x] **TASK-5202**: `utils/questionnaire.js` (questions + validation) with unit tests [REQ-416]
- [x] **TASK-5203**: Submission model, GraphQL types, `completeSurvey` arg + validation, admin-only field resolver, backend tests [REQ-416]
- [x] **TASK-5204**: Outro step 3 questionnaire page; steps renumbered 1–5; localStorage restore; required check on 送出 [REQ-416]
- [x] **TASK-5205**: Client `completeSurvey` + `App.handleSurveyComplete` pass the answers; Export CSV columns Q1–Q8 [REQ-416]
- [x] **TASK-5206**: E2E `finishOutro` answers Q1–Q8 + DB check; screenshots for review
- [x] **TASK-5207**: User reviews the questionnaire page (Q2 「曆史」→「歷史」, full-width 「？」 throughout, copy approved); then re-run `npm run test:e2e` (PC + phone report)
- [x] **TASK-5208**: Options to the right of the question text on screens ≥ 640px; below it on a phone [REQ-416]
- [x] **TASK-5209**: Restyle the questionnaire with the 理解測試 quiz's design (frame, title bar, amber panel, rows, chips, 下一步 button) [REQ-416]


**Implementation notes (2026-11-17)**:
- **Verification run** (before review): `npm run test:e2e` PASS on PC and phone (`test-results/e2e/20261117_160239/`); new checks: Q1–Q8 rendered, required gate, answers survive a reload, stored answers = clicked answers, hidden from `submission(id)` without admin, Q1–Q8 columns in Export CSV. Unit: `questionnaire.test.ts` 3/3, `backend/__tests__/questionnaire.test.js` 4/4, `SurveyOutro.test.tsx` 10/10.
- **Copy to review**: page title 「問卷」 and intro 「請依照您的看法回答以下問題，答案沒有對錯。」 are new wording; the debrief note now says the payment goes to the email 「稍後填寫」 (was 「下一步填寫」).
- **Not updated**: `scripts/irb-shots/shots.mjs` routes `/survey/outro/3` (email) and `/survey/outro/4` (done) now point at the questionnaire and the email page.

## Phase 53: Questionnaire Data-Capture Fixes (BUG-011, BUG-012; REQ-402.4, REQ-403.2, REQ-408.8, REQ-416)

**Status**: ✅ Complete (2026-11-17)

- [x] **TASK-5301**: Requirements (BUG-011, BUG-012, REQ-403.2, amended REQ-402.4 / REQ-408.8 / REQ-416); design Phase 53
- [x] **TASK-5302**: `completeSurvey` requires the questionnaire (schema `!` + always validate) [REQ-416]
- [x] **TASK-5303**: `completeSurvey` atomic not-completed guard → `ALREADY_COMPLETED` [BUG-012, REQ-402.4]
- [x] **TASK-5304**: `Submission.demographics` admin-only field resolver [REQ-408.8]
- [x] **TASK-5305**: `App.handleSurveyComplete` rethrows, navigates only on success, `ALREADY_COMPLETED` = success [BUG-011, REQ-403.2]
- [x] **TASK-5306**: Questionnaire answers in `sessionStorage` [REQ-416]
- [x] **TASK-5307**: Backend + unit regression tests; `group-closing.test.js` sends Q1–Q8
- [x] **TASK-5308**: E2E API participants send Q1–Q8; EC-12 checks; re-run `npm run test:e2e` (PC + phone)

**Implementation notes (2026-11-17)**:
- **Verification**: `npm run test:e2e` PASS — PC 113/113, phone 113/113 (`test-results/e2e/20261117_183207/`). New checks: the first 送出 with its request blocked shows 「提交失敗，請稍後再試」, stays on step 4, keeps the answers, leaves the submission incomplete, and the retry completes; code/email hidden from `submission(id)` without admin; re-completing and completing without the questionnaire rejected, A's data unchanged. Unit + backend: 26/26 in the four touched files; `tsc` clean. Full vitest: the 3 known `new-data-model.test.js` failures only.
- **Caught by the e2e**: the first run failed because the client still declared `$questionnaire` nullable against the now-required argument — before BUG-011's fix this would have shown the done page with nothing saved. The `questionnaire` parameter is now required in the TypeScript signatures too.
- **Decided 2026-11-17**: answers stay stored as the option text (wording fixed for the study); no 「不願回答」 option — the IRB approved the questionnaire as is.
- [x] **TASK-5309**: Legacy scripts `scripts/test-new-api.mjs` and `scripts/test-manual-mode-e2e.mjs` send Q1–Q8 to `completeSurvey`. They were already broken before Phase 53 (`test-new-api.mjs` imported the removed `SessionSetup.js` model; both lacked the REQ-100 Turnstile cookie at `startSurvey`); fixed both, and `test-new-api.mjs` reads `VITE_GRAPHQL_ENDPOINT` like the other. Both pass against a throwaway server + in-memory MongoDB.

## Phase 54: Response Time, Safe Answer Saves, Research CSV Columns (REQ-402.5, REQ-402.6, BUG-013, REQ-362)

**Status**: ✅ Complete (2026-11-17) — from the production data review; partner pairing (BUG-008) and exporting the per-round draw were reviewed and left as is

- [x] **TASK-5401**: Requirements REQ-402.5, REQ-402.6, BUG-013, REQ-362 columns; design Phase 54
- [x] **TASK-5402**: `saveSurveyAnswer` requires and stores `responseTime` [REQ-402.5]
- [x] **TASK-5403**: SurveyView measures the time per scenario; client sends it [REQ-402.5]
- [x] **TASK-5404**: SurveyView stays on the scenario when the save fails [REQ-402.6, BUG-013]
- [x] **TASK-5405**: Research CSV: Registration Code instead of Age/Gender/Education; no email [REQ-362]
- [x] **TASK-5406**: Backend + unit tests; e2e checks; legacy scripts send `responseTime`
- [x] **TASK-5408**: BUG-014 — `navigateWithSession` / `handleNext` read the live URL; e2e checks the first scenario URL carries the session. Remote-run options in the e2e: `E2E_BASE_URL`, `E2E_MONGODB_URI`, `E2E_ADMIN_PASSWORD`, `E2E_WIPE_DB`; `E2E_LATENCY_MS` and `E2E_PRESET_TURNSTILE` for local reproduction
- [x] **TASK-5407**: Local `npm run test:e2e`; after the user redeploys, production run + data report

**Implementation notes (2026-11-17)**:
- **First production run** (v40, `test-results/e2e/20261117_185107/`): every step passed except participant A's debrief reload on both devices — BUG-014. Everything A-dependent (DB check, ledger, EC-12) did not run. Turnstile is bypassed in the test browsers (unsigned cookie), so the real Cloudflare check is not covered.
- **Local verification**: `npm run test:e2e` PASS — PC 122/122, phone 122/122 (`test-results/e2e/20261117_191308/`); also PASS with `E2E_LATENCY_MS=400` (+ `E2E_PRESET_TURNSTILE=1`). Unit: 60 pass, the 3 known `new-data-model.test.js` failures.
- **Production run on v41** (`cce1ae2`): PASS — PC 122/122, phone 122/122, EC-1…EC-13 all pass (`test-results/e2e/20261117_192852/`). The first v41 attempt broke only because the e2e clicked Export Payments while the slower 「Mark Invalid」 dialog was still closing (exports work on production when checked by hand); the e2e now waits for the dialog to close.
- **Data report**: `docs/data-capture-report.html` / `.pdf` — per-item storage, production values, exports, safeguards, analysis notes. New finding recorded there: the research CSV's 「Answered At」 is epoch milliseconds, not ISO (exact, but unlike the other time columns).
- **Production database cleared** 2026-11-17 11:36 UTC (only e2e test data; collections and indexes kept).

## Phase 55: Simulated Pilot Data Check (NFR-9)

**Status**: ✅ Script complete (2026-11-17); D8 fails on purpose — open finding below

- [x] **TASK-5501**: Requirements NFR-9; design Phase 55
- [x] **TASK-5502**: `scripts/sim/simulate.mjs` — boot server + in-memory DB, admin login, launch Mixed group
- [x] **TASK-5503**: Personas (fixed deck of 20, so every persona appears) + concurrent recruitment until `GROUP_FULL`; ground truth recorded
- [x] **TASK-5504**: Export research CSV + payment ledger through the admin page (Chrome)
- [x] **TASK-5505**: Checks D1–D8, A1–A2, observations; `report.md`; exit code
- [x] **TASK-5506**: `npm run sim:data` script; run it and record the result here

**Implementation notes (2026-11-17)**:
- **Result** (default study: 162 scenarios × target 2 ≈ 33 participants estimated): D0–D7, A1, A2 pass — every answer, response time, Q1–Q8, code, payout and both CSVs match what was sent; retries are not double counted; no email in the research CSV; the planted 給予 effect (slope 0.41) and the planted straight-liners / speeders are recoverable from the CSV alone.
- **Finding — D8 fails**: the group closes when `responseCount ≥ target`, but `responseCount` also counts answers from participants who never complete. 5–21 of 162 scenarios end with fewer than 2 completed answers (depends on the run).
- **Finding — oversampling grows with concurrency**: 8 at a time → 51 participants, 165 answers above target; 1 at a time → 40 participants, 62 above target. Many participants who start at the same moment are given the same least-answered scenarios, because `responseCount` only rises when answers are saved. Real participants are in progress for minutes, not milliseconds, so the overlap in a live recruitment will be larger. This affects the REQ-314 cost estimate.
- Both findings need a decision (count only completed answers? reserve scenarios at assignment?) before real recruitment.

## Phase 56: Clear Names for Code and Email, Boolean Answers, Consent, Device (BUG-015, REQ-403, REQ-416, REQ-417, REQ-418)

**Status**: 🚧 In progress (2026-11-18)

- [x] **TASK-5601**: Requirements (BUG-015, REQ-403, REQ-416 storage/export, REQ-417, REQ-418, REQ-341/362/408 notes); design Phase 56
- [x] **TASK-5602**: Model + GraphQL: `registrationCode`, `email`, Boolean `answer`, consent + device fields; `demographics` removed; admin-only resolvers [BUG-015, REQ-416, REQ-417, REQ-418]
- [x] **TASK-5603**: `completeSurvey` contact validation; `startSurvey` consent requirement + device capture (`utils/device.js`) [REQ-403, REQ-417, REQ-418]
- [x] **TASK-5604**: `utils/questionnaire.js` Boolean validation + `answerValue` / `answerLabel` [REQ-416]
- [x] **TASK-5605**: Welcome consent checkbox + `utils/consent.ts`; client `startSurvey` sends consent [REQ-417]
- [x] **TASK-5606**: Outro / App / client send `registrationCode`, `email`, Boolean answers [BUG-015, REQ-416]
- [x] **TASK-5607**: Admin CSV + ledger columns; progress stage 「Outro」 [REQ-362, REQ-341]
- [x] **TASK-5608**: Unit + backend tests; e2e; `scripts/sim`, `scripts/irb-shots`, legacy scripts
- [x] **TASK-5609**: Local e2e; after redeploy: production e2e, update `docs/data-capture-report`, clear the production database — v42 (`e5a5a8d`): PC 130/130, phone 130/130, EC-1…EC-13 pass (`test-results/e2e/20261119_103241/`, run from a worktree at the deployed commit); data report regenerated; database cleared 2026-11-19 02:41 UTC

**Implementation notes (2026-11-18)**:
- **Decisions**: Boolean `true` = the first option (同意 / 好 / 管制) for every question; research CSV shows `true` / `false`. Consent = explicit checkbox on the welcome page (participant-facing text added — check with the IRB). Phase numbered 56 because Phase 55 / TASK-55xx is the simulated pilot data check.
- **Local verification**: `npm run test:e2e` PASS — PC 130/130, phone 130/130 (`test-results/e2e/20261118_181432/`): consent box gates 開始實驗; DB has `registrationCode`, `email`, Boolean answers, consent, `deviceType` (desktop on PC, mobile on the phone run), `userAgent`; no `demographics`; all hidden without admin; CSV `true` / `false` and the new columns; a submission without consent is refused. Unit: 65 pass, the 3 known `new-data-model.test.js` failures. `npm run sim:data`: D1–D7, A1–A2 pass; D8 fails as before (open Phase 55 finding, 9/162 short this run).
- **Also removed**: dead `/survey/demographics` route and the commented-out demographics form in `SurveyView`; `fix-incomplete-submission.mjs` no longer writes a placeholder `unknown` code.


## Phase 57: Signed Bot-Check Cookie (BUG-016, REQ-102.1, NFR-3)

**Status**: 🚧 In progress (2026-11-19)

- [x] **TASK-5701**: Requirements (BUG-016, REQ-102.1, NFR-3, EC-12); design Phase 57
- [x] **TASK-5702**: `server.js`: sign the cookie with `JWT_SECRET` (2 h expiry, `tv` claim), verify on read; fail startup in production without `JWT_SECRET`; drop `'fallback_secret'` from admin login [REQ-102.1, NFR-3]
- [x] **TASK-5703**: Test scripts get a real cookie from `POST /api/turnstile/verify` instead of `turnstile_verified=true` (e2e, sim, irb-shots, legacy scripts)
- [x] **TASK-5704**: EC-12: forged `turnstile_verified=true` is rejected by `/api/turnstile/status` and `startSurvey` [REQ-102.1]
- [ ] **TASK-5705**: Local `npm run test:e2e` + `npm run sim:data`; after redeploy, production e2e through the real Turnstile widget

**Implementation notes (2026-11-19)**:
- **Server**: cookie value = `jwt.sign({ tv: 1 }, JWT_SECRET, { expiresIn: '2h' })`; read with `jwt.verify` + `tv === 1`. Production throws at startup without `JWT_SECRET` (Heroku `pd-human-agent-survey` has a 64-char secret set, so no config change). Admin login uses the same constant instead of `'fallback_secret'`.
- **Checked by hand** against a local server: `turnstile_verified=true` → `verified: false`; cookie from `/api/turnstile/verify` → `true`; tampered, expired and admin-JWT-as-cookie → `false`; `NODE_ENV=production` without `JWT_SECRET` → refuses to start.
- **Scripts**: new `scripts/turnstile-cookie.mjs` (`turnstileCookieValue(baseUrl)`) used by sim, irb-shots and the three legacy API scripts. The e2e reuses the cookie the server issued to the first browser that passed the Turnstile modal for its API-only participants. `E2E_PRESET_TURNSTILE` removed.
- **Remote e2e** (`E2E_BASE_URL`): no stub, the real widget loads and its token is checked by Cloudflare; waits up to 2 min for `cf-turnstile-response`. If headless Chrome is challenged, rerun with `E2E_HEADED=1` and tick the box.
- **Local verification**: `npm run test:e2e` PASS — PC 132/132, phone 132/132 (`test-results/e2e/20261119_102516/`), incl. the two new EC-12 forged-cookie checks. `npm run sim:data`: D0–D7, A1–A2 pass; D8 fails as before (open Phase 55 finding, 6/162 short). Unit: 65 pass, the 3 known `new-data-model.test.js` failures.

## Phase 58: Email in the Research CSV, Welcome Footer Wording (REQ-362, REQ-417)

**Status**: 🚧 In progress (2026-11-19)

- [x] **TASK-5801**: Requirements (REQ-362 columns incl. Email, consent and device; REQ-417 footer; NFR-9 D6); design Phase 58
- [x] **TASK-5802**: Research CSV 「Email」 column [REQ-362]
- [x] **TASK-5803**: Welcome footer 「本研究使用瀏覽器指紋技術防止重複提交」 [REQ-417]
- [x] **TASK-5804**: e2e + sim checks for the Email column
- [ ] **TASK-5805**: Local e2e + sim; commit and push `main` (GitHub → Heroku auto-deploy, with Phase 57); production e2e through the real Turnstile widget; regenerate the data report; clear the production database

**Implementation notes (2026-11-19)**:
- **Local verification** (with Phase 57): `npm run test:e2e` PASS — PC 132/132, phone 132/132 (`test-results/e2e/20261119_110722/`); `npm run sim:data`: D0–D7 (incl. the new Email check) and A1–A2 pass, D8 fails as before (open Phase 55 finding, 6/162 short). Unit: 65 pass, the 3 known `new-data-model.test.js` failures.

