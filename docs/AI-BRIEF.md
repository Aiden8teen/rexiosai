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

The UI uses the authenticated company endpoint `POST /api/ai/challenge-brief/stream`. The original JSON endpoint `POST /api/ai/challenge-brief` remains available. LangGraph runs `prepare_context → generate → validate`; invalid JSON/schema content can pass through `repair → validate` up to the configured number of corrections. LangChain handles the OpenAI-compatible Featherless request. Ordinary chat output plus local Zod parsing is the baseline; native JSON-schema parameters and tool-call formatting are not required.

The system prompt instructs the model to treat request fields as task input and ignore embedded attempts to change its role, reveal instructions/secrets or bypass the output contract. Two short rejection examples demonstrate polite bilingual clarification for unrelated requests and instruction overrides; a positive example demonstrates using valid problem facts while ignoring an embedded override. These use the existing `needs_context` UI and add no classifier, keyword blacklist or extra model call. Actual security-related challenges and legitimate refinement instructions remain supported.

### Progressive preview and guided questions

Featherless text chunks are read through LangChain. A small incremental JSON reader extracts growing public text and list items before their closing quotes/array, alongside completed, individually validated metadata fields, and sends provisional snapshots over SSE. It withholds incomplete escapes and surrogate pairs, and handles Arabic and optional JSON fences. Text prefixes are unvalidated previews; the full result still passes Zod before use. The frontend consumes the POST response with fetch; it needs no WebSocket, EventSource connection or extra service. No raw JSON or reasoning is shown.

The preview starts with skeleton sections and fills as fields arrive. A refinement keeps the last valid brief visible and highlights changed sections. Real graph phases drive Drafting/Checking/Adjusting labels. An automatic repair starts a new provisional attempt. Only the fully validated final result enables **Use this draft**; cancellation, errors or a truncated connection discard provisional content and retain the last good brief. Disconnecting also aborts the API's provider request. SSE heartbeat comments keep an otherwise idle connection active.

Growing text uses a reusable word-prefix renderer with adaptive catch-up. It keeps punctuation and whitespace, renders one text node to preserve Arabic shaping, and flushes immediately on validation or cancellation. A short idle allowance reveals the last word when an individual field finishes. Hidden tabs and reduced-motion preferences skip the artificial reveal delay. Stable section keys prevent each new word from restarting section animations.

The drafting status uses [React Bits Shiny Text](https://reactbits.dev/text-animations/shiny-text); clarification questions use a restrained blue [Border Glow](https://reactbits.dev/components/border-glow). Their dependency-free TypeScript/Tailwind sources are local reusable components in `src/components/reactbits`, with upstream license and attribution. Border Glow includes local animation cleanup, keyboard focus and reduced-motion handling. No new npm dependency was installed. Other cards and backgrounds retain their existing styling.

Follow-up questions appear one at a time with **Next**, **Skip for now**, **Back**, and **View all questions & answers**. These actions navigate locally, preserving answers without waiting for another AI call. **Update with answers & changes** includes the collected answers in a real refinement. Answers and the current question survive interface-language and AI/manual mode changes. A successful new result starts its new question sequence while preserving answer history.

Short reveals, skeleton shimmer and changed-section highlights use the current theme and plain CSS. Reduced-motion preferences disable those effects. The preview never forces automatic scrolling.

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

Input-handling update: backend build and **58/58 AI checks** passed. Five real Gemma streaming scenarios also passed on one inference call each: unrelated text and an override-only request returned bilingual clarification; a valid CSV challenge with an embedded override preserved the original 70000 DZD budget/date and never displayed the override marker; a legitimate SQL-injection repair challenge remained usable; ordinary refinement applied 180000 DZD while retaining its other requirements. These are basic prompt/example checks, not an exhaustive adversarial evaluation. The local API was restarted and its health check passed. No UI or provider configuration changed.

Word/effects update: the full integration suite passed **77/77**, both builds passed, and lint retained only the same four existing warnings. Playwright observed **56 English** and **50 Arabic** paragraph text updates before generation completed, with a single text node and exact final form application. Question Next/Back retained answers and focus. The clarification card was the only glow instance; reduced-motion emulation produced no shine/glow and immediate provisional text. A 390 px Arabic viewport had no horizontal overflow. Explicit temporary stream fixtures verified repair reset, disabled Apply, cancellation and safe terminal error restoration, then the native fetch was restored. Screenshots were inspected; real success paths used Featherless. Review and implementation were inline without subagents; no push/deployment was performed.

Streaming update: the full suite passed **74/74** (including SSE transport, provisional parsing, repair and frontend decoding). Backend/frontend builds passed; lint retains the same four existing warnings. A real browser run showed the first completed title at **10.2 seconds**, with final validation at **53.1 seconds**. This is one observed full bilingual request, not a latency guarantee. Playwright verified disabled Apply during generation, one-question navigation and answer review, language preservation, live budget/deadline refinement, changed-section indicators, public-form application, private state preservation, cancellation and safe streamed error recovery. At 390 px, the document width stayed within the viewport; reduced-motion emulation disabled the new section animation. Intercepted error frames were explicit QA fixtures, not product responses.

A final Arabic inventory request on the final build showed its title at **8.9 seconds** and finished at **62.4 seconds**. Both language buffers applied correctly, unknown budget/deadline stayed blank, and Skip/Back question navigation made zero inference requests. After the prompt-order clarification, the focused suite passed **54/54** again. Browser console checks showed no application errors. Review was performed inline without subagents, as requested. Hosted streaming through the VPS proxy layers remains a later deployment check.

- Before the streaming update, backend CommonJS build/start and health and the original **67/67** checks passed against the separate local test database, including existing auth/posting/private-file/application flows. Existing PostgreSQL concurrent-query deprecation warnings remain.
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
- RTL/mobile stacking and question focus/navigation were reviewed with Playwright; full screen-reader acceptance remains untested.

## Future VPS update

Add the AI variables to the VPS's ignored `.env.vps`, then rebuild **api and rexios-web** and recreate only those Rexios services. See [VPS deployment](VPS.md). There is no migration, reseeding, new port, new service, or proxy change for this feature. Optional AI config is passed to the API container at runtime, never baked into frontend assets or image build arguments.

Streaming has been tested through local Vite → API → Featherless. Caddy documents immediate flushing for `Content-Type: text/event-stream`, so no global proxy change is planned ([Caddy streaming](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#streaming)). Verify that fields arrive before the final result through both existing VPS proxy layers during the next authorized deployment; hosted streaming has not been tested in this task.
