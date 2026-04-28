# Mixed Mode Implementation - Summary

**Date**: 2026-04-28  
**Status**: ✅ Design Complete - Ready for Implementation  
**Decision**: Scenario-Centric Architecture (Bottom-Up Refactor)

---

## Executive Summary

The Mixed Mode feature has been designed using a **scenario-centric architecture** that fundamentally refactors the data model. This unified approach eliminates mode-specific code branches and enables flexible data collection strategies.

### Key Innovation

> **Scenario** is now the atomic unit. **Session** is a lightweight container that references scenarios by ID. This abstraction naturally supports Manual, Batch, and Mixed modes without explicit mode switching logic.

---

## What is Mixed Mode?

A new launch mode that enables **cross-k sampling** for balanced data collection:

- Admin specifies `maxK` (e.g., 3) → system generates scenarios for k=1, k=2, k=3
- Creates a **scenario pool** from all combinations
- Each participant completes `S` scenarios sampled via **balanced selection** (prioritizes under-sampled scenarios)
- Tracks `responseCount` vs `targetSize` at the **scenario level** (not session level)

### Use Case

Collect 30 responses for each scenario across all edge combinations (k=1..3) without requiring each participant to complete 298+ scenarios. Instead, each participant completes 20 scenarios, and the system ensures balanced coverage.

---

## Architecture Decision

### Rejected Approach (v1)
- Add `launchMode` field to `SessionGroup`
- Create mode-specific models (`MixedSubmission`, `ScenarioAssignment`)
- Branch logic in resolvers based on mode

**Problem**: Increased complexity, duplicate code paths, difficult to maintain.

### Accepted Approach (v2) ✅
- **Scenario** = independent first-class entity with its own collection
- **Session** = references `scenarioIds: [String]` (not embedding)
- **No `launchMode` field** — mode is implicit in how sessions are composed
- **Unified survey flow** — same resolvers for all modes

**Benefits**:
- Single code path for survey completion
- Flexible: easy to add new modes (Adaptive, Longitudinal, A/B Testing)
- Clean: mode differences emerge from data structure, not explicit switches
- Scalable: scenario-level queries for fine-grained analytics

---

## Data Model Changes

### New: `Scenario` Collection

```javascript
{
  _id: String (UUID),
  focalNode: String,
  opponentNode: String,
  activeEdgeIds: [String],
  edgeStates: Map<String, String>,
  groupId: String | null,
  targetSize: Number,        // NEW: scenario-level tracking
  responseCount: Number,     // NEW: atomic counter
  status: 'active' | 'completed' | 'paused'
}
```

### Refactored: `Session` (was SessionSetup)

```javascript
{
  _id: String (UUID),
  scenarioIds: [String],      // References Scenario._id (not embedding!)
  focalNode: String,
  opponentNode: String,
  sampleSize: Number,
  groupId: String | null,
  submissionCount: Number,
  metadata: {
    participantId: String,    // NEW: Mixed Mode participant tracking
    createdFor: String        // NEW: 'manual' | 'batch' | 'mixed'
  }
}
```

Virtual field populates `session.scenarios` on demand.

### Updated: `Submission`

```javascript
{
  results: [{
    scenarioId: String,       // CHANGED: UUID reference (was Number index)
    cooperationProbability: Number,
    responseTime: Number,     // NEW
    answeredAt: Date
  }],
  participantId: String       // NEW: Mixed Mode uniqueness
}
```

### Simplified: `SessionGroup`

```javascript
{
  config: {                   // UNIFIED: all mode params in one object
    edgeCount: Number,        // Batch Mode
    maxK: Number,             // Mixed Mode
    scenariosPerSession: Number,
    targetSizePerScenario: Number,
    focalNode: String,
    opponentNode: String,
    sampleSize: Number
  },
  totalScenarios: Number      // NEW: Mixed Mode
}
```

No `launchMode` field — mode detected from which `config` fields are set.

---

## Three Modes, One Model

| Mode | Session Creation | Scenario Source | Participant Experience |
|------|------------------|-----------------|------------------------|
| **Manual** | Admin creates scenarios + one session | Single edge configuration | Complete all scenarios in session |
| **Batch** | For each C(12,k) combo: create scenarios + session | Each combo's design matrix | Complete all scenarios in one session |
| **Mixed** | **Dynamic**: select S scenarios, create personalized session | Scenario pool (k=1..maxK) | Complete S scenarios (unique mix per person) |

### Unified Flow

```javascript
// Survey completion logic (IDENTICAL for all modes!)
async function completeSurvey(submissionId, demographics) {
  const submission = await Submission.findByIdAndUpdate(submissionId, { 
    demographics, 
    isCompleted: true 
  });
  
  const session = await Session.findById(submission.sessionId);
  session.submissionCount += 1;
  await session.save();
  
  // Update scenario-level counters (relevant for Mixed Mode)
  for (const result of submission.results) {
    await Scenario.findByIdAndUpdate(result.scenarioId, { 
      $inc: { responseCount: 1 } 
    });
  }
  
  return submission;
}
```

