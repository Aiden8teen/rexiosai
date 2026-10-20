# RexiosAI core MVP

The core MVP keeps the existing React/Vite frontend and adds a NestJS API backed by PostgreSQL. Company and talent accounts can use persistent profiles, publish and browse industrial problems, save or submit applications, review decisions, and discuss a problem. The API owns role checks and private data access.

Seeded companies, profiles, discussions, and applications are synthetic demo content. The separate community forum remains a frontend preview; its fixture posts are not stored through the MVP API. Problem discussions are persisted. Google sign-in and password recovery controls remain visible no-ops.

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

Seeding is an explicit operation. It is safe to rerun and does not overwrite existing user edits or decisions.

Run the API and frontend in separate terminals:

    npm run api:dev
    npm run dev

The frontend is available at http://localhost:5173; the API listens on port 3000. Vite proxies /api to the API. The local database port is bound to 127.0.0.1:5438. Use npm run build, npm run lint, and npm run api:build for the app checks.

## Packaged demo with Docker Compose

The packaged setup builds the React files with node:24-bookworm-slim, serves them from the cached caddy:2.11.4-alpine image, and uses postgres:18-alpine. Compose publishes the web service on port 8080 by default. The API and database stay private on the Compose network. PostgreSQL data and uploaded files use named volumes.

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
    docker compose -f compose.yml -f compose.demo.yml up -d db
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

Run the seed command to create these accounts. Their initial password is the value of DEMO_PASSWORD, which defaults to RexiosDemo123!.

| Email | Account type |
| --- | --- |
| company@rexios.demo | Company |
| company2@rexios.demo | Company |
| company3@rexios.demo | Company |
| company4@rexios.demo | Company |
| solver@rexios.demo | Talent |
| member@rexios.demo | Talent |

These identities and sample records are for demonstrations only. They do not represent real companies, users, submissions, or adoption. Change the seeded password before sharing a hosted demo.
