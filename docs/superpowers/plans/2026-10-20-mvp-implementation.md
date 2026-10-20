# RexiosAI Core MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user chooses delegated execution. Steps use checkbox (`- [ ]`) syntax for tracking. This is a proposed plan for review, not an instruction to start implementing now.

**Goal:** Turn the existing RexiosAI frontend into a persistent company/talent marketplace covering the team's four MVP capabilities while preserving its visual design.

**Architecture:** Keep React/Vite at the root and add one NestJS REST application in `server/`. PostgreSQL stores accounts, sessions, problems, applications and problem discussions; private files live in a persistent local volume. Vite/Nginx proxy `/api` so cookie authentication stays same-origin.

**Tech Stack:** Node.js 24, existing React/TypeScript/Tailwind, NestJS Express adapter, Prisma/PostgreSQL 17, express-session/PostgreSQL session store, bcryptjs, native fetch, Docker Compose/Nginx.

**Spec:** `docs/superpowers/specs/2026-10-20-mvp-design.md` (proposed design; read product rules and privacy definitions before execution).

## Global Constraints

- Work only in `rexiosai`; the other repository is reference material.
- Preserve the existing colors, fonts, spacing conventions, mascots, Arabic/English switching, RTL behavior, cards, buttons, and existing page layouts.
- Add only missing screens and necessary functional controls using the existing theme. Do not rebuild the frontend or require Figma access.
- Keep the React application at the repository root and add the NestJS application in `server/`.
- Keep verification focused on working behavior, data ownership, and workflow transitions. No extensive test suite or coverage target.
- Do not run Playwright or browser verification without explicit user instructions.
- Skip Graphify entirely.
- Do not install dependencies or download Docker images during planning. If later setup would require over 1 GB of additional downloads, stop and report before that download.

## Review Focus

1. Private record IDs must not reveal other companies' notes, applicant messages, CVs, contacts or files; verify task 2/4/5 HTTP cases.
2. Concurrent submissions/acceptances must not duplicate applications or select two winners; verify task 4 integration cases.
3. New single-language content, Arabic text and real timestamps must render through the current bilingual layout; verify task 3 mapping checks and user-led visual inspection.
4. Restarting services or rerunning the seed must preserve edits, sessions, files and decisions; verify task 1/6 integration checks.
5. Failed requests and switching accounts must not leave stale private data, falsely report success or resubmit a finished decision; verify task 2/4 API-client checks and the HTTP smoke flow.

## Proposed file boundaries

```text
server/
  package.json, package-lock.json, nest-cli.json, tsconfig*.json
  prisma.config.ts
  prisma/schema.prisma, migrations/, seed.ts, fixtures/
  src/main.ts, app.module.ts
  src/database/prisma.module.ts, prisma.service.ts
  src/auth/auth.module.ts, auth.controller.ts, auth.service.ts
  src/auth/session.guard.ts, roles.guard.ts, current-user.decorator.ts
  src/auth/dto/register.dto.ts, login.dto.ts
  src/profiles/profiles.module.ts, profiles.controller.ts, profiles.service.ts, dto/
  src/problems/problems.module.ts, problems.controller.ts, problems.service.ts, dto/
  src/problems/problem-presenter.ts
  src/applications/applications.module.ts, applications.controller.ts, applications.service.ts, dto/
  src/comments/comments.module.ts, comments.controller.ts, comments.service.ts, dto/
  src/files/files.module.ts, files.controller.ts, files.service.ts, dto/
  src/health/health.controller.ts
  test/core.e2e-spec.ts, test/helpers.ts, jest-e2e.json
src/
  api/client.ts, contracts.ts, auth.ts, profiles.ts, problems.ts, applications.ts
  api/comments.ts, files.ts, mappers.ts
  context/AuthContext.tsx, ProblemsContext.tsx
  context/AppContext.tsx                 # retain language/modal/community responsibilities
  components/RequireAuth.tsx
  components/ProblemForm.tsx
  components/ApplicationStatus.tsx
  pages/CompanyProblemFormPage.tsx
  pages/CompanyProblemsPage.tsx
  pages/CompanyApplicationsPage.tsx
  pages/MyApplicationsPage.tsx
Dockerfile, server/Dockerfile, compose.yml, compose.demo.yml
deploy/nginx.conf, .dockerignore, .env.example, server/.env.example
scripts/smoke-mvp.mjs
docs/MVP.md
```

Keep DTOs in their feature's `dto/` directory and add only those needed by actual endpoints. Do not add generic repository/service base classes, CQRS layers or a separate shared-package build system. Small explicit frontend contract types are sufficient.

## Task 1: Persisted API foundation and reproducible fixtures

