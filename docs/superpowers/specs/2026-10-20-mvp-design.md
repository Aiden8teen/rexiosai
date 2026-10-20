# RexiosAI core MVP — proposed design

Status: Proposed for review. Planning only; no implementation is authorized by this document itself.

## Purpose and constraints

Build the team's four requested capabilities in `rexiosai`: problem posting/management, browsing/filtering, application/review, and discussion/tracking. Deliver a working course-demo application that can later run on one VPS. Preserve time for a visible AI feature after the core flow works.

- Work only in `rexiosai`; the other repository is reference material.
- Preserve the existing colors, fonts, spacing conventions, mascots, Arabic/English switching, RTL behavior, cards, buttons, and existing page layouts.
- Add only missing screens and necessary functional controls using the existing theme. Do not rebuild the frontend or require Figma access.
- Keep the React application at the repository root and add the NestJS application in `server/`.
- Keep verification focused on working behavior, data ownership, and workflow transitions. No extensive test suite or coverage target.
- Do not run Playwright or browser verification without explicit user instructions.
- Skip Graphify entirely.
- Do not install dependencies or download Docker images during planning. If later setup would require over 1 GB of additional downloads, stop and report before that download.

## Architecture choice

Recommended: NestJS REST API, PostgreSQL, Prisma, existing React/Vite frontend. This follows the user's preferred stack and gives a clear place for future AI tools to call ordinary application services.

Alternatives considered: a small Express API would reduce scaffolding but discard the requested Nest organization; a managed backend could reduce auth work but introduces an external service and account setup. Neither is necessary for the proposed single-server deployment.

Use Node.js 24, PostgreSQL 17, the NestJS Express adapter, Prisma's compatible PostgreSQL driver adapter, Nest validation DTOs, and npm lockfiles. Resolve and pin compatible Nest/Prisma versions when scaffolding; do not mix setup instructions from different majors.

Use `express-session` with a PostgreSQL session store and HTTP-only cookies. Hash passwords with `bcryptjs`; do not store auth credentials/tokens in localStorage. Use native `fetch` and small feature API modules on the frontend; no new state framework is needed. Swagger documents the API for team integration.

During development Vite proxies `/api` to Nest on port 3000. In the packaged deployment Nginx serves the built React application and proxies `/api` to Nest. Browser requests remain same-origin. PostgreSQL and API ports remain private in VPS Compose configuration. Configure secure cookies and trusted proxy behavior for the actual HTTPS deployment.

Docker CLI is installed locally, but the Docker daemon was unavailable during planning. No images were downloaded.

## Product rules and assumptions

These are proposed defaults, not claims that the team already approved them:

1. One company login represents one company; organization memberships and invitations are deferred.
2. Account roles are `TALENT` and `COMPANY`. A visitor is an unauthenticated request. Existing member/solver labels reflect profile completeness, not separate privileged accounts.
3. Any visitor can browse public open/closed problems and public discussion. Only authenticated accounts can comment.
4. A talent account must complete the existing solver profile to submit an application. Skill overlap is an explanatory indicator, not a hard hiring rule or an AI score.
5. One talent account has one application per problem, enforced in the database. An application begins as a draft and can be submitted once. Submitted applications are immutable in this MVP.
6. One applicant is selected per problem. Acceptance is a manual company decision, not automatic matching.
7. Application states are `DRAFT`, `UNDER_REVIEW`, `ACCEPTED`, and `REJECTED`. Drafts are visible only to their author; other states are visible only to the applicant and the owning company.
8. Problem states are `DRAFT`, `OPEN`, and `CLOSED`. Accepting an applicant closes the problem and rejects remaining applications under review with a system explanation. Manual closure also rejects pending applications with a closure explanation. Decisions are final in this MVP.
9. Deadline expiry prevents new submissions; owners can still review previously submitted applications while a problem remains open. No scheduler is needed to enforce expiry.
10. The company can edit drafts freely. Once applications are submitted, the brief, budget and deadline are fixed; contact/private details can still be maintained. No hard deletion or reopening workflow.
11. Company self-signup is allowed for the demo. This is not company verification. Remove misleading verification claims where necessary without restyling the page.

## Required pages

Existing pages are retained: `/`, `/signin`, `/signup`, `/profile/solver`, `/welcome`, `/problems`, `/problems/:id`, `/problems/:id/submit`, and existing community/About routes.

Missing pages to add:

| Route | Responsibility |
| --- | --- |
| `/company/problems/new` | Create a draft or publish a problem |
| `/company/problems/:id/edit` | Edit owned problem subject to the rules above |
| `/company/problems` | My Problems: statuses, submitted application counts, edit/review/close actions |
| `/company/problems/:id/applications` | Review applicant profile, cover message, links and attachments; accept/reject with optional reason |
| `/my-applications` | Talent dashboard: drafts, submitted applications, decisions and rejection reasons |

