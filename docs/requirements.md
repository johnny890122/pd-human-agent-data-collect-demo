# Requirements

This document is the single source of truth for the functional and non-functional requirements of the **PD Human-Agent Data Collect Demo** platform — a research tool that lets administrators configure Prisoner's Dilemma network experiments and collects participant cooperation-probability responses through a guided survey flow.

---

## Change Log

| Date | Change | Notes |
| :--- | :--- | :--- |
| 2026-04-28 | Initial spec-driven-dev baseline established | Captures all features currently implemented in the codebase as of commit `05b8cc2` (`feat: new bulk launch feature`). Numbered all requirements REQ-XXX for traceability. |
| 2026-04-28 | Documented batch launch / SessionGroup feature (REQ-301..REQ-304) | Reflects recently merged bulk launch capability. |
| 2026-04-28 | Documented i18n (REQ-501) | Reflects merged i18n commit `89a1e5d`. Specifics of supported locales TBD — flag for clarification. |
| 2026-04-28 | **Open decision**: pending request in `plan.md` to remove RRWeb session-recording functionality entirely (citing network-blocking concerns). REQ-401, REQ-402, REQ-403 are currently documented as **implemented** but flagged for removal pending user confirmation. | See "Open Questions" below. |
| 2026-04-28 | **MAJOR ARCHITECTURE CHANGE**: Scenario-centric data model refactor + Mixed Mode launch capability (REQ-305..REQ-309) | Bottom-up redesign: Scenario becomes the atomic unit, Session becomes a container. Enables unified handling of three launch modes without mode-specific branches. Database is clean slate — no backward compatibility required. |
| 2026-04-28 | **BACKEND REFACTOR COMPLETE** ✅ Phase 12-14 finished | All data models implemented and tested. GraphQL API refactored for Manual & Batch modes with new Scenario-centric architecture. 15/15 backend unit tests passing. REQ-321, REQ-322, REQ-323 fully implemented. Frontend integration pending (Phase 15-16). |
| 2026-04-29 | **LEGACY API REMOVAL COMPLETE** ✅ Phase 15-16 finished | All setupId-based legacy API removed. Manual & Batch modes now exclusively use new Session/Scenario API. URL format changed from `?setupId=` to `?sessionId=`. All frontend components updated. ~500 lines of legacy code removed. API tests passing. |

---

## Overview

The platform supports two primary user roles cooperating around an experimental flow:

1. An **Administrator** designs a network topology (4 named/colored nodes, up to 12 directed edges), picks a focal node and an opponent node, sets a target sample size, and launches experiments in one of three modes:
   - **Manual Mode**: Single session with fixed edges
   - **Batch Mode**: Multiple sessions, one per k-edge combination (complete factorial sweep)
   - **Mixed Mode**: Cross-k sampling with scenario-level targeting
   
   They distribute survey URLs and monitor responses at both session and scenario levels.

2. A **Participant** opens a survey URL, passes a Cloudflare Turnstile bot check, completes a sequence of cooperation-probability scenarios, fills demographics, and submits. Their progress is persisted and (currently) their interactions are recorded for later replay.

The system is implemented as a React/Vite SPA backed by a Node/Express GraphQL API and MongoDB. **Architecture note**: The data model is **scenario-centric** — Scenario is the atomic unit, Session is a container that references scenarios. This unified design eliminates mode-specific code branches.

---

## User Roles

- **Administrator (Admin)** — Researchers and platform managers. Authenticated via a shared `ADMIN_PASSWORD`. Has full read/write access to setups, groups, submissions, and (in dev mode only) database reset.
- **Participant** — Anonymous public user. Authenticated only by Cloudflare Turnstile cookie. Can only create and update their own `Submission`.

---

## User Stories

### Admin Stories

