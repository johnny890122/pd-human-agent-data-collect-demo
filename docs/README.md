# Documentation Index

This directory contains all specification and planning documents for the PD Human-Agent Data Collect Demo platform.

---

## 📋 Core Specifications (Source of Truth)

These three documents form the **single source of truth** for the project. All implementation work should reference these:

### 1. [`requirements.md`](requirements.md)
**What the system should do** from a user perspective.

- Functional requirements (REQ-XXX)
- Non-functional requirements (NFR-XXX)
- User stories (US-XXX)
- Acceptance criteria

**Key sections**:
- REQ-100: Authentication & Bot Protection
- REQ-200: Manual Mode (single session)
- REQ-300: Batch Mode (factorial sweep)
- **REQ-305..310: Mixed Mode** ⭐ NEW
- **REQ-320..323: Scenario-Centric Architecture** ⭐ NEW
- REQ-400: Participant Survey Flow

**Last updated**: 2026-04-28 (Mixed Mode + Scenario-Centric refactor)

### 2. [`design.md`](design.md)
**How the system is built** - complete technical architecture.

- Data models (Scenario, Session, Submission, SessionGroup)
- Three modes implementation (Manual, Batch, Mixed)
- GraphQL API specification
- Frontend component design
- Interaction flows

**Key innovation**: Scenario-centric architecture where `Scenario` is the atomic unit and `Session` is a lightweight container. This eliminates mode-specific branches.

**Last updated**: 2026-04-28 (Complete rewrite for scenario-centric architecture)

### 3. [`tasks.md`](tasks.md)
**Implementation checklist** - actionable development tasks.

- Phase 1-11: Baseline features (completed)
- **Phase 12-17: Scenario-Centric + Mixed Mode** ⭐ NEW
  - Phase 12: Data models (4 days)
  - Phase 13: GraphQL API (5 days)
  - Phase 14: Utils (2 days)
  - Phase 15: Admin UI (4 days)
  - Phase 16: Survey flow (4 days)
  - Phase 17: Testing & docs (3 days)

**Total effort**: 22 days (~4.5 weeks) for one engineer

**Last updated**: 2026-04-28 (Added Phase 12-17)

---

## 📖 Supporting Documentation

### [`mixed-mode-summary.md`](mixed-mode-summary.md) ⭐
**Executive summary** of the Mixed Mode feature and scenario-centric architecture refactor.

Read this first for a quick overview before diving into the detailed specs.

**Contents**:
- What is Mixed Mode?
- Architecture decision rationale
- Data model changes summary
- Implementation plan overview
- Open questions to resolve

---

## 🗂️ Historical Planning Documents

These documents were created during the design phase but are **not the source of truth**. They are retained for historical context and architectural decision records.

### [`mixed-mode-implementation-plan.md`](mixed-mode-implementation-plan.md)
**v1 approach** (rejected): Add `launchMode` field with mode-specific models.

- Proposed `MixedSubmission` and `ScenarioAssignment` models
- Mode-specific branches in resolvers
- Complex data migration strategy

**Status**: ❌ Rejected in favor of scenario-centric approach

### [`mixed-mode-implementation-plan-v2.md`](mixed-mode-implementation-plan-v2.md)
**v2 approach** (adopted): Scenario-centric bottom-up refactor.

- Scenario as atomic unit
- Session as container
- Unified model for all modes
- No data migration needed (clean database)

**Status**: ✅ Adopted - distilled into core specs above

**Note**: This document contains valuable detailed design thinking but the official specs are in `requirements.md` and `design.md`. Refer to those for implementation.

---

## 📚 How to Use This Documentation

### For Product Owners / Researchers
1. Start with [`mixed-mode-summary.md`](mixed-mode-summary.md) for overview
2. Read [`requirements.md`](requirements.md) for feature details
3. Review user stories and acceptance criteria

### For Engineers - New to Project
1. Read [`mixed-mode-summary.md`](mixed-mode-summary.md) for context
2. Study [`design.md`](design.md) for architecture
3. Check [`tasks.md`](tasks.md) Phase 1-11 to understand baseline
4. Review data models in `design.md` before coding

### For Engineers - Implementing Mixed Mode
1. Confirm understanding of scenario-centric architecture in [`design.md`](design.md)
2. Follow [`tasks.md`](tasks.md) Phase 12-17 in order
3. Reference [`requirements.md`](requirements.md) REQ-305..323 for acceptance criteria
4. Resolve open questions in [`mixed-mode-summary.md`](mixed-mode-summary.md) before starting

### For Code Reviewers
1. Check task references ([TASK-XXXX]) in commit messages
2. Verify acceptance criteria from [`requirements.md`](requirements.md) [REQ-XXX]
3. Confirm architecture alignment with [`design.md`](design.md)

---

## 🔄 Workflow: Spec-Driven Development (SSD)

This project follows the **Specification-Driven Development** methodology:

```
requirements.md → design.md → tasks.md → implementation
     ↑               ↑            ↑            ↓
     └───────────────┴────────────┴────────── feedback loop
```

**Process**:
1. **New feature request** → Update `requirements.md` (add REQ-XXX)
2. **Technical design** → Update `design.md` (add architecture, data models, APIs)
3. **Break down work** → Update `tasks.md` (add TASK-XXXX with REQ references)
4. **Implementation** → Code references TASK-XXXX
5. **Feedback** → Update specs if requirements change

**Key principle**: Specs are living documents, not static artifacts.

---

## 📊 Current Status

**Baseline Features**: ✅ Implemented (Phase 1-11)
- Manual Mode (single session configuration)
- Batch Mode (C(12,k) factorial sweep)
- Survey flow with Turnstile verification
- Admin monitoring dashboard

**Mixed Mode + Scenario-Centric Refactor**: 📋 Design Complete, Ready for Implementation (Phase 12-17)
- Specs finalized in core documents
- 42 tasks defined with 22-day estimate
- Open questions documented for clarification
- No blockers for starting Phase 12

---

## 🎯 Quick Links

### Core Specs (Read These)
- [Requirements](requirements.md) - What to build
- [Design](design.md) - How to build it
- [Tasks](tasks.md) - Implementation checklist

### Quick Start
- [Mixed Mode Summary](mixed-mode-summary.md) - Executive overview
- [Tasks Phase 12](tasks.md#phase-12-scenario-centric-data-model-foundation) - Start here for implementation

### Reference
- [Implementation Plan v2](mixed-mode-implementation-plan-v2.md) - Design thinking (historical)
- [Open Questions](mixed-mode-summary.md#open-questions-to-resolve) - Need clarification

---

## 📝 Version History

| Date | Change | Documents Updated |
|------|--------|-------------------|
| 2026-04-28 | Initial SSD baseline | requirements.md, design.md, tasks.md |
| 2026-04-28 | Batch Mode documentation | requirements.md (REQ-301..304), design.md, tasks.md |
| 2026-04-28 | **Mixed Mode + Scenario-Centric refactor** | All three core specs + new summary doc |

---

## 🤝 Contributing

When making changes:
1. **Always update specs first**, then code
2. Keep `requirements.md`, `design.md`, and `tasks.md` in sync
3. Reference REQ-XXX and TASK-XXXX in commits
4. Update traceability matrices if adding new requirements
5. Add changelog entries to spec documents

---

## 📧 Questions?

For questions about:
- **Requirements**: Check requirements.md Open Questions section
- **Architecture**: Review design.md or implementation plans
- **Tasks**: See tasks.md Notes section

Unresolved questions are documented in [`mixed-mode-summary.md`](mixed-mode-summary.md#open-questions-to-resolve).