**Files:** Create `server/` scaffold/config, database module, Prisma schema/migrations/seed/fixtures, health controller, `compose.yml`, `server/.env.example`, `server/test/helpers.ts`, `server/test/core.e2e-spec.ts`; modify root `package.json` and `.gitignore`.

**Interfaces:** `PrismaService` owns one API database client; `GET /api/health -> { status: 'ok' }` only when the DB query succeeds. Root scripts expose `api:dev`, `api:build`, `db:up`, `db:migrate`, and `db:seed` by delegating to server scripts/Compose.

- [ ] Check repository instructions/current changes, installed Docker status and dependency download requirements before setup. Do not start the unrelated IDE-open project.
- [ ] Scaffold a NestJS Express app in `server/`, retaining the existing root npm project and `src/`. Pin compatible dependencies and use the documented Prisma config/driver adapter for that version.
- [ ] Add the schema from the spec, including app-state enums, uniqueness constraints, private-details table, foreign keys, timestamps and session-store SQL migration. Set up a separate test database and refuse test reset against the application database.
- [ ] Add the first meaningful integration check: migrations succeed; seed inserts `p1`–`p4`; applying the seed again leaves a modified title/application decision unchanged; public counts equal real submitted rows.
- [ ] Extract the four bilingual problem fixtures, users, taxonomy and public comments/replies into `server/prisma/fixtures/`. Preserve URL IDs; export standalone community fixture content without adding forum APIs. Add deterministic demo accounts and application status examples; do not seed fake files or a visitor.
- [ ] Seed in dependency order with stable keys and insert-if-missing behavior. Anchor dates on first insertion. Hash demo passwords; expose demo credentials only in the demo setup documentation, not normal signup defaults.
- [ ] Add a Postgres healthcheck and named database volume. Keep only the database container necessary for local development at this point. Add `/api/health`, global DTO validation, the `/api` prefix, Swagger and uniform error responses.
- [ ] Verify `npm --prefix server run build`, the seed integration check and `/api/health`. Re-run seed and inspect counts/unchanged edits. Record the migration and seed commands in `docs/MVP.md`.

**Deliverable:** A working database-backed API foundation with repeatable demo content, independently of the browser.

## Task 2: Real accounts and existing profile screens

**Files:** Create `server/src/auth/*`, `server/src/profiles/*`, `src/api/client.ts`, `contracts.ts`, `auth.ts`, `profiles.ts`, `src/context/AuthContext.tsx`, `src/components/RequireAuth.tsx`; modify `src/context/AppContext.tsx`, `src/types/index.ts`, signup/signin/profile pages, `Navbar.tsx`, `App.tsx`, `vite.config.ts`, and API integration tests.

**Interfaces:** `AuthService.register(input: RegisterDto): Promise<CurrentUser>`; `login(input: LoginDto): Promise<CurrentUser>`; session stores only user identity. `CurrentUser` has id, role (`TALENT|COMPANY`), displayName, and role-specific profile/completeness. Frontend `apiRequest<T>(path: string, init?: RequestInit): Promise<T>` uses `/api`, credentials and uniform error handling. `useAuth()` exposes user, loading, login, register, logout and profile refresh.

- [ ] Add focused failing HTTP cases: duplicate email rejected; wrong password rejected; session survives a new request; logout invalidates it; talent cannot become company by sending profile fields; another account cannot read a private CV/contact via public DTOs.
- [ ] Implement registration/login/logout/me, normalized emails, bcryptjs hashes, PostgreSQL session persistence, session regeneration/destruction, HTTP-only cookies and configured expiry. Apply allowed-Origin checks to unsafe requests and login throttling. Never return password hashes.
- [ ] Add own-profile read/update endpoints. Talent completeness follows the current seven profile groups, with a real CV or professional URL as evidence. Company profile records company name and explicitly opt-in business contact.
- [ ] Route existing forms to the API. Add a small account-type control to signup using existing input styles. Remove prefilled mock identity/file claims for new users. Make Google/recovery controls report unavailability.
- [ ] Add Vite `/api` proxy; keep language preference local. Derive visitor/member/solver presentation from session/profile data. Remove unrestricted role switching, add dashboard menu destinations and clear previous-account state/caches on logout or account change.
- [ ] Re-run the focused API checks and both builds. Verify the client does not claim login/profile success before the request succeeds and can display a 401/network failure without stale private data.

**Deliverable:** Two real account types using the existing screens, with stable identity and persisted profile/session data.

## Task 3: Company posting and public browsing

**Files:** Create problems feature/DTOs/presenter, `src/api/problems.ts`, `mappers.ts`, `src/context/ProblemsContext.tsx`, `src/components/ProblemForm.tsx`, `src/pages/CompanyProblemFormPage.tsx`, `CompanyProblemsPage.tsx`; modify current list/detail pages, `App.tsx`, navigation and integration tests.