Use the current application form as the application/cover-message form. Keep its summary, delivery estimate, proof-of-work URL, consent, attachment, and Save draft controls. An application is a proposal to do the work; accepting it does not prove the industrial problem is solved or a reward was paid.

Add company/talent selection to signup, dashboard entries to the existing account menu, and contextual posting/review actions. Replace the unrestricted role switch with genuine account-derived behavior. Google/recovery controls must explain their unavailability rather than simulate success.

## Problem form and browsing

Fields: title, summary, category (`BUG`, `ISSUE`, `CHALLENGE`), detailed description, skills, difficulty, budget in whole DZD, deadline, deliverables, constraints, evaluation criteria, optional public attachments, optional private notes/attachments, and an opt-in business contact email/URL.

Publish requirements: title 10–160 trimmed characters; summary 10–500; description 30–20,000; 1–10 supported skill tags; positive integer DZD budget within PostgreSQL integer range; a valid future timestamp for the deadline. Drafts may be incomplete. Plain text is escaped; external links accept only HTTP(S), and the business email is validated separately.

Feed sorting uses real `createdAt` descending with an ID tiebreaker. Support `q`, `skill`, `difficulty`, `category`, `minReward`, `maxReward`, `sort`, `page`, and `limit`. Defaults: newest, page 1, limit 20; maximum limit 50. Newest/reward/deadline sorts retain deterministic tie order. OR within a filter group, AND across groups. Search title/summary/description in both saved languages with case-insensitive substring queries; no search engine.

Keep current Arabic/English seed content. New content is entered in one chosen content language; render the available text as fallback in the other interface language. The MVP does not require entering every problem twice or silently machine-translate it. Store timestamps and numbers, and derive relative dates, DZD labels, counts and completeness instead of storing display strings as facts.

## Data model

| Model | Main fields and constraints |
| --- | --- |
| User | id, unique normalized email, passwordHash, role, displayName, createdAt |
| TalentProfile | unique userId, existing education/experience/skills fields, GitHub/LinkedIn URL, optional cvFileId |
| CompanyProfile | unique userId, Arabic/English name, opt-in business contact fields |
| Problem | id, companyUserId, bilingual content, category, difficulty, skills array, budgetDzd, deadlineAt, status, nullable unique acceptedApplicationId, createdAt/updatedAt |
| ProblemPrivateDetails | unique problemId, privateNotes; queried only by authorized operations |
| Application | id, problemId, applicantUserId, coverMessage, deliveryDays, projectUrl, consent, status, optional rejectionReason/decisionCode, submittedAt/decidedAt; unique(problemId, applicantUserId) |
| ProblemComment | id, problemId, authorUserId, body, optional same-problem parentId, createdAt |
| StoredFile | id, uploaderUserId, storageKey, originalName, mimeType, byteSize, purpose, owning profile/problem/application link |
| Session store table | library-managed persisted session IDs, user IDs and expiry; included in migrations |

Public DTOs are explicit allowlists. They never include private notes, password hashes, session data, applicant messages, rejection reasons, CVs, or other applicants' identities. Separate private details prevent accidentally spreading a full problem record into a public response.

## Privacy and files

Sensitive-data protection in this MVP means explicit public/private inputs and server-enforced access. It does not mean automated redaction, NDA enforcement, or a guarantee that a user cannot type confidential information into public text.

- Public description/discussion/explicitly public problem attachments: everyone.
- Private problem notes/files: owning company and the accepted applicant only.
- Draft applications: applicant only.
- Submitted applications, submitted applicant profile evidence/CV and application files: applicant and owning company only.
- Company business contact: shown to authenticated users only if the company explicitly opts in. Never derive this from the account login email.
- Other companies/talent accounts cannot read private records by guessing IDs. Recheck ownership for every request and return 404 for unauthorized private resources.

Store files outside public/static directories using generated keys and a persistent uploads volume. Accept only PDF/DOCX files up to 5 MiB and reject empty/mismatched payloads after content validation. Serve downloads through a controller that checks the linked resource; use attachment disposition and no-sniff headers. A private upload is never made public solely because its file ID is attached to a different request. File upload/linking must validate ownership and purpose.

Use DTO validation, server-side role/ownership checks, session regeneration on login, session destruction on logout, HTTP-only SameSite=Lax cookies, exact allowed Origin checks on unsafe browser requests, and basic login rate limiting. Secrets live only in server environment variables. These basics support a hosted demo; larger security/compliance programs are outside scope.

## API contract

