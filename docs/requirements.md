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

---

## Overview

The platform supports two primary user roles cooperating around an experimental flow:

1. An **Administrator** designs a network topology (4 named/colored nodes, up to 12 directed edges), picks a focal node and an opponent node, sets a target sample size, and launches experiments in one of three modes:
   - **Manual Mode** (`/admin/setup?mode=manual`): Single session with fixed edges chosen on the network graph.
   - **Mixed Mode** (`/admin/setup?mode=mixed`): Cross-k sampling with scenario-level targeting. Admin picks maxK, scenariosPerSession, and targetSizePerScenario; the system generates a scenario pool and serves balanced sessions to each arriving participant. ✅ **COMPLETED 2026-04-29**
   - **Batch Mode** (`/admin/view/batch`): Multiple sessions, one per k-edge combination (complete factorial sweep). Accessible via the Groups tab, not the Setup tab.
   
   Manual Mode and Mixed Mode share the `/admin/setup` page and are selected with an inline two-button `LaunchMode` toggle. The active mode is always reflected in the URL as a `?mode=` query parameter, enabling bookmarking and direct links to each mode. Navigating to `/admin/setup` without the parameter defaults to Manual Mode. They distribute survey URLs and monitor responses at both session and scenario levels.

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

### Participant Stories

- **US-P1**: As a participant, I want my survey to remember my progress so that I can refresh or briefly leave and resume.
- **US-P2**: As a participant, I want to be told clearly if a session is full so that I do not waste time on a closed experiment.
- **US-P3**: As a participant in a mixed-mode experiment, I want to complete a manageable number of scenarios (e.g., 20) sampled from a larger pool, so that my time commitment is reasonable while still contributing to balanced data collection. ✅ **IMPLEMENTED 2026-04-29**
- **US-P4**: As a participant, I want the survey UI in my preferred language (zh-TW today; future locales planned).

---

## Functional Requirements

### REQ-100 — Authentication & Bot Protection

- **REQ-101 — Admin password login.** The system MUST gate every `/admin/*` route behind a password check against `ADMIN_PASSWORD`. Login state is held client-side after a successful `POST /api/admin/login`.
  - *Acceptance:* Submitting an incorrect password returns HTTP 401 with `{ success: false }`. Submitting the correct password returns HTTP 200 with `{ success: true }`. Direct navigation to `/admin/setup` while not authenticated redirects to `/login`.
  
- **REQ-102 — Cloudflare Turnstile gate.** Participants MUST pass Turnstile before any survey GraphQL mutation that creates or updates a submission. Verification is recorded as the `turnstile_verified` HTTP-only cookie (max age 2 h).
  - *Acceptance:* `startSurvey` resolver throws `Turnstile verification required before starting survey.` when the request lacks the cookie. In `NODE_ENV !== 'production'`, the test secret `1x0000000000000000000000000000000AA` short-circuits the Cloudflare round-trip.

### REQ-200 — Single-Session Setup (`/admin/setup`)

- **REQ-201 — Configure a session.** ✅ **USES NEW API (2026-04-29)** Admin selects (a) focal node, (b) opponent node, (c) active edge IDs from the 12 directed edges defined in `constants.ts`, and (d) target `sampleSize` (default 20).
  - *Acceptance:* `createManualSession` mutation creates independent `Scenario` documents and a `Session` document with UUID `_id`, `groupId = null`, and the supplied fields. Returns the session with `scenariosCreated` count.
  
- **REQ-202 — Generate a survey link.** ✅ **URL FORMAT UPDATED (2026-04-29)** After saving, the admin sees a shareable URL of the form `<origin>/survey/welcome?sessionId=<id>`.
  - *Acceptance:* Opening that link hydrates the session via `session(id)` query and starts the participant flow.
  
- **REQ-203 — Visualize the network graph.** The setup panel renders the 4-node directed graph with selectable edges and color-coded groups (Group A blue, Group B red).
  - *Acceptance:* Toggling an edge updates `activeEdgeIds`. Selecting focal/opponent nodes updates the corresponding fields.

- **REQ-204 — Mode toggle with URL synchronization.** The `/admin/setup` page MUST expose a two-button toggle (labeled "Manual" and "Mixed") that selects the active launch strategy. The toggle state MUST be reflected in the URL as a `?mode=` query parameter at all times, so the current mode is always bookmarkable and shareable.
  - *Acceptance:*
    - Clicking "Manual" sets the URL to `/admin/setup?mode=manual` and renders the Manual Mode configuration UI.
    - Clicking "Mixed" sets the URL to `/admin/setup?mode=mixed` and renders the Mixed Mode configuration UI.
    - URL update MUST use history replace (not push), so toggling the mode does not add entries to the browser history stack.
    - A user who copies the URL `/admin/setup?mode=mixed` and opens it in a new tab MUST land directly in Mixed Mode.
    - A user who copies the URL `/admin/setup?mode=manual` and opens it in a new tab MUST land directly in Manual Mode.
    - The browser back button reflects natural navigation history, not toggling between modes.

- **REQ-205 — Default mode when param is absent or invalid.** Navigating to `/admin/setup` without a `?mode=` parameter, or with an unrecognized value (e.g., `?mode=foo`), MUST default to Manual Mode. The URL MUST be corrected to `?mode=manual` immediately on load (via replace, not push).
  - *Acceptance:*
    - `GET /admin/setup` (no param) → renders Manual Mode; URL becomes `/admin/setup?mode=manual`.
    - `GET /admin/setup?mode=invalid` → renders Manual Mode; URL becomes `/admin/setup?mode=manual`.
    - No flash of the wrong mode is visible before the URL correction.

