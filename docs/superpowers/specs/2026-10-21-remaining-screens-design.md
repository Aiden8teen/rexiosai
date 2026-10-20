# Remaining frontend integration design

## Intent and boundaries

Make the remaining application screens share real server data while preserving the existing RexiosAI design. This extends the completed core marketplace; it does not rebuild it. Success means two independent browsers see the same community content and counts, the existing notification bell reflects actual events, and onboarding/statistics reflect the real account/database state.

The user explicitly confirmed on 2026-10-21 that Google sign-in and password recovery remain deferred. Previous instructions also keep design-preview role switches and error-simulation controls as no-ops. This is a proposed implementation design; this planning task changes documentation only.

## Global constraints

- Work only in `rexiosai`; preserve the existing design, Arabic/English behavior and RTL layout.
- Reuse React/Vite, NestJS, Prisma 7.10.1, PostgreSQL 18 and the existing cookie sessions.
- Keep Google/recovery and design-preview controls visible no-ops; never simulate successful authentication.
- Add no infrastructure services, paid dependencies, queues, WebSockets or CMS.
- Preserve existing marketplace records, uploaded files, decisions and short demo credentials (`123`).
- Use focused HTTP checks and the existing builds/lint; no extensive test suite or coverage target.
- Do not install browser tooling or run browser verification without explicit authorization; skip Graphify.
- Make regular local commits during execution; do not push or deploy externally.

## Current screen inventory

| Screen/control | Current source | Intended result |
| --- | --- | --- |
| `/community` | Fixtures plus localStorage; local filters and inflated reactions | Paginated API feed, real search/sort, persisted reactions, real sidebar aggregates |
| `/community/:id` | Finds a question in the local list; silently falls back to its first item | Load the exact ID, show 404 when missing, paginate real answers, owner-selected accepted answer |
| `/community/ask` | Local insertion, including a directly accessible guest route | Session-protected question creation, awaited request and inline errors |
| Notification bell | Permanent red dot and no action | Existing bell opens a small themed dropdown with unread state and links |
| `/about` statistic cards | Hardcoded 45/1,200/3.8M/85 figures | Four actual database aggregates and accurate labels |
| `/welcome` | Always says an account was created and assumes an incomplete talent | Session-protected, account-aware content and working destinations |
| Landing/About explanatory content | Static presentation and illustration | Remain static; fix role-inappropriate links and claims of unimplemented functionality |
| Signup/login/profile/marketplace dashboards | Already use the API | Preserve; share the canonical skill options and add notification event hooks |
| Google/recovery/role previews/error simulations | Deferred controls | Remain visible no-ops |

## Approach

Recommended: extend the existing REST application in three independently verifiable stages: community, notifications, presentation/cleanup. Reuse native fetch and the established validation/session/error handling. This adds a few tables and endpoints without another service.

Alternatives considered: keeping the forum local is cheaper but fails cross-user persistence; a realtime chat/forum service introduces subscriptions, infrastructure and dependencies without improving the required demo enough. Neither is selected.

Each stage has its own implementation plan: [community](../plans/2026-10-21-community-integration.md), [notifications](../plans/2026-10-21-notifications-integration.md), then [presentation and cleanup](../plans/2026-10-21-remaining-screen-integration.md). Community supplies events consumed by notifications; presentation cleanup runs last so removing mockData cannot break an intermediate stage.

## Stage A: community

### Storage and identity

- `CommunityQuestion`: UUID (fixture IDs `q1`–`q3` retained), authorUserId, title/titleEn, body/bodyEn, optional codeSnippet, tags, createdAt, lastActivityAt and nullable unique acceptedAnswerId. The accepted-answer relation must refer to an answer on this question, checked inside a question-row transaction lock.
- `CommunityAnswer`: UUID (fixture IDs prefixed with question ID), questionId, authorUserId, body/bodyEn, createdAt. Index `(questionId, createdAt, id)`.
- Separate `CommunityQuestionReaction` and `CommunityAnswerReaction` tables: targetId, userId, kind (`HELPFUL` or `INSIGHT`), createdAt; unique `(targetId, userId, kind)`. Separate foreign keys avoid unvalidated polymorphic targets.
- `CommunityQuestionView`: questionId, viewerKey, createdAt; unique `(questionId, viewerKey)`. Derive the key on the server from the signed-in user ID or a random visitor ID stored in the existing session. The client cannot supply it. Counts are approximate distinct viewers, not audited analytics.
- Count answers/reactions/views from actual rows; never trust client-supplied author names, totals, roles or verification flags. Public author data is only `{id,name,nameEn,avatarChar,role}`, where role is `member`, `solver` or `company` derived from the existing profile rules. Never expose login email, CV or contact fields.
- Move the existing `SKILLS` list to `server/src/common/skills.ts`, imported by profile/problem/community validation. Preserve exact values/casing. Tag inputs must contain 1–5 distinct members of this list.

