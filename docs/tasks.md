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
| Phase 35 | 📋 Planned | — | Debrief screen with realised round and payment (REQ-407) |

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

## Phase 35: Debrief Screen with Realised Round and Payment (REQ-407)

**Goal**: Insert a debrief step into `SurveyOutro` between the code step and the email step. The screen shows each round's decisions and highlights the randomly drawn 實現回合 with its cash reward (點數 × 100 NTD). Opponent data and point values are placeholder for this phase.

- [ ] **TASK-3501**: Renumber existing steps in `SurveyOutro.tsx` — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407]
  - Change `if (step === 2)` (email block) to `if (step === 3)`.
  - Change `setStep(3)` inside `handleFinalSubmit` to `setStep(4)`.
  - Change the final `return` fallback (step 3 completion card) to guard with `if (step === 4)` and add a final `return null` after it.

- [ ] **TASK-3502**: Add `selectedRoundIdx` state initialised once — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407]
  - Add: `const [selectedRoundIdx] = useState<number>(() => Math.floor(Math.random() * Math.max(results.length, 1)));`
  - No setter needed — index must never re-randomise.

- [ ] **TASK-3503**: Build the debrief step 2 block — [`components/SurveyOutro.tsx`](../components/SurveyOutro.tsx) [REQ-407]
  - Add `if (step === 2)` block rendering a full-screen card with:
    - **Header**: title「實驗結果回顧」, subtitle「以下是您每回合的決策記錄」.
    - **Round table**: one row per `results[i]` with columns: 回合 (1-based), 您的決策 (`${Math.round(p*100)}%` + 合作/不合作 label), 對手的決策 (`—` placeholder), 點數 (`—` placeholder).
    - **Selected row styling**: `results[selectedRoundIdx]` row gets `bg-amber-50` background, left `border-l-4 border-amber-400` accent, and a `🎯 抽中` badge on the round-number cell.
    - **Payment summary card** below the table:
      - Label「您的獎勵」.
      - 抽中回合: 第 `{selectedRoundIdx + 1}` 回合.
      - 點數: `—` (placeholder, to be wired with opponent data).
      - 金額公式: `— × 100 = — 元` (placeholder).
    - **繼續 button**: `onClick={() => setStep(3)}`, always enabled.

- [ ] **TASK-3504**: Verify step flow end-to-end — manual browser test [REQ-407]
  - Step 1 (code) → click 下一步 → lands on step 2 (debrief).
  - Selected round is highlighted amber; all other rows are plain.
  - Payment card shows correct round number; point fields show `—`.
  - Click 繼續 → step 3 (email). Submit email → step 4 (completion). No regressions.

**Acceptance Criteria for Phase 35**:
- Debrief screen is shown after code entry and before email collection.
- One and only one round is highlighted as 🎯 抽中; selection does not change on re-render.
- Opponent and point columns display `—` (data wiring deferred).
- Payment card shows correct round number derived from the random selection.
- All downstream steps (email → completion) still function correctly.
