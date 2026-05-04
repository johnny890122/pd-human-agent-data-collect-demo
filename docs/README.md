# Documentation Index

This directory contains all specification and planning documents for the PD Human-Agent Data Collect Demo platform.

**Last Updated**: 2026-05-04

---

## 📋 Core Specifications (Source of Truth)

These three documents form the **single source of truth** for the project. All implementation work should reference these:

### 1. [`requirements.md`](requirements.md) ⭐
**What the system should do** from a user perspective.

- Functional requirements (REQ-XXX)
- Non-functional requirements (NFR-XXX)
- User stories (US-XXX)
- Acceptance criteria
- Known issues and fixes

**Status**: ✅ **Up to date** - Synced with codebase as of 2026-05-04

**Key sections**:
- REQ-100: Authentication & Bot Protection
- REQ-200: Manual Mode (single session)
- REQ-300: Batch Mode (factorial sweep)
- REQ-305..310: Mixed Mode ✅ **IMPLEMENTED**
- REQ-320..323: Scenario-Centric Architecture ✅ **IMPLEMENTED**
- REQ-400: Participant Survey Flow
- Known Issues: BUG-001, BUG-002 (both fixed)

### 2. [`design.md`](design.md) ⭐
**How the system is built** - complete technical architecture.

- Data models (Scenario, Session, Submission, SessionGroup)
- Three modes implementation (Manual, Batch, Mixed)
- GraphQL API specification
- Frontend component design
- Interaction flows
- Bug fixes documentation

**Status**: ✅ **Up to date** - Synced with codebase as of 2026-05-04

**Key innovation**: Scenario-centric architecture where `Scenario` is the atomic unit and `Session` is a lightweight container. This eliminates mode-specific branches.

### 3. [`tasks.md`](tasks.md) ⭐
**Implementation checklist** - actionable development tasks.

- Phase 1-11: Baseline features ✅ **COMPLETE**
- Phase 12-14: Scenario-Centric Backend ✅ **COMPLETE**
- Phase 15-16: Frontend Refactor ✅ **COMPLETE**
- Phase 17: Testing & Docs 🟡 **PARTIAL** (heatmap deferred)
- Phase 18: Legacy API Removal ✅ **COMPLETE**
- Phase 19: Bug Fixes ✅ **COMPLETE**
- Phase 20: Documentation Consolidation ✅ **COMPLETE**

**Status**: ✅ **Up to date** - All completed tasks marked as of 2026-05-04

---

## 📖 Supporting Documentation

### [`testing-guide.md`](testing-guide.md)
Manual testing guide for the new Scenario-Centric data model and API.

- Backend unit tests
- API integration tests
- GraphQL playground examples
- Testing strategy

---

## 🗂️ Archive

The [`archive/`](archive/) directory contains detailed implementation reports, migration guides, and bug fix reports. These documents provide historical context and detailed implementation notes but are **not** the source of truth.

### Implementation Reports (2026-04-28 to 2026-05-04)

| Document | Date | Topic | Status |
|----------|------|-------|--------|
| [`MIGRATION-2026-04-29.md`](archive/MIGRATION-2026-04-29.md) | 2026-04-29 | Legacy API complete removal | ✅ Complete |
| [`legacy-api-removal-summary.md`](archive/legacy-api-removal-summary.md) | 2026-04-29 | Detailed removal report | ✅ Complete |
| [`LEGACY-API-REMOVAL-COMPLETE.md`](archive/LEGACY-API-REMOVAL-COMPLETE.md) | 2026-04-29 | Final verification report | ✅ Complete |
| [`BATCH-MODE-VERIFICATION-2026-04-29.md`](archive/BATCH-MODE-VERIFICATION-2026-04-29.md) | 2026-04-29 | Batch mode new API verification | ✅ Complete |
| [`MIXED-MODE-IMPLEMENTATION-2026-04-29.md`](archive/MIXED-MODE-IMPLEMENTATION-2026-04-29.md) | 2026-04-29 | Mixed mode implementation report | ✅ Complete |
| [`mixed-mode-implementation-plan-v2.md`](archive/mixed-mode-implementation-plan-v2.md) | 2026-04-28 | Scenario-centric architecture design | ✅ Adopted |
| [`mixed-mode-summary.md`](archive/mixed-mode-summary.md) | 2026-04-28 | Executive summary of Mixed Mode | ✅ Reference |

