# Community Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if explicitly selected. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing feed, question detail and question creation screens shared, persistent features.

**Architecture:** Extend the current NestJS REST API and Prisma database; replace local forum operations with native-fetch functions and focused React hooks. Keep the existing component theme and routes.

**Tech Stack:** Existing React/TypeScript/Vite, NestJS, Prisma 7.10.1, PostgreSQL 18, cookie sessions, Node HTTP integration checks.

**Spec:** `docs/superpowers/specs/2026-10-21-remaining-screens-design.md`, especially Stage A. Execute this plan before notifications and presentation cleanup.

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

1. An unknown question must return/display 404, not another question; pin in Tasks 1 and 3.
2. Simultaneous reaction requests must produce one ballot per account/type; pin in Task 2.
3. Single-language Arabic/English posts and literal code must survive reload; pin in Tasks 1 and 3.
4. Seed reruns must preserve text, acceptance and removed reactions; pin in Tasks 1 and 2.
5. Fast filters/account switches and failed follow-up refreshes must not show another account's state or resubmit committed content; pin in Task 3.

## Task 1: Persistent questions, answers and metadata

**Files:** Modify `server/prisma/schema.prisma`, `server/prisma/seed.ts`, `server/src/main.ts`, `server/src/profiles/profiles.controller.ts`, `server/src/problems/problem.dto.ts`; create a migration under `server/prisma/migrations/`, `server/src/common/skills.ts`, `server/src/meta/meta.controller.ts`, `server/src/community/community.dto.ts`, `community.controller.ts`, `community.service.ts`, `community-presenter.ts` in that community directory; create `server/test/community.test.ts`.

**Interfaces:**
- `CommunityService.list(query, viewerUserId?) -> Page<CommunityQuestionSummary>`; `detail(id, viewerUserId?) -> CommunityQuestionDetail`; `answers(id, query, viewerUserId?) -> Page<CommunityAnswer>`.
- `CommunityService.create(user, input) -> CommunityQuestionDetail`; `addAnswer(user, questionId, input) -> CommunityAnswer`.
- `MetaController GET /meta -> {skills:string[]}`. Exact DTO/response fields and limits are defined in Stage A of the spec; export frontend contract types in Task 3.

- [ ] Inspect current changes/instructions and record this stage as in progress in `docs/IMPLEMENTATION.md`. Use the existing checkout/dependencies unless isolation is actually needed.
- [ ] Write focused HTTP checks against the existing separate `*_test` database: guest writes 401; company/talent writes 201; injected author/role/count rejected 400; invalid/duplicate tags and title shorter than 15 rejected 400; list excludes an answer body; unknown detail/answers 404; Arabic-only and English-only content appear in both language presentations; literal `<script>`/code is returned as text. Run `npm run api:build` then `npm run api:test:integration`; new routes should fail while the old suite remains green.
- [ ] Add the question/answer models and accepted-answer relation from the spec, preserving all existing tables. Index feed ordering and per-question answers. Move SKILLS into the common module and update current imports; expose `/meta`. Generate/apply a new migration to the test database, never reset the application database.
- [ ] Implement public exact-ID reads, page/limit validation and deterministic ordering; latest and unanswered use the specified semantics. Explicitly select public author fields instead of reusing a private account response. Add text-only mutation DTOs, trim validation and transactionally updated lastActivityAt on answers. Preserve existing Origin/session enforcement.
- [ ] Extend the seed using `fixtures/demo.json`, `profiles` author mapping, stable question IDs and prefixed answer IDs. Insert missing records separately, preserve existing text/timestamps/acceptance, and set the initial accepted fixture answer only for a new question. Add a repeatability assertion that edits text and clears selection before reseeding, then confirms both remain changed.
- [ ] Run API build and integration checks; apply the migration/seed to development only after test success. Confirm `GET /api/meta`, `/api/community/questions` and direct `q1` detail return actual data without modifying existing p1–p4. Commit `feat: persist community questions and answers`.

**Deliverable:** Public forum reads and authenticated question/answer creation work through HTTP with stable fixtures.

## Task 2: Reactions, accepted answers, views and sidebar

**Files:** Modify the community schema/DTO/controller/service/presenter and seed from Task 1, plus the session type declaration in `server/src/common/http.ts`; create a second migration if needed; extend `server/test/community.test.ts`.

**Interfaces:**
- `setQuestionReaction(user,id,kind,enabled)` and `setAnswerReaction(user,id,kind,enabled)` return `{helpfulCount,insightCount,viewerReactions}`.
- `selectAnswer(user,questionId,answerId|null) -> CommunityQuestionDetail`.
- `recordView(questionId,viewerKey) -> {views:number}`; controller derives viewerKey using session identity/visitor ID.
- `overview() -> {contributors:Array<{author,answerCount,acceptedAnswerCount}>,popularTags:Array<{tag,questionCount}>}`.

