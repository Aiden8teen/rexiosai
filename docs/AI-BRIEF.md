# AI-assisted challenge drafting

Companies can open **Post a challenge → Describe with AI**, paste rough notes, and generate an editable Arabic/English brief. Optional answers and change requests refine it. **Use this draft** fills the normal posting form; **Save draft** and **Save and publish** remain separate actions.

The assistant uses the public notes, answers, requested changes and previous public draft submitted in that request. It does not automatically read private notes, contacts or uploaded files. Examples load source notes and still make a real model call when Generate is clicked.

## Local setup

Keep the key in the ignored root `.env` or `server/.env`:

```dotenv
FEATHERLESS_API_KEY=your-key-here
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
FEATHERLESS_MODEL=google/gemma-4-31B-it
AI_REQUEST_TIMEOUT_MS=180000
AI_MAX_OUTPUT_TOKENS=12000
AI_MAX_REPAIR_ATTEMPTS=2
```

The server also needs its ordinary database/session settings from `server/.env.example`. Root `.env.example` configures the packaged Compose demo. Never use a `VITE_` variable for the key. An absent key leaves manual posting available.

Start the cached local database with `npm run db:up`, then use `npm run api:dev` and `npm run dev` in separate terminals. Install the server dependencies with `npm --prefix server install` if they are not already available. No local model weights or additional service is required.

## How it works

The authenticated company endpoint is `POST /api/ai/challenge-brief`. LangGraph runs `prepare_context → generate → validate`; invalid JSON/schema content can pass through `repair → validate` up to the configured number of corrections. LangChain handles the OpenAI-compatible Featherless request. Ordinary chat output plus local Zod parsing is the baseline; native JSON-schema parameters and tool-call formatting are not required.

Both languages are generated together. Locale changes only select which version is shown. Provided/Suggested/Needs input labels explain the model's assessment; they are not factual verification. A missing budget or application deadline stays empty, and a delivery duration is kept separate from the application deadline. The company reviews suggestions before publishing.

Requests have a configurable timeout, cancel action, and finite automatic repairs. There are no per-user usage allowances or refinement caps. A failed or cancelled request preserves input and the last valid preview. Temporary notes/form state survive mode and language switches within the page visit; leaving, reloading, or changing accounts clears unsaved work.

## Live scenario evaluation

From `server`:

```bash
npm run ai:evaluate -- --model Qwen/Qwen3.6-35B-A3B --output ../.superpowers/ai-brief-evaluation/qwen.json
npm run ai:evaluate -- --model google/gemma-4-31B-it --output ../.superpowers/ai-brief-evaluation/gemma.json
# Optional focused trial:
npm run ai:evaluate -- --model Qwen/Qwen3.6-35B-A3B --scenario complete-en
```

Scenarios use their fixed reference date, independently of the actual evaluation timestamp. Output records latency, schema validity, exact budget/deadline/status checks, and full generated results for human review. Required-fact string matches are review hints; synonyms do not automatically fail a good draft. Results stay under ignored `.superpowers/ai-brief-evaluation/`; the script never saves or publishes a problem.

### Results — 25 October 2026

The same 15 scenarios ran through the real LangChain/LangGraph workflow on both models using ordinary text JSON and `chat_template_kwargs: { enable_thinking: false }`. Each scenario used the fixed reference date in its source. Neither native JSON mode nor tool-output formatting was needed.

| Model | Valid responses | Exact scenario checks | Median latency | Observed range |
| --- | --- | --- | --- | --- |
| `google/gemma-4-31B-it` | 15/15 | 15/15 | 50.6 s | 5.4–81.5 s |
| `Qwen/Qwen3.6-35B-A3B` | 15/15 | 13/15 | 39.9 s | 6.0–96.6 s |

**Selected default: Gemma 4 31B.** Qwen produced useful complete drafts, but returned needs-context for a vague real inventory problem and for a downtime problem with an expired submission date. Those cases should still produce editable drafts with missing facts left empty. Gemma handled both correctly in this run. These are small scenario trials, not a general benchmark or a guarantee that later responses will be identical.

