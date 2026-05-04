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

## Backlog / Future Enhancements

### Features (Out of Scope Today)

- [ ] **TASK-A01**: CSV export of submissions
  - Export button in admin UI
  - Include submission data + session metadata
  - [Backlog]

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
    - `opponentNode` → "對手"
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
- "對手" for opponent
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
☐ Labels are correct: "您", "對手", "參與者 [group]", "參與者 [group]"
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

**Risk: Very Low** — Cosmetic change only, no backend dependencies.