- **US-A1**: As an admin, I want to configure a single experimental session so that I can launch a tightly controlled experiment.
- **US-A2**: As an admin, I want to batch-launch every k-edge combination as a session group so that I can run a complete factorial sweep without configuring each session by hand.
- **US-A3**: As an admin, I want to launch a mixed-mode experiment that samples scenarios across multiple k values so that I can collect balanced data across the entire edge-space without requiring every participant to complete hundreds of scenarios.
- **US-A4**: As an admin, I want to monitor scenario-level completion status (not just session-level) so that I can identify under-sampled scenarios and adjust recruitment accordingly.
- **US-A5**: As an admin, I want to monitor real-time submission counts and completion percentages so that I know when a session or group has reached its target sample size.
- **US-A6**: As an admin, I want to replay a participant's session so that I can audit data quality and study behavior.
- **US-A7**: As an admin in development, I want to clear the database so that I can iterate on the schema without leftover state.

### Participant Stories

- **US-P1**: As a participant, I want my survey to remember my progress so that I can refresh or briefly leave and resume.
- **US-P2**: As a participant, I want to be told clearly if a session is full so that I do not waste time on a closed experiment.
- **US-P3**: As a participant in a mixed-mode experiment, I want to complete a manageable number of scenarios (e.g., 20) sampled from a larger pool, so that my time commitment is reasonable while still contributing to balanced data collection.
- **US-P4**: As a participant, I want the survey UI in my preferred language (zh-TW today; future locales planned).

---

## Functional Requirements

### REQ-100 — Authentication & Bot Protection

- **REQ-101 — Admin password login.** The system MUST gate every `/admin/*` route behind a password check against `ADMIN_PASSWORD`. Login state is held client-side after a successful `POST /api/admin/login`.
  - *Acceptance:* Submitting an incorrect password returns HTTP 401 with `{ success: false }`. Submitting the correct password returns HTTP 200 with `{ success: true }`. Direct navigation to `/admin/setup` while not authenticated redirects to `/login`.
- **REQ-102 — Cloudflare Turnstile gate.** Participants MUST pass Turnstile before any survey GraphQL mutation that creates or updates a submission. Verification is recorded as the `turnstile_verified` HTTP-only cookie (max age 2 h).
  - *Acceptance:* `startSurveyEntry` resolver throws `Turnstile verification required before starting survey.` when the request lacks the cookie. In `NODE_ENV !== 'production'`, the test secret `1x0000000000000000000000000000000AA` short-circuits the Cloudflare round-trip.

### REQ-200 — Single-Session Setup (`/admin/setup`)

- **REQ-201 — Configure a session.** Admin selects (a) focal node, (b) opponent node, (c) active edge IDs from the 12 directed edges defined in `constants.ts`, and (d) target `sampleSize` (default 20).
  - *Acceptance:* `saveSessionSetup` mutation creates a new `SessionSetup` document with a UUID `_id`, `groupId = null`, and the supplied fields. Returns the persisted setup with a `submissionCount` of 0.
- **REQ-202 — Generate a survey link.** After saving, the admin sees a shareable URL of the form `<origin>/survey/welcome?setupId=<id>`.
  - *Acceptance:* Opening that link with a fresh browser hydrates the setup via `sessionSetup(id)` and starts the participant flow.
- **REQ-203 — Visualize the network graph.** The setup panel renders the 4-node directed graph with selectable edges and color-coded groups (Group A blue, Group B red).
  - *Acceptance:* Toggling an edge updates `activeEdgeIds`. Selecting focal/opponent nodes updates the corresponding fields.

### REQ-300 — Batch Launch / Session Groups (`/admin/groups`)

- **REQ-301 — Create a SessionGroup.** Admin specifies `name`, optional `description`, `edgeCount` (k, 1–12), `focalNode`, `opponentNode`, `sampleSize`. The system enumerates **all** C(12, k) edge combinations, generates a design matrix per combination via `generateDesignMatrix`, and inserts one `SessionSetup` per combination linked to the new `SessionGroup` via `groupId`.
  - *Acceptance:* `createBatchSessions` mutation rejects `edgeCount < 1`, `edgeCount > 12`, or combinations exceeding the 1000 cap. On success, returns `{ groupId, sessionsCreated, sessionIds[] }`. The group's status transitions from `creating` -> `active`.