Manual inspection of detailed English/Arabic, mixed input, unsupported-skill and refinement outputs found aligned bilingual meaning, preserved station/machine counts and CSV/offline requirements, no invented cameras/datasets in the textile case, and the requested budget change from 120000 to 180000 DZD. Both left unsupported mechanical skills empty. Missing/ranged/foreign budgets and ambiguous/impossible dates stayed unknown. Suggested wording still needs company review; provenance labels are model assessments. Full actual results are ignored local QA artifacts, not canned UI responses.

Generation latency includes complete bilingual output and provider queuing. For a short video, trim the waiting segment; do not simulate a completed AI result. The timeout/output budget remains configurable and there are no per-user usage limits.

### Verification

- Backend CommonJS build/start and health passed; the full suite passed **67/67** against the separate local test database, including existing auth/posting/private-file/application flows. Existing PostgreSQL concurrent-query deprecation warnings remain.
- Frontend build passed; lint has zero errors and four unchanged warnings in `Navbar.tsx:29`, `useNotifications.ts:106`, `usePublicStats.ts:22`, and `AppContext.tsx:323`. Vite retains the existing large-chunk advisory.
- Both Compose configurations validated with placeholder secrets. The real key remains in ignored local environment files and is passed only to the API at runtime.
- A live company login → Vite proxy → AI endpoint → Featherless → public-form-adapter check passed with the selected default in 43 seconds. Both languages, 120000 DZD and the known application date were retained; no problem was saved or published. The default-model evaluation command also passed a needs-context smoke scenario.
- After browser authorization, Playwright verified a real English textile generation → answers → refinement → apply → bilingual manual edits → save → reopen flow. The changed 180000 DZD budget, known date, both titles, private notes and selected public/private PDFs were retained. A real Arabic maintenance generation and English/Arabic previews also passed.
- Desktop and 390 px mobile RTL screenshots were inspected; there was no horizontal overflow. Example replacement confirmation, provider-error recovery, cancellation with a late response, page reload and switching to a second company account preserved or cleared work as intended. The failure/cancel edge cases used explicitly temporary browser interception; success paths called the real provider. Full screen-reader acceptance was not tested.
- Browser testing found a pre-existing duplicate Navbar key for company Home/My Challenges. A stable route-plus-label key fixes stale mixed-language links without changing navigation design. After a full reload, locale switching produced no duplicate-key console errors. Unauthenticated session checks still produce expected 401 network entries, and the simulated failure deliberately produces 503.

One minor display limitation remains from the existing save contract: an unspecified budget is stored as the legacy zero sentinel in a saved draft, and the company list can show `0 DZD`. The AI preview and reopened form show it as unspecified/blank; publishing still requires a positive budget. No database migration was added.

## Demo segment (30–45 seconds)

1. Choose the textile example and point out the rough operational notes.
2. Generate, then show the structured brief and switch Arabic/English without another call.
3. Answer a question about available defect images or data; update the draft and show how the requirements change.
4. Choose **Use this draft**, review the filled form, then use the normal Save/Publish action.

Use real results and keep a backup recording of a successful run for the video pitch. The example notes are not prerecorded responses.

## Acceptance checklist

- Notes → preview → answer → refine → apply → save.
- Arabic → English → Arabic preserves both content buffers.
- Manual ↔ AI preserves selected files, contacts and private notes.
- New AI application replaces public content only.
- Cancel/retry/provider failure preserves work; an older request cannot replace a newer result.
- Loading an example over nonempty notes requires an explicit replace action.
- Account switching clears unsaved AI/form state.
- Existing editing/public locks/private-file behavior remains functional.
- RTL, mobile stacking and keyboard interaction require a browser review when authorized.

## Future VPS update

Add the AI variables to the VPS's ignored `.env.vps`, then rebuild **api and rexios-web** and recreate only those Rexios services. See [VPS deployment](VPS.md). There is no migration, reseeding, new port, new service, or proxy change for this feature. Optional AI config is passed to the API container at runtime, never baked into frontend assets or image build arguments.
