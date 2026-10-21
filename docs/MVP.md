# RexiosAI core MVP

The core MVP keeps the existing React/Vite frontend and adds a NestJS API backed by PostgreSQL. Company and talent accounts can use persistent profiles, publish and browse industrial problems, save or submit applications, review decisions, and discuss a problem. The API owns role checks and private data access.

Seeded companies, profiles, discussions, applications and community posts are synthetic demo content. Both the standalone community and discussions attached to problems use the API. Google sign-in and password recovery controls remain visible no-ops.

Seed copy includes Arabic and English proposals, rejection feedback, private notes and talent profile names/background. Education and experience store canonical option values with translated labels. Technical identifiers, code and product names retain their usual spelling. Demo contacts use reserved `.example` addresses; portfolio links are neutral examples, not evidence of real work. See [the content audit](CONTENT-AUDIT.md) for screen coverage and corrections.

## Screens and data

| Area | Data and behavior |
| --- | --- |
| Signup/login/logout and profiles | Persistent accounts, sessions, CV and profile evidence |
| Company posting, browsing and application dashboards | Persistent problems, drafts, decisions and private files |
| Community feed/detail/ask | Shared questions, answers, per-account reactions and approximate distinct session views |
| Community sidebar | Actual answer counts, accepted answers and most-used tags |
| Answer acceptance | Question author chooses one answer; this is not independent expert verification |
| Notification bell | Recipient-only answer/application/decision/comment events; persisted read state |
| About figures | Actual company/talent/open budget/selection aggregates; no payout/completion claims |
| Welcome and landing navigation | Uses the actual account role and profile completeness |
| Landing illustrations, mission and guidelines | Static explanatory content |
| Google/recovery and design-preview controls | Visible no-ops; AI/agents are still future work |

Community endpoints are under `/api/community`: `GET/POST questions`, exact-ID question detail, paginated `questions/:id/answers`, idempotent PUT/DELETE question/answer reactions, owner-only `PUT questions/:id/accepted-answer`, `POST questions/:id/view`, and `GET overview`. Guest browsing is public; posting, answering and reacting require a session. Bodies and code render as text. Feed search supports q/tag and latest/active/unanswered sorting; unanswered means zero answers. An unknown question returns 404.

`GET /api/meta` supplies canonical skill options. `GET /api/notifications` and `PATCH /api/notifications/:id/read` are session/recipient scoped. Read state persists; notification text contains no private application details. The bell refreshes on focus and every 30 seconds while visible, rather than using realtime services. `GET /api/public/stats` exposes aggregate totals only.

The community seed keeps existing `q1`–`q3` URLs, inserts missing questions/answers and preserves subsequent edits, accepted-answer changes and removed reactions. Old browser-local forum content is not imported or read; only language preference remains browser-local. Real reaction rows replace decorative mock totals, so seeded counts may be lower than the original screenshots.

## Local development

Prerequisites: Node.js 24, npm, and a running Docker Engine with Docker Compose.

From the repository root, create the environment files and install both projects:

    Copy-Item .env.example .env
    Copy-Item server/.env.example server/.env
    npm ci
    npm --prefix server ci

The root .env supplies Compose settings. The API process reads server/.env; its example points at PostgreSQL on localhost:5438 and Vite on localhost:5173. Before hosting, replace its example session secret. If you change the database password in the root .env, update the password in server/.env's DATABASE_URL to match.

Start the local PostgreSQL service and apply migrations:

    npm run db:up
    npm run db:migrate

Seed the demo accounts and sample records when desired:

    npm run db:seed

Seeding is an explicit operation. It preserves problem edits, deadlines and application decisions. As requested, rerunning the demo seed resets only known fixture accounts to the configured short email/password; ordinary registered accounts are untouched.

After pulling content changes, apply migrations before running the seed. A versioned content upgrade replaces only exact, unchanged seed text and selected original fixture defaults; it preserves edited text, application decisions, reactions and deadlines. A revision record prevents subsequent reseeds from restoring translations deliberately cleared later. Concurrent content upgrades are serialized per revision. User-written content is displayed as entered with a fallback when no translation exists; the app does not automatically translate submissions.

Run the API and frontend in separate terminals:

    npm run api:dev
    npm run dev

The frontend is available at http://localhost:5173; the API listens on port 3000. Vite proxies /api to the API. The local database port is bound to 127.0.0.1:5438. Use npm run build, npm run lint, and npm run api:build for the app checks.

## Packaged demo with Docker Compose

For the shared Oracle VPS and `rexios.duckdns.org`, use the separate [VPS deployment and removal guide](VPS.md). Its standalone Compose file publishes no host ports and keeps the existing local/demo setup separate.