- **REQ-302 — Group monitoring table (`GroupsTable`).** Lists all `SessionGroup` documents with progress (`completedSessions / totalSessions`) and status (`creating | active | completed | archived`).
  - *Acceptance:* Completion percentage is derived consistently with `SessionGroup.completionPercentage` virtual field.
- **REQ-303 — Group detail view (`/admin/groups/:groupId`).** Lists every `SessionSetup` belonging to the group with per-session submission counts and survey links.
  - *Acceptance:* Sessions are loaded via `sessionsByGroup(groupId)` query and ordered by `createdAt` ascending.
- **REQ-304 — Group lifecycle controls.** Admin can update a group's status (via `updateSessionGroupStatus`) or delete a group (via `deleteSessionGroup`, which cascades and deletes all child `SessionSetup` and `Submission` documents).
  - *Acceptance:* `updateSessionGroupStatus` rejects any status not in the enum. `deleteSessionGroup` returns `true` only if the group existed and was removed.

### REQ-305 — Mixed Mode Launch (`/admin/mixed`)

- **REQ-306 — Create a Mixed Mode Group.** Admin specifies `name`, optional `description`, `maxK` (1–12), `scenariosPerSession` (S), `targetSizePerScenario`, `focalNode`, `opponentNode`. The system generates a **scenario pool** by enumerating all edge combinations for k=1 through k=maxK, generating a design matrix for each combination, and creating individual `Scenario` documents. Each scenario tracks its own `responseCount` vs `targetSize`.
  - *Acceptance:* `createMixedGroup` mutation validates `1 <= maxK <= 12` and `scenariosPerSession > 0`. Returns `{ groupId, totalScenarios, estimatedSessions }`. Scenarios are created with `status='active'` and `responseCount=0`. Group status transitions from `creating` -> `active`.
  
- **REQ-307 — Mixed Mode Participant Session Creation.** When a participant opens `/survey/welcome?groupId=<id>&mode=mixed`, the system dynamically creates a personalized `Session` by selecting S scenarios from the group's scenario pool using a **balanced selection strategy** (prioritizing scenarios with lower `responseCount`).
  - *Acceptance:* `startMixedSession(groupId, participantId)` mutation selects scenarios where `status='active'`, sorts by `responseCount` ascending, and samples S scenarios. Creates a new `Session` with `scenarioIds` referencing the selected scenarios, `metadata.participantId` set, `sampleSize=1`. Returns `{ sessionId, assignedScenarios[] }`. If the participant already has a session for this group (based on `participantId`), returns the existing session for resume capability.

- **REQ-308 — Scenario-Level Data Collection Tracking.** Each time a participant submits a response for a scenario (via `saveSurveyAnswer`), the system MUST atomically increment the scenario's `responseCount` using `$inc`.
  - *Acceptance:* After `saveSurveyAnswer` or `completeSurvey`, the referenced `Scenario` document's `responseCount` field is incremented by 1. Concurrent submissions to the same scenario are handled safely via MongoDB atomic operations.

- **REQ-309 — Mixed Mode Completion Detection.** When all scenarios in a Mixed Mode group reach their `targetSize` (i.e., `responseCount >= targetSize`), the system automatically updates the group's status to `completed`.
  - *Acceptance:* After each submission completion, query `Scenario.countDocuments({ groupId, responseCount: { $lt: targetSize } })`. If count is 0, update `SessionGroup.status = 'completed'`. Admin UI displays completion progress as `(scenarios where responseCount >= targetSize) / totalScenarios × 100%`.

