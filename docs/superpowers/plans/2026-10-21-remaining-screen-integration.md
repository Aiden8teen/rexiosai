# Remaining Screen Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if explicitly selected. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish data-backed presentation/onboarding and remove runtime mock data after the community and notification stages.

**Architecture:** Reuse current account state and canonical metadata; expose one aggregate-only public statistics endpoint. Keep static presentation content in React and remove obsolete local forum storage/imports.

**Tech Stack:** Existing React/Vite, NestJS, Prisma 7.10.1, PostgreSQL 18; existing build/lint/HTTP verification tools.

**Spec:** `docs/superpowers/specs/2026-10-21-remaining-screens-design.md`, Stage C.

## Execution order

1. [Community plan](2026-10-21-community-integration.md): persistence, reactions/acceptance, shared feed/detail/create screens and metadata.
2. [Notification plan](2026-10-21-notifications-integration.md): transactional events and the existing bell dropdown.
3. Tasks below: real About metrics, account-aware Welcome/landing links, mock cleanup and packaged verification.

Google sign-in/recovery stay deferred by explicit user confirmation. No additional payment, admin, public-profile or AI screens are included. Stage 1 is the largest and can be demonstrated independently; stages 2 and 3 have separate working checkpoints.

## Global Constraints

- Work only in `rexiosai`; preserve the existing design, Arabic/English behavior and RTL layout.
- Reuse React/Vite, NestJS, Prisma 7.10.1, PostgreSQL 18 and the existing cookie sessions.
- Keep Google/recovery and design-preview controls visible no-ops; never simulate successful authentication.
- Add no infrastructure services, paid dependencies, queues, WebSockets or CMS.
- Preserve existing marketplace records, uploaded files, decisions and short demo credentials (`123`).
- Use focused HTTP checks and the existing builds/lint; no extensive test suite or coverage target.
- Do not install browser tooling or run browser verification without explicit authorization; skip Graphify.
- Make regular local commits during execution; do not push or deploy externally.

## Review Focus

1. Draft/expired budgets and unselected closures must not inflate public statistics; pin in Task 1.
2. Empty API results mean zero, network failures mean unknown; never show fabricated fallback metrics; verify Tasks 1 and 2.
3. Welcome/direct links must respect guest/company/incomplete/complete talent identity; verify Task 2.
4. Old localStorage forum data must not override server data or leak between accounts; verify Task 2.
5. Rebuild/restart/seed must preserve new community/read state and old private marketplace records; pin in Task 2.

## Task 1: Public statistics with accurate meanings

**Files:** Create `server/src/public/public.controller.ts`, `server/src/public/public.service.ts`, `server/test/public-stats.test.ts`; modify `server/src/main.ts`, `src/api/contracts.ts`, `src/pages/AboutPage.tsx`; create `src/api/public.ts`, `src/hooks/usePublicStats.ts`.

**Interfaces:** `PublicService.stats() -> {companiesWithPublishedProblems:number,talentAccounts:number,openBudgetDzd:number,problemsWithSelectedApplicant:number}`; `getPublicStats()` returns that same type from GET `/api/public/stats`; the hook exposes data/loading/error/retry without substituting fake values.

- [ ] Add failing HTTP checks using before/after deltas on the existing separate test database: draft-only company does not count; publishing its first problem adds one company; publishing its second does not add another; future OPEN budgets add their exact DZD amount; past deadlines/drafts/closures add none; manual closure with no winner does not add a selection; acceptance adds one. No record-level/private fields appear. For the empty-dataset case, create a uniquely named `rexios_stats_<uuid>_test` database through the existing test PostgreSQL role, migrate it, start the API with that URL, and assert four zeros. Close its app/pools then drop only that exact test-owned database in finally; never reset existing databases.
- [ ] Implement the public controller/service with database aggregates in a consistent read transaction, numeric zero for an empty sum, and no per-account details. Reuse current status/deadline/acceptedApplicationId semantics.
- [ ] Replace the four hardcoded About figures with the exact Stage C aggregates and bilingual labels. Keep existing cards/grid/styles; use localized number formatting. Loading/error shows a dash and retry, actual zero displays zero. Remove claims that selected proposals have already been delivered or paid.
- [ ] Run API build, integration checks, frontend build and lint. Commit `feat: replace mock platform figures with real aggregates`.