The packaged setup builds the React files with node:24-bookworm-slim, serves them from the cached caddy:2.11.4-alpine image, and uses postgres:18-alpine. Compose publishes the web service on port 8080 by default. The API and database stay private on the Compose network. PostgreSQL data and uploaded files use named volumes. The packaged project is named rexios-demo; development uses rexios, so their databases/uploads stay separate.

Copy .env.example to .env. Replace SESSION_SECRET and POSTGRES_PASSWORD with long random hex values before hosting. One way to generate a value is:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Use one generated value for the session secret and a separate one for the database password. Hex values are safe in the Compose-built PostgreSQL connection string. Set DEMO_PASSWORD to the password you want for seeded demo accounts.

For a local packaged demo, keep APP_ORIGIN at http://localhost:8080,http://127.0.0.1:8080, SECURE_COOKIES=false, and TRUST_PROXY=false. To place it behind an HTTPS reverse proxy:

- Set APP_ORIGIN to the exact public HTTPS origin, such as https://rexios.example.
- Set SECURE_COOKIES=true and TRUST_PROXY=true.
- Keep WEB_BIND=127.0.0.1 so only the host reverse proxy can reach the app, and point it at port 8080.
- Forward the original Host, X-Forwarded-For, and X-Forwarded-Proto headers through the host proxy. Caddy trusts those values from private-range proxies, then passes the trusted scheme to the API. Keep the web port bound to loopback so only the host proxy reaches it. If the proxy connects from outside private ranges, adjust the trusted proxy ranges in deploy/Caddyfile.

Set WEB_BIND=0.0.0.0 only when you intend to expose the web port directly. WEB_PORT changes the host port. The public host or HTTPS configuration is deployment-specific.

Build the API and web images, start PostgreSQL, and apply the schema:

    docker compose -f compose.yml -f compose.demo.yml build api web
    docker compose -f compose.yml -f compose.demo.yml up -d --wait db
    docker compose -f compose.yml -f compose.demo.yml run --rm --no-deps api npm run db:migrate

Seed the sample content once if you want the demo accounts:

    docker compose -f compose.yml -f compose.demo.yml run --rm --no-deps api npm run db:seed

Then start the API and web app:

    docker compose -f compose.yml -f compose.demo.yml up -d api web

Open http://localhost:8080. The Compose health checks wait for PostgreSQL and the API before marking dependencies ready. Migrations and seeding are explicit commands; restarting a container does not run either operation.

Useful operations:

    docker compose -f compose.yml -f compose.demo.yml logs -f api
    docker compose -f compose.yml -f compose.demo.yml restart api
    docker compose -f compose.yml -f compose.demo.yml down

The down command keeps both named volumes. Do not add -v when you want to retain database records and uploads. Back up the database and upload volume before moving or replacing the Docker host.

## Demo accounts

Run the seed command to create these accounts. Their initial password is the value of DEMO_PASSWORD, which defaults to 123.

| Email | Account type |
| --- | --- |
| c@demo.test | Company |
| c2@demo.test | Company |
| c3@demo.test | Company |
| c4@demo.test | Company |
| s@demo.test | Talent |
| m@demo.test | Talent |

These identities and sample records are for demonstrations. Customize DEMO_PASSWORD if desired; the short default is intentional for the course demo.

## Focused verification

Create a separate integration-test database once:

    docker compose exec -T db psql -U rexios -d rexios -c "CREATE DATABASE rexios_test"

Set TEST_DATABASE_URL in server/.env to that database, then run:

    npm run api:build
    npm run api:test:integration
    npm run build
    npm run lint

The tests require a database name ending in _test and apply migrations without resetting existing application databases. They check account ownership, drafts, concurrent decisions, file permissions, seed preservation, and restart persistence.

With the development API running, npm run smoke:mvp creates a small synthetic company/talent workflow and leaves its closed problem visible. To check the packaged version in PowerShell:

    $env:SMOKE_BASE_URL = 'http://localhost:8080'
    npm run smoke:mvp
    Remove-Item Env:SMOKE_BASE_URL

`npm run smoke:community` checks separate authenticated users, shared question/answer reads, reactions, owner selection and notification read permissions. It retains clearly labelled synthetic posts. Both smoke scripts support SMOKE_BASE_URL and SMOKE_ORIGIN. For an explicit packaged restart/seed check, set SMOKE_STATE_FILE to a temporary JSON path when first running the community smoke; rerun after restart with SMOKE_VERIFY_STATE set to that path. This temporary file contains only synthetic session cookies and must not be committed.