### Contracts (all paths below are under `/api`)

Use existing `Page<T> = {items,total,page,limit}`; default limit 20, maximum 50. Stable tie-breaking by ID. Public reads attach viewer reactions using the optional session and use `Cache-Control: private, no-store` for those personalized responses.

| Endpoint | Access and behavior |
| --- | --- |
| `GET /meta` | Public; `{skills: string[]}` from canonical server configuration |
| `GET /community/questions?q=&tag=&sort=latest|active|unanswered&page=&limit=` | Public summaries; q max 200, searches both titles/bodies plus tags; tag exact canonical match; latest=createdAt desc; active=lastActivityAt desc; unanswered=zero answers only, latest first |
| `GET /community/questions/:id` | Public exact question detail; unknown ID 404; no write side effects |
| `GET /community/questions/:id/answers?page=&limit=` | Public answers, createdAt asc then ID; unknown question 404 |
| `POST /community/questions` | Any authenticated account; `{language:'ar'|'en',title,body,tags,codeSnippet?}`; trimmed title 15–160 chars, body 1–20,000, code max 20,000; returns detail, status 201 |
| `POST /community/questions/:id/answers` | Any authenticated account; `{language,body}`, trimmed body 1–20,000; insert and update question lastActivityAt in one transaction; return answer, status 201 |
| `PUT/DELETE /community/questions/:id/reactions/:kind` | Authenticated; kind `helpful|insight`; idempotently set/unset this account's reaction; return `{helpfulCount,insightCount,viewerReactions}` |
| `PUT/DELETE /community/answers/:id/reactions/:kind` | Same semantics for answers; unknown targets 404 |
| `PUT /community/questions/:id/accepted-answer` | Question owner only; `{answerId:string|null}`; same-question validation, at most one accepted answer, selecting the current answer is idempotent; return updated detail |
| `POST /community/questions/:id/view` | Public unsafe request with existing Origin check; initialize visitor session if needed; insert-if-missing viewer row; return `{views}` without changing lastActivityAt |
| `GET /community/overview` | Public; `{contributors: [{author,answerCount,acceptedAnswerCount}], popularTags:[{tag,questionCount}]}`; top 3 contributors by answerCount desc, acceptedAnswerCount desc, ID; top 6 tags by questionCount desc then tag; empty arrays on empty database |

DTOs reject unrecognized fields. Title/body are stored in the selected language column; presenters fall back to the populated language, without claiming translation. Summaries return `id,title,titleEn,excerpt,excerptEn,tags,author,createdAt,lastActivityAt,views,answerCount,helpfulCount,insightCount,viewerReactions`. Excerpt is derived from the body, capped at 150 characters plus an ellipsis. Detail adds `body,bodyEn,codeSnippet,acceptedAnswerId`. Answers return `id,questionId,author,body,bodyEn,createdAt,helpfulCount,insightCount,viewerReactions,isAccepted`.

The existing green answer badge becomes “Accepted / إجابة مقبولة”, meaning selected by the question author. Add a small owner-only select/clear control using existing button styles. Do not imply independent expert certification. Self-reactions are rejected with 400; each user may independently hold one of each reaction type. Most Active tracks new discussion activity, not view/reaction spam.

### Frontend behavior

Add focused community hooks/API functions rather than growing AppContext. Feed data, question detail and answer pages load independently; direct links do not depend on the feed being loaded. Keep filters in the URL so refresh/back preserve them. Debounce search 250ms. Cancel or ignore stale responses when filters, route ID or identity change.

Await mutations before redirecting/clearing input. Preserve typed content on failure. Apply a successful response immediately; a failed follow-up refresh cannot convert committed work into a displayed submission failure. Reaction clicks set or remove desired state, with a pending guard and `aria-pressed`. On sign-out/account change clear personalized reactions, drafts in memory and notifications. Do not fall back to fixtures when the API fails.

Protect `/community/ask` using existing `RequireAuth` without an account-type restriction. Add loading/error/retry/empty/404 states within existing card styles. Extend ReactionButton with optional `active` and `pending` props. Render body/code as text; do not introduce HTML execution.

### Seed preservation

Extend existing `server/prisma/seed.ts` using the question/answer data already in `fixtures/demo.json` and the existing author-ID map. Insert each missing fixture row separately, not only when its parent is new. Anchor dates on first insertion. Seed the existing verified fixture answer as the initially accepted answer only when creating its question; retain later author changes.

Seed a small deterministic set of real reaction rows from existing fixture accounts, excluding self-reactions. Ignore obsolete aggregate numbers in the old mockup; derive all displayed counts from stored rows. Reruns must not restore a removed seeded reaction: only initialize seed ballots on first insertion of their target. Targets created before the reaction stage are left unchanged, so zero initial counts are valid. Do not import arbitrary browser-local posts automatically. Preserve fixture credentials `c@demo.test`, `s@demo.test`, `m@demo.test` / `123`.