All routes use `/api`. Session cookies apply to protected requests. Errors have `{ code, message, fieldErrors? }`; lists have `{ items, total, page, limit }`. Business conflicts return 409, field errors 400, unauthenticated requests 401, role violations 403, missing/private resources 404.

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- `GET /profiles/me`, `PATCH /profiles/me` (role-specific fields).
- `GET /problems`, `GET /problems/:id` (public DTOs; owner can retrieve own draft through company routes).
- `GET /problems/:id/contact` (authenticated; returns only explicitly opted-in business contact).
- `GET /problems/:id/private` (owner or selected applicant).
- `POST /problems`, `PATCH /problems/:id`, `POST /problems/:id/publish`, `POST /problems/:id/close` (owner operations).
- `PUT /problems/:id/application/draft`, `POST /problems/:id/applications` (submit), `GET /me/applications` (including drafts, paginated).
- `GET /company/problems`, `GET /company/problems/:id/applications` (paginated owner data), `GET /company/problems/:id` (editable owner representation).
- `POST /applications/:id/decision` with `{ decision: 'ACCEPTED' | 'REJECTED', reason?: string }`.
- `GET /problems/:id/comments`, `POST /problems/:id/comments` with `{ body, parentId? }`.
- `POST /files` (one file and a validated purpose/parent context), `GET /files/:id`.
- `GET /health` verifies API/database readiness; Swagger at `/api/docs` in local/demo configuration.

Acceptance and concurrent submissions must serialize against the same problem row. Within a database transaction, lock the problem, recheck open status/deadline when submitting, and lock/check application state. Accept at most one applicant, close the problem and reject remaining submitted applications atomically. A uniqueness constraint prevents duplicate applicant/problem rows even with double-clicks.

Before attaching a file to a new problem/application, save its draft to obtain the parent ID. CV upload can use the authenticated user's own profile context. Reject attempts to use another account's file or a file with the wrong purpose. Public comments/contact endpoints must also respect draft problem visibility.

## Seed strategy

Extract fixtures from `src/data/mockData.ts` into server-owned seed data without importing browser/React modules. Seed all four existing problems, company names, budgets, Arabic/English requirements and public discussion/replies, named technical profiles, and the skills taxonomy. Add deterministic company/talent demo accounts and a few clearly synthetic applications covering draft, under-review, accepted and rejected states. An accepted seed application must have a closed parent problem.

Preserve existing problem IDs such as `p1` for current URLs. Compute future deadlines and recent creation dates from a seed anchor on first insertion. Use stable unique keys and insert-if-missing/upsert-without-overwrite behavior: rerunning the seed neither duplicates records nor overwrites user edits, decisions, passwords, or existing deadlines. No visitor account. No fake CV/proposal file metadata unless actual sample files are included.

Application counts must reflect actual seeded applications, not the current hardcoded 7/3/11/5 counts. Add enough records to demonstrate review states; manufacturing 26 proposals just to preserve counters is unnecessary. Fixture identities and sample company data are not evidence of real adoption.

The standalone community forum is outside the requested MVP. Preserve its existing screens/behavior and export its current fixture content alongside the seed fixtures, but do not add forum tables/APIs in the first core implementation. Only discussion attached to problems is persisted. Clearly distinguish the standalone forum preview from persisted core functionality.

## Docker and development

First use Compose for `db` only and run React/Nest locally for fast iteration. Add packaged `web`, `api`, and `db` services after the first vertical workflow works. Use named volumes for PostgreSQL and uploads, a database healthcheck, and explicit migration and demo-seed commands. Startup must wait for database readiness, not only container creation. Seeding is opt-in and never a destructive startup step.

Nginx must provide SPA fallback, `/api` proxying, and an upload body limit above the API's 5 MiB file cap. Compose should support a host VPS reverse proxy without claiming a domain/TLS setup is already known. Do not add Redis, queues, Kubernetes, a monorepo build system, or object storage for this demo.

## Verification and completion

Use a small API integration suite against a separate test database plus build/lint checks. Verify registration/login/logout, profile completion, company posting, public filtering, draft save, submission, owner review, rejection reason, single-winner acceptance, comment isolation and file/private-field permissions. Test duplicate/concurrent submissions and concurrent acceptance. Verify seed reruns and restart persistence. Use HTTP smoke scripts for the two-role scenario. No browser automation without explicit user instruction.

The MVP is complete when company A can post, talent B can apply, company A can decide, both dashboards show the persisted decision after refresh/restart, and unrelated accounts cannot read private content. Docker package and documented seed/setup commands must reproduce this with sample accounts.

## Deferred work and AI seam

Defer payments/escrow, direct chat, email notifications, Google login, password recovery, CV parsing, GitHub API integration, organization invitations, moderation, ratings, automated company verification, and full standalone forum persistence.

After the core flow works, add an AI module that calls the same authorized problem/profile/application services. A future challenge assistant can clarify a brief and propose relevant talent, with human approval before publication/decisions. Do not scaffold an agent framework, queue, vector database, or fake AI endpoint now. Reserve an explicit AI milestone before final demo preparation.

## Documentation consulted

- NestJS sessions: https://docs.nestjs.com/techniques/session
- Prisma NestJS REST guide: https://github.com/prisma/web/blob/main/apps/blog/content/blog/nestjs-prisma-rest-api-7D056s1BmOL0/index.mdx
- Docker Compose startup readiness: https://docs.docker.com/compose/how-tos/startup-order/
