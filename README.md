# Rexios AI

Rexios AI is a demo platform for industrial open challenges and technical talent in Algeria. The core MVP connects company and talent accounts through challenge posting, browsing, applications, review decisions, and problem discussions.

The current sample records are synthetic. The community forum and problem discussions are persisted, with real questions, answers, reactions, author-selected answers and activity notifications. About-page figures reflect the database, and onboarding follows the signed-in account. Google sign-in, password recovery and design-preview controls remain visible no-ops. AI/agent features are future work.

## Local development

Use Node.js 24, npm, and Docker Compose. The complete setup, packaged demo, environment settings, and sample accounts are documented in [docs/MVP.md](docs/MVP.md).

    Copy-Item .env.example .env
    Copy-Item server/.env.example server/.env
    npm ci
    npm --prefix server ci
    npm run db:up
    npm run db:migrate
    npm run db:seed

Run the API and frontend in separate terminals:

    npm run api:dev
    npm run dev

The Vite development app runs at http://localhost:5173. The packaged Compose demo runs at http://localhost:8080.