## Stage B: notifications

Persist `Notification(id,recipientUserId,type,eventKey,problemId?,questionId?,answerId?,createdAt,readAt?)`; unique `(recipientUserId,eventKey)` and index `(recipientUserId,readAt,createdAt,id)`. Use domain event types `COMMUNITY_ANSWER`, `ANSWER_ACCEPTED`, `APPLICATION_RECEIVED`, `APPLICATION_DECIDED`, `PROBLEM_COMMENT`. References point to existing entities; links are generated by the server from these references, never accepted from clients.

| Trigger | Recipients and destination |
| --- | --- |
| New community answer | Question author, `/community/:id` |
| Answer first selected | Answer author, `/community/:id`; reselecting the same answer does not produce another notification |
| Application submitted | Owning company, `/company/problems/:id/applications`; never for draft saves |
| Acceptance/rejection including automatic rejection and manual problem closure | Each affected applicant, `/my-applications` |
| New root problem comment | Owning company, `/problems/:id` |
| Reply to a problem comment | Parent-comment author, `/problems/:id` |

Suppress self-notifications. Event keys use the triggering row ID and event type; accepted-answer keys include question/answer IDs. Write notifications in the same database transaction as the triggering change so a failed event does not leave a misleading notification. Suppress duplicate event/recipient pairs. No notifications for reactions, ordinary browsing, old records or seed reruns.

`GET /notifications?page=1&limit=20` returns `Page<NotificationView> & {unreadCount:number}`. `NotificationView` is `{id,type,title,titleEn,href,createdAt,readAt}` with short server-generated bilingual event text and permitted destinations. Do not include cover letters, rejection reasons, private notes, email addresses or files in notification payloads. `PATCH /notifications/:id/read` is idempotent and recipient-scoped; another account receives 404. All notification endpoints require a session and use `Cache-Control: private, no-store`.

The existing bell opens a themed, keyboard-accessible dropdown with loading/error/empty states, 10 entries initially and load-more. Show the red dot only when unreadCount > 0. Clicking a row marks it read and follows its destination; a failed read update does not falsely clear its unread state. Refresh first page on login/focus, after known successful mutations, and every 30 seconds only while the document is visible. Ignore stale responses from another identity and stop polling on logout. No push/email/realtime infrastructure.

## Stage C: presentation and mock removal

`GET /public/stats` is public and returns `{companiesWithPublishedProblems,talentAccounts,openBudgetDzd,problemsWithSelectedApplicant}`. Count companies with at least one non-draft problem; count TALENT users; sum budgets of OPEN problems whose deadline is in the future; count problems with acceptedApplicationId set. Empty database returns zeros. No private records or individual amounts are returned.

Use the four existing About cards with labels “Companies posting challenges”, “Talent accounts”, “Open challenge budgets (DZD)”, “Applicants selected”, plus Arabic equivalents. Selection is not delivery/completion or payment. Loading/error shows a dash, never fake fallback totals. Seeded data remains clearly described as synthetic in setup documentation.

Protect `/welcome` with RequireAuth. Use current account role/profile state: incomplete talent gets a completion CTA; complete talent gets browse/applications CTAs; company gets post/manage-problems CTAs. Avoid “Account created!” when opened by an established account; use a neutral personalized welcome. Landing navigation also respects the signed-in role. The decorative example conversation remains an illustration, not a claimed stored conversation or AI response.

Use `GET /meta` options throughout community/profile/problem skill controls. Move the guest presentation constant to `src/data/guest.ts`; guest identity is local UI state, not a fake database account. Remove frontend `mockData.ts` after every runtime import is replaced; keep server fixture JSON for the seed. Remove forum localStorage reading/writing; leave old browser data untouched and unused. Language preference may remain localStorage.

Make small bilingual copy corrections wherever the existing UI claims actual payouts, contracts, independent verification or IP transfers. Preserve design/layout; describe budgets, profile completeness, selection and protected access that exist. Do not build payments, legal workflows, public profile pages, moderation, editing/deleting posts, full-text search infrastructure or AI in this pass.

## Completion evidence and order

1. Community API and existing screens work across independent sessions, including reload/direct links, actual counts, 404s and owner-only acceptance.
2. Notification counts/read state persist, are recipient-scoped, and match successful community/marketplace events without duplicates.
3. Metadata/statistics and onboarding use real account/data state; no runtime imports of mockData or browser-local forum persistence remain.
4. Existing marketplace focused checks plus new narrowly scoped HTTP checks pass; both builds/lint pass. Rebuild and smoke the packaged app using existing Docker images only when executing this work.

Browser verification, if explicitly authorized at execution time, uses Playwright MCP with independent sessions, never the built-in browser viewer. No tests, downloads or application changes are performed by this planning task.
