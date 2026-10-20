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
- Community frontend: in progress (Luna/max).
- Notifications API/events and public statistics: complete; recipient-scoped reads, transactional events, read persistence and empty/filtered statistics verified.
- Notification/presentation frontend: in progress (Luna/max).
- Integrated HTTP/build/lint/packaged verification and final review: pending.

## Evidence

- API build passed. Community/marketplace HTTP smoke workflows passed on localhost:3000.
- Community tests (5 subchecks plus parent), original marketplace suite and preserving seed test passed. The first notification test run found invalid space-containing fixture email addresses; corrected test data, then all notification/statistics cases passed (3 checks including a fresh isolated zero-stat database).
- Independent Luna/max backend review found no material privacy/correctness issues. Existing pg8 concurrent-query deprecation is non-failing; no dependency upgrades added.
- Fixtures seeded into development without resetting problem decisions, deadlines or sessions. Community display totals now come from actual rows.