### Bug Reports and Fixes

| Document | Date | Issue | Status |
|----------|------|-------|--------|
| [`bug-fix-networkgraph-undefined-2026-05-04.md`](archive/bug-fix-networkgraph-undefined-2026-05-04.md) | 2026-05-04 | TypeError: Cannot read properties of undefined | ✅ Fixed |
| [`bug-report-session-f059e0a1.md`](archive/bug-report-session-f059e0a1.md) | Earlier | Incomplete submission investigation | ✅ Fixed |
| [`fix-summary-incomplete-submissions.md`](archive/fix-summary-incomplete-submissions.md) | 2026-05-04 | completeSurvey not called in SurveyOutro | ✅ Fixed |

---

## 📚 How to Use This Documentation

### For Product Owners / Researchers
1. Read [`requirements.md`](requirements.md) for feature details
2. Check user stories and acceptance criteria
3. Review Open Questions section for pending decisions

### For Engineers - New to Project
1. Start with [`requirements.md`](requirements.md) for what the system does
2. Study [`design.md`](design.md) for architecture and data models
3. Review [`tasks.md`](tasks.md) to see implementation history
4. Check [`archive/`](archive/) for detailed implementation context

### For Engineers - Making Changes
1. Update [`requirements.md`](requirements.md) first (add/modify REQ-XXX)
2. Update [`design.md`](design.md) with technical approach
3. Update [`tasks.md`](tasks.md) with actionable tasks
4. Reference REQ-XXX and TASK-XXX in commits
5. Keep all three files synchronized

### For Code Reviewers
1. Check task references (TASK-XXXX) in commit messages
2. Verify acceptance criteria from [`requirements.md`](requirements.md) [REQ-XXX]
3. Confirm architecture alignment with [`design.md`](design.md)

---

## 🔄 Specification-Driven Development (SSD) Workflow

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

**System Status**: ✅ **Production Ready**

**Implementation Progress**:
- ✅ Manual Mode (single session)
- ✅ Batch Mode (factorial sweep)
- ✅ Mixed Mode (cross-k sampling)
- ✅ Unified survey flow (all modes)
- ✅ Legacy API removed (~500 lines)
- ✅ Bug fixes applied (NetworkGraph, SurveyOutro)
- ✅ Documentation synchronized

**Test Coverage**:
- ✅ 15/15 backend unit tests passing
- ✅ 5/5 API integration tests passing
- ✅ E2E tests for all three modes

**Known Limitations**:
- ⏸️ Scenario heatmap visualization (REQ-310) deferred
- Frontend tests need updates for new API (backlog)

---

## 🎯 Quick Links

### For Immediate Use
- [Requirements](requirements.md) - What to build
- [Design](design.md) - How to build it
- [Tasks](tasks.md) - Implementation checklist
- [Testing Guide](testing-guide.md) - How to test

### For Historical Context
- [Archive Directory](archive/) - Detailed implementation reports
- [Mixed Mode Summary](archive/mixed-mode-summary.md) - Quick overview
- [Bug Fixes](archive/) - All bug reports and fixes

---

## 📝 Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-04-28 | Initial SSD baseline established | Foundation |
| 2026-04-28 | Scenario-Centric refactor documented | Major architecture change |
| 2026-04-29 | Legacy API removal completed | Code simplification (~500 lines) |
| 2026-04-29 | Mixed Mode implementation completed | Feature complete |
| 2026-05-04 | Bug fixes applied | Production stability |
| 2026-05-04 | Documentation consolidated | This README created |

---

## 🤝 Contributing

When making changes:
1. **Always update specs first**, then code
2. Keep `requirements.md`, `design.md`, and `tasks.md` in sync
3. Reference REQ-XXX and TASK-XXXX in commits
4. Update traceability matrices if adding new requirements
5. Add changelog entries to spec documents
6. Archive detailed implementation reports in `archive/`

---

## 📧 Questions?

For questions about:
- **Requirements**: Check [`requirements.md`](requirements.md) Open Questions section
- **Architecture**: Review [`design.md`](design.md)
- **Tasks**: See [`tasks.md`](tasks.md) Notes section
- **Implementation details**: Check [`archive/`](archive/) for detailed reports

---

**Documentation Status**: ✅ **Complete and Up-to-date** (2026-05-04)

All core specifications are synchronized with the codebase. The system is production-ready with all three launch modes fully functional.