- **REQ-310 — Scenario Completion Visualization.** Admin UI for Mixed Mode groups MUST display a scenario-level completion heatmap showing which scenarios are under-sampled, at-target, or over-sampled.
  - *Acceptance:* `GroupDetailView` for Mixed Mode groups queries all scenarios via `scenarios(groupId)` and renders a visual matrix (e.g., D3 heatmap) where color intensity represents `responseCount / targetSize`. Clicking a cell shows scenario details (edge configuration, current count).

### REQ-315 — Session History (`/admin/history`)

- **REQ-316 — List standalone sessions.** Shows every `Session` where `groupId == null`, with submission counts and links to (a) the survey URL, (b) replay (per submission), (c) raw data.
  - *Acceptance:* Backed by `allSessions(excludeGroupSessions: true)` query.

### REQ-320 — Scenario-Centric Data Model (Architecture Requirement)

- **REQ-321 — Scenario as Atomic Unit.** ✅ **IMPLEMENTED 2026-04-28** The system MUST model `Scenario` as an independent, first-class entity with its own collection, lifecycle, and tracking. Each scenario encapsulates: (a) experiment configuration (focalNode, opponentNode, activeEdgeIds), (b) specific state (edgeStates map), (c) data collection progress (responseCount vs targetSize), (d) status (active/completed/paused).
  - *Acceptance:* ✅ `Scenario` collection exists with UUID primary keys. Can be queried independently of `Session`. Supports scenario-level analytics and filtering. Implemented in `backend/models/Scenario.js`. Tested in 15/15 backend unit tests.

- **REQ-322 — Session as Scenario Container.** ✅ **IMPLEMENTED 2026-04-28** `Session` MUST be a lightweight container that references scenarios via `scenarioIds: [String]` rather than embedding scenario data. Sessions define the participant experience (which scenarios in what order) but scenarios exist independently.
  - *Acceptance:* ✅ `Session` documents contain only IDs, not full scenario objects. GraphQL queries populate scenarios on-demand via `toSessionGraph` helper. Implemented in `backend/models/Session.js`. Verified with unit tests.

- **REQ-323 — Unified Survey Flow.** ✅ **IMPLEMENTED 2026-04-28** The survey completion logic MUST be identical across all three modes (Manual, Batch, Mixed). No mode-specific conditional branches in resolvers or UI components.
  - *Acceptance:* ✅ `startSurvey`, `saveSurveyAnswer`, `completeSurvey` resolvers handle all modes without checking a `launchMode` field. Mode differences are emergent from session composition, not explicit switches. Implemented in `backend/graphql/resolvers.js`. Tested with unified survey flow tests.

### REQ-330 — Submissions, Replay, and Database Control

- **REQ-331 — Recent submissions feed.** `recentSubmissions(limit)` query returns the most recent submissions across all sessions for admin review.
  - *Acceptance:* Default `limit` 20, sorted by `createdAt` descending.
- **REQ-332 — Database clear (dev only).** `clearDatabase` mutation wipes all collections.
  - *Acceptance:* Throws `Action denied: You cannot clear the database in production.` when `NODE_ENV === 'production'`.

### REQ-400 — Participant Survey Flow

- **REQ-401 — Sequential routing.** A participant opening `/survey/welcome?sessionId=<id>` (Manual/Batch modes) or `/survey/welcome?groupId=<id>&mode=mixed` (Mixed mode) is guided through `welcome` -> `intro/:step` -> `scenarios/:scenarioIdx` -> `outro`.
  - *Acceptance:* Direct navigation to a step out of order (e.g., `scenarios/3` with no resumable session) creates an entry from the start and saves session state. Mixed mode URLs first create/retrieve a personalized session via `startMixedSession`.
  
- **REQ-402 — Per-scenario response capture.** Each scenario captures one `cooperationProbability` in `[0, 1]`. Answers are upserted by `scenarioId` (UUID reference to `Scenario._id`), with latest write wins per scenario.
  - *Acceptance:* `saveSurveyAnswer(submissionId, scenarioId, probability)` rejects values outside `[0, 1]` with the error `cooperationProbability must be between 0 and 1`. The mutation updates both `Submission.results` and atomically increments `Scenario.responseCount`.
  
