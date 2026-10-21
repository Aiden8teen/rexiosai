# Notifications Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if explicitly selected. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing notification bell to real community and marketplace activity.

**Architecture:** Store recipient-scoped events in PostgreSQL within the existing mutation transactions. Display them in a small dropdown anchored to the current bell, refreshed through ordinary HTTP polling.

**Tech Stack:** Existing NestJS/Prisma/PostgreSQL, React/native fetch, existing cookie authentication; no realtime service.

**Spec:** `docs/superpowers/specs/2026-10-21-remaining-screens-design.md`, Stage B. Depends on the completed `2026-10-21-community-integration.md` interfaces.

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

1. Account A must never read/mark Account B's notification; pin in Task 1.
2. Failed, repeated or competing decisions must not create phantom/duplicate events; pin in Task 1.
3. Acceptance/closure must notify every automatically rejected pending applicant, excluding drafts; pin in Task 1.
4. Notification payloads must not reveal private messages/reasons/files; pin in Task 1.
5. Polling/account-switch races must clear another account's feed and stop hidden-tab traffic; verify Task 2.

## Task 1: Persist events in domain transactions

**Files:** Modify `server/prisma/schema.prisma`, add a migration, `server/src/main.ts`, `server/src/community/community.service.ts`, `server/src/applications/applications.service.ts`, `server/src/problems/problems.service.ts`, `server/src/comments/comments.controller.ts`; create `server/src/notifications/notifications.dto.ts`, `notifications.controller.ts`, `notifications.service.ts`; create `server/test/notifications.test.ts`.

**Interfaces:** `NotificationsService.record(tx: Prisma.TransactionClient, events: NotificationEventInput[]) -> Promise<void>` writes recipient/type/eventKey/domain references, filters self-recipients and deduplicates. `list(recipientId,query) -> Page<NotificationView> & {unreadCount:number}` and `markRead(recipientId,id) -> NotificationView`. NotificationEventInput contains actorUserId, recipientUserId, type, eventKey and optional problemId/questionId/answerId. Exact view fields/routes/event rules are defined in Stage B.

- [ ] Write failing HTTP assertions for guest access 401, recipient-only list, other recipient's read 404, repeat read leaves readAt unchanged, count decreases exactly once, and list ordering/page validation. Trigger a real answer/application event rather than inserting arbitrary user-supplied notification data.
- [ ] Add the notification model/enums/indexes and migration. Implement guarded GET `/notifications` and PATCH `/notifications/:id/read`, selecting by recipient as part of the query. Generate bilingual titles and fixed application-relative hrefs on the server. Return no private payload fields.
- [ ] Inject the notification service through the existing AppModule providers. Hook answer creation and acceptance inside their current transactions. Dedupe by event type + source row ID; acceptance includes question/answer pair. Do not notify the actor, on removal of acceptance, or on reselecting an already-notified answer.
- [ ] Hook application submission (never draft), manual decisions, acceptance's automatic rejections and `ProblemsService.close` automatic rejections inside their problem-row-locked transactions. Capture affected UNDER_REVIEW applicant IDs before updateMany so each receives one event and drafts receive none.
- [ ] Wrap problem-comment creation and its notification in one transaction. Root comments notify the owning company; replies notify the parent author. Retain same-problem/top-level parent validation and suppress self-events.
- [ ] Add event checks: duplicate submit/decision attempts do not duplicate notifications; failed acceptance creates none; concurrent acceptance still produces one winner plus correct loser notifications; manual closure covers pending applicants; self-answer/comment creates no self-event; seed rerun creates none; notification JSON lacks coverMessage, rejectionReason, private notes, email and file metadata. Check session/API restart retains unread/read state.
- [ ] Run API build and integration suite. Commit `feat: persist recipient-scoped activity notifications`.

**Deliverable:** Community and marketplace events produce durable, private notification lists through HTTP.

## Task 2: Activate the bell without redesigning the navbar

**Files:** Create `src/api/notifications.ts`, `src/hooks/useNotifications.ts`, `src/components/NotificationsDropdown.tsx`; modify `src/api/contracts.ts`, `src/components/Navbar.tsx`; extend `scripts/smoke-community.mjs`, `scripts/smoke-mvp.mjs`; update `docs/MVP.md` and `docs/IMPLEMENTATION.md`.

**Interfaces:** `listNotifications({page,limit}) -> Page<NotificationView> & {unreadCount:number}`; `markNotificationRead(id) -> NotificationView`; `useNotifications(userId)` provides items, unreadCount, loading, error, refresh, loadMore and markRead, keyed to the authenticated identity.

- [ ] Extend the existing smoke scripts to assert the expected recipient receives its event, another account cannot mark it read, and its unread count persists then decreases after a successful read.
- [ ] Preserve the current bell/icon and anchor a themed dropdown with 10 entries initially, relative times, unread styling, load-more, loading/empty/error/retry. Only show its red dot for positive unreadCount. Include keyboard focus, Escape/outside close, aria-expanded and RTL positioning.
- [ ] Refresh on identity login/focus, opening the dropdown and a visible-only 30-second timer. Reuse a single hook instance in Navbar; do not add intervals per row. Refresh after known same-tab domain mutations by emitting an internal `rexios:notifications-refresh` browser event after a committed mutation, dispatched from the community hook and existing marketplace/comment mutation wrappers. Clear/ignore obsolete identity results and cancel polling on logout or hidden tabs.
- [ ] Clicking an item requests markRead and follows its server-provided permitted destination. Keep read state unchanged on update failure and allow the destination to load; do not advertise a successful read. Never accept arbitrary external hrefs from client submissions.
- [ ] Run both builds, lint, integration checks and the two smoke scripts. If browser checks are authorized, verify company/talent bells in separate sessions, unread removal after read/reload, keyboard/mobile/RTL behavior and no requests while hidden/logged out. Otherwise explicitly record the unrun visual checks.
- [ ] Update docs and commit `feat: connect the notification bell to persisted activity`.

**Deliverable:** The existing notification bell reflects real persisted recipient-specific activity and navigates to working screens.