- **REQ-206 — Internal admin links preserve mode context.** Any link within the admin console that navigates to `/admin/setup` MUST include a `?mode=` parameter. The default when generating such links programmatically (e.g., "go to setup" buttons) MUST be `?mode=manual`.
  - *Acceptance:*
    - No internal navigation produces a bare `/admin/setup` URL without a `?mode=` param.
    - Where the originating context already knows the target mode (e.g., "Edit in Mixed Mode" from a Mixed Mode group), the link uses `?mode=mixed`.

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
  - *Acceptance:* After each submission completion, query `Scenario.countDocuments({ groupId, responseCount: { $lt: targetSize } })`. If count is 0, update `SessionGroup.status = 'completed'`. Admin UI displays completion progress as `(scenarios where responseCount >= targetSize) / totalScenarios × 100%`. **Implemented**: Logic in completeSurvey resolver.

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

### REQ-315 — Session History (`/admin/view/manual`)

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
      - **"答題中 (N/M)"** — when `isCompleted = false` and `demographics = null`
      - **"填寫人口統計"** — when `isCompleted = false` and `demographics !== null` (user finished all questions but not submitted final demographics)
      - **"已完成 ✓"** — when `isCompleted = true`
    - The progress display MUST be visible in the expanded row below each session entry, alongside the existing submission detail table (ID, Status, Start Time, End Time)
  - *Technical note:* No backend changes required. All data is already available in the `Submission` model (`results[]`, `demographics`, `isCompleted`) and can be correlated with the session's total scenario count.

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
    14. **Response Time (ms)** — `SurveyResult.responseTime` (optional, may be null)
    15. **Answered At** — `SurveyResult.answeredAt` (ISO timestamp)
    16. **Age** — `Submission.demographics.age` (same value repeated for all rows of one submission)
    17. **Gender** — `Submission.demographics.gender`
    18. **Education** — `Submission.demographics.education`
    19. **Submission Completed** — `Submission.isCompleted` (true/false)
    20. **Submission Invalid** — `Submission.isInvalid` (true/false)
    21. **Submission Created At** — `Submission.createdAt` (ISO timestamp)
    22. **Submission Completed At** — `Submission.completedAt` (ISO timestamp, may be null)
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
   
- **REQ-403 — Demographics + completion.** ✅ **BUG FIXED 2026-05-04** On the final step the participant submits `{ age, gender, education }`. The system marks the `Submission.isCompleted = true` and shows the outro screen.
  - *Acceptance:* `completeSurvey` returns the updated submission. On success, the local survey-session cache for that session is cleared. In Mixed Mode, this triggers a check for group completion status (REQ-309). **Bug Fix**: SurveyOutro now properly calls `completeSurvey` mutation when user submits email and code.
   
- **REQ-404 — Session persistence (resume).** Refreshing the browser or returning to the URL must restore `submissionId` and route from `localStorage[survey_session_<sessionId>]`.
  - *Acceptance:* If the stored `path` is meaningfully different from the current URL (e.g., user landed on `/survey/scenarios/0` but session was at `scenarios/2`), the app navigates back to the stored path; mismatch heuristic logs a warning and falls back to a fresh entry.
   
- **REQ-405 — "Session full" gate.** When the live `submissionCount` for a session reaches `sampleSize` and the participant has no resumable entry, the system MUST display 「人數已滿」 instead of the survey UI. For Mixed Mode groups, the gate closes when all scenarios reach `targetSize`.
  - *Acceptance:* Already-started entries (those holding a `restoredSubmissionId`) MAY continue to completion even after the gate closes.

### REQ-415 — Chrome-Only Browser Enforcement

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
- **NFR-3 — Security:** Admin password and Turnstile secret are read from environment only. Turnstile cookie is `httpOnly`, `sameSite=lax`, and `secure` in production. The `clearDatabase` mutation is hard-blocked outside production via env check.
- **NFR-4 — Deployment:** Single-Procfile deploy (`web: npm start`) on Heroku-class platforms, Node 20.x. Static assets served from `dist/` after `vite build`.
- **NFR-5 — Compatibility:** SPA must handle deep links (server falls back to `index.html` for any non-`/graphql` route).
- **NFR-6 — Body size:** GraphQL endpoint accepts JSON payloads (standard size limits after RRWeb removal).

---

## Known Issues

### Active Issues

| Issue ID | Description | Severity | Reported |
|----------|-------------|----------|----------|
| BUG-004 | Mixed Mode creates session too early (on welcome page load) | High | 2026-05-06 |

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

---

## Known Issues (Fixed)

### Fixed Issues

| Issue ID | Description | Fix Date | Status |
|----------|-------------|----------|--------|
| BUG-001 | NetworkGraph TypeError: Cannot read properties of undefined (reading 'includes') | 2026-05-04 | ✅ Fixed |
| BUG-002 | SurveyOutro not calling completeSurvey, causing all submissions to show as incomplete | 2026-05-04 | ✅ Fixed |
| BUG-003 | Admin history view: clicking session ID shows 0 active edges in read-only setup panel | 2026-05-04 | ✅ Fixed |

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