- **REQ-403 — Demographics + completion.** On the final step the participant submits `{ age, gender, education }`. The system marks the `Submission.isCompleted = true` and shows the outro screen.
  - *Acceptance:* `completeSurvey` returns the updated submission. On success, the local survey-session cache for that session is cleared. In Mixed Mode, this triggers a check for group completion status (REQ-309).
  
- **REQ-404 — Session persistence (resume).** Refreshing the browser or returning to the URL must restore `submissionId` and route from `localStorage[survey_session_<sessionId>]`.
  - *Acceptance:* If the stored `path` is meaningfully different from the current URL (e.g., user landed on `/survey/scenarios/0` but session was at `scenarios/2`), the app navigates back to the stored path; mismatch heuristic logs a warning and falls back to a fresh entry.
  
- **REQ-405 — "Session full" gate.** When the live `submissionCount` for a session reaches `sampleSize` and the participant has no resumable entry, the system MUST display 「人數已滿」 instead of the survey UI. For Mixed Mode groups, the gate closes when all scenarios reach `targetSize`.
  - *Acceptance:* Already-started entries (those holding a `restoredSubmissionId`) MAY continue to completion even after the gate closes.

### REQ-410 — Session Recording (RRWeb) — Currently Implemented; Removal Pending

- **REQ-411 — Background DOM recording.** While in `/survey/*` (with a valid `entryId`), the client runs `rrweb.record` and flushes events every 5 s via the `saveSessionEvents` mutation.
  - *Acceptance:* Events are appended to a `SessionReplay` chunk; chunks roll over once they exceed 2000 events to stay under MongoDB's 16 MB document cap.
- **REQ-412 — Admin replay (`/admin/replay/:sessionId`).** Concatenates all chunks via `getSessionReplay` query and plays them in `rrweb-player`.
  - *Acceptance:* Errors if `events.length < 2`.
- **REQ-413 — *PENDING REMOVAL*** — `plan.md` requests the entire RRWeb subsystem be removed because it is blocked on some participant networks. **Action item:** confirm with the admin, then deprecate REQ-411..REQ-412, drop the `SessionReplay` collection, the `SessionRecorder` and `SessionPlayback` components, the `saveSessionEvents` / `getSessionReplay` GraphQL operations, the `/admin/replay/:sessionId` route, and the `rrweb` / `rrweb-player` dependencies.

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
- **NFR-6 — Body size:** GraphQL endpoint MUST accept up to 50 MB JSON payloads (configured to support large RRWeb event chunks).

---

## Out of Scope (Explicitly Not Required)

- CSV export of submissions (backlog candidate).
- Role-based access control beyond a single shared admin password (backlog candidate).
- Participant accounts, login, or returning-user profiles.
- Real-time admin dashboards (current views are query-on-load).
- Multi-tenancy / organization separation.
- A11y certification (no formal WCAG target set).

---

## Open Questions

1. **Confirm RRWeb removal (REQ-413).** `plan.md` requests removing it entirely. Should we proceed? If yes, do we keep the `SessionReplay` collection's existing data for archival, or drop it?
2. **REQ-501 i18n details.** Which locales are in scope? Where does the language switcher live? How is the choice persisted?
3. **Mixed Mode design matrix size (REQ-306).** How many scenarios does each edge combination's design matrix contain? This affects `totalScenarios` calculation and estimated participant count.
4. **Mixed Mode balanced selection strategy (REQ-307).** Preference: strict balanced (always pick lowest `responseCount`), random from undersampled pool (pick randomly from bottom N%), or hybrid?
5. **Mixed Mode duplicate participation (REQ-307).** Should the system enforce `participantId` uniqueness per group to prevent repeat submissions? Via cookie, email requirement, or other method?
6. **NFR-6 body size.** With RRWeb removal and scenario-centric model, can we reduce the 50 MB GraphQL body limit to a more reasonable size (e.g., 1 MB)?