**Interfaces:** `ProblemsService.list(query: ListProblemsDto): Promise<Page<ProblemPublicDto>>`; `create(ownerId, input)`; `update(ownerId, id, input)`; `publish(ownerId, id)`; `getPrivate(viewerId, id)`; `listOwned(ownerId, query)`. `toProblemView(dto, lang)` derives existing display fields without leaking private fields. All names and state rules match the spec.

- [ ] Add failing HTTP cases for draft visibility, unauthorized editing, missing/invalid publish fields, private-note omission, combined filters, deterministic chronology, and content-language fallback. Use the spec's validation bounds.
- [ ] Implement create/save-draft/edit/publish/read/list-owned operations, categories, whole-DZD budget, future deadline validation, normalized skills and explicit public/private DTOs. Return 404 for other companies' owned resources.
- [ ] Implement case-insensitive bilingual keyword filtering, skill/difficulty/category/reward filters, supported sort order and bounded pagination. Read public counts from actual applications/comments.
- [ ] Add the company form and My Problems page by reusing existing form/card styles. Add no new visual system, charts or sidebar design. Reuse one form for creation/editing.
- [ ] Connect current list/detail to API data and real loading/empty/error states within their existing layouts. Map Arabic/English content, dates, budget and status to current presentation. Unknown IDs show a real not-found state.
- [ ] Keep single-language user content readable in either interface language. Verify fresh content and errors never fall back to stale localStorage problem records.
- [ ] Run the task's API checks and builds. Verify company A can create/publish and an unauthenticated HTTP client can browse that public record without seeing private notes or hidden contacts.

**Deliverable:** A company can publish a problem that another user can browse, filter and open.

## Task 4: Applications, company decisions and both dashboards

**Files:** Create applications feature/DTOs, `src/api/applications.ts`, `src/components/ApplicationStatus.tsx`, `src/pages/MyApplicationsPage.tsx`, `CompanyApplicationsPage.tsx`; modify current application/detail pages, My Problems page, API contracts/context and integration tests.

**Interfaces:** `ApplicationsService.saveDraft(applicantId, problemId, input)`; `submit(applicantId, problemId, input)`; `listMine(applicantId, query)`; `listForCompany(ownerId, problemId, query)`; `decide(ownerId, applicationId, input)`; `ProblemsService.close(ownerId, problemId)`. Draft DTO fields: coverMessage, deliveryDays, projectUrl, consent; submitted coverMessage has at least 10 words, deliveryDays integer 1–365, consent true, HTTP(S) projectUrl optional. Reasons max 2,000 characters.

- [ ] Add failing HTTP cases: another applicant cannot read an application/draft; another company cannot review it; duplicate concurrent submits create one application; expired/closed problems reject new submissions; rejected reason is visible only to applicant/owner.
- [ ] Add a concurrent acceptance check with two distinct applications: exactly one ACCEPTED response succeeds, one receives 409; one application is accepted, the problem is closed, and all other under-review applications are rejected. Include a simultaneous submission/closure case.
- [ ] Implement server-side state transitions under one per-problem transaction lock, then uniqueness/error mapping. Recheck owner/applicant role and state inside the transaction. Draft saving must not overwrite already submitted applications.
- [ ] Connect the existing application form to true Save draft and Submit operations. Keep its layout/consent/summary/proof URL/delivery controls. Use the current per-account application state, not any user's submission. Skill overlap remains advisory.
- [ ] Add My Applications with drafts/resume links, pending/accepted/rejected states and private rejection reasons. Add owner review cards with applicant evidence and accept/reject controls; clearly explain that acceptance closes the problem/rejects other pending applicants.
- [ ] Show real status on the existing problem sidebar and My Problems. Disable duplicate submissions/actions while requests run; update state only on success and reconcile a 409 by refetching. Submitted review state must survive reload.
- [ ] Run the focused transaction/ownership tests, then the HTTP sequence company publish → talent submit → company review → talent sees decision. Verify both app builds.

**Deliverable:** The main company/talent workflow works end to end and both dashboards reflect the same database state.

## Task 5: Public discussion, contacts and private attachments

**Files:** Create comments/files features and DTOs, `src/api/comments.ts`, `files.ts`; modify current problem discussion, profile/application file controls, company form/review page and integration tests.

**Interfaces:** `CommentsService.list(problemId)`; `create(authorId, problemId, {body,parentId?})`; `FilesService.upload(userId, context, file)`; `authorizeDownload(viewerId|null, fileId)`; private problem access uses `ProblemsService.getPrivate`. `GET /api/problems/:id/contact` requires authentication and returns only the company's opted-in business contact. Upload purposes are `CV`, `APPLICATION`, `PROBLEM_PUBLIC`, `PROBLEM_PRIVATE` with validated parent ownership.

