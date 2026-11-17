# System Design

This document describes how the PD Human-Agent Data Collect Demo is built using a **scenario-centric architecture**. Every section traces back to the requirements in [`requirements.md`](requirements.md).

**Implementation Status**: 🟢 **Phase 12-16 Complete** | 🟡 **Phase 17 Partial** (Heatmap deferred)

---

## Overview

A two-tier web application with a fundamentally refactored data model:

- **Frontend** — React 19 SPA built with Vite, routed by `react-router-dom@7`, styled by TailwindCSS (loaded from CDN) plus Material UI components. Communicates with backend exclusively over GraphQL with REST escape hatches for admin login and Turnstile.
- **Backend** — Node 20 Express 5 server hosting Apollo Server 5 (GraphQL), persisting through Mongoose to MongoDB.
- **Bot protection** — Cloudflare Turnstile with server-side `httpOnly` cookie.

**Architecture Innovation**: 
The system uses a **scenario-centric data model** where `Scenario` is the atomic unit and `Session` is a lightweight container. This unified design eliminates mode-specific code branches and enables flexible data collection strategies including Manual, Batch, and Mixed modes.

---

## Implementation Status Summary

| Phase | Status | Completion Date | Notes |
|-------|--------|-----------------|-------|
| Phase 1-11 | ✅ Complete | 2026-04-28 | Baseline features |
| Phase 12 | ✅ Complete | 2026-04-28 | Data models (Scenario, Session, etc.) |
| Phase 13 | ✅ Complete | 2026-04-28 | GraphQL API refactor |
| Phase 14 | ✅ Complete | 2026-04-28 | Utils layer |
| Phase 15 | ✅ Complete | 2026-04-29 | Admin UI (Manual, Batch, Mixed) |
| Phase 16 | ✅ Complete | 2026-04-29 | Survey flow (all modes) |
| Phase 17 | 🟡 Partial | Ongoing | Testing complete, heatmap deferred |
| Phase 30 | 📋 Planned | — | Submission invalidation (REQ-350..354) |
| Phase 31 | 📋 Planned | — | Complete submission data CSV export (REQ-360..363) |
| Phase 34 | 📋 Planned | — | Partner node peach-pink highlight (REQ-406) |
| Phase 35 | ✅ Complete | 2026-07-02 | Debrief screen with realised round, real opponent pairing, and persisted probabilistic payment (REQ-407, REQ-407.1) |
| Phase 40 | ✅ Complete | 2026-10-01 | IRB before/after capture tooling + baseline ("before") screenshots (NFR-7) |
| Phase 41 | ✅ Complete | 2026-10-01 | IRB comment 2 — points → payment conversion disclosure, persisted payout, payment ledger (REQ-408); fee and timing values pending PI (Open Questions #8, #9) |
| Phase 42 | ✅ Complete | 2026-10-01 | IRB comment 1 — figure legend, captions, minimum sizes (REQ-409); caption copy pending PI approval |
| Phase 43 | ✅ Complete | 2026-10-01 | IRB "after" screenshots + before/after PDF report + packet caption index (NFR-7, REQ-409.4) |

**Recent Updates**:
- 2026-04-29: Legacy API completely removed (~500 lines)
- 2026-04-29: Mixed Mode core functionality implemented
- 2026-05-04: NetworkGraph undefined bug fixed
- 2026-05-04: SurveyOutro completeSurvey bug fixed
- 2026-05-04: Scenario schema refined (scenarioIndex required, status simplified)
- 2026-05-04: Device fingerprinting design for participant identification (REQ-311)
- 2026-05-04: Mixed Mode config fields (`maxK`, `scenariosPerSession`, `targetSizePerScenario`) tightened to required (REQ-312) — see SessionGroup data model and Open Question #7
- 2026-05-04: Survey intro "關係結構" page now displays complete network history (REQ-405.1)
- 2026-05-04: **BUG FIXED** Admin history view read-only mode shows 0 active edges (BUG-003) — fixed by adding virtual activeEdgeIds field in toSessionGraph resolver
- 2026-05-05: URL-level mode differentiation design added — `SetupPanel.tsx` syncs `LaunchMode` toggle to `?mode=` query param via `useSearchParams` (REQ-204, REQ-205, REQ-206) — see Phase 26
- 2026-05-06: One-submission-per-participant enforcement (REQ-313) — three-layer fix: unique sparse index on `Submission`, `startSurvey` accepts `participantId` and returns existing submission on duplicate, client passes fingerprint ID — see Phase 27
- 2026-05-06: Submission progress tracking design added — `HistoryTable.tsx` enhanced submission detail view with progress bars and stage indicators (REQ-341, REQ-342) — see Phase 27
- 2026-05-06: **BUG FIXED** Mixed Mode session creation timing issue (BUG-004) — `startMixedSession` now deferred until after intro completion to match Manual Mode behavior and prevent duplicate sessions from React StrictMode — see Phase 28
- 2026-05-06: Submission invalidation feature designed (REQ-350..REQ-354) — new `isInvalid` field on `Submission`, `invalidateSubmission` mutation, cascading `submissionCount` and `Scenario.responseCount` corrections, admin UI filter — see Phase 30
- 2026-05-06: Complete submission data CSV export designed (REQ-360..REQ-363) — client-side CSV generation with row-per-answer format including full scenario configurations, demographics, timestamps, and validity flags — see Phase 31
- 2026-07-02: Debrief give/no-give outcome changed from a 50%-threshold rule to a persisted Bernoulli draw on the cooperation probability itself (REQ-407.1) — `drawRealisedRound` now also draws and persists `Submission.myDecisions`/`Submission.opponentDecisions` so the debrief screen and realised cash payout are stable across page refreshes; per-row probability percentages and the 50%-only "randomly decided" tooltip were removed from the UI — see Phase 35
- 2026-10-01: IRB revisions designed — shared payment module `utils/payment.js`, persisted `realisedPoints`/`payoutNtd`, consistent payment copy, payment ledger export and admin-guarded PII queries (REQ-408); `GraphLegend`, captions and larger figure elements (REQ-409); deterministic before/after screenshot tooling and PDF report (NFR-7) — see Phases 40–43

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph "Admin Experience"
        AdminUI[Admin Console UI]
        ManualConfig[Manual Mode Config]
        BatchConfig[Batch Mode Config]
        MixedConfig[Mixed Mode Config ✅]
    end
    
    subgraph "Participant Experience"
        SurveyUI[Survey UI]
        Turnstile[Turnstile Verification]
    end
    
    subgraph "Express Server"
        REST[REST endpoints]
        Apollo[Apollo Server /graphql]
        Static[Static dist/]
    end
    
    subgraph "MongoDB Collections"
        Scenario[(Scenario<br/>atomic unit)]
        Session[(Session<br/>container)]
        Submission[(Submission)]
        SessionGroup[(SessionGroup)]
    end
    
    AdminUI --> ManualConfig
    AdminUI --> BatchConfig
    AdminUI --> MixedConfig
    
    ManualConfig -->|creates| Scenario
    BatchConfig -->|creates many| Scenario
    MixedConfig -->|creates pool| Scenario
    
    ManualConfig -->|creates| Session
    BatchConfig -->|creates many| Session
    MixedConfig -->|dynamic create| Session
    
    Session -->|references| Scenario
    
    SurveyUI --> Turnstile
    SurveyUI --> Apollo
    Apollo --> Scenario
    Apollo --> Session
    Apollo --> Submission
    Apollo --> SessionGroup
    
    Submission -->|belongs to| Session
    Submission -->|references| Scenario
```

---

## Core Architectural Principle: Scenario-Centric Design

### The Unified Abstraction

```text
Scenario (atomic) → self-contained experiment condition
    ↓
Session (container) → participant experience (ordered list of scenario IDs)
    ↓
Submission → responses to a session's scenarios
```

**Key Insight**:
> All three launch modes (Manual, Batch, Mixed) are identical from the participant's perspective: they complete a Session. The difference is **how** that Session's scenarios are selected and composed, not **what** happens during completion.

### Three Modes, One Model

| Mode | Session Composition | Scenario Selection Logic | URLs Generated |
|------|---------------------|--------------------------|----------------|
| **Manual** | Admin manually selects edges → generates design matrix → creates scenarios → creates one session | Scenarios come from a single edge configuration | `/survey/welcome?sessionId=<uuid>` |
| **Batch** | For each of C(12,k) edge combinations → generate design matrix → create scenarios → create one session per combination | Scenarios grouped by edge combination, one session per group | `/survey/welcome?sessionId=<uuid>` (multiple URLs) |
| **Mixed** | Generate scenarios for all combinations k=1..maxK → pool all scenarios → dynamically select S scenarios per participant → create personalized session | Balanced selection from scenario pool (prioritize low `responseCount`) | `/survey/welcome?groupId=<uuid>&mode=mixed` (one URL, dynamic sessions) |

**No `launchMode` field needed** — the mode is implicit in the data structure.

---

## Data Models

**Implementation Status**: ✅ **COMPLETED 2026-04-28** - All models implemented and tested

UUIDs are used as primary keys (`_id: { type: String, default: () => randomUUID() }`) for `Scenario`, `Session`, and `SessionGroup`. `Submission` uses Mongoose default ObjectId.

### `Scenario` (New Model - Atomic Unit) ✅ 🔧 **REFINED 2026-05-04**

```javascript
// backend/models/Scenario.js
{
  _id: String (UUID),                    // Primary key
  
  // Experiment configuration (self-contained)
  focalNode: String,                     // 'A1' | 'A2' | 'B3' | 'B4'
  opponentNode: String,
  activeEdgeIds: [String],               // e.g., ['A1-A2', 'A2-B3']
  
  // Specific state (this scenario's condition)
  edgeStates: Map<String, String>,       // edgeId → 'give' | 'not give'
  scenarioIndex: Number (REQUIRED),      // Position in original design matrix (REQUIRED for traceability)
  
  // Ownership (traceability)
  groupId: String | null,                // Which SessionGroup created this
                                         //
                                         // WHY Scenario carries its own groupId (not derived from Session):
                                         //
                                         // 1. Creation-time orphan: In Mixed Mode, createMixedGroup bulk-creates
                                         //    the entire Scenario pool (hundreds–thousands) before any Session
                                         //    exists. Sessions are created lazily when participants arrive, so
                                         //    there is no Session to trace back to at Scenario creation time.
                                         //    groupId must be stamped onto Scenario at creation or it cannot
                                         //    be stored at all.
                                         //
                                         // 2. Query efficiency (balanced selection): startMixedSession runs
                                         //      ScenarioModel.find({ groupId, status: 'active' })
                                         //    which hits the compound index { groupId, status, responseCount }
                                         //    in a single round-trip. Without this field the equivalent query
                                         //    would require: load all Sessions for group → collect scenarioIds
                                         //    → query Scenarios by those IDs — three round-trips with no useful
                                         //    index coverage on the Scenario collection.
                                         //
                                         // 3. Cascade delete: deleteSessionGroup uses
                                         //      ScenarioModel.deleteMany({ groupId })
                                         //    for the same single-query reason.
                                         //
                                         // Session.groupId and Scenario.groupId are two independent upward
                                         // foreign keys to the same SessionGroup parent. They serve different
                                         // child entities and neither is derivable from the other across the
                                         // full object lifecycle. This is intentional denormalization, not
                                         // redundancy.
  setupId: String | null,                // Original SessionSetup ID (for migration/reference)
  
  // Data collection tracking (scenario-level!)
  targetSize: Number,                    // How many responses needed for THIS scenario
  responseCount: Number,                 // How many responses collected so far
  
  status: 'active' | 'inactive',         // Controls selection availability (simplified 2026-05-04)
                                         // 'active' = can be selected for new sessions
                                         // 'inactive' = excluded from selection (e.g., paused experiments)
                                         // NOTE: Completion is tracked via responseCount >= targetSize
  
  createdAt: Date,
  updatedAt: Date
}
```

**Schema Refinements (2026-05-04)**:

- `scenarioIndex` changed from optional to **required** to ensure all scenarios are traceable to their design matrix position
- `status` enum simplified from `['active', 'completed', 'paused']` to `['active', 'inactive']`:
  - Removes redundancy: scenario completion is already determinable via `responseCount >= targetSize`
  - Simplifies logic: status now only controls **selection availability** for new sessions
  - 'active' = scenario can be selected by Mixed Mode balanced selection or included in queries
  - 'inactive' = scenario is excluded (e.g., admin paused a problematic configuration)

**Indexes**:

- `{ groupId: 1, status: 1, responseCount: 1 }` — Mixed Mode balanced selection
- `{ setupId: 1, scenarioIndex: 1 }` — Traceability
- `{ status: 1 }` — Status queries

**Maps to**: REQ-321 (Scenario as Atomic Unit)

### `Session` (Refactored - Lightweight Container) ✅

```javascript
// backend/models/Session.js (renamed from SessionSetup)
{
  _id: String (UUID),                    // Primary key
  
  // Container: references scenarios (NOT embedding!)
  scenarioIds: [String],                 // Array of Scenario._id, preserves order
  
  // Session-level metadata
  focalNode: String,                     // For display/filtering
  opponentNode: String,
  sampleSize: Number,                    // How many PEOPLE should complete this session
  
  // Ownership
  groupId: String | null,                // Which SessionGroup owns this
  
  // Cached stats
  submissionCount: Number,               // How many people completed this session
  
  // Mixed Mode metadata
  metadata: {
    participantId: String | null,        // For Mixed Mode: which participant is this for?
    createdFor: 'manual' | 'batch' | 'mixed' | null
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual field**:

```javascript
SessionSchema.virtual('scenarios', {
  ref: 'Scenario',
  localField: 'scenarioIds',
  foreignField: '_id'
});
```

**Indexes**:

- `{ groupId: 1 }`
- `{ metadata.participantId: 1 }` — Mixed Mode participant lookup

**Maps to**: REQ-322 (Session as Scenario Container)

### `Submission` (Updated - References Scenarios by ID) ✅

```javascript
// backend/models/Submission.js
{
  _id: ObjectId,                         // Mongoose default
  
  sessionId: String,                     // References Session._id
  participantId: String | null,          // Mixed Mode: uniqueness check
  
  // Responses (now reference Scenario UUIDs)
  results: [{
    scenarioId: String,                  // References Scenario._id (was: Number index)
    cooperationProbability: Number,      // [0, 1]
    responseTime: Number,                // milliseconds
    answeredAt: Date
  }],
  
  demographics: {
    age: Number,
    gender: String,
    education: String
  } | null,
  
  isCompleted: Boolean,
  completedAt: Date | null,
  
  isInvalid: Boolean,                    // NEW (2026-05-06, REQ-351)
                                         // Default: false
                                         // When true: excluded from submissionCount and
                                         // Scenario.responseCount; slot is freed for new participant.
                                         // Reversible: can be set back to false by admin.
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `{ sessionId: 1 }`
- `{ sessionId: 1, participantId: 1 }` — Prevent duplicate Mixed Mode submissions
- `{ sessionId: 1, isInvalid: 1 }` — Efficient queries for valid-only submissions per session

**Maps to**: REQ-402 (Per-scenario response capture), REQ-351 (invalidation flag)

**Known Issue (Fixed 2026-05-04)**: SurveyOutro component was not calling `completeSurvey` mutation, causing `isCompleted` to always be `false`. Fixed by passing `onComplete` prop and calling it on final submission.

### `SessionGroup` (Simplified - Unified Config) ✅ 🔧 **REFINED 2026-05-04**

```javascript
// backend/models/SessionGroup.js
{
  _id: String (UUID),
  
  name: String,
  description: String | null,
  
  // Unified configuration (mode implicit from which fields are set)
  config: {
    // Batch Mode fields
    edgeCount: Number | null,            // k value
    
    // Mixed Mode fields — ALL THREE ARE REQUIRED for Mixed Mode groups (REQ-312)
    maxK: Number,                        // 1..12  REQUIRED when mode=mixed
    scenariosPerSession: Number,         // S      REQUIRED when mode=mixed
    targetSizePerScenario: Number,       //        REQUIRED when mode=mixed
    
    // Common fields
    focalNode: String,
    opponentNode: String,
    sampleSize: Number                   // Per-session target (Batch/Manual)
  },
  
  // Cached statistics
  totalSessions: Number,                 // Sessions created
  totalScenarios: Number,                // Scenarios created (Mixed Mode)
  
  status: 'creating' | 'active' | 'completed' | 'archived',
  
  createdAt: Date,
  updatedAt: Date
}
```

**Schema Refinement (2026-05-04) — REQ-312**:

The three Mixed Mode–specific config fields are now enforced as mandatory at multiple layers:

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| Mongoose schema | Conditional `required` validator: required only when `config.maxK` is set (to avoid breaking Batch/Manual documents) | MongoDB persistence |
| GraphQL `GroupConfigInput` | Fields declared `Int!` (non-nullable) | Schema-level — client gets error before resolver runs |
| Resolver logic | Explicit `if (!maxK)` / `if (!scenariosPerSession)` / `if (!targetSizePerScenario)` throw guards | Runtime — defense-in-depth |
| TypeScript `SessionGroup.config` | Fields typed as `number` (not `number \| null`) | Compile-time on frontend call sites |

**Conflict note**: Mongoose `required: true` applied unconditionally would reject Batch Mode documents (which have no `maxK`). The recommended resolution is a conditional validator:

```javascript
maxK: {
  type: Number,
  min: 1,
  max: 12,
  required: function() { return !!this.config?.maxK; }  // Only required if set (Mixed Mode)
}
```

Alternatively, enforcement is delegated entirely to the GraphQL layer (`Int!` in `GroupConfigInput` + resolver guards) which already catches all callers before any DB write happens. See Open Question #7 for decision.

**Mode detection**:

```javascript
function getGroupMode(group) {
  if (group.config.maxK) return 'mixed';
  if (group.config.edgeCount) return 'batch';
  return 'manual';  // Or null for standalone sessions
}
```

**Indexes**:

- `{ status: 1 }`
- `{ createdAt: -1 }`

**Maps to**: REQ-301 (Batch), REQ-306 (Mixed), REQ-312 (Mixed Mode mandatory config)

---

## Three Modes Implementation

### Mode 1: Manual (Single Session) ✅ Implemented 2026-04-29

**Admin Action**: Configure focal, opponent, edges, sampleSize

**Backend Logic** ([`createManualSession`](../backend/graphql/resolvers.js)):

```javascript
async function createManualSession(input) {
  // 1. Generate design matrix
  const designMatrix = generateDesignMatrix(input.activeEdgeIds);
  
  // 2. Create independent Scenario documents
  const scenarios = await Scenario.insertMany(
    designMatrix.map((edgeStates, index) => ({
      focalNode: input.focalNode,
      opponentNode: input.opponentNode,
      activeEdgeIds: input.activeEdgeIds,
      edgeStates,
      scenarioIndex: index,
      groupId: null,
      targetSize: 0,  // Manual mode doesn't track scenario-level
      responseCount: 0,
      status: 'active'
    }))
  );
  
  // 3. Create Session referencing scenarios
  const session = await Session.create({
    scenarioIds: scenarios.map(s => s._id),
    focalNode: input.focalNode,
    opponentNode: input.opponentNode,
    sampleSize: input.sampleSize,
    groupId: null,
    metadata: { createdFor: 'manual' }
  });
  
  return session;
}
```

**Participant URL**: `/survey/welcome?sessionId=<session._id>`

**Maps to**: REQ-201, REQ-202

### Mode 2: Batch (Multiple Sessions, Factorial Sweep) ✅ Implemented 2026-04-29

**Admin Action**: Configure name, k, focal, opponent, sampleSize

**Backend Logic** ([`createBatchSessions`](../backend/graphql/resolvers.js)):

```javascript
async function createBatchSessions(input) {
  // 1. Create SessionGroup
  const group = await SessionGroup.create({
    name: input.name,
    config: {
      edgeCount: input.edgeCount,
      focalNode: input.focalNode,
      opponentNode: input.opponentNode,
      sampleSize: input.sampleSize
    },
    status: 'creating'
  });
  
  // 2. Generate all C(12, k) combinations
  const combinations = generateCombinations(ALL_EDGES, input.edgeCount);
  
  // 3. For each combination, create scenarios + session
  for (const combo of combinations) {
    const designMatrix = generateDesignMatrix(combo);
    
    // Create scenarios for this combination
    const scenarios = await Scenario.insertMany(
      designMatrix.map((edgeStates, index) => ({
        focalNode: input.focalNode,
        opponentNode: input.opponentNode,
        activeEdgeIds: combo,
        edgeStates,
        scenarioIndex: index,
        groupId: group._id,
        targetSize: 0,  // Batch mode tracks session-level, not scenario-level
        responseCount: 0,
        status: 'active'
      }))
    );
    
    // Create session for this combination
    await Session.create({
      scenarioIds: scenarios.map(s => s._id),
      focalNode: input.focalNode,
      opponentNode: input.opponentNode,
      sampleSize: input.sampleSize,
      groupId: group._id,
      metadata: { createdFor: 'batch' }
    });
  }
  
  // 4. Activate group
  group.totalSessions = combinations.length;
  group.status = 'active';
  await group.save();
  
  return { groupId: group._id, totalSessions: combinations.length };
}
```

**Participant URLs**: `/survey/welcome?sessionId=<session._id>` (many URLs, one per combination)

**Verified**: k=2 generates 66 sessions with 264 scenarios (66×4).

**Maps to**: REQ-301

### Mode 3: Mixed (Dynamic Session per Participant) ✅ Implemented 2026-04-29

**Admin Action**: Configure name, maxK, scenariosPerSession (S), targetSizePerScenario, focal, opponent

**Backend Logic** ([`createMixedGroup`](../backend/graphql/resolvers.js)):

```javascript
async function createMixedGroup(input) {
  // 1. Create SessionGroup
  const group = await SessionGroup.create({
    name: input.name,
    config: {
      maxK: input.maxK,
      scenariosPerSession: input.scenariosPerSession,
      targetSizePerScenario: input.targetSizePerScenario,
      focalNode: input.focalNode,
      opponentNode: input.opponentNode
    },
    status: 'creating'
  });
  
  // 2. Generate scenario pool (all k=1..maxK combinations)
  const scenarioPool = [];
  
  for (let k = 1; k <= input.maxK; k++) {
    const combinations = generateCombinations(ALL_EDGES, k);
    
    for (const combo of combinations) {
      const designMatrix = generateDesignMatrix(combo);
      
      for (const [index, edgeStates] of designMatrix.entries()) {
        scenarioPool.push({
          focalNode: input.focalNode,
          opponentNode: input.opponentNode,
          activeEdgeIds: combo,
          edgeStates,
          scenarioIndex: index,
          groupId: group._id,
          targetSize: input.targetSizePerScenario,  // KEY: scenario-level tracking
          responseCount: 0,
          status: 'active'
        });
      }
    }
  }
  
  // 3. Bulk create scenarios
  await Scenario.insertMany(scenarioPool);
  
  // 4. Activate group
  group.totalScenarios = scenarioPool.length;
  group.status = 'active';
  await group.save();
  
  return { 
    groupId: group._id, 
    totalScenarios: scenarioPool.length,
    estimatedSessions: Math.ceil(
      (scenarioPool.length * input.targetSizePerScenario) / input.scenariosPerSession
    )
  };
}
```

**Participant URL**: `/survey/welcome?groupId=<group._id>&mode=mixed` (single URL, sessions created dynamically)

**Verified**: maxK=2 generates 288 scenarios (12×2 + 66×4).

**Participant Flow** (Lazy Session Creation):

**Before Fix (BUG-004)**: Session was created immediately on `/survey/welcome?groupId=xxx&mode=mixed` page load, before user saw welcome screen or clicked "開始實驗". React StrictMode's double-execution caused duplicate sessions.

**After Fix (Phase 28)**:
1. User opens `/survey/welcome?groupId=xxx&mode=mixed`
2. [`App.tsx`](../App.tsx) detects Mixed Mode URL, stores `groupId` in state (`pendingMixedGroupId`), does NOT call `startMixedSession`
3. User clicks "開始實驗" → navigates through intro with URL `?groupId=xxx&mode=mixed`
4. User finishes intro step 8 → clicks "開始實驗！"
5. [`handleSurveyStart`](../App.tsx:173) detects `pendingMixedGroupId` and NOW calls `startMixedSession`
6. Session created, URL transitions to `?sessionId=xxx`, unified flow continues

This matches Manual Mode behavior (which delays `startSurvey` until after intro) and prevents premature session creation.

**Resolver Logic** ([`startMixedSession`](../backend/graphql/resolvers.js)):

```javascript
async function startMixedSession(groupId, participantId) {
  const group = await SessionGroup.findById(groupId);
  const S = group.config.scenariosPerSession;
  
  // Check if participant already has a session (resume)
  let session = await Session.findOne({
    groupId,
    'metadata.participantId': participantId
  });
  
  if (!session) {
    // **Balanced Selection Strategy** (REQ-307)
    // Select scenarios with lowest responseCount, then random sample
    const candidates = await Scenario
      .find({ groupId, status: 'active' })
      .sort({ responseCount: 1 })  // Prioritize under-sampled
      .limit(S * 2);  // Get 2× candidates for randomization
    
    // Random sample from bottom 2S
    const selected = _.sampleSize(candidates, S);
    
    // Create personalized session
    session = await Session.create({
      scenarioIds: selected.map(s => s._id),
      focalNode: group.config.focalNode,
      opponentNode: group.config.opponentNode,
      sampleSize: 1,  // Mixed mode: each session for one person
      groupId,
      metadata: {
        participantId,
        createdFor: 'mixed'
      }
    });
  }
  
  return session;
}
```

**Maps to**: REQ-306, REQ-307

---

## Unified Survey Flow (All Modes) ✅ Implemented 2026-04-29

**Critical Design Win**: The survey completion logic is **identical** for all three modes.

### Start Survey ✅ 🔧 **UPDATED 2026-05-06 (REQ-313)**

```javascript
// Unified: works for Manual, Batch, AND Mixed
// participantId is optional; when present, enables duplicate detection
async function startSurvey(sessionId, participantId) {
  // Turnstile check (REQ-102)
  if (!context.isTurnstileVerified) {
    throw new Error('Turnstile verification required');
  }
  
  // Session full check
  const session = await Session.findById(sessionId);
  if (session.submissionCount >= session.sampleSize) {
    throw new Error('Session full');
  }
  
  // ** REQ-313: Duplicate participant check **
  // If participant already has a submission for this session, resume it
  if (participantId) {
    const existing = await Submission.findOne({ sessionId, participantId });
    if (existing) return existing;  // resume
  }
  
  // Create submission (with participantId recorded for future dedup)
  const submission = await Submission.create({
    sessionId,
    participantId: participantId || null,
    results: [],
    isCompleted: false
  });
  
  return submission;
}
```

**DB enforcement (REQ-313)**:

```javascript
// backend/models/Submission.js
submissionSchema.index(
  { sessionId: 1, participantId: 1 },
  { unique: true, sparse: true }  // sparse: true allows multiple null participantId rows
);
```

**Why `sparse: true`**: Manual and Batch Mode participants may not have fingerprinting enabled, so their `participantId` is `null`. A regular unique index would reject a second `null` value. `sparse: true` skips the uniqueness check for documents where `participantId` is `null`, so only fingerprinted participants (Mixed Mode) are subject to the dedup constraint.

**Maps to**: REQ-401, REQ-313

### Save Scenario Answer ✅

```javascript
// Unified: scenarioId is now a UUID reference
async function saveSurveyAnswer(submissionId, scenarioId, probability) {
  // Validate
  if (probability < 0 || probability > 1) {
    throw new Error('cooperationProbability must be between 0 and 1');
  }
  
  // Update submission
  const submission = await Submission.findById(submissionId);
  const existingIndex = submission.results.findIndex(r => r.scenarioId === scenarioId);
  
  if (existingIndex >= 0) {
    submission.results[existingIndex].cooperationProbability = probability;
    submission.results[existingIndex].answeredAt = new Date();
  } else {
    submission.results.push({
      scenarioId,
      cooperationProbability: probability,
      answeredAt: new Date()
    });
  }
  
  await submission.save();
  
  // ** KEY: Update scenario's responseCount (REQ-308) **
  // Only increment on first answer (not on updates)
  if (existingIndex < 0) {
    await Scenario.findByIdAndUpdate(scenarioId, { $inc: { responseCount: 1 } });
  }
  
  return submission;
}
```

**Maps to**: REQ-402, REQ-308

### Complete Survey ✅

```javascript
// Unified: works for all modes
async function completeSurvey(submissionId, demographics) {
  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    {
      demographics,
      isCompleted: true,
      completedAt: new Date()
    },
    { new: true }
  );
  
  // Increment session's submissionCount
  const session = await Session.findById(submission.sessionId);
  session.submissionCount += 1;
  await session.save();
  
  // ** Mixed Mode: Check group completion (REQ-309) **
  if (session.groupId && session.metadata?.createdFor === 'mixed') {
    const group = await SessionGroup.findById(session.groupId);
    const targetSize = group.config.targetSizePerScenario;
    
    // Count incomplete scenarios
    const incompleteCount = await Scenario.countDocuments({
      groupId: session.groupId,
      responseCount: { $lt: targetSize }
    });
    
    // If all scenarios complete, mark group as completed
    if (incompleteCount === 0) {
      group.status = 'completed';
      await group.save();
    }
  }
  
  return submission;
}
```

**Maps to**: REQ-403, REQ-309

### Invalidate Submission (Admin Only) 📋 **NEW 2026-05-06 (REQ-350)**

```javascript
// Admin-only mutation: requires admin authentication (checked via context.isAdmin)
async function invalidateSubmission(submissionId, isInvalid, context) {
  // Admin auth check (same pattern as clearDatabase)
  if (!context.isAdmin) {
    throw new Error('Admin authentication required');
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  // ** Idempotency guard: no-op if already in the requested state **
  if (submission.isInvalid === isInvalid) {
    return submission;  // Nothing to do
  }

  const previousIsInvalid = submission.isInvalid ?? false;
  submission.isInvalid = isInvalid;
  await submission.save();

  // ** REQ-352: Adjust Session.submissionCount **
  // Only completed submissions contribute to submissionCount, so only adjust
  // when the submission was completed.
  if (submission.isCompleted) {
    const countDelta = isInvalid ? -1 : 1;
    await Session.findByIdAndUpdate(
      submission.sessionId,
      { $inc: { submissionCount: countDelta } }
    );
  }

  // ** REQ-354: Adjust Scenario.responseCount for each answered scenario **
  // The Submission.results array contains one entry per answered scenario.
  // Use $inc with min(0) floor to avoid negative counts.
  if (submission.results && submission.results.length > 0) {
    const countDelta = isInvalid ? -1 : 1;

    for (const result of submission.results) {
      await Scenario.findByIdAndUpdate(
        result.scenarioId,
        [
          {
            $set: {
              responseCount: {
                $max: [0, { $add: ['$responseCount', countDelta] }]
              }
            }
          }
        ]
      );
    }

    // ** REQ-354: If re-validating (isInvalid: false) and group was completed,
    //    check if it should revert to 'active' **
    if (!isInvalid) {
      const session = await Session.findById(submission.sessionId);
      if (session?.groupId) {
        const group = await SessionGroup.findById(session.groupId);
        if (group?.status === 'completed' && group.config?.targetSizePerScenario) {
          const nowIncomplete = await Scenario.countDocuments({
            groupId: session.groupId,
            responseCount: { $lt: group.config.targetSizePerScenario }
          });
          if (nowIncomplete > 0) {
            group.status = 'active';
            await group.save();
          }
        }
      }
    }
  }

  return submission;
}
```

**Key design decisions**:

1. **Idempotency**: The resolver checks `submission.isInvalid === isInvalid` before making any changes. If they match, it returns early. This prevents double-decrement if an admin invalidates an already-invalid submission.

2. **`submissionCount` adjustment**: Only `isCompleted: true` submissions were counted in the first place (see `completeSurvey` resolver). Incomplete submissions never incremented `submissionCount`, so they must not decrement it either. The guard `if (submission.isCompleted)` preserves this invariant.

3. **`responseCount` adjustment**: Uses a MongoDB aggregation pipeline update (`$max: [0, ...]`) to atomically decrement with a floor of 0, preventing negative counts due to data anomalies.

4. **Group status reversion (re-validation path)**: When an invalid submission is restored, if the group was already marked `completed`, we re-check whether all scenarios still meet `targetSize`. If not, the group reverts to `active` so new participants can be recruited.

5. **Backward compatibility**: `isInvalid` defaults to `false`. All existing submissions without the field behave identically to before.

**Maps to**: REQ-351, REQ-352, REQ-354

---

## Submission Invalidation — Enhanced Admin UI (REQ-353, REQ-356, REQ-357, REQ-358)

**Status**: 📋 Designed 2026-05-06 | **Priority**: High | **Component**: [`GroupDetailView.tsx`](../components/GroupDetailView.tsx)

### Overview

The enhanced invalidation UI replaces text-based controls with icon buttons, adds confirmation modals, and implements tab-based view switching for cleaner visual hierarchy.

### Tab-Based View Switching (REQ-358)

Replace the inline "Invalid (N)" toggle button with a two-tab selector above the submission table.

**Current Implementation** (lines 589-600):
```tsx
{submissions.some(s => s.isInvalid) && (
  <button
    onClick={() => setShowInvalid(v => !v)}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      showInvalid
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'
    }`}
  >
    Invalid ({submissions.filter(s => s.isInvalid).length})
  </button>
)}
```

**Enhanced Design**:

```tsx
{/* Tab-based view selector - placed below header, above table */}
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

**State Management**:
```typescript
// Single boolean state (simpler than per-session map for GroupDetailView)
const [showInvalid, setShowInvalid] = useState<boolean>(false);

// Filter logic (unchanged)
const filteredSessions = sessions.filter(session => {
  const submission = submissions.find(sub => sub.sessionId === session._id);
  return showInvalid ? submission?.isInvalid : !submission?.isInvalid;
});
```

**Empty State** (when "Invalid" tab is selected but no invalid submissions exist):
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

### Icon-Based Action Buttons (REQ-356)

Replace text buttons with icon-only buttons in the action column.

**Current Implementation** (lines 728-738):
```tsx
<button
  onClick={() => handleInvalidate(submission._id, !submission.isInvalid)}
  disabled={invalidatingId === submission._id}
  className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
    submission.isInvalid
      ? 'border-green-300 text-green-700 hover:bg-green-50'
      : 'border-red-300 text-red-600 hover:bg-red-50'
  }`}
>
  {invalidatingId === submission._id ? '...' : submission.isInvalid ? 'Restore' : 'Invalidate'}
</button>
```

**Enhanced Design**:

```tsx
{/* Icon button for Invalidate action (valid → invalid) */}
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

{/* Icon button for Restore action (invalid → valid) */}
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

**Icon Sources** (Heroicons):
- **Invalidate**: `XCircleIcon` (outline) — `<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`
- **Restore**: `ArrowPathIcon` (outline) — `<path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />`
- **Loading**: Spinner animation (same as other loading states in the app)

### Confirmation Modal (REQ-357)

Add confirmation step before executing invalidation/restoration action.

**Modal State Management**:

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

function openConfirmModal(submissionId: string, action: 'invalidate' | 'restore') {
  setConfirmModal({ isOpen: true, submissionId, action });
}

function closeConfirmModal() {
  setConfirmModal({ isOpen: false, submissionId: null, action: 'invalidate' });
}

async function handleConfirm() {
  if (!confirmModal.submissionId) return;
  
  const newIsInvalid = confirmModal.action === 'invalidate';
  await handleInvalidate(confirmModal.submissionId, newIsInvalid);
  closeConfirmModal();
}
```

**Modal Rendering**:

```tsx
<ConfirmationModal
  isOpen={confirmModal.isOpen}
  onClose={closeConfirmModal}
  onConfirm={handleConfirm}
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

**Mutation Handler** (unchanged, already exists):

```typescript
const handleInvalidate = async (submissionId: string, nextInvalid: boolean) => {
  setInvalidatingId(submissionId);
  try {
    const updated = await invalidateSubmission(submissionId, nextInvalid);
    setSubmissions(prev =>
      prev.map(s => s._id === submissionId ? { ...s, isInvalid: updated.isInvalid } : s)
    );
    // Reload sessions so the submissionCount on the session row stays accurate
    const sessionsData = await fetchSessionsByGroup(groupId!);
    setSessions(sessionsData);
    toast.success(nextInvalid ? 'Marked as invalid' : 'Restored');
  } catch (e) {
    toast.error('Action failed');
  } finally {
    setInvalidatingId(null);
  }
};
```

### Visual Hierarchy Improvements

**Before** (current design):
```
┌─────────────────────────────────────────────────────────────┐
│ All Submission (N)              [Invalid (1)] [Export CSV]  │ ← Mixed visually
├─────────────────────────────────────────────────────────────┤
│ # │ Participant ID │ Status │ Progress │ [Invalidate]      │
└─────────────────────────────────────────────────────────────┘
```

**After** (enhanced design):
```
┌─────────────────────────────────────────────────────────────┐
│ All Submission (N)                          [Export CSV]    │ ← Clear hierarchy
├─────────────────────────────────────────────────────────────┤
│ [Valid (45)] [Invalid (3)]                                  │ ← Tab selector
├─────────────────────────────────────────────────────────────┤
│ # │ Participant ID │ Status │ Progress │ [🚫]              │ ← Icon button
└─────────────────────────────────────────────────────────────┘
```

### Implementation Checklist

**Files to modify**:
- [`components/GroupDetailView.tsx`](../components/GroupDetailView.tsx) — Primary implementation
  - Lines 78-79: Add `confirmModal` state
  - Lines 189-205: Update `handleInvalidate` (already exists, no changes)
  - Lines 584-612: Replace inline filter button with tab selector
  - Lines 726-740: Replace text button with icon button + modal trigger
  - Add `ConfirmationModal` import and rendering at component bottom

**No backend changes required** — all changes are frontend-only UI enhancements.

**Maps to**: REQ-356 (icon buttons), REQ-357 (confirmation modal), REQ-358 (tab-based view)

### GraphQL Mutation (Frontend)

```typescript
// utils/graphqlClient.ts
const INVALIDATE_SUBMISSION = `
  mutation InvalidateSubmission($submissionId: ID!, $isInvalid: Boolean!) {
    invalidateSubmission(submissionId: $submissionId, isInvalid: $isInvalid) {
      _id
      isInvalid
      isCompleted
    }
  }
`;
```

**Maps to**: REQ-353

---

## Frontend Architecture

### Admin UI

#### Unified Mode Selection with URL Sync ([`SetupPanel.tsx`](../components/SetupPanel.tsx)) ✅ — *Updated 2026-05-05*

`SetupPanel.tsx` uses React Router v7 `useSearchParams()` to keep the two-button `LaunchMode` toggle and the URL's `?mode=` query parameter in sync at all times. No full-page reload occurs when the mode changes.

**Reading mode on mount / navigation:**

```typescript
import { useSearchParams } from 'react-router-dom';

type LaunchMode = 'manual' | 'mixed';

function SetupPanel() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse and validate the ?mode= param; default to 'manual' for absent/invalid values
  const rawMode = searchParams.get('mode');
  const launchMode: LaunchMode =
    rawMode === 'manual' || rawMode === 'mixed' ? rawMode : 'manual';

  // Correct the URL immediately if the param was absent or invalid (replace, not push)
  useEffect(() => {
    if (rawMode !== launchMode) {
      setSearchParams({ mode: launchMode }, { replace: true });
    }
  }, []);  // Run once on mount
```

**Writing mode when the toggle is clicked:**

```typescript
  const handleModeChange = (newMode: LaunchMode) => {
    // replace: true prevents a new browser-history entry
    setSearchParams({ mode: newMode }, { replace: true });
    // launchMode is re-derived on next render from searchParams
  };
```

**Rendering the toggle and conditional UI:**

```typescript
  return (
    <>
      {/* Two-button mode selector */}
      <ButtonGroup>
        <Button
          variant={launchMode === 'manual' ? 'contained' : 'outlined'}
          onClick={() => handleModeChange('manual')}
        >
          Manual
        </Button>
        <Button
          variant={launchMode === 'mixed' ? 'contained' : 'outlined'}
          onClick={() => handleModeChange('mixed')}
        >
          Mixed
        </Button>
      </ButtonGroup>

      {/* Conditional configuration panel */}
      {launchMode === 'manual' && <ManualModeForm />}
      {launchMode === 'mixed' && <MixedModeConfig />}
    </>
  );
}
```

**Design rationale:**

- `useSearchParams` is the idiomatic React Router v7 way to own a URL slice without a full navigation. It avoids a separate `useState` for mode that would need to be manually kept in sync with the URL.
- `{ replace: true }` on every write means the browser back button reflects page-level navigation (e.g., Admin → Setup), not mode toggling within Setup.
- The validation-and-correction `useEffect` runs once on mount. It fires `replace` only when the URL is stale (absent or invalid param), so a bookmarked `/admin/setup?mode=mixed` opens directly in Mixed Mode without any observable flash.
- This pattern is consistent with the `?sessionId=` and `?groupId=&mode=mixed` patterns used in the participant survey flow.

#### Mixed Mode Configuration ([`MixedModeConfig.tsx`](../components/MixedModeConfig.tsx)) ✅

```typescript
function MixedModeConfig() {
  const [maxK, setMaxK] = useState(2);
  const [scenariosPerSession, setScenariosPerSession] = useState(10);
  const [targetSize, setTargetSize] = useState(5);
  
  // Calculate estimates
  const totalScenarios = useMemo(() => {
    let sum = 0;
    for (let k = 1; k <= maxK; k++) {
      sum += binomial(12, k) * Math.pow(2, k);
    }
    return sum;
  }, [maxK]);
  
  const estimatedParticipants = Math.ceil(
    (totalScenarios * targetSize) / scenariosPerSession
  );
  
  return (
    <form onSubmit={handleSubmit}>
      <Slider label="Max K" value={maxK} onChange={setMaxK} min={1} max={4} />
      <Slider label="Scenarios per Session" value={scenariosPerSession} min={5} max={30} step={5} />
      <NumberInput label="Target Size per Scenario" value={targetSize} onChange={setTargetSize} />
      
      <Alert severity="info">
        Will generate {totalScenarios} scenarios.
        Estimated {estimatedParticipants} participants needed.
      </Alert>
      
      <Button type="submit">Create Mixed Group</Button>
    </form>
  );
}
```

### Survey Flow (Minimal Changes) ✅

```typescript
// App.tsx (UPDATED routing logic)
function App() {
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('sessionId');
  const groupId = searchParams.get('groupId');
  const mode = searchParams.get('mode');
  
  // Resolve actual sessionId
  useEffect(() => {
    if (sessionId) {
      setResolvedSessionId(sessionId);
    } else if (groupId && mode === 'mixed') {
      // Mixed mode: create or retrieve session
      startMixedSession({
        variables: { groupId, participantId: getParticipantId() }
      }).then(({ data }) => {
        const newSessionId = data.startMixedSession.sessionId;
        navigate(`/survey/welcome?sessionId=${newSessionId}`, { replace: true });
      });
    }
  }, [sessionId, groupId, mode]);
  
  return (
    <Routes>
      <Route path="/survey/*" element={<SurveyView sessionId={resolvedSessionId} />} />
      ...
    </Routes>
  );
}

// SurveyView.tsx (NO CHANGES NEEDED!)
function SurveyView({ sessionId }) {
  const { data: session } = useSession(sessionId);  // Auto-populates scenarios
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Works for ALL modes because session.scenarios is always an array
  const scenario = session.scenarios[currentIndex];
  
  return (
    <div>
      <Progress current={currentIndex + 1} total={session.scenarios.length} />
      <ScenarioView scenario={scenario} onAnswer={handleAnswer} />
    </div>
  );
}
```

**Key Insight**: `SurveyView` doesn't need to know which mode created the session!

### Survey Introduction - Relationship Structure Display (REQ-405.1)

#### Current Implementation Analysis

In [`SurveyIntro.tsx`](../components/SurveyIntro.tsx) at the "關係結構" step (introStep 2), the history legend displays interaction records filtered to only show edges involving the focal participant or opponent:

```typescript
// Line 336-339: Current filtering logic
{networkDemoSetup.activeEdgeIds.filter(edgeId => {
  const [source, target] = edgeId.split('-');
  return source === setup.focalNode || target === setup.focalNode || source === setup.opponentNode || target === setup.opponentNode;
}).map(edgeId => {
  // ... render history record
})}
```

**Problem**: This filter restricts the display to only 2 edges (You ↔ Opponent), hiding the interactions between the other two participants. Participants cannot see the complete network structure.

#### Enhanced Design

**Remove the filter** to display all 4 edges in `networkDemoSetup.activeEdgeIds`:

```typescript
// Enhanced: Display ALL interactions
{networkDemoSetup.activeEdgeIds.map(edgeId => {
  const [source, target] = edgeId.split('-');
  const isGive = networkDemoScenario.edgeStates[edgeId] === 'give';
  
  // Enhanced participant labeling
  const getName = (id: string, agent: any) => {
    if (id === setup.focalNode) return "您";
    if (id === setup.opponentNode) return "搭檔";
    // For other participants, show generic label
    return `參與者 ${agent.group}`;
  };
  
  const sourceName = getName(source, AGENTS[source as AgentId]);
  const targetName = getName(target, AGENTS[target as AgentId]);
  
  return (
    <div key={edgeId} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`font-bold ${source === setup.focalNode ? 'text-indigo-600' : 'text-gray-700'}`}>
          {sourceName}
        </span>
        <span className="text-gray-300">➜</span>
        <span className="text-gray-600">{targetName}</span>
      </div>
      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isGive ? 'bg-neutral-700 text-white' : 'bg-gray-300 text-gray-700'}`}>
        {isGive ? '給予' : '不給予'}
      </span>
    </div>
  );
})}
```

#### Enhanced Grouping and Labeling Strategy

**Two-Group Display**: Records are organized into two distinct sections to improve clarity:

##### Group 1: Your Pair (您這對的互動)

- Blue-tinted background for visual distinction
- Label: "您這對的互動"
- Contains interactions between `focalNode` (您) and `opponentNode` (搭檔)

##### Group 2: Other Pair (另一對參與者的互動)

- White background
- Label: "另一對參與者的互動"
- Contains interactions between the other two participants
- Uses **in-group/out-group** labeling relative to focal participant's group

| Participant Role | Display Label | Logic |
|-----------------|---------------|-------|
| `focalNode` (You) | "您" | Always in Group 1 |
| `opponentNode` (Opponent) | "搭檔" | Always in Group 1 |
| Other participant (same group as focal) | "組內成員 (KMT)" or "組內成員 (DPP)" | In-group member |
| Other participant (different group from focal) | "組外成員 (KMT)" or "組外成員 (DPP)" | Out-group member |

**Example**: If focal participant is KMT1:

- KMT2 (same group) → "組內成員 (KMT)"
- DPP3 (different group) → "組外成員 (DPP)"

#### Expected Output

**Before (2 records, ungrouped)**:

- 您 → 搭檔: 給予
- 搭檔 → 您: 不給予

**After (4 records, grouped)**:

**您這對的互動** (blue background)

- 您 → 搭檔: 不給予
- 搭檔 → 您: 給予

**另一對參與者的互動** (white background)

- 組內成員 (KMT) → 組外成員 (DPP): 不給予
- 組外成員 (DPP) → 組內成員 (KMT): 給予

#### Implementation Impact

- **Code changes**: 1 file ([`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx))
- **Lines modified**: ~4 lines (remove filter condition)
- **Testing**: Visual verification on `/survey/intro/2?sessionId=<any>`
- **Backward compatibility**: ✅ No data model changes, UI-only enhancement

---

### Decision Slider — Randomized Default & Mandatory Interaction (REQ-402.1)

#### Current Implementation

In [`SurveyView.tsx`](../components/SurveyView.tsx), `sliderValue` (the participant's "your decision" value, 0–100) is reset to a hardcoded `50` every time the scenario changes:

```typescript
// Line 236-241 (current)
useEffect(() => {
  setRevealedEdgeIds(new Set());
  setIsDecisionPhase(false);
  setHasInteracted(false);
  setSliderValue(50);
}, [scenarioIdx]);
```

The confirm button only gates on `allRevealed`, so a participant can advance without ever touching the slider — silently submitting whatever the default (50) happens to be:

```typescript
// Line 601-607 (current)
<button
  onClick={!isDecisionPhase && allRevealed ? () => { setIsDecisionPhase(true); setHasInteracted(false); } : handleNext}
  disabled={!allRevealed}
  ...
>
```

#### Enhanced Design

**1. Randomize the per-scenario starting value** instead of a fixed constant:

```typescript
useEffect(() => {
  setRevealedEdgeIds(new Set());
  setIsDecisionPhase(false);
  setHasInteracted(false);
  setSliderValue(Math.floor(Math.random() * 101)); // random integer in [0, 100]
}, [scenarioIdx]);
```

**2. Gate the confirm button on `hasInteracted` while in the decision phase**, on top of the existing `allRevealed` check:

```typescript
<button
  onClick={!isDecisionPhase && allRevealed ? () => { setIsDecisionPhase(true); setHasInteracted(false); } : handleNext}
  disabled={!allRevealed || (isDecisionPhase && !hasInteracted)}
  ...
>
```

`hasInteracted` already flips to `true` on the slider's `onChange` (`DecisionSlider value={sliderValue} onChange={(v) => { setSliderValue(v); setHasInteracted(true); }} ...`), so no new state is introduced — the gate simply reuses the existing flag that previously only controlled the floating value bubble.

#### Rationale

- Fixed 50% invites anchoring bias and is indistinguishable from "participant didn't engage."
- Randomizing start position + requiring one drag ensures every stored `cooperationProbability` reflects a deliberate choice, without changing the data contract (still `sliderValue / 100`, still saved via the existing `handleNext` → `onSaveAnswer` path).

#### Implementation Impact

- **Code changes**: 1 file ([`components/SurveyView.tsx`](../components/SurveyView.tsx)) — the `useEffect` initializer and the confirm button's `disabled` expression.
- **Backend/GraphQL/schema**: ✅ No changes — purely local React state, matching the requirement to keep this "純前端控制" (pure frontend control).
- **Testing**: Visual verification on `/survey/scenarios/0?sessionId=<any>` — confirm slider starting position differs across scenario reloads, and confirm button stays disabled until the slider is dragged.

---

### Disabled-State Visual Feedback for Confirm Button + Slider Glow Prompt (REQ-402.2)

#### Problem

REQ-402.1 disabled the confirm button via the `disabled` HTML attribute when `isDecisionPhase && !hasInteracted`, but the button's Tailwind `className` ternary in [`SurveyView.tsx`](../components/SurveyView.tsx) only checked `!allRevealed` to decide gray-vs-black styling. Result: the button was functionally unclickable but still rendered with the "enabled" black background and `animate-glow-indigo` pulse — confusing, since it looked active.

#### Fix 1 — Button gray-out matches `disabled`

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

The className condition now mirrors the `disabled` expression exactly — same boolean logic, evaluated twice (once for `disabled`, once for styling) rather than introducing a shared variable, consistent with the file's existing style of inlining these checks.

#### Fix 2 — Glowing prompt on the untouched slider

To visually invite the participant to interact (rather than just silently blocking the button), [`DecisionSlider`](../components/SurveyShared.tsx) now pulses with an indigo glow while `hasInteracted` is `false`. The glow is self-contained in `SurveyShared.tsx` (a local `<style>` block, mirroring the pattern already used in `SurveyView.tsx` for `animate-glow-indigo`) so it works wherever `DecisionSlider` is rendered — both the real decision phase (`SurveyView.tsx`) and the practice slider in the intro tutorial (`SurveyIntro.tsx`), since both pass a `hasInteracted` flag that starts `false`.

```typescript
{!hasInteracted && (
  <style>{`
    @keyframes glow-slider-pulse {
      0% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.3), 0 0 10px rgba(79, 70, 229, 0.15); }
      50% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.7), 0 0 25px rgba(79, 70, 229, 0.4); }
      100% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.3), 0 0 10px rgba(79, 70, 229, 0.15); }
    }
    .animate-glow-slider {
      animation: glow-slider-pulse 1.6s infinite ease-in-out;
    }
  `}</style>
)}
...
<input
  ...
  className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'animate-glow-slider' : ''}`}
/>
```

The glow disappears the instant `onChange` fires (`hasInteracted` flips to `true`), so it functions purely as a "this needs your input" affordance, not a persistent decoration.

#### Fix 3 — Gray out the "決策分析" probability text until interacted

The analysis paragraph below the slider ("您有 X% 機率會給予，Y% 機率不會給予對方。") previously always rendered in `text-gray-600`, even while the value shown was just the randomized (REQ-402.1) starting position the participant hadn't chosen yet. It now dims to `text-gray-300` while `!hasInteracted`, and transitions back to normal color on first interaction:

```typescript
<p className={`transition-colors duration-300 ${!hasInteracted ? 'text-gray-300' : ''}`}>
  您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。
</p>
```

#### Implementation Impact

- **Code changes**: 2 files — [`components/SurveyView.tsx`](../components/SurveyView.tsx) (button className) and [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (`DecisionSlider` glow + analysis text gray-out).
- **Backend/GraphQL/schema**: ✅ No changes.
- **Testing**: Visual verification that the confirm button is gray while `isDecisionPhase && !hasInteracted`, turns black with its pulse the instant the slider is dragged, and that the slider itself glows only before the first interaction.

---

### Slider Visual Camouflage — Appears Valueless Until Interacted (REQ-402.3)

#### Problem

REQ-402.1 gives `DecisionSlider` a randomized starting value instead of a fixed 50%, so anchoring bias is reduced — but the slider still visibly renders that random value's thumb position and indigo fill immediately, which can itself look like a starting "answer" the participant might mistake for a suggestion or leave unchanged. The requirement is for the slider to visually present as if it has **no** value at all until the participant actually touches it.

#### Design decision

A native `<input type="range">` cannot hold a `null`/empty value — it always needs a numeric `value` to be a valid controlled input. Rewriting it as a fully custom slider (to truly defer initializing a value until first touch) was considered but rejected as disproportionate for a cosmetic requirement. Instead, this is solved with **visual camouflage**: the randomized value keeps existing under the hood (unchanged from REQ-402.1), but the thumb and filled-track color are set to match the track's own background color while `!hasInteracted`, making the value's position visually indistinguishable from an empty track.

```typescript
// Before:
className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'animate-glow-slider' : ''}`}

// After:
className={`w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!hasInteracted ? 'accent-gray-200 animate-glow-slider' : 'accent-indigo-600'}`}
```

`accent-gray-200` matches the track's `bg-gray-200`, so Chrome's native thumb + filled-track rendering (both colored via `accent-color`) blends into the track. This project is Chrome-only (REQ-415), so no cross-browser `accent-color` fallback is needed. The moment the participant drags the slider, the class switches to `accent-indigo-600`, revealing the thumb and true value — consistent with the floating value bubble and "決策分析" text, which already only appear post-interaction (REQ-402.2).

#### Implementation Impact

- **Code changes**: 1 file — [`components/SurveyShared.tsx`](../components/SurveyShared.tsx), `DecisionSlider`'s `<input>` className.
- **Backend/GraphQL/schema**: ✅ No changes — the underlying `value`/`sliderValue` state and submission payload (`cooperationProbability: sliderValue / 100`) are unchanged.
- **Testing**: Visual verification that the slider track shows no visible thumb or fill color before interaction, and that dragging reveals the indigo thumb/fill immediately.

---

### Undecided-State Copy + Neutral Network Graph Decision Edge (REQ-402.4)

#### Problem

REQ-402.3 camouflaged the slider's own thumb/fill, but two other UI surfaces still leaked the randomized-but-untouched value:

1. The "決策分析" paragraph under the slider still computed and displayed `您有 X% 機率會給予...` from the random starting value.
2. `NetworkGraph`'s decision edge — the animated dashed path, the draggable percentage bubble ("給予"/"不給予"/"中立"), and the arrow tip — all colored themselves (`COLORS.coop`/`COLORS.defect`/`COLORS.highlight`) and labeled themselves from the same untouched `decision` prop, effectively announcing a stance on the graph before the participant chose one.

#### Fix 1 — Analysis text shows a call-to-action pre-interaction

```typescript
<p className={`transition-colors duration-300 ${!hasInteracted ? 'text-gray-300' : ''}`}>
  {hasInteracted
    ? <>您有 <span>{value}%</span> 機率會給予，<span>{100 - value}%</span> 機率不會給予對方。</>
    : '請點擊輸入您的決策'}
</p>
```

#### Fix 2 — `NetworkGraph` gains a `hasInteracted` prop; decision edge renders neutral until set

A new optional prop, `hasInteracted?: boolean` (default `true`, so existing admin/preview callers that never pass it are unaffected), is threaded through `NetworkGraph.tsx`. All three decision-edge render sites — the Layer 2 path, the Layer 6 draggable bubble (including its label and `dashSpeed` animation timing), and the arrow-tip marker — now check it first:

```typescript
if (!hasInteracted) {
  decisionColor = COLORS.highlight;
  edgeOpacity = 0.5;
} else if (visualDecision > 50) {
  decisionColor = COLORS.coop;
  ...
```

The bubble label:

```typescript
{!hasInteracted ? '未決策' : visualDecision > 50 ? '給予' : visualDecision < 50 ? '不給予' : '中立'}
```

And the dash animation, which previously varied speed with the raw `decision` value even pre-interaction:

```typescript
const dashSpeed = hasInteracted ? 1 - (decision / 100) * 0.6 : 0.7;
```

`COLORS.highlight` (`#f59e0b`, amber-500 — the same orange already used for the exact-50% "中立" case) was chosen over `COLORS.neutral` (gray) per feedback, so the undecided state visually matches the existing neutral/中立 amber accent instead of looking like a disabled/inactive gray edge. The color was already defined and the arrow-marker `<defs>` block already predefines a marker for it (`[COLORS.edgeInactive, COLORS.highlight, COLORS.coop, COLORS.defect, COLORS.neutral, 'transparent']`), so no new marker/color token was needed.

**Callers updated**: [`SurveyView.tsx`](../components/SurveyView.tsx) passes `hasInteracted={hasInteracted}` to its `<NetworkGraph>`; [`SurveyIntro.tsx`](../components/SurveyIntro.tsx) passes `hasInteracted={introSliderInteracted}` to its interactive practice-slider `<NetworkGraph>` for the same behavior in the tutorial.

#### Implementation Impact

- **Code changes**: 3 files — [`components/SurveyShared.tsx`](../components/SurveyShared.tsx) (analysis text), [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx) (new prop + 3 render sites + dash speed), [`components/SurveyView.tsx`](../components/SurveyView.tsx) and [`components/SurveyIntro.tsx`](../components/SurveyIntro.tsx) (pass the prop through).
- **Backend/GraphQL/schema**: ✅ No changes.
- **Testing**: Visual verification that before interaction the decision edge (path, bubble, arrow tip) renders in amber (`COLORS.highlight`) with a "未決策" label and the analysis text reads "請點擊輸入您的決策"; after the first drag, all of these switch to their value-driven colors/labels immediately.

---

## Known Issues and Fixes

### Fixed Issues

| ID | Component | Issue | Fix Date | Status |
|----|-----------|-------|----------|--------|
| BUG-001 | [`NetworkGraph.tsx`](../components/NetworkGraph.tsx) | TypeError: Cannot read properties of undefined (reading 'includes') | 2026-05-04 | ✅ Fixed |
| BUG-002 | [`SurveyOutro.tsx`](../components/SurveyOutro.tsx) | completeSurvey mutation never called, all submissions incomplete | 2026-05-04 | ✅ Fixed |
| BUG-003 | [`AdminView.tsx`](../components/AdminView.tsx) / [`SetupPanel.tsx`](../components/SetupPanel.tsx) | Read-only setup view shows 0 active edges despite history table showing correct count | 2026-05-04 | ✅ Fixed |

#### BUG-001: NetworkGraph undefined error

**Problem**: `activeEdges` could be undefined in multiple locations, causing crashes when calling `.includes()`.

**Solution**: Added defensive checks at 5 locations:

```typescript
// Before (crash-prone)
const activeEdges = mode === 'survey' && scenario?.activeEdgeIds 
  ? scenario.activeEdgeIds 
  : setup.activeEdgeIds;

// After (safe)
const activeEdges = (mode === 'survey' && scenario?.activeEdgeIds) 
  || setup?.activeEdgeIds 
  || [];
```

#### BUG-002: Incomplete submissions bug

**Problem**: [`SurveyOutro.tsx`](../components/SurveyOutro.tsx) never called `completeSurvey` mutation, so all submissions had `isCompleted: false`.

**Solution**:

1. Updated `SurveyOutro` to accept `onComplete` and `entryId` props
2. Added `handleFinalSubmit` function that calls `completeSurvey`
3. Updated `SurveyView` to pass these props
4. Created repair script [`scripts/fix-incomplete-submission.mjs`](../scripts/fix-incomplete-submission.mjs) for historical data

#### BUG-003: Admin history read-only view shows zero active edges

**Problem**: When clicking a session ID from [`/admin/view/manual`](../components/HistoryTable.tsx) to view configuration in read-only mode ([`/admin/setup`](../components/SetupPanel.tsx)), the "Active Edges" section displays as empty (k=0, no edge list) and the Network Graph shows no highlighted edges, despite the history table correctly showing the edge count and edge names.

**Root Cause**:
In the scenario-centric data model (REQ-320), `Session` documents do not store `activeEdgeIds` directly — this field only exists in `Scenario` documents. The [`AdminView.tsx`](../components/AdminView.tsx) history loader (lines 40-53) derives `activeEdgeIds` from `session.scenarios?.[0]?.activeEdgeIds || []` when mapping fetched sessions to local state. However, if the scenarios array is empty or not properly populated by the backend, this fallback results in `activeEdgeIds: []`, which gets passed to [`SetupPanel`](../components/SetupPanel.tsx), causing the UI to display zero edges.

**Impact**:

- Admins cannot verify historical session configurations in read-only mode
- Complexity check shows incorrect values (k=0, 2^k=1 instead of actual scenario count)
- Network graph visualization is blank, defeating the purpose of the read-only view

**Proposed Solutions** (choose one):

1. **Frontend fix in AdminView**: Ensure `activeEdgeIds` is always extracted from scenarios when loading history. If `scenarios` is empty, explicitly refetch or warn.
2. **Frontend fix in SetupPanel**: Add defensive logic to derive `activeEdgeIds` from `setup.scenarios[0]` if `setup.activeEdgeIds` is empty.
3. **Backend fix in resolvers**: Modify [`toSessionGraph`](../backend/graphql/resolvers.js:41) to always populate a virtual `activeEdgeIds` field by extracting from the first scenario for UI compatibility. This maintains backwards compatibility with UI expectations while preserving the scenario-centric model.

**Fix Applied**: Four-layer complete solution addressing all parts of the data pipeline:

1. **GraphQL Schema Layer** ([`backend/graphql/typeDefs.js:31`](../backend/graphql/typeDefs.js)):
   - Added `activeEdgeIds: [String!]!` to `Session` type as virtual field
   - Enables GraphQL to recognize and validate the field

2. **GraphQL Resolver Layer** ([`backend/graphql/resolvers.js:56-67`](../backend/graphql/resolvers.js)):
   - Modified `toSessionGraph` to derive `activeEdgeIds` from first scenario
   - Handles two cases: scenarios populated (extract from array) or not populated (query first scenario)
   - Ensures field is always populated with correct data

3. **Frontend Query Layer** ([`utils/graphqlClient.ts:88`](../utils/graphqlClient.ts)):
   - Updated `fetchAllSessions` GraphQL query to request `activeEdgeIds` field
   - Also added `activeEdgeIds` to nested `scenarios` query for consistency
   - Without this, frontend would not receive the field even if backend provides it

4. **Frontend Component Layer** ([`components/AdminView.tsx:47`](../components/AdminView.tsx)):
   - Simplified to use `session.activeEdgeIds` directly instead of deriving from scenarios
   - Added null coalescing (`|| []`) for TypeScript safety
   - Removed complex fallback logic that was masking the underlying issue

This complete solution ensures data flows correctly: Database → Resolver → GraphQL Schema → Frontend Query → Component Rendering.

---

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Build | Vite 6 | Fast dev server, ESM-first |
| UI | React 19 + TailwindCSS + MUI | React for familiarity; Tailwind via CDN; MUI for complex inputs |
| Routing | react-router-dom@7 | Standard SPA routing |
| Notifications | react-hot-toast | Lightweight feedback |
| GraphQL server | @apollo/server@5 + express5 integration | Mature, well-documented |
| HTTP server | Express 5 | Adequate for small REST surface |
| DB | MongoDB + Mongoose 8 | Document model fits scenarios array; Mongoose handles UUIDs |
| Bot defense | Cloudflare Turnstile | Free, privacy-friendly |
| Visualization | D3 v7 | Network graphs |
| Tests | Vitest + Testing Library | Co-located with Vite |

---

## Performance Considerations

- **Scenario populate**: Session.scenarios uses virtual populate. For sessions with 100+ scenarios, consider pagination or selective loading.
- **Balanced selection**: Mixed Mode queries sort by `responseCount` — index on `{ groupId: 1, status: 1, responseCount: 1 }` is critical.
- **Atomic updates**: `$inc` on `Scenario.responseCount` handles concurrency safely.
- **Batch inserts**: `Scenario.insertMany` for Mixed Mode scenario pools (potentially thousands of documents) — tested at scale (288 scenarios).

---

## Security Considerations

- Admin password env-only
- Turnstile cookie `httpOnly`, `sameSite=lax`, `secure` in prod
- `clearDatabase` hard-blocked in production
- No CSRF tokens (relies on same-site cookies + JSON content type)

**Mixed Mode Participant Identification** (REQ-311):

- **Current Implementation**: Random 16-character ID stored in localStorage (easily cleared)
- **Enhanced Approach**: Device fingerprinting with multi-layer fallback strategy

---

## Summary of Key Changes from Legacy Design

| Aspect | Old Design | New Design (Scenario-Centric) |
|--------|-----------|-------------------------------|
| **Atomic unit** | SessionSetup (embedded scenarios) | **Scenario** (independent documents) |
| **Session model** | SessionSetup with embedded data | **Session** with scenario ID references |
| **Mode handling** | Implicit, no explicit Mixed Mode support | **Three modes unified**, Mixed Mode fully supported |
| **Data collection** | Session-level only | **Scenario-level tracking** in Mixed Mode |
| **Submission.results** | `scenarioId: Number` (index) | `scenarioId: String` (UUID reference) |
| **SessionGroup** | `batchMode` boolean + separate fields | **Unified `config` object**, mode implicit |
| **Admin UI** | Manual + Batch | **Manual + Batch + Mixed** ✅ |
| **Survey flow** | Mode-agnostic (by accident) | Mode-agnostic (**by design**, REQ-323) |
| **GraphQL** | SessionSetup type + legacy queries | **`Session` + `Scenario`** types, clean API |
| **URL format** | `?setupId=` | `?sessionId=` or `?groupId=&mode=mixed` |
| **Code complexity** | ~500 lines legacy code | Removed, unified architecture |

---

## Traceability Matrix

| REQ | Design Components | Status |
|-----|-------------------|--------|
| REQ-201..203 | Manual Mode: `createManualSession` resolver, UI | ✅ Complete |
| REQ-204..206 | `SetupPanel.tsx` `useSearchParams()` toggle ↔ URL sync; default to `manual`; internal link hygiene | 📋 Planned (Phase 26) |
| REQ-301..304 | Batch Mode: `createBatchSessions` resolver, UI | ✅ Complete |
| REQ-306..309 | Mixed Mode: `createMixedGroup`, `startMixedSession` resolvers, `MixedModeConfig` | ✅ Complete |
| REQ-312 | `SessionGroup.config` conditional required validators, `GroupConfigInput` non-nullable fields, TypeScript types | 🔧 In Progress (Phase 24) |
| REQ-310 | Scenario heatmap visualization | ⏸️ Deferred |
| REQ-321 | `Scenario` model with independent collection | ✅ Complete |
| REQ-322 | `Session` model with `scenarioIds` reference array | ✅ Complete |
| REQ-323 | Unified `startSurvey`, `saveSurveyAnswer`, `completeSurvey` | ✅ Complete |
| REQ-401..405 | Survey flow: routing, response capture, completion | ✅ Complete |
| REQ-308 | `saveSurveyAnswer` atomically increments `Scenario.responseCount` | ✅ Complete |
| REQ-309 | `completeSurvey` checks scenario-level completion | ✅ Complete |
| REQ-340..342 | Submission progress tracking in admin history table | 📋 Planned (Phase 27) |
| REQ-351..354 | `Submission.isInvalid` field, `invalidateSubmission` mutation, cascading `submissionCount` / `responseCount` corrections, admin UI filter | 📋 Planned (Phase 30) |
| REQ-405.1 | Complete network history display in survey introduction | 📋 Planned |
| REQ-406 | `COLORS.rolePartnerHighlight` token in `constants.ts`; three color references in `NetworkGraph.tsx` (ring stroke, glow aura, badge fill) | 📋 Planned (Phase 34) |
| REQ-408 | `utils/payment.js`; `Submission.realisedPoints`/`payoutNtd`; `drawRealisedRound` persistence + backfill; `requireAdmin` + `submissionsByGroup`; `SurveyOutro` load/error flow and payment card; `SurveyIntro` step 7; `GroupDetailView` Export Payments | ✅ Complete (Phase 41) |
| REQ-409 | `GraphLegend` in `SurveyShared.tsx`; captions in `SurveyIntro.tsx`; "?" marker + graph cap in `NetworkGraph.tsx`; scenario grid + legend in `SurveyView.tsx` | ✅ Complete (Phase 42) |
| NFR-7, REQ-409.4 | `scripts/irb-shots/` (fixture, shot list, capture, report); `docs/irb/figures.md` | ✅ Complete (Phases 40, 43) |

---

## Device Fingerprinting Architecture (REQ-311)

### Overview

Replace random localStorage-based participant IDs with browser fingerprinting to provide more stable participant identification while remaining privacy-friendly.

### Fingerprinting Strategy

#### Multi-Layer Identification Approach

```
Layer 1: Device Fingerprint (Primary)
  ↓
Layer 2: Browser Storage (Secondary)
  ↓
Layer 3: Random ID (Fallback)
```

### Technical Design

#### 1. Fingerprint Generation (`utils/participantId.ts`)

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface FingerprintResult {
  visitorId: string;     // Stable fingerprint hash
  confidence: number;    // 0-1 score
  components: object;    // Raw fingerprint data (not stored)
}

/**
 * Generate device fingerprint
 * Uses: Canvas, WebGL, fonts, screen, timezone, audio context
 */
async function generateFingerprint(): Promise<string> {
  try {
    // Check DNT (Do Not Track) header
    if (navigator.doNotTrack === '1') {
      console.log('[Fingerprint] DNT enabled, using anonymous mode');
      return generateRandomId('dnt');
    }
    
    // Initialize FingerprintJS
    const fp = await FingerprintJS.load({
      monitoring: false  // Disable telemetry for privacy
    });
    
    // Get fingerprint
    const result = await fp.get();
    
    // Confidence check
    if (result.confidence.score < 0.5) {
      console.warn('[Fingerprint] Low confidence, using hybrid ID');
      return `fp-${result.visitorId.substring(0, 8)}-${generateRandomId('hybrid').substring(0, 8)}`;
    }
    
    return `fp-${result.visitorId}`;
    
  } catch (error) {
    console.error('[Fingerprint] Generation failed:', error);
    return generateRandomId('fallback');
  }
}

/**
 * Get or create participant ID with fingerprinting
 */
export async function getParticipantId(): Promise<string> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return generateRandomId('server');
  }
  
  const STORAGE_KEY = 'pd_participant_id';
  const FINGERPRINT_KEY = 'pd_fingerprint_v1';
  
  // Check if we already have a fingerprint-based ID
  let storedId = localStorage.getItem(STORAGE_KEY);
  let storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  
  // Generate current fingerprint
  const currentFingerprint = await generateFingerprint();
  
  // If fingerprint matches stored, reuse ID
  if (storedFingerprint === currentFingerprint && storedId) {
    return storedId;
  }
  
  // New fingerprint: create new ID or migrate old random ID
  if (!storedId) {
    storedId = currentFingerprint;
  } else if (!storedId.startsWith('fp-')) {
    // Migrate random ID to fingerprint-based
    console.log('[Fingerprint] Migrating random ID to fingerprint');
    storedId = currentFingerprint;
  }
  
  // Store both ID and fingerprint
  localStorage.setItem(STORAGE_KEY, storedId);
  localStorage.setItem(FINGERPRINT_KEY, currentFingerprint);
  
  return storedId;
}
```

#### 2. Privacy Safeguards

```typescript
/**
 * Privacy-first fingerprinting configuration
 */
const FINGERPRINT_CONFIG = {
  // Exclude sensors that might be considered invasive
  excludePixelRatio: false,
  excludeScreenResolution: false,
  excludeAvailableScreenResolution: true,  // Can reveal window manager
  excludeSessionStorage: true,              // Privacy concern
  excludeIndexedDB: true,                   // Privacy concern
  
  // Use only stable, non-invasive components
  components: [
    'canvas',          // Canvas rendering fingerprint
    'webgl',           // WebGL rendering
    'fonts',           // Installed fonts
    'timezone',        // Browser timezone
    'colorDepth',      // Screen color depth
    'platform',        // OS platform
    'plugins',         // Browser plugins (deprecated but still used)
    'touchSupport',    // Touch capability
    'hardwareConcurrency', // CPU cores
  ]
};
```

#### 3. UI Disclosure (Privacy Compliance)

Add notice to [`SurveyWelcome.tsx`](../components/SurveyWelcome.tsx):

```typescript
<Alert severity="info" sx={{ mt: 2 }}>
  本研究使用裝置指紋技術以防止重複提交,不會收集任何個人識別資訊。
  指紋技術僅分析您的瀏覽器配置(如字體、螢幕解析度),不涉及生物特徵或跨網站追蹤。
  <br />
  This study uses device fingerprinting to prevent duplicate submissions without
  collecting personal information. We analyze only browser configuration (fonts,
  screen resolution), not biometric data or cross-site tracking.
</Alert>
```

#### 4. Database Schema (No Changes Needed)

Fingerprint IDs are stored as regular strings in existing fields:
- `Session.metadata.participantId` (String)
- `Submission.participantId` (String)

ID format examples:
- Fingerprint-based: `fp-a1b2c3d4e5f6g7h8`
- DNT fallback: `dnt-a1b2c3d4e5f6g7h8`
- Error fallback: `fallback-a1b2c3d4e5f6g7h8`
- Hybrid (low confidence): `fp-a1b2c3d4-hybrid-e5f6g7h8`

### Library Choice Analysis

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **FingerprintJS (open-source)** | Free, privacy-friendly, good accuracy (90-95%) | Lower accuracy than Pro version | ✅ **Recommended** for academic use |
| **Fingerprint Pro (commercial)** | Higher accuracy (99.5%), server-side verification | $200/month, overkill for research | ❌ Not cost-effective |
| **Custom implementation** | Full control, no dependencies | Complex, maintenance burden, lower accuracy | ❌ Not recommended |

**Decision**: Use open-source FingerprintJS v3 (MIT license)

### Implementation Phases

#### Phase 21: Fingerprinting Core (1-2 days)
- Install `@fingerprintjs/fingerprintjs` package
- Refactor `utils/participantId.ts` with fingerprinting
- Add privacy notices to survey welcome page
- Handle DNT headers and error fallbacks

#### Phase 22: Testing & Validation (1 day)
- Test fingerprint stability across sessions
- Test fallback scenarios (DNT, errors, low confidence)
- Verify existing Mixed Mode flows still work
- Performance testing (<100ms fingerprint generation)

#### Phase 23: Migration Strategy (if needed)
- Existing random IDs can coexist with fingerprint IDs
- No database migration needed (both are strings)
- Admin can filter by ID prefix to analyze adoption

### Performance Considerations

- Fingerprint generation: ~50-100ms (async, non-blocking)
- Cache fingerprint in memory after first generation
- Only regenerate if localStorage is cleared
- No impact on backend performance (client-side only)

### Privacy & Compliance

✅ **Compliant with**:
- GDPR (no PII, transparent disclosure)
- CCPA (no sale of data, opt-out via DNT)
- Research ethics (informed consent via notice)

❌ **Does NOT**:
- Track users across websites
- Collect biometric data
- Store raw fingerprint components
- Identify individuals personally

### Monitoring & Analytics

Add optional tracking in Admin UI:
- Count of fingerprint-based vs. fallback IDs
- Fingerprint collision rate (multiple participants with same ID)
- DNT opt-out rate

---

## Submission Progress Tracking (REQ-340)

### Overview

The admin history table displays detailed progress information for each submission to help administrators understand participant completion patterns and identify drop-off points.

### Current Data Model Support

All required data is already available without schema changes:

```typescript
interface Submission {
  _id: string;
  sessionId: string;
  results: SurveyResult[];           // ← Count of answered questions
  demographics: {...} | null;         // ← Indicates demographics stage reached
  isCompleted: boolean;               // ← Final completion status
  createdAt: string;
  updatedAt: string;
}

interface Session {
  _id: string;
  scenarioIds: string[];              // ← Total question count
  scenarios?: Scenario[];             // ← Populated for detailed access
  // ...
}
```

### Progress Calculation

**Progress Formula**:
```
answeredCount = submission.results.length
totalCount = session.scenarioIds.length (or session.scenarios.length if populated)
progressPercent = (answeredCount / totalCount) × 100
```

**Stage Detection Logic**:
```typescript
function getSubmissionStage(submission: Submission, totalScenarios: number): StageInfo {
  if (submission.isCompleted) {
    return { stage: 'completed', label: '已完成 ✓', color: 'green' };
  }
  
  const answeredCount = submission.results.length;
  const hasAllAnswers = answeredCount >= totalScenarios;
  const hasDemographics = submission.demographics !== null;
  
  if (hasDemographics || hasAllAnswers) {
    // User finished questions but didn't submit final completion
    return {
      stage: 'demographics',
      label: '填寫人口統計',
      color: 'amber',
      progress: answeredCount / totalScenarios
    };
  }
  
  return {
    stage: 'answering',
    label: `答題中 (${answeredCount}/${totalScenarios})`,
    color: answeredCount / totalScenarios >= 0.5 ? 'amber' : 'red',
    progress: answeredCount / totalScenarios
  };
}
```

### UI Implementation in HistoryTable.tsx

**Current Structure** (lines 136-209):
```tsx
<tr className="bg-emerald-50/20">
  <td colSpan={10} className="px-4 py-4">
    <table className="w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>          {/* Currently: Completed / Incomplete */}
          <th>Start Time</th>
          <th>End Time</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map(sub => (
          <tr>
            <td>{sub._id}</td>
            <td>{sub.isCompleted ? 'Completed' : 'Incomplete'}</td>
            <td>{new Date(sub.createdAt).toLocaleString()}</td>
            <td>{sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </td>
</tr>
```

**Enhanced Structure** (proposed):
```tsx
<tr className="bg-emerald-50/20">
  <td colSpan={10} className="px-4 py-4">
    <table className="w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Progress</th>          {/* NEW: Progress bar + stage */}
          <th>Start Time</th>
          <th>End Time</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map(sub => {
          const totalScenarios = s.scenarios?.length || s.scenarioIds?.length || 0;
          const answeredCount = sub.results?.length || 0;
          const stageInfo = getSubmissionStage(sub, totalScenarios);
          
          return (
            <tr>
              <td>{sub._id}</td>
              
              {/* Status Badge */}
              <td>
                {sub.isCompleted ? (
                  <span className="bg-green-100 text-green-800">Completed</span>
                ) : (
                  <span className="bg-amber-100 text-amber-800">Incomplete</span>
                )}
              </td>
              
              {/* NEW: Progress Column */}
              <td>
                <div className="flex flex-col gap-1">
                  {/* Stage Label */}
                  <span className="text-xs font-medium text-gray-700">
                    {stageInfo.label}
                  </span>
                  
                  {/* Progress Bar (only for incomplete) */}
                  {!sub.isCompleted && (
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
              
              <td>{new Date(sub.createdAt).toLocaleString()}</td>
              <td>{sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '-'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </td>
</tr>
```

### Visual Design Mockup

**Before** (current):
```
┌─────────────────────────────────────────────────────────┐
│ ID          │ Status      │ Start Time   │ End Time     │
├─────────────────────────────────────────────────────────┤
│ 507f1f77... │ Completed   │ 2026-05-06   │ 2026-05-06   │
│ 507f1f88... │ Incomplete  │ 2026-05-05   │ -            │
└─────────────────────────────────────────────────────────┘
```

**After** (enhanced):
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ID          │ Status      │ Progress                │ Start    │ End      │
├──────────────────────────────────────────────────────────────────────────┤
│ 507f1f77... │ ✓ Completed │ 已完成 ✓                │ 2026...  │ 2026...  │
│ 507f1f88... │ ⧗ Incomplete│ 答題中 (7/15)           │ 2026...  │ -        │
│             │             │ 7/15 ████████░░░░░░ 47% │          │          │
│ 507f1f99... │ ⧗ Incomplete│ 填寫人口統計            │ 2026...  │ -        │
│             │             │ 15/15 ███████████ 100%  │          │          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Color Coding Strategy

| Progress % | Color | Tailwind Classes | Interpretation |
|-----------|-------|------------------|----------------|
| 100% (completed) | Green | `bg-green-500` | Submission complete |
| 50-99% | Amber | `bg-amber-500` | Good progress, likely to complete |
| 0-49% | Red | `bg-red-500` | Low progress, may be abandoned |

### Performance Considerations

- **No additional queries**: All data is already loaded in `HistoryTable` component's `submissions` state
- **Computation cost**: O(n) where n = number of submissions (already iterating in `.map()`)
- **Rendering cost**: Minimal — adds one extra cell per row with simple CSS progress bar

### Implementation Impact

| Aspect | Details |
|--------|---------|
| **Files changed** | 1 file ([`components/HistoryTable.tsx`](../components/HistoryTable.tsx)) |
| **Lines modified** | ~40 lines (add progress column and calculation logic) |
| **Data model changes** | None |
| **API changes** | None |
| **Breaking changes** | None (purely additive UI enhancement) |

### Traceability

| REQ | Design Section | Implementation |
|-----|----------------|----------------|
| REQ-341 | Progress calculation logic, Stage detection | `HistoryTable.tsx` enhanced submission table |
| REQ-342 | Color coding strategy, Visual design mockup | Progress bar rendering with conditional colors |
| REQ-343 | N/A — deferred | Not implemented in Phase 27 |

---

## Phase 34 — Partner Node Peach-Pink Visual Highlight (REQ-406)

**Status**: 📋 Designed 2026-06-15 | **Priority**: Medium | **Components**: [`constants.ts`](../constants.ts), [`components/NetworkGraph.tsx`](../components/NetworkGraph.tsx)

### Overview

The partner node ("搭檔") in the experiment network graph currently renders with near-invisible gray emphasis colors. This design section documents the change to a vivid peach-pink (`#f472b6`, Tailwind `pink-400`) that matches the visual prominence of the focal node ("您") amber highlight (`#f59e0b`).

### Current Color Scheme

| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.highlight` | `#f59e0b` (amber-500) | Focal node ring stroke, glow aura, badge fill |
| `COLORS.roleOpponent` | `#374151` (gray-700) | **Partner node** ring stroke and glow aura — **TO CHANGE** |
| `COLORS.rolePartner` | `#6b7280` (gray-500) | **Partner node** badge fill — **TO CHANGE** |

### New Color Scheme

Add one new token to `COLORS` in `constants.ts`:

```typescript
rolePartnerHighlight: '#f472b6',   // pink-400 — partner node emphasis (ring, glow, badge)
```

The existing `roleOpponent` and `rolePartner` tokens are **not removed** — they may be referenced elsewhere in the codebase and their gray values remain valid for any non-emphasis usage.

### NetworkGraph.tsx — Three Affected Locations

#### 1. Node Ring Stroke (partner node branch)

```typescript
// Before (~line 646):
strokeColor = COLORS.roleOpponent; strokeWidth = 4;

// After:
strokeColor = COLORS.rolePartnerHighlight; strokeWidth = 4;
```

#### 2. Pulsing Glow Aura (partner node animated circle)

```typescript
// Before (~line 742):
stroke={COLORS.roleOpponent}

// After:
stroke={COLORS.rolePartnerHighlight}
```

#### 3. Role Badge Fill

```typescript
// Before (~line 771):
roleFill = COLORS.rolePartner; // gray-500

// After:
roleFill = COLORS.rolePartnerHighlight;
```

### Visual Comparison

| Element | Before | After |
|---------|--------|-------|
| Partner ring stroke | `#374151` gray-700 (very dark, low contrast) | `#f472b6` pink-400 (vibrant, high contrast) |
| Partner glow aura | `#374151` gray-700 | `#f472b6` pink-400 |
| Partner badge fill | `#6b7280` gray-500 | `#f472b6` pink-400 |
| Focal ring/glow/badge | `#f59e0b` amber-500 | `#f59e0b` amber-500 (unchanged) |

### Design Rationale

The focal node ("您") and partner node ("搭檔") are the two nodes a participant must attend to simultaneously when making their cooperation-probability judgment. They should be visually co-equal in salience. The current gray partner colors are muted by design system defaults rather than intentional choice. Peach-pink (`#f472b6`) provides:

- High contrast against both dark and light backgrounds
- Clear semantic differentiation from the focal node's amber (avoiding confusion about which role is which)
- Warm-toned palette that fits the existing amber/orange-family highlight approach

### Implementation Impact

| Aspect | Details |
|--------|---------|
| **Files changed** | 2 files: `constants.ts`, `components/NetworkGraph.tsx` |
| **Lines changed** | ~4 lines total |
| **Backend changes** | None |
| **Data model changes** | None |
| **Breaking changes** | None — `roleOpponent` and `rolePartner` tokens preserved |

**Maps to**: REQ-406

---

## Phase 33 — Chrome-Only Browser Enforcement (REQ-415)

**Status**: 📋 Designed 2026-05-30 | **Priority**: High | **Component**: [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx)

### Overview

Add client-side browser detection to `SurveyWelcome.tsx`. If the participant is not using Chrome, display a blocking warning and disable the "開始實驗" button.

### Detection Logic

```typescript
function isChromeBrowser(): boolean {
  const ua = navigator.userAgent;
  return /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
}
```

**Why this rule:**
- `Chrome/` — present in Chrome, Brave, and all Chromium-based browsers
- `Edg/` — present in Microsoft Edge; excluded
- `OPR/` — present in Opera; excluded
- Brave omits its own identifier from `userAgent`, so it passes as Chrome (acceptable)

### State Management

```typescript
const [isChrome, setIsChrome] = useState<boolean>(true);

useEffect(() => {
  const ua = navigator.userAgent;
  setIsChrome(/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua));
}, []);
```

Using `useState(true)` as the default avoids a flash of the warning during hydration on actual Chrome browsers.

### UI Design

**Warning banner** (rendered when `!isChrome`):

```tsx
{!isChrome && (
  <div className="w-full max-w-3xl mb-4 bg-amber-50 border border-amber-300 rounded-xl px-6 py-4 flex items-start gap-3">
    {/* Warning icon */}
    <svg className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.194-.833-2.964 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
    <div>
      <p className="font-semibold text-amber-800">請使用 Google Chrome 瀏覽器</p>
      <p className="text-sm text-amber-700 mt-1">
        本實驗僅支援 Chrome，使用其他瀏覽器可能導致實驗無法正常運行。
        請複製網址並在 Chrome 中開啟。
      </p>
    </div>
  </div>
)}
```

**Disabled button** (when `!isChrome`):

```tsx
<button
  onClick={handleStart}
  disabled={!isChrome}
  className={`px-10 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all duration-200 ${
    isChrome
      ? 'hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1'
      : 'opacity-50 cursor-not-allowed'
  }`}
>
  開始實驗
</button>
```

### Implementation Impact

| Aspect | Details |
|--------|---------|
| **Files changed** | 1 file: [`components/SurveyWelcome.tsx`](../components/SurveyWelcome.tsx) |
| **Lines added** | ~25 lines |
| **Backend changes** | None |
| **Breaking changes** | None |
| **Test impact** | All Chrome-based testing environments unaffected |

**Maps to**: REQ-415

---

## Next Steps

### Completed ✅
- Phase 12-14: Backend refactor (data models, GraphQL API, utils)
- Phase 15-16: Frontend refactor (Admin UI, Survey flow)
- Legacy API removal
- Mixed Mode core implementation
- Bug fixes (NetworkGraph, SurveyOutro)
- Scenario schema refinement

### In Progress 🔄
- **Phase 21-23**: Device fingerprinting implementation (REQ-311)

### Remaining 🟡
- **REQ-310**: Scenario completion heatmap for Mixed Mode groups
- Frontend test updates for new API
- Performance optimization if needed at scale

### Future Enhancements 💡
- Real-time admin dashboards
- Multi-language support (i18n expansion)
- Email verification as additional layer (post-fingerprinting)

---

## Phase 31 — Complete Submission Data CSV Export (REQ-360..REQ-363)

**Status**: 📋 Designed | **Priority**: High | **Requirement**: REQ-361, REQ-362, REQ-363

### Objective

Replace the current session-level CSV export (which only includes session metadata) with a comprehensive submission data export that includes all participant responses, complete scenario configurations, demographics, and validity flags in a format optimized for statistical analysis.

### Background

The current `handleExportCSV` function in [`GroupDetailView.tsx`](../components/GroupDetailView.tsx:187-215) exports only session-level metadata (session ID, focal/opponent nodes, progress, survey URL). Researchers need the actual participant response data including:
- Individual cooperation probability answers for each scenario
- Complete scenario configuration (active edges, edge states)
- Participant demographics
- Timestamps and validity flags
- All fields needed to reconstruct the experimental condition

### Design Decision: Row-Per-Answer Format

**Choice**: CSV uses "long format" where each row represents one participant's response to one scenario.

**Rationale**:
- **Analysis-friendly**: Standard format for R (`tidyverse`), Python (`pandas`), and SQL databases
- **Flexible filtering**: Easy to filter by scenario, participant, or time range
- **Scenario details included**: Each row contains complete scenario configuration (no need for joins)
- **Handles variable-length data**: Participants may answer different numbers of scenarios (especially in Mixed Mode)

**Alternative considered**: "Wide format" (one row per submission, cooperation probabilities in separate columns) — rejected because it requires fixed column count and doesn't scale to variable scenario counts.

### Data Schema

#### CSV Column Specification (22 columns)

| Column | Data Source | Type | Example | Notes |
|---|---|---|---|---|
| `Group Name` | `SessionGroup.name` or "Standalone Session" | string | "政治網絡實驗 2026-05" | Empty if `groupId` is null |
| `Group ID` | `SessionGroup._id` | string (UUID) | "abc123..." | Empty if standalone |
| `Session ID` | `Session._id` | string (UUID) | "def456..." | Always present |
| `Submission ID` | `Submission._id` | string (UUID) | "ghi789..." | Always present |
| `Participant ID` | `Submission.participantId` | string or empty | "fp_a1b2c3..." | May be null for Manual Mode |
| `Scenario ID` | `Scenario._id` | string (UUID) | "jkl012..." | Always present |
| `Scenario Index` | `Scenario.scenarioIndex` | integer | `0`, `42` | Position in design matrix |
| `Focal Node` | `Scenario.focalNode` | string | "KMT1" | Agent ID format |
| `Opponent Node` | `Scenario.opponentNode` | string | "DPP3" | Agent ID format |
| `Active Edges` | `Scenario.activeEdgeIds.join('; ')` | string | "KMT1→DPP3; KMT2→DPP4" | Semicolon-separated edge names |
| `Edge Count (k)` | `Scenario.activeEdgeIds.length` | integer | `2`, `5` | Number of active edges |
| `Edge States (JSON)` | `JSON.stringify(Scenario.edgeStates)` | JSON string | `{"KMT1→DPP3":"give",...}` | Full edge state mapping |
| `Cooperation Probability` | `SurveyResult.cooperationProbability` | float | `0.65`, `0.0`, `1.0` | Range [0.0, 1.0] |
| `Response Time (ms)` | `SurveyResult.responseTime` | integer or empty | `3542` | May be null if not recorded |
| `Answered At` | `SurveyResult.answeredAt` | ISO timestamp | "2026-05-06T12:34:56.789Z" | UTC timezone |
| `Age` | `Submission.demographics.age` | integer or empty | `25`, `42` | Repeated for all rows of one submission |
| `Gender` | `Submission.demographics.gender` | string or empty | "male", "female", "other" | Repeated for all rows |
| `Education` | `Submission.demographics.education` | string or empty | "bachelor", "master" | Repeated for all rows |
| `Submission Completed` | `Submission.isCompleted` | boolean | `true`, `false` | Repeated for all rows |
| `Submission Invalid` | `Submission.isInvalid` | boolean | `true`, `false` | Repeated for all rows, defaults to `false` |
| `Submission Created At` | `Submission.createdAt` | ISO timestamp | "2026-05-06T12:30:00.000Z" | Repeated for all rows |
| `Submission Completed At` | `Submission.completedAt` | ISO timestamp or empty | "2026-05-06T12:45:00.000Z" | May be null if not completed |

#### Row Generation Rules

1. **One row per answer**: A submission with N scenarios generates N rows
2. **Empty submissions**: If `submission.results.length === 0`, generate a single row with scenario fields empty (to preserve submission metadata)
3. **Missing scenarios**: If a scenario referenced in `results[]` is deleted from the database, generate row with scenario ID but detail fields marked "DELETED"
4. **Demographics repeat**: Age, gender, education values are repeated in every row for that submission (standard long format practice)

### Implementation Design

#### Location

Modify [`GroupDetailView.tsx`](../components/GroupDetailView.tsx:187-215) `handleExportCSV` function.

#### Required Data

The export needs to join across four collections:
1. **SessionGroup** — for group name (or null)
2. **Session** — already loaded in component state
3. **Submission** — already loaded in component state via GraphQL query
4. **Scenario** — need to load referenced scenarios from `submission.results[].scenarioId`

#### Data Loading Strategy

**Option A: Frontend join** (recommended for Phase 31)
- Use existing `submissions` state (already loaded for display)
- Each submission already has `results` array with `scenarioId` references
- Load all referenced scenarios in a single GraphQL query: `scenarios(ids: [...])`
- Perform join in client JavaScript

**Pro**: No backend changes, reuses existing GraphQL queries
**Con**: Additional network round-trip for scenario data

**Option B: Backend resolver**
- Add new GraphQL query `exportSubmissionData(groupId: ID!)`
- Resolver performs MongoDB aggregation pipeline with `$lookup` joins
- Returns pre-joined flat data structure

**Pro**: Single network call, optimized database join
**Con**: Requires new backend resolver, query definition, more testing

**Decision**: Start with Option A (frontend join) for fastest implementation. Consider Option B if performance becomes an issue (>1000 submissions).

#### Edge Name Derivation

Active edges are stored as IDs (e.g., `["KMT1→DPP3", "KMT2→DPP4"]`). The CSV should display human-readable edge names.

**Approach**: Reuse existing helper functions from `GroupDetailView.tsx`:
- Import `EDGES` from [`constants.ts`](../constants.ts)
- Edge ID format is already `"{source}→{target}"`, so it's human-readable as-is
- No additional transformation needed

#### CSV Encoding & Format

```typescript
// Pseudo-code structure
const rows = [];

for (const submission of submissions) {
  const groupName = group?.name || "Standalone Session";
  const groupId = group?._id || "";
  
  // Handle empty submissions (no answers yet)
  if (submission.results.length === 0) {
    rows.push({
      "Group Name": groupName,
      "Group ID": groupId,
      "Session ID": submission.sessionId,
      "Submission ID": submission._id,
      "Participant ID": submission.participantId || "",
      // ... all scenario fields empty
      "Submission Completed": submission.isCompleted,
      "Submission Invalid": submission.isInvalid || false,
      // ... timestamps
    });
    continue;
  }
  
  // For each answer in this submission
  for (const result of submission.results) {
    const scenario = scenariosMap.get(result.scenarioId); // Pre-loaded scenario lookup
    
    if (!scenario) {
      // Handle deleted scenario case
      rows.push({
        /* ... */
        "Scenario ID": result.scenarioId,
        "Scenario Index": "",
        "Focal Node": "DELETED",
        "Opponent Node": "DELETED",
        /* ... */
      });
      continue;
    }
    
    rows.push({
      "Group Name": groupName,
      "Group ID": groupId,
      "Session ID": submission.sessionId,
      "Submission ID": submission._id,
      "Participant ID": submission.participantId || "",
      "Scenario ID": scenario._id,
      "Scenario Index": scenario.scenarioIndex,
      "Focal Node": scenario.focalNode,
      "Opponent Node": scenario.opponentNode,
      "Active Edges": scenario.activeEdgeIds.join('; '),
      "Edge Count (k)": scenario.activeEdgeIds.length,
      "Edge States (JSON)": JSON.stringify(scenario.edgeStates),
      "Cooperation Probability": result.cooperationProbability,
      "Response Time (ms)": result.responseTime || "",
      "Answered At": result.answeredAt || "",
      "Age": submission.demographics?.age || "",
      "Gender": submission.demographics?.gender || "",
      "Education": submission.demographics?.education || "",
      "Submission Completed": submission.isCompleted,
      "Submission Invalid": submission.isInvalid || false,
      "Submission Created At": submission.createdAt,
      "Submission Completed At": submission.completedAt || ""
    });
  }
}

// Convert to CSV
const headers = Object.keys(rows[0]);
const csvContent = [
  headers.join(','),
  ...rows.map(row =>
    headers.map(h => {
      const value = row[h];
      // Escape values containing commas, quotes, or newlines
      if (typeof value === 'string' && /[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  )
].join('\n');

// Add BOM for UTF-8 Excel compatibility
const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
```

#### Filename Format

```
{group_name}_submissions_{YYYYMMDD}_{HHmmss}.csv
```

Example: `政治網絡實驗_2026_05_submissions_20260506_133045.csv`

- Replace non-alphanumeric characters (except underscores/hyphens) with underscores for filesystem safety
- Include date and time to make exports uniquely identifiable
- Use "submissions" (not "sessions") to clarify data type

#### UI Changes

1. **Button label**: Change "Export CSV" tooltip/label to clarify it exports submission data (not just session metadata)
2. **Disabled state**: Keep existing `disabled={sessions.length === 0}` check, but also disable if `submissions.length === 0`
3. **Toast message**: Update to "CSV 已匯出: {filename}" to show actual filename

### GraphQL Query Requirement

Need to fetch scenarios for all `scenarioId` values referenced in `submissions[].results[]`:

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

**Check**: Does this query already exist? If not, add to [`backend/graphql/typeDefs.js`](../backend/graphql/typeDefs.js) and implement resolver in [`backend/graphql/resolvers.js`](../backend/graphql/resolvers.js).

### Testing Strategy

1. **Unit tests**:
   - CSV escaping logic (commas, quotes, newlines)
   - Empty submission handling
   - Missing/deleted scenario handling
   - Filename sanitization

2. **Integration tests**:
   - Export from Manual Mode session (single session, multiple submissions)
   - Export from Batch Mode group (multiple sessions)
   - Export from Mixed Mode group (dynamic sessions, 1:1 session-submission)
   - Verify row count: sum of all `submission.results.length` across group
   - Verify UTF-8 BOM presence (open in Excel, check Chinese characters render correctly)

3. **Data validation**:
   - Import CSV into R/Python and verify:
     - All cooperation probabilities are in [0, 1]
     - All timestamps are valid ISO format
     - No missing required fields (Submission ID, Scenario ID, Cooperation Probability)
     - Group-by submission ID count matches original `results.length`

### Edge Cases

1. **Submission with no answers** (user created entry but answered nothing)
   - Generate 1 row with empty scenario fields
   - Preserve submission metadata (ID, created timestamp, demographics if filled)

2. **Deleted scenario** (scenario referenced in `results[]` but removed from database)
   - Generate row with `Scenario ID` but mark detail fields as "DELETED"
   - Log warning to console: "Scenario {id} referenced in submission but not found"

3. **Invalid submission**
   - Include in export (don't filter out)
   - `Submission Invalid` column explicitly marks it for researcher's filtering decision

4. **Mixed Mode with partial completion**
   - Only scenarios in `results[]` are exported (not all scenarios assigned to session)
   - Matches actual data collected, not theoretical assignment

5. **Very large exports** (>10,000 rows)
   - May cause browser memory pressure
   - Consider showing progress indicator during CSV generation
   - Future: stream to file or backend-generated download

### Success Criteria

- [ ] Export button generates CSV with 22 columns matching spec
- [ ] Each row represents one answer (cooperation probability + scenario)
- [ ] Demographics are correctly repeated for all rows of one submission
- [ ] Invalid submissions are included and marked
- [ ] Edge names are human-readable (not just IDs)
- [ ] Edge states are preserved as JSON for programmatic parsing
- [ ] CSV opens correctly in Excel with Chinese characters rendering properly (BOM present)
- [ ] Filename includes group name and timestamp
- [ ] Toast notification shows successful export
- [ ] Export works for all three modes (Manual, Batch, Mixed)

### Dependencies

- **GraphQL**: May need to add `scenarios(ids: [ID!]!): [Scenario]` query if not already present
- **Frontend utilities**: Reuse existing edge/node label helpers from `GroupDetailView.tsx`
- **No backend changes**: All logic runs client-side (frontend join)

### Migration Notes

None. This is a new feature, not a schema change. Existing data is read-only for export.

---

## Phase 35: Debrief Screen with Realised Round, Real Opponent Pairing, and Persisted Payment (REQ-407, REQ-407.1)

**Status**: ✅ **Complete** — superseding the original frontend-placeholder design below. Opponent pairing and persisted give/no-give draws are fully backend-wired.

### Overview

`SurveyOutro` inserts a debrief step (step 2) between the registration code step (step 1) and the email collection step. The debrief reveals each round's give/no-give outcome and highlights the randomly drawn "實現回合" that determines the participant's cash reward. Both the drawn round and every round's give/no-give outcome (mine and my opponent's) are decided server-side, once, and persisted — so re-opening or refreshing the debrief screen always shows the same result and pays out the same amount.

### Step Renumbering

| Old step | New step | Content |
|----------|----------|---------|
| 1 | 1 | 報名代碼確認 (unchanged) |
| — | **2** | **Debrief: 每回合決策結果 + 實現回合 + 金額** |
| 2 | 3 | Email 收集 |
| 3 | 4 | 完成頁 |

### Backend: `drawRealisedRound` Resolver (`backend/graphql/resolvers.js`)

Called once when the participant reaches step 2 ([`SurveyOutro.tsx`](../components/SurveyOutro.tsx)). Two responsibilities:

**1. Draw which round is realised (paid out):**
```js
const drawnIndex = Math.floor(Math.random() * totalRounds); // uniform over answered rounds
```

**2. Pair with a real opponent, per round, and draw a give/no-give outcome for both sides:**

- The session's `groupId` + `opponentNode` identify the opposing node group (`KMT1`/`KMT2` vs `DPP3`/`DPP4`).
- For each of the participant's scenarios, find `Scenario` docs in the group with the **same `scenarioIndex`** but `focalNode` in the opponent group (the mirrored condition).
- Collect `cooperationProbability` answers from completed, valid `Submission`s that answered any of those mirrored scenarios.
- For each round, randomly sample one probability from that pool as `opponentProbs[i]`. **Fallback**: `Math.random()` when there's no group/opponent context, or no partner has answered the mirrored scenario yet.
- **Give/no-give is a Bernoulli draw on the probability itself, not a threshold** (REQ-407.1): for every round, `myDecisions[i] = Math.random() < results[i].cooperationProbability` and `opponentDecisions[i] = Math.random() < opponentProbs[i]`. This applies uniformly — there is no special-cased comparison against 50%, and no distinction between "the participant picked exactly 50%" and any other value.

```js
const myDecisions = submission.results.map(r => Math.random() < r.cooperationProbability);
const opponentDecisions = opponentProbs.map(p => Math.random() < p);

await SubmissionModel.findByIdAndUpdate(submissionId, {
  $set: { realisedRoundIndex: drawnIndex, opponentProbs, myDecisions, opponentDecisions }
});
```

**Idempotency & persistence**: `realisedRoundIndex`, `opponentProbs`, `myDecisions`, `opponentDecisions` are all persisted on `Submission` ([`backend/models/Submission.js`](../backend/models/Submission.js)). If `drawRealisedRound` is called again for a submission that already has `realisedRoundIndex` set, it returns the cached values instead of re-drawing — so a page refresh cannot change the outcome or payout. Legacy submissions that predate `myDecisions`/`opponentDecisions` (but already have `realisedRoundIndex`/`opponentProbs` from before REQ-407.1) are migrated in place on next access: the missing boolean arrays are drawn once and persisted.

**Why persistence matters here**: before REQ-407.1, only the exact-50%-probability tie was decided by an unpersisted client-side coin flip (`Math.random() > 0.5`, recomputed via `useMemo` on every component mount) — a narrow edge case. Generalizing to a Bernoulli draw for *every* probability means nearly every round is now a random draw; without server-side persistence, refreshing the debrief screen could change the participant's realised cash payout, which is unacceptable for a real-incentive research design.

### GraphQL Schema (`backend/graphql/typeDefs.js`)

```graphql
type Submission {
  ...
  realisedRoundIndex: Int
  opponentProbs: [Float!]
  myDecisions: [Boolean!]
  opponentDecisions: [Boolean!]
  ...
}

type DebriefResult {
  realisedRoundIndex: Int!
  opponentProbs: [Float!]!
  myDecisions: [Boolean!]!
  opponentDecisions: [Boolean!]!
}
```

### Component Changes — `SurveyOutro.tsx`

**State**: `selectedRoundIdx`, `myDecisions: boolean[]`, `opponentDecisions: boolean[]` are populated from `fetchSubmission` (resume/refresh case) or `drawRealisedRound` (first visit), never computed locally except as a last-resort fallback if both GraphQL calls fail (in which case the fallback draws + displays a result but does not persist it).

**No client-side probability threshold or coin-flip logic remains.** `randomDecisions`/`myAtFifty`/`oppAtFifty` were removed; `myGive`/`oppGive` for each row are read directly from the persisted `myDecisions[i]`/`opponentDecisions[i]` booleans.

### Debrief UI Layout (step 2)

```text
┌─────────────────────────────────────────────────────┐
│  標題: 實驗結果回顧                                   │
│  副標題: 以下是您每回合的決策記錄                      │
│                                                     │
│  ┌──┬──────────┬──────────┬──────┐                  │
│  │# │ 您        │ 搭檔      │ 點數 │                  │
│  ├──┼──────────┼──────────┼──────┤                  │
│  │1 │ 合作      │ 不合作    │  0   │                  │
│  │2 │ 不合作    │ 合作      │  3   │  ← amber highlight (selected round)
│  │… │ …         │ …         │  …   │                  │
│  └──┴──────────┴──────────┴──────┘                  │
│                                                     │
│  ┌── 您的獎勵 ────────────────────────────────────┐  │
│  │  抽中回合：第 2 回合                            │  │
│  │  點數：3 點                                    │  │
│  │  獎勵金額：300 元                               │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│  [ 繼續 ]                                           │
└─────────────────────────────────────────────────────┘
```

Each row shows only the qualitative 合作/不合作 badge — the underlying `cooperationProbability` percentage is not displayed, and no tooltip explains a "randomly decided" edge case, since every row's outcome is now equally a probabilistic draw (there is nothing exceptional about any single value to call out).

**Row styling:**

- Plain row: white background, gray border
- Selected round row: `bg-amber-50 border-l-4 border-amber-400`

**Payoff computation** (client-side, from the persisted booleans):

```ts
const points = myGive && oppGive ? 2 : !myGive && oppGive ? 3 : myGive && !oppGive ? 0 : 1;
```

**Payment card:** `bg-indigo-50 rounded-xl p-4 border border-indigo-200`, showing the drawn round, its points, and `points × 100` NTD.

> **Superseded 2026-10-01 (Phase 41, REQ-408):** the payment card now shows the server-persisted `payoutNtd` with the explicit formula, and the client-side fallback draw is gone. See Phase 41 below.

---

## Phases 40–43 — IRB Revisions: Payment Conversion, Figure Legibility, Before/After Evidence (REQ-408, REQ-409, NFR-7)

**Status**: ✅ Complete (2026-10-01) — pending PI decisions: participation fee, payment timing, caption/payment copy approval

### Overview

| IRB comment | Design response | Phase |
|-------------|-----------------|-------|
| 1.「適度調整圖片尺寸及解析度，並補充相對應的說明，以利參與者理解欲傳達的訊息及內容。」 | `GraphLegend` explains every graph encoding; captions under the intro figures; larger "?" markers, a wider scenario graph and a readable intro list; 2× DPR screenshots with a caption index for the IRB packet | 42, 43 |
| 2.「確認點數與實際報酬的換算。」 | One payment module; payout computed and persisted on the server; consistent rate / range / example / payment form in the intro, debrief and email step; payment ledger export; admin-only access to participant email | 41 |
| (Requested by the research team) before/after evidence for every edit | Deterministic capture tooling + PDF report | 40, 43 |

**Why the figures were hard to read but never "low resolution" in the app:** every participant-facing figure (`NetworkGraph`, `InteractiveInlineEdge`, `MiniAvatar`) is inline SVG, so it scales without blur. The resolution problem the IRB saw comes from raster screenshots in the application packet, and is solved by Phase 43's 2× DPR captures. The size problem is real in the app and is solved by Phase 42.

**Execution order:** Phase 40 (tooling + "before" shots, taken while the app source is still identical to commit `934e945`) → Phase 41 → Phase 42 → Phase 43 ("after" shots + report).

---

### Phase 40 — Before/After Capture Tooling (NFR-7)

All tooling lives in `scripts/irb-shots/` and never changes the app bundle. It uses two devDependencies:

- `playwright-core` — drives the locally installed Google Chrome (`channel: 'chrome'`), so no browser download is needed and screenshots use the same browser participants are required to use (REQ-415).
- `mongodb-memory-server` — a throwaway in-memory MongoDB, so capture runs never touch the study database. Setting `IRB_SHOTS_MONGODB_URI` points the tooling at an existing dev database instead; the study database must never be used.

| File | Responsibility |
|------|----------------|
| `fixture.mjs` | Fixed IDs and documents; `seedFixture()` inserts them through the app's own Mongoose models |
| `shots.mjs` | The edit-part catalog (A1–A6, B1–B3) and the shot list shared by the capture and report scripts |
| `capture.mjs` | Starts the DB and the built app, applies the fixture, captures every shot at both viewports, writes `meta.json` and text evidence |
| `build-report.mjs` | Pairs before/after images, checks coverage, renders HTML and prints the PDF |

**npm scripts:** `npm run irb:shots -- --label before|after` builds `dist/` from the working tree and captures it; `npm run irb:report` builds the PDF from the two captured sets.

**Capturing the baseline from a clean checkout:** the "before" set in the report was captured from a git worktree of `934e945` (its `node_modules` symlinked to the main checkout), after `npx vite build` there:

```bash
git worktree add --detach <dir> 934e945 && ln -s "$PWD/node_modules" <dir>/node_modules
(cd <dir> && npx vite build)
node scripts/irb-shots/capture.mjs --label before --app <dir>
```

`--app` points the capture at another checkout (its `dist/`, `server.js` and git state); the tooling itself always runs from the main checkout. This also lets the "before" set be retaken at any time.

#### Fixture (identical in every run)

| Document | Key fields |
|----------|-----------|
| `SessionGroup` `irb-fixture-group` | Mixed-mode group (so the admin page loads submissions on mount): name「IRB 截圖測試組」; `maxK` 3, `scenariosPerSession` 3, `targetSizePerScenario` 5; focal KMT1, opponent DPP3 |
| `Scenario` `irb-fixture-scn-1..3` | 3 active edges each with fixed `edgeStates`; `scenarioIndex` 0..2 |
| `Session` `irb-fixture-session` | The in-progress participant's session (all participant screens) |
| `Session` `irb-fixture-session-done` | The completed participant's session |
| `Submission` `6a1f0000000000000000a001` (live) | In progress; 3 answers; persisted draw: `realisedRoundIndex` 1, `myDecisions` [true, **false**, true], `opponentDecisions` [false, **true**, true] → round 2 is 您 不給 / 搭檔 給 → **3 點** |
| `Submission` `6a1f0000000000000000a002` (done) | Completed; registration code `A1B2C3` in `demographics.gender`, email `participant@example.com` in `demographics.education`; draw: round 1 both give → 2 點 (feeds the payment ledger and evidence E1) |

`Submission._id` is an ObjectId in the schema, so its fixed IDs are 24-character hex strings. Documents are validated against the app's schemas and written through the raw collections, so the fixed `createdAt`/`updatedAt` survive.

The fixture submissions are seeded **without** `realisedPoints`/`payoutNtd` (the "before" code has no such fields). In the "after" run the idempotent `drawRealisedRound` path backfills them, which exercises the legacy-migration branch of REQ-408.5. Before capturing, the tooling replays the completed participant's debrief visit (one idempotent `drawRealisedRound` call — a no-op on the old code), because every real finisher passes the debrief before the email step.

#### How a screen is opened directly

- Cookie `turnstile_verified=true` → `/api/turnstile/status` reports verified, so no Turnstile widget is needed.
- `localStorage.survey_session_irb-fixture-session = { submissionId: 'irb-fixture-sub-live', path: <target URL> }` → `App.tsx` restores the fixture submission instead of calling `startSurvey` (scenario routes require the stored path to equal the URL; outro routes skip that check).
- Admin screens: log in through `POST /api/admin/login` with the capture server's own `ADMIN_PASSWORD`, then store the returned JWT in `localStorage.token` (a real token, so the guarded queries of REQ-408.8 work in the "after" run).

#### Determinism

- **Randomness:** an init script replaces `Math.random` with a seeded PRNG (mulberry32, fixed seed) on every page load, so the shuffled node positions (`generateTrianglePositions`) and the randomized slider start (REQ-402.1) are identical in both runs. `d3-force` already uses its own fixed-seed generator. The Tailwind CDN runtime also calls `Math.random`, a varying number of times depending on which classes exist — enough to shift the app's values between runs — so calls from the app bundle (`/assets/index-*.js`, detected from the call stack) get their own stream and everything else gets a second one.
- **Animation:** screenshots use Playwright's `animations: 'disabled'`; SVG `<animate>` elements are frozen with `svg.pauseAnimations(); svg.setCurrentTime(0)`; fonts are awaited with `document.fonts.ready`.
- **Interaction:** "?" markers are clicked through their SVG text node; sliders are set through the native `value` setter plus an `input` event, which React treats exactly like a drag; buttons that pulse forever (e.g. 「開始決策」) are clicked with `force`. All selectors exist in both the old and the new markup.
- **Viewports:** desktop 1440×900 and phone 390×844 (touch, Chrome-on-Android user agent), both at `deviceScaleFactor: 2`, full-page PNG.
- **Network independence:** `index.html` loads Tailwind from `cdn.tailwindcss.com` at runtime. The capture downloads that runtime once (it resolves to 3.4.17), caches it in `docs/irb/screenshots/.cache/`, and serves the cached copy to every page, so a slow CDN cannot stall a run and both sets use the same Tailwind build.
- **Timeouts:** each shot has a 120-second limit, page loads retry once, and the `document.fonts.ready` wait is capped at 5 seconds (`page.evaluate` has no timeout of its own). Long pauses with almost no CPU time mean the machine slept — keep it awake during a capture.

#### Shot list

| ID | Screen / state | Edit parts | IRB |
|----|----------------|------------|-----|
| S01 | `/survey/intro/0` roles & groups | B1 B2 | 1 |
| S02 | `/survey/intro/2` interaction records | B1 B2 B3 | 1 |
| S03 | `/survey/intro/3` tip 1, "?" not clicked | B2 B3 | 1 |
| S04 | `/survey/intro/3` tip 1, revealed | B2 B3 | 1 |
| S05 | `/survey/intro/4` tip 2, "?" not clicked | B1 B2 B3 | 1 |
| S06 | `/survey/intro/5` tip 3, slider set to 70 | B1 B2 | 1 |
| S07 | `/survey/intro/7` payment explanation | A1 A4 | 2 |
| S08 | `/survey/scenarios/0` nothing revealed | B1 B3 | 1 |
| S09 | `/survey/scenarios/0` all revealed | B1 B3 | 1 |
| S10 | `/survey/scenarios/0` deciding, slider set to 70 | B1 B3 | 1 |
| S11 | `/survey/outro/2` debrief with the fixed draw | A1 A2 A3 A4 | 2 |
| S12 | `/survey/outro/2` while every debrief request fails (`page.route` abort) | A3 | 2 |
| S13 | `/survey/outro/3` email step | A4 | 2 |
| S14 | `/admin/view/batch/irb-fixture-group` (desktop only) | A5 | 2 |
| E1 | Unauthenticated `recentSubmissions` query (text evidence, emails redacted) | A6 | 2 |
| E2 | Payments CSV downloaded from S14 ("after" only) | A2 A5 | 2 |

Packet-only screens (captured in the "after" run for REQ-409.4, not compared): welcome, intro 1 / 6 / 8, outro 1 / 4.

#### Outputs

```text
docs/irb/screenshots/<before|after>/<desktop|phone>/<ID>.png   (gitignored)
docs/irb/screenshots/<before|after>/meta.json                   (git SHA, dirty flag, appSourceMatchesBaseline, fee, timestamp)
docs/irb/screenshots/<before|after>/evidence/E1.json, E2.csv
docs/irb/report/irb-before-after-report.pdf                     (gitignored)
docs/irb/figures.md                                             (committed caption index)
```

`appSourceMatchesBaseline` is `git diff --quiet 934e945 -- App.tsx components backend utils server.js constants.ts types.ts index.html index.tsx`. The report prints it on the cover, so a reader can verify the "before" set really is the old app.

#### Report layout (A4 landscape, `page.pdf({ printBackground: true })`)

The report is written in Traditional Chinese for the advisor/PI and is readable without the code: it shows no commit hashes, file paths, code identifiers, requirement IDs or raw system output. Edit parts are labelled by IRB comment (1-1…1-3 for comment 1, 2-1…2-6 for comment 2), shots are numbered as figures (圖 1, 圖 2, …) in report order, and the evidence appendices describe their results in plain language.

The report shows participant-facing changes only. Items marked `internal` in `shots.mjs` — the admin-facing parts A5 (2-5, payment ledger) and A6 (2-6, admin-only email access), shot S14 (admin page) and evidence E1/E2 — are still captured for internal verification but left out of the report, together with their summary rows and appendices. The summary's open items list only the pending fee and payment timing.

1. **Cover** — title, the two IRB comments, before/after SHAs, the baseline check, the payment settings used (`PARTICIPATION_FEE_NTD`, `PAYMENT_TIMELINE_TEXT`, flagged as pending), and how the shots were captured.
2. **Summary** — IRB comment → edit part → change → REQ → shots, plus the open items this revision does not change. The build fails if any edit part has no shot or evidence, or if any screenshot is missing.
3. **One section per IRB comment**; within it one page per shot and viewport, tagged with its edit parts, with a one-line change note and **Before | After** side by side. Shot pages have a fixed height, so each pair fills exactly one sheet.
   - The IRB comment 2 section opens with a **報酬規則說明** page (zh-TW): the rate (`POINT_TO_NTD`), the participation fee (`PARTICIPATION_FEE_NTD`, flagged as provisional while it is 0), the total formula, how `drawRealisedRound` picks the paid round and decides each give/no-give, a payoff table (points and NT$ without a fee and with a NT$100 fee), the resulting range, how `realisedPoints`/`payoutNtd` are persisted, and the delivery method and timing. Values come from the "after" capture's `meta.json`, so the page always matches the screenshots.
4. **Appendix A** — E1 before/after (emails redacted; the development server's stack traces are trimmed to `message` and `path`). **Appendix B** — E2 payment-ledger rows.

Images in the PDF are JPEG copies (quality 82, made with macOS `sips`) to keep the file small (about 11 MB for 33 pages); the PNG masters stay in `docs/irb/screenshots/` for the IRB packet.

---

### Phase 41 — Points → Payment Conversion (REQ-408)

#### Payment module — `utils/payment.js`

Plain ES module with JSDoc types. The backend imports it as `../../utils/payment.js` (like `mathBackend.js`), and the frontend imports it directly (`allowJs` is enabled in `tsconfig.json`). For money, one shared module deliberately replaces the `math.ts` / `mathBackend.js` twin pattern: the rate must exist in exactly one place.

```js
export const POINT_TO_NTD = 100;
export const PARTICIPATION_FEE_NTD = 0;          // Open Question #8 — set to 100 if the consent form promises a fee
export const PAYMENT_METHOD_TEXT = '電子禮券';
export const PAYMENT_TIMELINE_TEXT = '實驗結束後盡快'; // Open Question #9 — e.g. '實驗結束後 14 天內'
export const MIN_POINTS = 0;
export const MAX_POINTS = 3;

export function payoffPoints(myGive, oppGive) { /* both 2 · me only 0 · partner only 3 · neither 1 */ }
export function pointPayoutNtd(points) { return points * POINT_TO_NTD; }
export function totalPayoutNtd(points, fee = PARTICIPATION_FEE_NTD) { return pointPayoutNtd(points) + fee; }
export const MIN_TOTAL_NTD = totalPayoutNtd(MIN_POINTS);
export const MAX_TOTAL_NTD = totalPayoutNtd(MAX_POINTS);
```

`PayoffMatrix` and the comprehension quiz stay in points only on purpose, so the decision screens do not gain a money framing mid-experiment.

#### Data model and GraphQL

```graphql
type Submission {
  ...
  realisedPoints: Int      # payoffPoints() of the realised round
  payoutNtd: Int           # totalPayoutNtd(realisedPoints) — the amount shown and paid
}

type DebriefResult {
  ...
  realisedPoints: Int!
  payoutNtd: Int!
}

type Query {
  ...
  submissionsByGroup(groupId: ID!): [Submission!]!   # admin only
}
```

`Submission.js` gains `realisedPoints` and `payoutNtd` (`Number`, default `null`), and `toSubmissionGraph` maps both.

#### Resolvers

```js
function requireAdmin(context) {
  if (!context?.isAdmin) throw new Error('Unauthorized');
}

recentSubmissions: async (_, { limit = 20 }, context) => { requireAdmin(context); ... }

submissionsByGroup: async (_, { groupId }, context) => {
  requireAdmin(context);
  const sessions = await SessionModel.find({ groupId }, { _id: 1 }).lean();
  const docs = await SubmissionModel.find({ sessionId: { $in: sessions.map(s => String(s._id)) } })
    .sort({ createdAt: -1 }).lean();
  return docs.map(toSubmissionGraph);
}
```

`drawRealisedRound`:

- **First draw:** after drawing `myDecisions` / `opponentDecisions`, compute `realisedPoints = payoffPoints(myDecisions[r], opponentDecisions[r])` and `payoutNtd = totalPayoutNtd(realisedPoints)`, and `$set` them together with the other draw fields.
- **Idempotent path:** return the persisted values; if `realisedPoints` or `payoutNtd` is missing (a submission drawn before 2026-10-01, or the screenshot fixture), compute them from the persisted decisions, `$set` them once, and return them.
- A persisted `payoutNtd` is never recomputed, so changing the fee later does not change what an earlier participant was shown.

#### SurveyOutro load flow (steps 2 and 3)

```text
entryId available ─► fetchSubmission(entryId)
    ├─ has realisedRoundIndex + myDecisions + opponentDecisions + payoutNtd ─► ready
    └─ otherwise ─► drawRealisedRound(entryId)  (idempotent; also backfills payout) ─► ready
any error ─► error
```

| State | Step 2 (debrief) | Step 3 (email) |
|-------|------------------|----------------|
| loading | 「載入中...」 | email form with the generic sentence (no amount) |
| ready | round table + payment card | email form with the amount sentence |
| error | 「讀取結果失敗」+「重試」button; **no amount, no table** | email form with the generic sentence (no amount) |

The old fallback (a random draw computed in the browser and never saved) is removed, so no screen can show an amount the researcher has no record of.

#### Participant copy (built from the module constants; PI to approve)

Intro step 7 「點數兌換報酬說明」:

- 「在實驗中，您將會參與數次的兩人遊戲。所有遊戲結束後，電腦會隨機抽出其中一次遊戲，依照您在該次遊戲中得到的點數換算成報酬。」
- Rate badge: 「1 點 = 新台幣 100 元」
- Outcome table (same row order as `PayoffMatrix`):

| 您的決定 | 搭檔的決定 | 您得到的點數 | 點數報酬 | 合計（含參與費）— only when fee > 0 |
|---------|-----------|-------------|---------|-----------------------------------|
| 不給 | 不給 | 1 點 | 新台幣 100 元 | 新台幣 200 元 |
| 給 | 不給 | 0 點 | 新台幣 0 元 | 新台幣 100 元 |
| 不給 | 給 | 3 點 | 新台幣 300 元 | 新台幣 400 元 |
| 給 | 給 | 2 點 | 新台幣 200 元 | 新台幣 300 元 |

- Fee sentence (only when fee > 0): 「完成全部實驗的參與者，另可獲得參與費新台幣 100 元。」
- Range: fee 0 → 「因此，您的報酬最少為新台幣 0 元，最多為新台幣 300 元。」; fee 100 → 「因此，您的總報酬最少為新台幣 100 元，最多為新台幣 400 元。」
- Worked example: 「舉例：若抽中的那一次遊戲中，您選擇不給、搭檔選擇給，您會得到 3 點，報酬為 3 × 100 = 新台幣 300 元。」 (fee 100 appends 「，加上參與費 100 元，合計新台幣 400 元。」)
- Payment: 「報酬將以電子禮券的形式，於實驗結束後盡快寄送到您在實驗最後填寫的 Email。」 (「實驗結束後盡快」 is `PAYMENT_TIMELINE_TEXT`)

Debrief card (outro step 2):

| Row | Value |
|-----|-------|
| 抽中回合 | 第 2 回合 |
| 點數 | 3 點 |
| 點數報酬 | 3 點 × 100 = 新台幣 300 元 |
| 參與費 (only when fee > 0) | 新台幣 100 元 |
| **合計** | **新台幣 {payoutNtd} 元** |

Footnote: 「報酬將以電子禮券的形式，於實驗結束後盡快寄送到您下一步填寫的 Email。」

Email step (outro step 3): 「謝謝您的參與！請在以下空格填上您的 Email，我們將於實驗結束後盡快，把新台幣 {payoutNtd} 元的電子禮券寄送到這個 Email。」 When the amount is not available, the sentence omits it: 「…把您的報酬以電子禮券寄送到這個 Email。」

#### Payment ledger (GroupDetailView)

- Data source: `fetchSubmissionsByGroup(groupId)` replaces both `fetchRecentSubmissions()` calls (initial load and the 5-second refresh), fixing BUG-007 for the table and the research CSV alike.
- 「Export Payments」 button next to 「Export CSV」; disabled when the group has no completed, valid submission.
- One row per submission with `isCompleted && !isInvalid`, columns: `Submission ID, Participant ID, Registration Code (demographics.gender), Email (demographics.education), Realised Round (realisedRoundIndex + 1), Points, Participation Fee (NTD), Point Payout (NTD), Total Payout (NTD) (= payoutNtd), Completed At`.
- Fee and point payout columns are derived from the persisted values: `Point Payout = realisedPoints × POINT_TO_NTD`, `Participation Fee = payoutNtd − Point Payout`, so the ledger always matches what the participant saw even if the constants change later.
- UTF-8 with BOM, filename `{group_name}_payments_{YYYYMMDD_HHmmss}.csv`. Rows without a persisted payout keep empty payout cells and trigger a warning toast with their count.

---

### Phase 42 — Figure Legibility (REQ-409)

#### `GraphLegend` (in `SurveyShared.tsx`)

```ts
type LegendItem = 'you' | 'partner' | 'groups' | 'give' | 'notGive' | 'unrevealed' | 'decision';
GraphLegend: React.FC<{ items: LegendItem[]; compact?: boolean; className?: string }>
```

Each row = a small inline-SVG swatch drawn with the same `COLORS` tokens as `NetworkGraph` + a bold label + a description (`text-sm`). `compact` switches to a two-column grid with less padding but the same text size.

| Item | Swatch | Label | Description |
|------|--------|-------|-------------|
| you | amber ring (`COLORS.highlight`) | 您 | 您本人 |
| partner | pink ring (`COLORS.rolePartnerHighlight`) | 搭檔 | 與您配對的參與者 |
| groups | blue + green dots (`COLORS.kmt`, `COLORS.dpp`) | 國民黨／民進黨 | 頭像顏色代表所屬團體 |
| give | dark label on an arrow (`COLORS.coop`) | 給予 | 箭頭起點的人把點數給了箭頭終點的人 |
| notGive | light label on an arrow (`COLORS.defect`) | 不給予 | 箭頭起點的人把點數留給自己 |
| unrevealed | gray dashed line + blue 「?」 | ？ | 尚未查看的互動紀錄，點擊即可顯示 |
| decision | dashed line from 您 to 搭檔 | 您的決定 | 您這一回合的決定，會隨滑桿改變 |

Placement: intro 0 → you, partner, groups; intro 2 → you, partner, groups, give, notGive; intro 4 → unrevealed, give, notGive; intro 5 → you, partner, decision; every scenario page → all seven, `compact`, directly under the graph and above the reveal prompt (same position every round).

#### Captions (圖說, `text-sm text-gray-600`, directly under each figure; PI to approve)

| Step | Caption |
|------|---------|
| intro 0 | 圖中的四個頭像代表四位參與者，頭像顏色代表所屬團體（藍色為國民黨、綠色為民進黨）。橘色外框、標示「您」的是您本人；粉紅色外框、標示「搭檔」的是與您配對進行遊戲的參與者。 |
| intro 2 | 每一個箭頭代表一次過去的互動：箭頭從做決定的人指向接收的人。深色標籤「給予」表示這個人把點數給了對方；淺色標籤「不給予」表示這個人把點數留給自己。圖旁的清單以文字列出相同的互動紀錄。 |
| intro 3 | 灰色虛線加上「?」代表一筆尚未查看的互動紀錄。點擊「?」後，虛線會變成實線，並顯示該次的決定（「給予」或「不給予」）。 |
| intro 4 | 正式實驗的每一回合，您都需要先點開圖中所有的「?」，看完全部互動紀錄後，才能開始做決定。 |
| intro 5 | 從「您」指向「搭檔」的動態虛線代表您這一回合的決定。滑桿數值代表您給予點數的機率；線上的標籤只顯示您目前的傾向（大於 50 顯示「給予」、小於 50 顯示「不給予」）。 |

#### Size changes

| Element | File | Before | After |
|---------|------|--------|-------|
| "?" marker circle / glow | `NetworkGraph.tsx` | r 9 / pulse 10–14 | r 13 / pulse 15–19 |
| "?" glyph | `NetworkGraph.tsx` | class `text-[14px] md:text-[12px]` | `fontSize={18}` attribute |
| "?" hit area | `NetworkGraph.tsx` | the 20px-wide edge path only | + transparent circle r 20 |
| Graph max width | `NetworkGraph.tsx` | `lg:max-w-[440px]` | `lg:max-w-[520px]` |
| Scenario grid | `SurveyView.tsx` | `xl:grid-cols-2` | `xl:grid-cols-[3fr_2fr]` |
| Intro list text / avatars | `SurveyIntro.tsx` | `text-[10px]`–`text-xs` / 18px | `text-sm` (labels, names and 給予/不給予 badges) / 24px |
| Intro list colors | `SurveyIntro.tsx` | invalid `bg-white-50`, `border-white-200`, `text-white-*` | `bg-white`, `border-gray-200`, `text-gray-*` |
| Intro list avatar clip paths | `SurveyIntro.tsx` | `mini-avatar-<agent>` reused by every row (duplicate DOM ids) | unique per instance (`useId`) |
| Tip-1 demo edge | `SurveyIntro.tsx` | `max-w-[240px]` | `max-w-[360px]` |
| Intro graph containers | `SurveyIntro.tsx` | `h-[340px]`, `h-[350px] md:h-[400px]` | `h-[380px] md:h-[480px]` |

All values are tuned by eye at 1440×900 and 390×844 using the Phase 40 tooling.

---

### Phase 43 — After Shots, Report and Packet Index (NFR-7, REQ-409.4)

1. `npm run build && npm run irb:shots -- --label after`.
2. `npm run irb:report` → `docs/irb/report/irb-before-after-report.pdf`.
3. `docs/irb/figures.md` — figure number → screen → caption, for every participant-facing screen in the packet set.
4. If the fee or timeline is confirmed later (Open Questions #8, #9): change the constant, then repeat steps 1–2 only (the "before" set never changes).

---

---

## Phase 44 — Full-Flow E2E Test with Review Report (NFR-8)

### Overview

`npm run test:e2e` (`vite build && node scripts/e2e/full-flow.mjs`) runs one real study end to end in real Chrome against an in-memory MongoDB and writes a screenshot report for review. It proves the money trail: **debrief amount = `Submission.payoutNtd` = ledger「Total Payout (NTD)」**, and that the amount follows the persisted draw (`totalPayoutNtd(payoffPoints(myDecisions[r], opponentDecisions[r]))`). It is a plain Node script, not a vitest suite — like `scripts/irb-shots/capture.mjs`, it needs a built `dist/`, a spawned `server.js` and a browser.

### Harness

| Concern | How |
|---|---|
| Database | `MongoMemoryServer.create()`; the script reads it back through the app's own models (`backend/models/*.js`) on a separate mongoose connection |
| Server | `spawn(node server.js)` with `PORT=3200` (`E2E_PORT`), `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, `NODE_ENV=development`, `CLIENT_ORIGIN=BASE_URL`; stdout/stderr → `server.log`; ready when `/api/turnstile/status` answers |
| Browser | `chromium.launch({ channel: 'chrome' })` (`playwright-core`); 1440×900, `zh-TW` |
| Tailwind | `index.html` loads the Tailwind CDN runtime; served from the cache shared with the IRB capture (`docs/irb/screenshots/.cache/tailwindcss-cdn.js`) |
| Turnstile | `https://challenges.cloudflare.com/turnstile/**` is routed to a stub whose `render()` immediately calls `callback('e2e-token')`. The participant clicks「進入測驗」, so the real `/api/turnstile/verify` runs; in development it accepts any token and sets the `turnstile_verified` cookie |
| Two participants | Participant ID is a FingerprintJS hash, so the second browser context uses a different `timezoneId` and `locale` (both fingerprint inputs). The test asserts the two `participantId`s differ |
| Slider | Native value setter + `input`/`change` events (same as capture), so React sees a real drag and `hasInteracted` becomes true |
| Admin sliders | `rc-slider` handles (`[role=slider]`) are set with the keyboard (`Home`), giving maxK = 1, scenarios/participant = 5 (the UI minimum), target = 1 |

### Study

Admin (UI): focal 國民黨 (`KMT1`), partner 民進黨 (`DPP4`), maxK 1, 5 scenarios/participant, target 1 → 9 edges × 2 states = **18 scenarios**.

### Journey and checks

| Step | Actions | Checks |
|---|---|---|
| 1 Admin launch | `/login` → password → `/admin/setup/mixed` → sliders, name → Launch Batch Sessions → Yes, Launch | lands on `/admin/view/batch/:groupId`; DB group `totalScenarios` 18; 18 scenarios with `responseCount` 0; Public URL = `${BASE_URL}/survey/welcome?groupId=<id>&mode=mixed` |
| 2 Participant A | invite URL → 開始實驗 → intro 0–8 (step 3 click the demo edge, step 4 reveal every "?", step 6 answers 1/3/3/2 → 提交, step 7 payment page) → 開始實驗！ → 進入測驗 → 5 scenarios (reveal "?" → 開始決策 → slider → 確認並前往下一題 / 確認並送出) → code → debrief → reload → 繼續 → email → 送出 | payment page shows 新台幣 `MIN_TOTAL_NTD`/`MAX_TOTAL_NTD`; a session with 5 scenarios exists; debrief 合計 Z is unchanged after reload; email step repeats Z; done screen reached |
| 3 Participant B | second context; intro → 2 of 5 scenarios → stops | its `participantId` ≠ A's; its submission is not completed |
| 4 Database | — | A: `isCompleted`; 5 answers with the entered probabilities; code/email stored in `demographics.gender/education`; `realisedPoints` = `payoffPoints(...)` of the realised round; `payoutNtd` = `totalPayoutNtd(realisedPoints)` = Z; A's scenarios `responseCount` 1; session `submissionCount` 1 |
| 5 Ledger | group page → Export Payments → download | filename `*_payments_YYYYMMDD_HHmmss.csv`; UTF-8 BOM; exactly 1 row; code, email, round (1-based), points, fee, total = Z |

### Recording and report

- `check(step, label, expected, actual)` records `{ pass }` instead of throwing, so one wrong value does not hide the rest. A broken journey (timeout, missing element) ends that step with a failure screenshot and its error; the later steps are marked "not run".
- `shot(page, id, caption)` saves `shots/NN-<id>.png` (full page) after the page settles (`networkidle` + 700 ms for the Tailwind runtime).
- Output: `test-results/e2e/<YYYYMMDD_HHmmss>/` — `shots/`, `report.html`, `report.pdf` (`page.pdf()` of the same HTML), `payments.csv`, `server.log`. Written in `finally`, whatever happened.
- `report.html` sections: **Summary** (PASS/FAIL, duration, git sha + dirty, payment settings, study config, ids, Z) · **Money trail** (debrief → DB → ledger, and the recomputation) · **Steps** (screenshots + checks table) · **Ledger** (CSV as a table) · **Known issues** (BUG-008 with the `matched=…` line from `server.log`). English; screenshots stay zh-TW.
- Exit code 1 if any check failed or a step broke.

### Not covered

Real partner pairing (BUG-008); visual layout (NFR-7); phone viewport.

---

## Phase 45 — Registration Code Survives a Refresh (REQ-403.1, BUG-009)

**Problem.** `SurveyOutro` held the step-1 code only in component state. Outro steps are in the URL so a refresh resumes them (REQ-404), but the code was lost and `handleFinalSubmit` saved `codeValue || 'unknown'`, so the payment ledger could not be matched to the registered participant.

**Change (`components/SurveyOutro.tsx` only).**

| When | What |
|---|---|
| Code input changes (step 1) | `localStorage.setItem('survey_code_<entryId>', code)` (sanitised value) |
| Mount / `entryId` becomes known | if state is empty, restore from `survey_code_<entryId>` |
| Final submit (step 3), code empty | `onNavigateStep(1)`; no `completeSurvey` call |
| `completeSurvey` succeeded | `localStorage.removeItem('survey_code_<entryId>')` |

Keyed by the submission id (`entryId`) because that is what `SurveyOutro` receives and it is unique per participant and session. Storage access is wrapped in `try/catch`; without storage the behaviour is the old in-memory one, minus the `unknown` fallback. The payload shape (`demographics.gender` = code) is unchanged, so the ledger and research CSV need no change.

**Tests.** `components/__tests__/SurveyOutro.test.tsx`: the code entered on step 1 is restored on a fresh mount of step 3 and submitted; an empty code on step 3 navigates to step 1 without calling `onComplete`. End to end: NFR-8's debrief reload now passes the registration-code checks.

---

## Phase 46 — E2E Edge Cases (NFR-8.1)

### Approach

The edge cases (requirements.md NFR-8.1, EC-1…EC-13) are added to `scripts/e2e/full-flow.mjs` as further steps of the same run, so they share the server, database and report. A browser **context** is one device: closing a page and opening a new one in the same context is "close the tab and come back" (cookies, `localStorage` and the fingerprint survive). A new context with a different `timezoneId`/`locale` is a different device. Cases that only need the server (another device, filling a group, API misuse) call GraphQL directly with the `turnstile_verified` cookie.

### Step dependencies

`step(id, title, fn, { needs })`: a step runs unless a step it needs did not pass its journey (broke or was not run). A broken step no longer stops unrelated steps. Failed checks never block later steps.

### Steps

| # | Step | Cases | How |
|---|---|---|---|
| 1 | Admin launch | EC-13 | as Phase 44, plus Export Payments disabled |
| 2 | Participant A | EC-1, EC-2 | quiz 0/0/0/0 first → hint, 下一步 disabled → 重新作答 → 1/3/3/2; empty code, invalid email checked before the valid ones |
| 3 | Participant B quits | — | as Phase 44 |
| 4 | A's database record | — | as Phase 44 |
| 5 | Participant C (device C) | EC-3…EC-6 | tab 1 leaves at intro 4 → session count unchanged; tab 2 restarts at welcome, answers 2, moves the slider on 3 and reloads → still scenario 3, 2 answers saved; tab 3 via the invite link → resumes at scenario 3, same ids; answers 3, Back, re-answers 3 → 3 answers, value updated, `responseCount` delta 0; finishes with code E2E003 |
| 6 | C returns after completing | EC-7 | tab 4 via the invite link → expect 「無法參與實驗」. If the welcome page shows instead, it is recorded as a failure and the participant goes through the intro to 進入測驗 to show what happens; then no new session/submission, payout and code unchanged |
| 7 | Same person, another device (API) | EC-8 | `startMixedSession` with participant ID `e2e-device-2` → answers → `drawRealisedRound` → `completeSurvey` with A's code |
| 8 | Ledger | EC-8 | export → A, C, D (observation: A's code appears twice) → admin marks D invalid in the group page (Mark as invalid → Mark Invalid) → export again → A, C only; A's and C's totals equal their persisted payouts |
| 9 | Full group | EC-9 | second group via GraphQL (max k 1, 18 scenarios/participant, target 1); an API participant answers all 18 and completes → every `responseCount` ≥ 1, group status `completed`; device E opens the invite → expect 「無法參與實驗」, otherwise continue to 進入測驗 and check that no session was created |
| 10 | Other entry points | EC-10, EC-11 | Firefox user agent → 開始實驗 disabled + notice; `groupId=does-not-exist` → observation of what is shown on arrival and after the intro |
| 11 | API guards | EC-12 | `saveSurveyAnswer` 1.5; `startMixedSession` without the cookie; `submissionsByGroup` without a token |

### Report

- Checks gain a third kind, **observation** (ℹ), for behaviour no requirement defines; observations never fail the run.
- A new **Edge cases** table after the summary lists EC-1…EC-13 with the step and its result (pass / fail / observed).

## Phase 47 — Test-case roadmap in the e2e report (NFR-8.2)

### Data
`ROADMAP` in `scripts/e2e/full-flow.mjs` lists the journey stages in order: `[stage, happyStepId | null, [EC ids]]`.

| Stage | Happy path (step) | Edge cases |
|---|---|---|
| Admin sets up the study | `admin` | — |
| Participant opens the invite link | `participantA` | EC-9, EC-10, EC-11 |
| Intro, quiz, Turnstile | `participantA` | EC-1, EC-3 |
| Scenarios | `participantA` | EC-4, EC-5, EC-6 |
| Outro & debrief | `participantA` | EC-2 |
| Coming back later | — | EC-7, EC-8 |
| Payment ledger | `ledger` | EC-13 |
| Behind the UI (direct API) | — | EC-12 |

A startup guard throws if an `EDGE_CASES` id is missing from `ROADMAP` or placed twice, so the catalogue and the roadmap cannot drift apart.

### Rendering
- The `Roadmap` section sits directly under the PASS/FAIL banner, before Summary.
- Vertical rail: numbered dot per stage joined by a line; the dot is green / red / grey from the happy-path step status (grey when there is none).
- Per stage: the stage name, a happy-path badge, then one chip per edge case — `EC-n` + short title, coloured with the same pass / fail / observed / not-run palette as the tables. The chip's `title` is the expected behaviour; the chip links to `#step-<id>` of the first step that recorded it.
- A legend and a count line (`n pass · n observed · n fail · n not run`) sit above the rail.
- Plain HTML and CSS (no script), so it prints the same in `report.pdf`; rows use `break-inside: avoid`.

## Phase 48 — Full group closes, confirmed answers are final, unknown invite link (BUG-010, REQ-309, REQ-402.4, REQ-405.1, REQ-405.2)

### Data model
- `SessionGroup.status: 'active' | 'completed'` (default `active`). Exposed on the GraphQL `SessionGroup` type as `status: String!` and fetched by `fetchSessionGroup`.

### Server (`backend/graphql/resolvers.js`)
- `refreshGroupStatus(groupId)`: for a Mixed group, `status = completed` when `Scenario.countDocuments({ groupId, responseCount: { $lt: targetSizePerScenario } }) === 0`, else `active`; writes only when it changes. Called at the end of `completeSurvey` (replaces the count-and-log block) and of `invalidateSubmission` (invalidating can drop a scenario below target and re-open the group).
- `startMixedSession`: after the existing-session lookup (resume stays allowed), a `completed` group throws `GROUP_FULL: …`.
- `saveSurveyAnswer`:
  - completed submission → throw `ANSWER_LOCKED: …`
  - scenario already answered with the same value → return the submission unchanged (idempotent retry)
  - scenario already answered with a different value → throw `ANSWER_LOCKED: …`
  - otherwise append and `$inc responseCount` as before.

### Client
- `App.tsx` gets `entryGate: 'full' | 'unknown' | null`, rendered in place of the survey routes:
  - `full` → the existing 「無法參與實驗」 card.
  - `unknown` → 「找不到此實驗」 + 「此邀請連結無效或實驗已結束，請向研究人員確認連結是否正確。」
- Mixed arrival without an existing session: the group is fetched (already done for `scenariosPerSession`). `null` → `unknown`; `status === 'completed'` → `full`. A fetch error keeps today's behaviour (no gate).
- `handleSurveyStart`: a `GROUP_FULL` error from `startMixedSession` (the group filled while the visitor was in the intro) sets `entryGate = 'full'`.
- Back (REQ-402.4): `SurveyView` already traps Back by pushing a duplicate `'blocked'` history entry, so Back never leaves the page. Its `popstate` handler now also shows the toast 「已確認的答案無法修改。」 (`ANSWER_LOCKED_MSG` in `constants.ts`, toast id `answer-locked`) on `/survey/scenarios/*` and `/survey/outro/*`. Intro steps stay silent.
- Earlier-scenario URL (REQ-402.4), in the `sessionId` hydrate branch: when the current path is `/survey/scenarios/<i>` and the stored resume path is a later scenario or the outro, navigate (replace) to the stored path with the same toast, instead of the old "path mismatch → ignore stored session" fallback. The Mixed-URL resume branch shows the toast when it redirects from an earlier scenario.

### E2E (`scripts/e2e/full-flow.mjs`)
- EC-6: Back → stays on scenario 4 (index 3), toast visible, answer + `responseCount` unchanged; API re-answer of that scenario with another value rejected, same value accepted.
- EC-9: unchanged checks (they were the BUG-010 failures) plus `startMixedSession` via the API returns `GROUP_FULL`.
- EC-11: on arrival 「找不到此實驗」 shown, 開始實驗 absent, no session for `does-not-exist`.
- EC-12: the "edit a completed submission" observation becomes a check (rejected).

## Phase 49 — Mixed Mode Cost Estimate (REQ-314)

### Calculation (client only, no API change)
- `estimatedParticipants = ceil(totalScenarios × targetSizePerScenario / scenariosPerSession)` (existing `calculateMixedStats` in `SetupPanel.tsx`).
- `minCost = estimatedParticipants × MIN_TOTAL_NTD`, `maxCost = estimatedParticipants × MAX_TOTAL_NTD`, both imported from `utils/payment.js` (today 0 and 300: 0–3 points × NT$100 + fee 0).
- Added to the `mixedStats` object, so it recomputes on every render like the other stats.

### UI (`components/SetupPanel.tsx`, Mixed Setting Preview)
- New full-width「Est. Cost」card below the Total Scenarios / Est. Participants grid, same purple card style:
  - headline `≤ NT$ {maxCost}` (`toLocaleString()`)
  - KaTeX formula `= ~{participants} × NT$ {MAX_TOTAL_NTD}`
  - line「Range NT$ {minCost} – {maxCost} (NT$ {MIN_TOTAL_NTD}–{MAX_TOTAL_NTD} per participant)」
  - small note: estimate only; in-progress participants at closing and replacements for invalidated submissions add to it.
- 「Confirm Batch Sessions」modal: extra `<li>` 「Estimated cost: NT$ {minCost} – {maxCost}」.


## Phase 50 — Actual Payout on the Group Page (REQ-408.9)

### Calculation (client only, no API change)
- `GroupDetailView` already loads every submission of the group with `payoutNtd` (`submissionsByGroup`, REQ-408.7) and filters `payable = completed && !isInvalid` for the ledger. The card reuses that `payable` list:
  - `paid = payable.filter(s => s.payoutNtd != null)`
  - `actualPayout = Σ paid.payoutNtd`, `avg = actualPayout / paid.length`
  - `missingPayout = payable.length − paid.length`
- Mixed only: `budget = estimatedParticipants × MAX_TOTAL_NTD` (same `estimatedParticipants` as the existing Est. Participants card).
- `submissions` state is updated in place on invalidate/restore, so the card recomputes on the next render.

### UI (`components/GroupDetailView.tsx`, Statistics Cards grid)
- Third card「Actual Payout」, shown for every mode, same purple card style:
  - headline `NT$ {actualPayout}` (`toLocaleString()`)
  - `{paid} participants · avg NT$ {avg}`
  - Mixed: `of budget ≤ NT$ {budget}`
  - amber `{missingPayout} 筆無報酬紀錄` when > 0.

## Phase 51 — Batch Is the Only Launch Mode (REQ-207)

### Routing (`App.tsx`, `components/AdminView.tsx`)
- `/` and `/admin/setup` → `Navigate` to `/admin/setup/mixed` (was `/admin/setup/manual`).
- 「Setup」nav item → `/admin/setup/mixed`.
- `/admin/setup/manual` route stays, because the history page opens a past session there with `state.readOnly = true`. `AdminView` redirects (replace) to `/admin/setup/mixed` when that path is opened without `readOnly`.
- `AdminView` drops the `generatedUrl` / `isSaving` state that only the manual launch used.

### `components/SetupPanel.tsx`
- `launchMode = readOnly ? 'manual' : 'mixed'` (was derived from the URL). The manual branches now render only the read-only history view.
- Removed: Launch Mode toggle, `handleGenerateUrl` + `createManualSession` import, the「Confirm Setup」modal, the「Session is live」URL modal, the "select at least one edge" hint, and the `generatedUrl` / `isSaving` / `onSave` props.
- The launch button is Batch-only: `Launch Batch Sessions`, disabled while `isMixedCreating`.

### Unchanged
- Backend `createManualSession`, `utils/graphqlClient.createManualSession`, the `scripts/test-manual-mode-*.mjs` API scripts, `HistoryTable`, and the participant `?sessionId=` flow.

## Phase 52 — Remove Single-Session History; Rename「View Sessions」(REQ-207 amended, REQ-208)

Nothing opens the manual layout once the history page is gone, so it is deleted rather than kept read-only.

### Routing (`App.tsx`)
- `/admin/setup/manual` → `<Navigate to="/admin/setup/mixed" replace />`; `/admin/view/manual` → `<Navigate to="/admin/view/batch" replace />` (route-level, replaces the Phase 51 redirect inside `AdminView`).
- `onSave` prop dropped from every `AdminView` route (it was never used).

### `components/AdminView.tsx`
- Tabs: `setup` | `groups` only. Removed: history state/effects, `HistoryTable`, `handleLoadHistorySetup`, `handleBackFromReadOnly`, `handleNodeInteraction`, `toggleEdge`, read-only state.
- Nav: 「Setup」,「View Sessions」(was「View Batch Sessions」), 「Clear Database」(dev), 「Logout」.

### `components/SetupPanel.tsx`
- Props are `setup`, `setSetup` only. Removed: `LaunchMode`, the Target Size slider, `NetworkGraph`, the manual Setting Preview (`SummaryWidget`), Complexity Check, the read-only Back button, and unused batch state (`batchEdgeCount`, `isBatchCreating`).

### Deleted
- `components/HistoryTable.tsx`; `fetchAllSessions` in `utils/graphqlClient.ts` (its only caller). The backend `allSessions` query is kept.

### Tests
- `components/__tests__/AdminView.test.tsx` rewritten (the old one targeted a「History」tab that no longer existed and was failing 3/3): nav items, Batch-only setup, `/admin/setup/manual` redirect.

## Phase 49 — Phone run of the e2e test (NFR-8.3)

- `E2E_DEVICE=mobile` (npm script `test:e2e:mobile`) switches `scripts/e2e/full-flow.mjs` to the phone profile. Unset = desktop, unchanged.
- Phone profile, applied to every participant context: viewport 390×844, `deviceScaleFactor` 2, `isMobile`, `hasTouch`, user agent Android Chrome (`… Chrome/130.0.0.0 Mobile Safari/537.36`). Each device keeps its own timezone/locale so the fingerprint IDs stay distinct. The EC-10 device uses mobile Firefox (`… Firefox/128.0` on Android), which must still be refused.
- The admin context (`newContext(DEVICES.A, { desktop: true })`) stays 1440×900: the admin console is a desktop tool.
- Output folder `test-results/e2e/<timestamp>-mobile/`; the report title and banner say "phone (390×844)"; screenshots are full-page at phone width.

## Phase 50 — One report for PC and phone (NFR-8.3)

- `scripts/e2e/full-flow.mjs` gains `E2E_OUT` (output folder override) and writes `results.json` next to its own report: device, pass/fail, duration, steps (checks + screenshots), edge-case results, roadmap, money trail, ledger, pairing log line.
- `scripts/e2e/run-both.mjs` (`npm run test:e2e`): runs `full-flow.mjs` for the PC into `<run>/pc/`, then with `E2E_DEVICE=mobile` into `<run>/phone/` (sequential: separate server, database and fingerprints), then writes `<run>/report.html` and `report.pdf` from the two `results.json` files. It exits 1 unless both runs passed.
- Combined report:
  - **Banner**: PASS only if both; `PC n/n · Phone n/n`.
  - **Roadmap**: as Phase 47, but each chip carries a PC and a phone result; the chip colour is the worse of the two (fail > observed > not run > pass); the stage dot uses the worse happy-path status.
  - **Summary**: one column per device.
  - **Edge cases / Observations**: a PC and a Phone column / a device column.
  - **Money trail**: both devices.
  - **Steps**: one section per step with both status badges; checks paired by label (expected, PC actual ✓✗, phone actual ✓✗); screenshots paired by shot id, PC (wide) left and phone (narrow) right.
  - **Ledger**: both final exports. **Known issues**: BUG-008.
- `test:e2e:pc` and `test:e2e:mobile` still run one device and write that device's own report.

## Phase 51 — Legend and captions open on tap (REQ-409.5); admin pages PC-only in the combined report (NFR-8.3)

### Survey (`components/SurveyShared.tsx`)
- `GraphLegend` and `FigureCaption` each render a native `<details>` (closed) with a `<summary>` header: label (圖例 / 圖說, its own `<span>` so tests can find it), a hint 「點擊展開」 / 「收合」 switched with Tailwind `group-open:`, and a ▸ chevron that rotates when open. The default disclosure marker is hidden (`list-none`, `[&::-webkit-details-marker]:hidden`).
- No React state: the browser keeps open/closed and handles keyboard and screen readers. Call sites in `SurveyIntro.tsx` / `SurveyView.tsx` are unchanged.

### E2E
- Participant A, intro step 4: the legend and caption are closed; tapping the legend header opens it (screenshot), tapping again closes it.

### Combined report (`scripts/e2e/run-both.mjs`)
- A phone-run screenshot taken at desktop width (the admin context) is dropped; a step whose shots have no phone counterpart shows the PC screenshot at full width with no Phone column.

## Phase 52 — Post-survey questionnaire Q1–Q8 (REQ-416)

### Shared definition — `utils/questionnaire.js`
- `QUESTIONNAIRE = [{ id: 'Q1', text, options: ['同意', '不同意'] }, …]` (verbatim from REQ-416) — the only place the wording lives; imported by the outro page, the server and the CSV export (same pattern as `utils/payment.js`).
- `questionnaireError(answers)` → `null` or a message: exactly one answer per question ID, each answer one of that question's options.

### Data
- `Submission.questionnaire: [{ questionId: String, answer: String }]` (default `null`).
- GraphQL: `type QuestionnaireAnswer { questionId: String! answer: String! }`, `input QuestionnaireAnswerInput`, `Submission.questionnaire: [QuestionnaireAnswer!]`, and `completeSurvey(submissionId, demographics, questionnaire: [QuestionnaireAnswerInput!])`.
- `completeSurvey`: when `questionnaire` is given, validate with `questionnaireError` (throw `INVALID_QUESTIONNAIRE: …`) and save it with the demographics. Omitted = unchanged (API callers and tests keep working; the UI always sends it).
- Field resolver `Submission.questionnaire`: returns the answers only when `context.isAdmin`, else `null`.

### Outro (`components/SurveyOutro.tsx`, `SurveyView.tsx`, `App.tsx`)
- Steps: 1 code, 2 debrief, **3 questionnaire**, 4 email, 5 done. `SurveyView` accepts outro steps 1–5; debrief 繼續 → 3; questionnaire 下一步 → 4; `App.handleSurveyComplete` → 5. The debrief note says the payment goes to the email 「稍後填寫」.
- Questionnaire page: title 「問卷」, one line 「請依照您的看法回答以下問題，答案沒有對錯。」, one card per question with its options as native radio inputs styled as two large tap targets; 「已回答 n / 8」; 下一步 disabled until complete.
- Look: the same classes as the 理解測試 step in `SurveyIntro.tsx` — outer frame (`md:max-w-5xl md:rounded-[2rem] md:shadow-2xl md:p-12`), `text-3xl md:text-4xl font-black` title + `w-20 h-1.5 bg-indigo-500` bar, amber panel (`bg-amber-50 border-amber-200`, instruction `text-amber-800`) holding a white panel (`border-amber-100`); question rows `text-sm font-bold text-gray-800 leading-loose`, divided by `divide-amber-100`; options are compact chips in the quiz-input style (`border-gray-300 bg-gray-50 rounded`, amber when selected, `focus-within:ring-amber-500`); footer button = the intro's 下一步 (`rounded-2xl shadow-lg bg-indigo-600`, disabled `bg-gray-200`).
- Row layout: `role="radiogroup"` labelled by the question text (`aria-labelledby`); `sm:flex` puts the text (`flex-1`) left and the two option chips (fixed `w-48`) right on screens ≥ 640px; below that the chips sit under the text.
- Answers live in state and in `localStorage[survey_questionnaire_<submissionId>]` (try/catch, like the code); restored on mount; removed after a successful submit.
- 送出 on step 4: if the code is missing → step 1 (as before); if any answer is missing → step 3; otherwise `onComplete(entryId, results, demographics, questionnaire)` → `completeSurvey(…, questionnaire)`.

### Export (`GroupDetailView.tsx`)
- `fetchSubmissionsByGroup` also selects `questionnaire { questionId answer }` (admin token). Export CSV adds columns Q1–Q8 after Education.

### Tests
- Unit: `questionnaireError` cases; SurveyOutro questionnaire page (下一步 disabled until 8 answers, survives a remount, sent on submit).
- Backend: `completeSurvey` saves valid answers, rejects invalid ones; `submission(id)` hides them without admin, shows them with admin.
- E2E (PC + phone): `finishOutro` answers Q1–Q8 (participant A with a fixed pattern), screenshots step 3; DB check that A's `questionnaire` equals what was clicked.

## Phase 53 — Questionnaire data-capture fixes (BUG-011, BUG-012; REQ-402.4, REQ-403.2, REQ-408.8, REQ-416)

Supersedes the Phase 52 points 「Omitted = unchanged」 and 「Answers live in … `localStorage`」.

### Server (`backend/graphql/resolvers.js`, `typeDefs.js`)
- `completeSurvey(submissionId, demographics, questionnaire: [QuestionnaireAnswerInput!]!)` — the argument is required; `questionnaireError` always runs first (`INVALID_QUESTIONNAIRE: missing Q1, …`), before any write.
- One atomic write: `findOneAndUpdate({ _id: submissionId, isCompleted: { $ne: true } }, { $set: … })`. No match → `findById`: exists → `ALREADY_COMPLETED: this submission is already completed`, else `Submission not found`. The `submissionCount` `$inc` and the group-status refresh only run after a successful match, so they happen once per submission.
- Field resolver `Submission.demographics`: `context.isAdmin ? submission.demographics : null` (same pattern as `questionnaire`). Admin queries already send the JWT; `recentSubmissions` / `submissionsByGroup` stay admin-only.

### Client
- `App.handleSurveyComplete`: `completeSurvey` → on success clear the session and navigate to step 5; on `ALREADY_COMPLETED` the same (an earlier 送出 was saved but its response was lost); any other error sets the notice and **rethrows**, without navigating.
- `SurveyOutro.handleFinalSubmit` already keeps the stored code/answers and shows 「提交失敗，請稍後再試」 when `onComplete` throws — now reachable.
- Answers: `sessionStorage[survey_questionnaire_<submissionId>]` instead of `localStorage` (per tab; survives a refresh; gone when the tab closes). The registration code stays in `localStorage` (REQ-403.1).

### Tests
- Backend: questionnaire omitted → rejected and nothing saved; second `completeSurvey` → `ALREADY_COMPLETED`, answers/email/`submissionCount` unchanged; `Submission.demographics` null without admin. `group-closing.test.js` sends a questionnaire.
- Unit: `onComplete` rejecting → stays on step 4, alert, stored code and answers kept; answers read from `sessionStorage`.
- E2E: API participants send Q1–Q8; EC-12 adds 「completing a completed submission rejected」 and 「completing without the questionnaire rejected」, and 「email hidden from `submission(id)` without admin」.

## Phase 54 — Response time, safe answer saves, research CSV columns (REQ-402.5, REQ-402.6, BUG-013, REQ-362)

### Response time (REQ-402.5)
- `SurveyView`: `shownAtRef = performance.now()` in the effect that resets each scenario (keyed on `scenarioIdx`, so a reload restarts it); `handleNext` sends `responseTime: Math.round(performance.now() - shownAtRef.current)` in the `SurveyResult`.
- `App.handleSaveAnswer` → `saveSurveyAnswer(submissionId, scenarioId, cooperationProbability, responseTime)`.
- GraphQL: `saveSurveyAnswer(submissionId, scenarioId, cooperationProbability: Float!, responseTime: Int!)`. Resolver rejects a negative value (`responseTime must be a non-negative integer`) before any write and pushes `{ scenarioId, cooperationProbability, responseTime, answeredAt }`. The schema field `results[].responseTime` already exists.

### Failed answer save (REQ-402.6, BUG-013)
- `handleNext`: `if (!(await onSaveAnswer(entryId, answer))) { toast.error('儲存失敗，請再按一次。', { id: 'save-failed' }); return; }` before updating local results or navigating. A `saving` flag disables the confirm button while the request is in flight (no double submit).

### Session in the URL (BUG-014, REQ-404)
- `SurveyView.navigateWithSession(path)` reads `new URLSearchParams(window.location.search)` when called: `?sessionId=` if present, else the intro's `?groupId=&mode=mixed`, else the bare path. `handleNext` builds the saved resume path from the same live `sessionId`. The render-time `groupId` / `mode` constants are removed.

### Research CSV (REQ-362, `GroupDetailView.handleExportCsv`)
- Columns 16–18 (Age, Gender, Education) → one column 「Registration Code」 (`demographics.gender`). No email in this file; the payment ledger keeps Registration Code + Email per Submission ID.

### Tests
- Backend: `saveSurveyAnswer` stores `responseTime`, rejects a negative one.
- SurveyView has no unit harness (router, graph, session setup); its behaviour is covered by the e2e below.
- E2E: A's stored `responseTime` is present and ≥ 0 for every answer; the CSV row has the code and no email; one blocked `saveSurveyAnswer` keeps the participant on the scenario and the retry saves it.


## Phase 55 — Simulated pilot data check (NFR-9)

One script, `scripts/sim/simulate.mjs` (`npm run sim:data` = `vite build && node scripts/sim/simulate.mjs`). Boots the app like the e2e (`server.js` on `SIM_PORT`, default 3300, against `MongoMemoryServer`, `NODE_ENV=development`, admin password `sim-admin`).

### Flow
1. `POST /api/admin/login` → admin JWT. `createMixedGroup` with `SIM_MAX_K` (2), `SIM_PER_SESSION` (10), `SIM_TARGET` (2), KMT1 vs DPP4.
2. Recruitment loop: a pool of `SIM_CONCURRENCY` (8) workers; each worker takes the next participant `sim-0001…`, draws its persona from a seeded RNG (`SIM_SEED`, mulberry32) and runs it through the participant API with the REQ-100 cookie `turnstile_verified=true`. The loop stops when `startMixedSession` answers `GROUP_FULL` (or `SIM_MAX_PARTICIPANTS`, 2000, as a safety cap). A participant's ground truth — persona, sent `{ scenarioId, p, responseTime }`, code, email, Q1–Q8 — is recorded as it is sent.
3. Persona answer model: `share = #edgeStates values 'give' / #edgeStates`. Probabilities rounded to 0.01 (the slider's step), clamped to [0, 1]; response time log-normal around the persona's median. Retrier sends every `saveSurveyAnswer` twice with the same value (the second is the REQ-402.4 no-op). Drop-out stops after `1 … n−1` answers and never calls `drawRealisedRound` / `completeSurvey`.
4. Export: Chrome (playwright-core) with the admin token put in `localStorage.token` by an init script, opens `/admin/view/batch/<groupId>`, clicks 「Export CSV」 and 「Export Payments」 and saves both (Tailwind / Cloudflare requests aborted — styling is irrelevant).
5. Checks read the DB (`submissions`, `sessions`, `scenarios`, `sessiongroups` collections via the same connection) and the two CSVs (`parseCsv` as in the e2e).

### Check details
- D1–D5 compare DB documents with the ground truth; D5 recomputes `totalPayoutNtd(payoffPoints(myDecisions[r], opponentDecisions[r]))` from `utils/payment.js`.
- D6 joins CSV rows to DB answers on (Submission ID, Scenario ID); compares probability, response time, registration code, Q1–Q8, completed flag; scans every cell for each sent email.
- D7 compares the ledger's Submission IDs to the completed, valid submissions, and Σ `Total Payout (NTD)` to Σ `payoutNtd`.
- D8: `SessionGroup.status === 'completed'`; per scenario, answers from completed submissions ≥ target.
- A1: OLS slope of `Cooperation Probability` on the 給予 share parsed from `Edge States (JSON)`, completed rows only; expected = 0.6 × (completed rows from Conditional + Retrier) / (completed rows).
- A2: per completed Submission ID in the CSV, flag `sd(p) = 0` (≥ 3 answers) and `median(RT) < 2000`; compare to the planted Straight-liner / Speeder sets.

### Output
`test-results/sim/<timestamp>/report.md`, `research.csv`, `payments.csv`, `ground-truth.json`, `server.log`; one console line per check; `process.exitCode = 1` on any failed check.