No mode checking needed!

---

## Implementation Plan

**Total effort**: 22 days (4.5 weeks) for one engineer

### Phase 12: Data Models (4 days)
- Create `Scenario` model
- Refactor `Session` model (rename from SessionSetup)
- Update `Submission` and `SessionGroup` schemas

### Phase 13: GraphQL API (5 days)
- Add `Scenario` types and queries
- Implement three mode creation endpoints
- Unified survey flow resolvers

### Phase 14: Utils (2 days)
- Balanced scenario selection algorithm
- Participant ID generation

### Phase 15: Admin UI (4 days)
- Mixed Mode configuration panel
- Scenario completion heatmap
- Group detail view enhancements

### Phase 16: Survey Flow (4 days)
- URL routing: `?groupId=X&mode=mixed` support
- Dynamic session creation for Mixed Mode
- Verify unified flow works across all modes

### Phase 17: Testing & Docs (3 days)
- Unit, integration, E2E tests
- Update README and API docs
- Mixed Mode walkthrough guide

---

## Key Technical Decisions

### 1. Balanced Selection Strategy (REQ-307)
**Chosen**: Query scenarios sorted by `responseCount ASC`, then random sample from bottom 2S.

**Rationale**: Ensures even coverage while maintaining some randomness.

### 2. Participant ID (REQ-307)
**Chosen**: Cookie-based or browser fingerprint, stored in localStorage.

**Rationale**: Prevents duplicate submissions without requiring user accounts. Admin can optionally require email.

### 3. Scenario Pool Size (REQ-306)
**Constraint**: For maxK=3, pool size ≈ (C(12, 1) + C(12,2) + C(12,3)) × design_matrix_size.

**Consideration**: Each edge combination's design matrix size needs clarification from admin.

### 4. Group Completion (REQ-309)
**Logic**: Query `Scenario.countDocuments({ groupId, responseCount: { $lt: targetSize } })`. If 0, mark group as `completed`.

**Note**: Runs after each survey completion (Mixed Mode only).

### 5. No Data Migration
**Confirmed**: Starting with clean database, no backward compatibility needed.

**Impact**: Simplifies implementation significantly (no migration scripts, no dual-mode support).

---

## Documentation Updates

All three core documents have been updated:

### ✅ requirements.md
- Added US-A3, US-A4, US-P3 (Mixed Mode user stories)
- Added REQ-305..REQ-310 (Mixed Mode functional requirements)
- Added REQ-320..REQ-323 (Scenario-centric architecture requirements)
- Updated REQ-401..REQ-405 (survey flow with Mixed Mode support)

### ✅ design.md
- Complete rewrite focused on scenario-centric architecture
- Detailed data models for `Scenario`, `Session`, `Submission`, `SessionGroup`
- Implementation logic for all three modes
- Unified survey flow design
- GraphQL API specification
- Frontend component design

### ✅ tasks.md
- Added Phase 12-17 (42 tasks total)
- Detailed acceptance criteria for each task
- Dependencies and effort estimates
- Implementation strategy (week-by-week breakdown)

---

## Next Steps

1. **Start Phase 12**: Create Scenario and Session models
2. **Parallel workstreams after Phase 13**:
   - One engineer on frontend (Phase 15-16)
   - Another on testing (Phase 17)
3. **Weekly milestones**:
   - Week 1: API works for all modes (GraphQL only)
   - Week 2: Admin UI complete
   - Week 3: Survey flow complete
   - Week 4: Production-ready

---

## Open Questions to Resolve

Before starting implementation, clarify:

1. **Design matrix size**: How many scenarios does `generateDesignMatrix(edges)` produce? (Affects totalScenarios calculation)
2. **Balanced vs Random**: Preference for strict balanced or hybrid strategy?
3. **Participant uniqueness**: Enforce via cookie only, or require email?
4. **Body size limit**: Can we reduce from 50 MB (RRWeb) to 1 MB after RRWeb removal?
5. **Locale requirements**: Which locales need support in i18n?

---

## References

- **Planning Documents**:
  - [`mixed-mode-implementation-plan.md`](mixed-mode-implementation-plan.md) (v1 - historical, launchMode approach)
  - [`mixed-mode-implementation-plan-v2.md`](mixed-mode-implementation-plan-v2.md) (v2 - scenario-centric, adopted)
  
- **Official Specs** (source of truth):
  - [`requirements.md`](requirements.md) - REQ-305..REQ-323
  - [`design.md`](design.md) - Complete architecture
  - [`tasks.md`](tasks.md) - Phase 12-17

---

## Conclusion

The scenario-centric architecture provides a clean, maintainable foundation for Mixed Mode while improving the system's overall design. The unified data model eliminates technical debt and positions the platform for future enhancements.

**Status**: Ready to begin implementation.