- [ ] Add failing HTTP checks: comment on problem A cannot use problem B's reply parent; blank/over-5,000-character comments rejected; 0-byte/over-5-MiB/mismatched PDF-DOCX uploads rejected; another applicant/company cannot download private files; unrelated file IDs cannot be attached to an application/problem.
- [ ] Persist public comments and same-problem replies with real authors/timestamps. Prevent comments/contact retrieval from exposing unpublished drafts. Keep the current discussion UI and visitor auth prompt. Do not add chat or notifications.
- [ ] Persist real files outside web assets with generated keys. Verify extension/content and size; store ownership/context metadata, and enforce purpose/access when linking and downloading. Use attachment disposition, safe filenames and no-sniff.
- [ ] Replace preset filename clicks with native file pickers while retaining upload-card styling. Save a problem/application draft before uploading its first attachment, then use that parent context. Support the currently visible optional proposal/CV attachment fields and clearly separate public/private company uploads. A file succeeds only after actual storage.
- [ ] Show only opt-in business contacts to authenticated users. Return private notes/files to the owner or accepted applicant; never rely on hiding a public API field with CSS.
- [ ] Verify the comments/file cases and one real download round trip. Test accepted applicant access versus rejected/unrelated applicant access. Re-run both builds.

**Deliverable:** Companies/talent can communicate on problems, share intended contact information, and exchange appropriately restricted files.

## Task 6: Package the demo, document it and verify restart behavior

**Files:** Create root/server Dockerfiles, `.dockerignore`, `compose.demo.yml`, `deploy/nginx.conf`, `.env.example`, `scripts/smoke-mvp.mjs`; update root/server scripts, `.gitignore`, `README.md`, `docs/MVP.md`.

**Interfaces:** `npm run build`, `npm run lint`, `npm run api:build`, `npm run api:test:integration`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run smoke:mvp`. The smoke script uses separate cookie jars and an explicit test/demo database; it must not reset a VPS application's data. Deployment migration and seed are explicit separate commands.

- [ ] Add multi-stage builds for the API and static web app. Compose demo services are `web`, `api`, `db`; reuse named database/uploads volumes and a DB readiness healthcheck. Do not silently seed/reset on container restart.
- [ ] Configure Nginx SPA fallback, `/api` proxy, body-size limit and environment-based upstream settings. Publish only the web service for deployment; document local ports versus container hostnames.
- [ ] Document environment variables, Node version, Docker prerequisites, demo accounts, migrations, opt-in seed, normal startup, logs and VPS reverse-proxy/HTTPS requirements. Correct the current README's Node prerequisites and mock capability claims.
- [ ] Add a compact HTTP smoke script covering company publish, another talent's draft/submit, public discussion, review, applicant decision visibility and unrelated-user denial. Keep automated checks small and scenario-driven.
- [ ] Run `npm run build`, `npm run lint`, `npm run api:build`, `npm run api:test:integration`, `docker compose -f compose.yml -f compose.demo.yml config`, and the smoke script against the packaged demo.
- [ ] Restart API/database containers and verify the existing session, application decision and uploaded-file download still work. Rerun seed and verify edits/decisions/deadlines remain unchanged. Do not remove named volumes as part of this verification.
- [ ] Report actual verification results and any limitations. Ask the user to inspect the existing and newly added screens manually; browser automation remains excluded unless explicitly requested.

**Deliverable:** A reproducible demo with documented setup, truthful sample data and verified persistence.

## Delivery order and scope protection

Tasks 1–2 establish accounts/data; task 3 adds publishing/browsing; task 4 completes the important vertical workflow; task 5 completes communication/privacy; task 6 packages it. Do not spend the first day containerizing every service before the application works.

Suggested week allocation, subject to actual progress: core flow in the first 3–4 days; one AI feature after that; deployment/rehearsal/video and buffer in the remaining time. This is a planning target, not an estimate that one person can implement the full list in a few hours. Team members can own new themed pages, fixture cleanup and demo preparation while backend interfaces stabilize.

Do not add the standalone community backend, payments, direct messaging, notifications, OAuth, multi-member organizations, CI matrices or full production infrastructure to the core milestone. The future AI feature should call these same services and preserve their permissions, with human approval for publish/accept actions.

## Execution handoff

This document is a proposed plan; no product code, migrations, containers or dependency changes have been made. Review the defaults about one company login, one accepted applicant, closure/rejection behavior, sensitive-data visibility and standalone forum scope before implementation. Inline execution is the simplest default for this tightly connected MVP. If delegated implementation is explicitly selected later, follow the user's subagent model/effort preference and the applicable Superpowers workflow.