- [ ] Add failing cases: two concurrent identical PUT reactions yield one row/count; repeated DELETE stays zero; each account/type is independent; self-reaction 400; forged actor 400; outsider acceptance 403; answer from another question 404; simultaneous owner selections leave one selected answer; repeated selection is idempotent; repeated view with one session increments once while another session increments again.
- [ ] Add the two reaction models, view model, enum, unique constraints and indexes specified in Stage A. Extend SessionData with `communityVisitorId?: string` for server-generated visitor keys. Use idempotent upsert/delete semantics, server-derived actors and a question-row lock for acceptance. Keep view changes out of GET requests and active sorting.
- [ ] Implement actual aggregates and viewer-specific flags. Pin active ordering with an older question receiving a new answer; pin unanswered to exclude every answered question. Use public-only author projections. Sidebar ranking/ties must follow the spec and return empty arrays on an empty dataset.
- [ ] Initialize a few genuine seed ballot rows only on first insertion of their targets; never reproduce arbitrary mock totals or recreate an explicitly removed fixture ballot. Extend the repeatability check to remove a ballot and confirm it stays removed after seed rerun.
- [ ] Run API build/integration checks, including existing marketplace concurrency/privacy cases. Commit `feat: add persistent community engagement and sidebar data`.

**Deliverable:** Every existing forum counter and badge can be derived from server state, with bounded per-account interactions.

## Task 3: Connect the existing community screens

**Files:** Create `src/api/community.ts`, `src/api/meta.ts`, `src/hooks/useCommunity.ts`, `src/hooks/useMetadata.ts`; modify `src/api/contracts.ts`, `src/api/mappers.ts`, `src/types/index.ts`, `src/context/AppContext.tsx`, `src/pages/CommunityFeedPage.tsx`, `QuestionDetailPage.tsx`, `AskQuestionPage.tsx`, `SolverProfilePage.tsx`, `ProblemsListPage.tsx` in that pages directory, `src/components/ReactionButton.tsx`, `src/components/ProblemForm.tsx`, `src/App.tsx`; create `scripts/smoke-community.mjs` and add its root package script; update `docs/MVP.md` and the ledger.

**Interfaces:** Export the spec's `CommunityQuestionSummary`, `CommunityQuestionDetail`, `CommunityAnswer`, `CommunityOverview` types. `src/api/community.ts` exports `listQuestions(filters)`, `getQuestion(id)`, `listAnswers(id,page)`, `createQuestion(input)`, `createAnswer(id,input)`, `setQuestionReaction(id,kind,enabled)`, `setAnswerReaction(id,kind,enabled)`, `selectAcceptedAnswer(id,answerId|null)`, `recordQuestionView(id)`, `getCommunityOverview()`. `getMetadata() -> {skills:string[]}`. Hooks expose loading/error/data/retry plus awaited mutations; ignore obsolete identity/filter requests.

- [ ] Add a small HTTP smoke script using separate company/talent/visitor clients: create question, read it from another client, answer, react/unreact, select answer as owner, and fetch overview. Keep created content labelled synthetic. Add `smoke:community` and run it against the API; this does not need a new browser/test dependency.
- [ ] Wire feed search/tag/sort/page to the API, retain query values in URL parameters, use server total, and replace hardcoded contributors/popular tags. Add load-more with existing button styles. Keep a failed request visibly failed instead of loading old local fixtures.
- [ ] Load question detail/answers by exact route ID; remove `questions[0]` fallback. Paginate answers, POST a view once per loaded question/session, render accepted state, and expose owner-only select/clear buttons. Preserve literal code rendering and current bilingual/RTL structure.
- [ ] Protect AskQuestion via RequireAuth, await creation before navigation, and make answers/reactions await persistence. Preserve typed forms on failure; use successful response data immediately even if a later refresh fails. Extend ReactionButton with active/pending semantics. Key question forms to currentUser.id and answer forms to question ID plus currentUser.id so identity/route changes also clear another user's unsent text, not just fetched state.
- [ ] Remove forum questions/actions/localStorage persistence from AppContext. Keep marketplace/auth/language behavior. Load canonical `/meta` skill options for the existing profile/problem/community controls; show retry if metadata is unavailable rather than inventing defaults. Frontend mockData may still supply only the visitor constant until Stage C.
- [ ] Run `npm run api:build`, `npm run api:test:integration`, `npm run build`, `npm run lint` and `npm run smoke:community`. If browser verification is explicitly authorized, use Playwright MCP for two independent sessions, direct q1/missing links, refresh/back filters, network failure, account switching, mobile and Arabic. Otherwise document that browser checks are outstanding rather than claim they ran.
- [ ] Update docs to remove the statement that community is local-only. Commit `feat: connect community screens to the API`.

**Deliverable:** All three existing community screens work with shared persisted data; no frontend-local forum writes remain.
