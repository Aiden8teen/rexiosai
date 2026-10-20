# Core MVP implementation ledger

Plan: `docs/superpowers/plans/2026-10-20-mvp-implementation.md`

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
- Task 2: pending — auth/profile integration.
- Task 3: pending — posting/browsing.
- Task 4: pending — applications/review/dashboards.
- Task 5: pending — discussions/private files.
- Task 6: pending — packaging/browser verification/docs.

- Task 2 backend: complete — registration/login/logout and own-profile validation passed real HTTP checks.
- Task 3 backend: complete — publishing, private drafts, bilingual fallback and filtering passed.
- Task 4 backend: complete — duplicate submissions and concurrent winner decisions passed; 7 integration checks green.
- Ruling: independent frontend and deployment file tasks delegated to GPT-6 Luna/max while root owns the API; commits are serialized by root after one shared-index overlap. Cost: final cross-layer verification is required.
- Ruling: use cached Caddy instead of Nginx for identical SPA/API proxy duties. Cost: deployment configuration is a Caddyfile.
