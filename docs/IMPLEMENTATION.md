# Core MVP implementation ledger

Plan: `docs/superpowers/plans/2026-10-20-mvp-implementation.md`

The 2026-10-21 follow-up integrates the standalone community, notification bell and presentation screens. Its final status and verification are recorded in `docs/REMAINING-IMPLEMENTATION.md`; the earlier local-only community limitation below is superseded by that work.

User authorized continuous implementation and regular local commits on 2026-10-20. Do not push or deploy externally. Preserve the UI; deferred features (including Google OAuth) remain visible and are no-ops. Playwright MCP is authorized for later browser checks; do not use the built-in browser viewer.

## Decisions

- Ruling: implement on `feat/core-mvp` in the existing checkout rather than create another worktree. This preserves the user's active preview paths and avoids duplicating installed packages. Cost: the current checkout displays the feature branch until switched back.
- Ruling: reuse cached PostgreSQL 18 rather than download 17. The schema uses ordinary PostgreSQL features and the major is pinned in Compose. Cost: deployment also requires PostgreSQL 18.
- Ruling: pin Prisma 7.10.1 rather than adopt the currently advertised Prisma 8 release candidate. Cost: a later major upgrade is separate work.
- Ruling: latest user instructions override the plan's unavailable-feature feedback: OAuth/recovery/deferred controls remain enabled-looking no-ops; no real success is simulated.
- Pre-flight: auth produces one account identity consumed by profiles/problems/applications/files; frontend legacy role labels are mapped from account type and profile completeness.
- Pre-flight: applications and closure share a problem-row lock; all submitted counts exclude drafts. Public DTOs never include private fields.

## Progress

- Task 1: complete — migrations and seed applied; seed preservation integration test passed; API TypeScript build passed.
- Task 2: complete — persistent auth/profile integration and short fixture logins.
- Task 3: complete — company drafts/publication, public browsing and filters.
- Task 4: complete — draft/submitted applications, review decisions and both dashboards.
- Task 5: complete — persisted discussions, contact opt-in and permission-checked private files.
- Task 6: complete — packaged runtime, browser verification, focused checks and setup documentation.

- Task 2 backend: complete — registration/login/logout and own-profile validation passed real HTTP checks.
- Task 3 backend: complete — publishing, private drafts, bilingual fallback and filtering passed.
- Task 4 backend: complete — duplicate submissions and concurrent winner decisions passed; 7 integration checks green.
- Ruling: independent frontend and deployment file tasks delegated to GPT-6 Luna/max while root owns the API; commits are serialized by root after one shared-index overlap. Cost: final cross-layer verification is required.
- Ruling: use cached Caddy instead of Nginx for identical SPA/API proxy duties. Cost: deployment configuration is a Caddyfile.

- Task 5 backend: complete — real PDF uploads/downloads, private access, fake/empty/oversized rejection checked. API restart preserves session/decisions. Focused suite: 9 checks passed.
- Verification storage: server dependencies occupy about 380 MiB; cached base images reused. API image adds only OpenSSL/CA packages (~9 MiB installed) needed by Prisma CLI.

- Final review: Luna/max reviewed the full implementation. Important findings repaired and verified: private-only edits after submissions, identity-scoped frontend caches, evidence validation, committed-mutation refresh handling, nested title fallback and relative timestamps.
- Ruling: user requested demo password 123 and short emails; seed intentionally refreshes only known fixture account credentials, preserving ordinary accounts and all problem/application state. Cost: rerunning seed resets fixture logins to configured values.

- Frontend integration and review repairs complete: auth/profile, company pages, application drafts/review/dashboards, private state keyed to identity, safe post-mutation refresh, form date/evidence handling and responsive navbar. Build/lint passed; existing Fast Refresh warning only.
- Browser verified via Playwright MCP: no-op Google button, short demo logins, company creation/publication, draft persistence on reload, submission, review/acceptance.
- Ruling: packaged Compose uses project rexios-demo, separate from development rexios, so verification cannot mix databases or file volumes. Cost: a small separate demo database volume.
- Deferred minor: original standalone marketing/verification wording remains as requested by UI-preservation scope; docs describe actual implemented capabilities.

## Final verification

- API and frontend production builds passed; lint passed with one Fast Refresh export warning in AppContext.tsx.
- All 10 focused integration checks passed against the separate test database. Coverage includes ownership, private files and real bytes, duplicate/concurrent decisions, seed preservation and session persistence.
- Native and packaged HTTP smoke workflows passed: registration/profile, publication, comments, draft/submission, acceptance, dashboards, private details and logout.
- Playwright MCP verified the full company/talent flow, cross-account private-state clearing, private edits after acceptance, English/Arabic layouts and narrow-screen overflow.
- Docker API and database restart preserved the session identity, seeded records and uploaded private PDF bytes; anonymous download remained rejected.
- Corrected first-start ordering: development and packaged database startup now waits for PostgreSQL health before migration commands.
- Reused cached base images, avoided a worktree/dependency duplicate, and removed obsolete images created during this task. No external deployment or push performed.
- AI/agent features remain future work; deferred OAuth/recovery/preview controls remain visible no-ops as requested. Work stays on feat/core-mvp.
