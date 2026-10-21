# Remaining frontend integration ledger

Plans: `docs/superpowers/plans/2026-10-21-community-integration.md`, `2026-10-21-notifications-integration.md`, `2026-10-21-remaining-screen-integration.md`.

User authorized implementation on 2026-10-21. Preserve the design, short demo credentials and existing records; Google/recovery/design previews stay no-ops. No push/external deployment. Root alone stages/commits. Run final notification once after overall completion.

## Pre-flight and rulings

- Existing feature branch `feat/core-mvp` and installed dependencies are reused; no duplicate worktree/download needed. Existing PostgreSQL dev and packaged projects are healthy; unrelated Docker projects stay untouched.
- Ruling: execute root-owned community API inline, with Luna/max agents on non-overlapping community UI, other UI and event/statistics API files. This preserves the user's model preference and shortens elapsed time. Cost: final integrated review and verification are required.
- Shared interfaces: community API normalized DTOs and `/meta` feed UI hooks; notification record(tx, events) is called from community/marketplace mutations; public stats has four spec-defined numeric fields. Verified plan/spec agree.
- Ruling: new frontend feature types live beside their API functions instead of enlarging contracts.ts; existing contract exports remain untouched. Cost: feature imports use those files.
- Ruling: schema changes for the two related backend stages are generated together to avoid overlapping Prisma generation/migration work. Their HTTP checks and commits remain separately reviewable.
- Migration inspection removed Prisma's proposed `DROP TABLE session` (the session table belongs to an earlier custom SQL migration). Only additive community/notification tables and constraints are applied; existing sessions are preserved.
- Initial community HTTP cases failed on missing endpoints while all 10 original checks passed. Luna tasks were briefly interrupted by usage exhaustion, then resumed when the user reported reset.

## Progress

- Community persistence/API/seed: complete; metadata, paginated reads/mutations, idempotent reactions/views, locked acceptance and preserving seed verified.
- Community frontend: complete (Luna/max); shared feed/detail/create, exact IDs, URL filters, acceptance/reactions, canonical metadata and no runtime mock imports.
- Notifications API/events and public statistics: complete; recipient-scoped reads, transactional events, read persistence and empty/filtered statistics verified.
- Notification/presentation frontend: complete (Luna/max); real bell, aggregates, role-aware onboarding and deferred no-op previews.
- Integrated HTTP/build/lint/packaged verification and final review: complete.

## Evidence

- API build passed. Community/marketplace HTTP smoke workflows passed on localhost:3000.
- Community tests (5 subchecks plus parent), original marketplace suite and preserving seed test passed. The first notification test run found invalid space-containing fixture email addresses; corrected test data, then all notification/statistics cases passed (3 checks including a fresh isolated zero-stat database).
- Independent Luna/max backend review found no material privacy/correctness issues. Existing pg8 concurrent-query deprecation is non-failing; no dependency upgrades added.
- Fixtures seeded into development without resetting problem decisions, deadlines or sessions. Community display totals now come from actual rows.
- Final full integration run: 19 checks passed, zero failures. Frontend build and lint passed; lint reports two intentional effect-synchronization warnings and the existing Fast Refresh export warning. Vite reports a non-failing 500 kB bundle-size advisory (about 142 kB compressed).
- Frontend review fixes: bound URL pagination and fetch one requested page; merge answer pages by ID/date; invalidate stale notification snapshots after read; keep preview error checkboxes no-ops; apply committed problem comments immediately with best-effort refresh.
- Playwright MCP: two independent company/talent sessions created a question, posted an answer, selected it and received/read notifications; direct About aggregates and company-aware Welcome checked. Large page input generated one bounded request. Simulated post-comment refresh failure left the committed comment visible, cleared the input and showed no false error. Narrow Arabic dropdown overflow reproduced and fixed; panel now fits within 375 px.
- Packaged API and web images rebuilt using cached dependencies; both community and marketplace smoke workflows passed at localhost:8080. API/database restart and subsequent seed rerun preserved the same session identity, question, selected answer, reaction and notification read state.
- Rebuilt packaged frontend manually verified through Playwright MCP: shared community cards, exact missing-question 404, protected guest Welcome redirect, short company login, account-aware Welcome and real About statistic labels. Scoped second review confirmed all five earlier findings resolved.
- Ruling: leave the completed work on the existing feat/core-mvp branch, with local commits only. The user's existing authorization requires no merge/push approval flow. No new application dependencies, infrastructure services or browser downloads were needed.
- Remaining deliberate exclusions: Google OAuth, password recovery, preview controls, AI/agents, payments, public profile/moderation/edit/delete workflows. Static illustrations and explanatory content remain static.