**Deliverable:** About-page statistics reflect actual database state with truthful labels and failure handling.

## Task 2: Account-aware static screens, mock removal and final verification

**Files:** Modify `src/pages/WelcomePage.tsx`, `src/pages/LandingPage.tsx`, `src/pages/AboutPage.tsx`, `src/App.tsx`, `src/context/AppContext.tsx`, `src/pages/ProblemDetailPage.tsx`, `src/pages/SolverProfilePage.tsx` where copy requires correction; create `src/data/guest.ts`; remove `src/data/mockData.ts` only after import audit; update `README.md`, `docs/MVP.md`, `docs/IMPLEMENTATION.md` and relevant smoke scripts.

**Interfaces:** `GUEST_USER: User` replaces only `INITIAL_USERS.visitor`; it is a UI guest placeholder and grants no backend role. Welcome consumes currentRole/currentUser/authLoading; no new onboarding endpoint. Metadata remains the Stage A `getMetadata()` contract.

- [ ] Wrap `/welcome` in RequireAuth. Preserve its visual structure while selecting copy/cards/CTAs from actual account/profile state: company -> post/manage challenges; incomplete talent -> complete profile/browse; complete talent -> browse/My Applications. Use a neutral personalized welcome rather than unconditional account-created success. Keep guests on the existing sign-in redirect path.
- [ ] Make Landing CTAs respect signed-in roles while keeping guest signup/browse paths and the decorative illustration. Correct only unsupported bilingual claims of payouts/contracts/IP transfer/expert certification in affected existing pages; preserve theme, spacing and page composition. Do not implement legal/payment systems to justify promotional copy.
- [ ] Replace the visitor mock import with GUEST_USER. Check every runtime import and remove mockData.ts after the community/profile metadata migration is complete. Confirm `rg -n 'mockData|INITIAL_QUESTIONS|INITIAL_PROBLEMS|rexios_questions' src` has no matches. Keep server fixture JSON and `rexios_lang` language preference; never upload or restore browser-local forum content automatically.
- [ ] Update documentation with the complete screen matrix, new endpoints, seed meanings and deferred controls. Extend smoke scripts to verify a created question/answer/reaction/notification read survives API restart and a seed rerun without losing old problem decisions/files. Use test-owned synthetic records and separate test data, never reset shared application data.
- [ ] Run `npm run api:build`, `npm run api:test:integration`, `npm run build`, `npm run lint`, `npm run smoke:mvp` and `npm run smoke:community`. Reuse cached images for packaged `docker compose -f compose.yml -f compose.demo.yml build api web`; start DB with `up -d --wait db`, apply explicit migrations/seed, then start API/web. Stop before any newly required download exceeding the user's 1 GB limit. Use `.env` or the existing local `--env-file` setup; do not overwrite local secrets.
- [ ] Smoke the packaged app with SMOKE_BASE_URL set to its local URL; restart its own API/database containers and confirm retained data/read state. Do not touch unrelated Docker projects or volumes. If browser verification is explicitly authorized, check two independent users plus guest/company/talent Welcome destinations and all changed pages at narrow widths in both languages. Record any checks that were not run.
- [ ] Review the diff against the three-stage scope, resolve important issues, commit `feat: finish account-aware screens and remove runtime mocks`, and leave a clean local branch. Report the remaining deliberate no-ops. Run `codex-notify` exactly once only after the overall implementation task finishes, not after individual stages.

**Deliverable:** Every in-scope application screen uses persisted data or real account state; remaining static illustration/content and explicit deferred controls are documented.
