# AI-assisted Challenge Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert rough company notes into a bilingual, validated challenge draft, optionally refine it, and populate the existing posting form.

**Architecture:** Run a small LangGraph generation/validation/repair workflow inside the existing NestJS API, using LangChain chat completions routed through Featherless. Keep AI workspace state in the new-challenge page and reuse existing form/save/publish endpoints; generation performs no database writes.

**Tech Stack:** Existing React/TypeScript, NestJS/Node 24, PostgreSQL; server-side `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`, `zod`; existing `node:test`/`tsx` for focused checks.

**Spec:** [AI challenge brief design](../specs/2026-10-25-ai-challenge-brief-design.md). Read the entire spec before execution. This plan is proposed, and the planning request authorizes no product implementation or deployment.

## Global Constraints

- Preserve the existing visual theme and manual posting/editing behavior. AI entry point is new creation only: `/company/problems/new`.
- Draft first with optional refinement is the planner's proposed default. Generate Arabic and English public content together.
- `FEATHERLESS_MODEL=Qwen/Qwen3.6-35B-A3B` is the initial candidate; compare `google/gemma-4-31B-it` before final model choice.
- Use normal chat completions requesting one JSON object. Provider-native `response_format`/tool-output enforcement is not a dependency.
- No per-user quotas, refinement allowance, daily budget ceiling, queue, vector database, orchestration server, AI checkpoint storage, or production hardening programme.
- Finite automatic correction and a configurable timeout keep requests usable: `AI_MAX_REPAIR_ATTEMPTS=2`, `AI_REQUEST_TIMEOUT_MS=180000`, `AI_MAX_OUTPUT_TOKENS=12000`.
- Match existing posting limits: title 160, summary 500, description 20,000 characters; 30 list entries, 1,000 characters per entry; one to five supported skills for publishing. Incomplete drafts may have no supported skill yet.
- Unknown money/date remains null in the AI response and empty in the form. Project duration must not become an application deadline.
- AI uses only submitted notes/answers/public previous draft; existing private notes, contacts, file selections and account ownership are preserved.
- Keep the backend on Node 24/CommonJS. No new infrastructure, migration, port, or proxy change.
- No Playwright/browser automation unless the user explicitly authorizes it for the implementation turn. Skip Graphify.
- Existing working-tree edits belong to the user. Create an implementation branch/worktree only at implementation time. Commit completed implementation tasks regularly; a plan request does not authorize a push/deployment.

## Review Focus

- Language switching and refinement must retain both language buffers and distinguish new AI content from a previously saved problem.
- An application deadline and a delivery duration must not be conflated; missing/ranged/foreign-currency budgets must not be fabricated.
- Refinement must use the latest answers/instructions and preserve other source facts; unsupported-skill/vague requests must stay useful.
- Provider text can contain fences, malformed JSON, separate reasoning, or truncated output; no invalid draft can reach form application.
- Retry, mode switch, cancel, and account change must not erase input or allow an older request to overwrite newer work.

## File map and interfaces

| File | Responsibility |
| --- | --- |
| `server/src/ai/challenge-brief.schema.ts` | Zod contracts, exported wire types, JSON parsing and content validation |
| `server/src/ai/challenge-brief.prompt.ts` | Few-shot examples and generation/repair messages |
| `server/src/ai/featherless.client.ts` | Lazy configuration and LangChain model adapter |
| `server/src/ai/challenge-brief.graph.ts` | LangGraph nodes, branching and finite correction |
| `server/src/ai/challenge-brief.service.ts` | Role check, request parsing, timeout, error translation |
| `server/src/ai/challenge-brief.controller.ts` | Authenticated `POST /api/ai/challenge-brief` |
| `server/src/main.ts` | Register providers/controller and 1 MiB JSON parser compatibility |
| `src/api/challengeBrief.ts`, `src/api/contracts.ts` | Frontend request and wire types |
| `src/hooks/useChallengeBrief.ts` | AI request state, cancel, latest-response handling, refinement |
| `src/components/ChallengeBriefAssistant.tsx` | Notes, examples, questions, refinement and actions |
| `src/components/ChallengeBriefPreview.tsx` | Readable bilingual preview and field labels |
| `src/data/challengeBriefExamples.ts` | Three source-note examples, never fake generated answers |
| `src/utils/problemFormDraft.ts` | Pure bilingual public-form state and AI application/serialization helpers |
| `src/components/ProblemForm.tsx` | Use bilingual buffers and explicitly apply a new AI draft |
| `src/pages/CompanyProblemFormPage.tsx` | New-page mode/workspace ownership; retain mounted form; prevent locale refetch resets |
| `server/test/ai-brief*.test.ts` | Focused contract, workflow, HTTP and pure form-helper verification |
| `server/scripts/evaluate-ai-brief.ts`, `server/scripts/ai-brief-scenarios.ts` | Opt-in live scenario evaluation |
| `docs/AI-BRIEF.md` | Setup, architecture, actual evaluation summary, demo notes and limitations |

Small frontend/backend wire types are mirrored like the existing code; do not add a shared package or change TS project roots. `BriefRequest`, `BriefDraft`, `BriefResult`, `BriefQuestion`, `LocalizedText`, and `BriefField` have the exact fields defined in the spec.

### Task 1: Validated prompt and Featherless adapter

**Files:** Create schema, prompt and client files above, `server/test/ai-brief-schema.test.ts`, `server/test/ai-brief-client.test.ts`; modify `server/package.json`, `server/package-lock.json` and `server/.env.example`.

**Interfaces:**
- `parseBriefRequest(value: unknown): BriefRequest` trims/parses the request and strips unrelated properties.
- `parseAndValidateBrief(raw: string, context: { now: Date; timeZone: string }): BriefResult` returns a validated/normalized result or throws `BriefValidationError` with `issues: string[]`.
- `buildBriefMessages(request: BriefRequest, context: { now: Date; timeZone: string }): BaseMessage[]` and `buildRepairMessages(request: BriefRequest, raw: string, issues: string[], context: { now: Date; timeZone: string }): BaseMessage[]` use LangChain message types.
- `BriefModel.complete(messages: BaseMessage[], signal: AbortSignal): Promise<string>` returns only final answer content.
- `createFeatherlessModel(overrides?: { model?: string; baseURL?: string; apiKey?: string }): BriefModel` reads the spec's defaults lazily. Export a named `AiUnavailableError` for missing configuration so ordinary API startup succeeds.

- [ ] **Step 1: Add focused failing contract/client checks**, using `node:test`, `assert`, and a small local Node HTTP stub for Chat Completions. Cover the assertions below, with shared fixture objects kept in this test file or a small `server/test/fixtures/ai-brief.ts` if reused in Task 2:

```ts
assert.equal(parseAndValidateBrief(validRaw, ctx).draft?.budgetDzd, 120000);
assert.equal(parseAndValidateBrief(fencedRaw, ctx).status, 'draft');
assert.throws(() => parseAndValidateBrief(truncatedRaw, ctx), BriefValidationError);
assert.throws(() => parseAndValidateBrief(invalidSkillRaw, ctx), BriefValidationError);
assert.throws(() => parseAndValidateBrief(impossibleCalendarDateRaw, ctx), BriefValidationError);
assert.equal(parseAndValidateBrief(needsContextRaw, ctx).draft, null);
```

Include both language length limits, optional previous draft/answers, null money/date, an empty skills draft, a past-date warning, and missing-source labels. The client stub checks `/chat/completions`, selected model, supplied key, no required `response_format`/tools, nonempty few-shot messages, and a final answer with any separate reasoning excluded. A missing key must fail on invocation, not module import.

- [ ] **Step 2: Verify failure**, with the existing `server/node_modules/.bin/tsx` runner (`npm exec -- tsx --test test/ai-brief-schema.test.ts test/ai-brief-client.test.ts`, working directory `server`). Expected initial failure: new modules are missing. Add `test:ai` as `tsx --test --test-concurrency=1 test/ai-brief*.test.ts` for subsequent focused runs.
- [ ] **Step 3: Implement contracts, three few-shot examples, and the client.** Resolve/pin compatible package versions without installing the full umbrella ecosystem. Preserve the complete bilingual output contract, nullable facts and existing field limits. Include source-data instructions, latest-answer precedence, unknown-budget examples, and delivery/deadline distinction. Parse exact JSON or a single enclosing Markdown fence; no executable/greedy text recovery. Normalize past dates to null with localized warning. Empty skill lists get a helpful warning, while unknown enum tags trigger repair. No native JSON mode is required. Use the spec's configurable output/time settings; disable hidden SDK retries. Test a supported non-thinking option at live evaluation time; do not invent a provider parameter.
- [ ] **Step 4: Verify**, `npm run test:ai` and `npm run build` in `server` (supply a placeholder `DATABASE_URL` for Prisma generation if the local env is absent). Also start the compiled backend once in Task 2 to verify Node 24/CommonJS compatibility, not just compilation.
- [ ] **Step 5: Commit** only this task's files: `feat: add validated bilingual AI brief prompts and Featherless client`.

### Task 2: LangGraph workflow and authenticated endpoint

**Files:** Create graph/service/controller, `server/test/ai-brief-graph.test.ts`, `server/test/ai-brief-api.test.ts`; modify `server/src/main.ts`.

**Interfaces:**
- `BriefRunOptions = { signal: AbortSignal; now: Date; maxRepairAttempts: number }`.
- `generateChallengeBrief(request: BriefRequest, model: BriefModel, options: BriefRunOptions): Promise<BriefResult>` builds/invokes the LangGraph workflow.
- `ChallengeBriefService.generate(user: Account, value: unknown): Promise<BriefResult>` performs role/request checks, creates an abort timeout, invokes the graph and converts failures to localized Nest exceptions.
- `ChallengeBriefController` exposes `POST /api/ai/challenge-brief` with `SessionGuard` and HTTP 200. It passes `req.user` and unknown body to the service; Zod validates this endpoint body, avoiding a second duplicated DTO schema.

- [ ] **Step 1: Write failing graph checks** with a fake `BriefModel` returning a sequence of answers. Assert valid output uses one call, malformed→valid uses two calls, three invalid outputs stop with validation error, abort stops further calls, needs-context returns 200-style data without repair, and refinement messages contain the current notes/answers/instructions and previous draft. A transport error must not enter the schema-repair branch.
- [ ] **Step 2: Write a focused HTTP check** using the existing bootstrap/session test pattern, a separate `*_test` database, and the Task 1 local HTTP inference stub. Check 401 without a session, 403 for talent, 400 for blank notes, 200 for company draft/refinement/needs-context, 422 after exhausted malformed responses, 503 without key, 504 on abort, and 502 for a non-capacity upstream error. Provider 429/temporary capacity becomes 503 with a useful retry message. Compare `Problem` and `CompanyProfile` records before/after generation to confirm no writes. Include an ordinary bilingual payload larger than 100 KiB but smaller than 1 MiB. Changing test env must be restored on completion.
- [ ] **Step 3: Run `npm run test:ai` in `server`**; confirm graph/controller tests fail because the modules/route are missing, without paid requests.
- [ ] **Step 4: Implement** `prepare_context → generate → validate` with conditional `repair → validate`, using Task 1 parser and prompt functions. Ordinary valid/missing-fact drafts return immediately. All repair calls share the same abort signal and get the original source context; default to two repairs, not an unlimited graph. Reuse current date and validated IANA time zone (default Africa/Algiers). Register the controller/service alongside existing Nest providers. Set the shared JSON parser limit to 1 MiB through Nest's supported parser configuration. Keep keys out of logs/errors, and lazy-init so unrelated endpoints work without Featherless. Do not modify auth, Prisma schema, or the public publish requirements.
- [ ] **Step 5: Verify** focused AI checks, `npm run build` in `server`, and startup plus `/api/health` using the compiled backend against the local demo/test stack. Use only Rexios local resources; do not start/alter unrelated services. Expected: JSON API follows existing origin/session rules; no provider or database mutations beyond temporary test sessions/fixtures.
- [ ] **Step 6: Commit**: `feat: expose LangGraph challenge drafting and refinement API`.

### Task 3: Bilingual form state and explicit draft application

**Files:** Modify `src/api/contracts.ts`, `src/components/ProblemForm.tsx`, `src/pages/CompanyProblemFormPage.tsx`; create `src/utils/problemFormDraft.ts`, `server/test/ai-brief-form.test.ts`.

**Interfaces:**
- Mirror the spec's AI wire types in `src/api/contracts.ts`.
- `ProblemFormFields` holds both language variants of all public text/list fields, skills/category/difficulty, `budget: string`, and `deadline: string` (datetime-local), plus `originalDeadlineAt?: string` and `originalDeadlineInput: string` for lossless unchanged-date saves. File/contact/private state remains owned by the existing form.
- `createProblemFormFields(initial?: EditableProblem): ProblemFormFields` retains the saved record's real bilingual values. A missing translation can be shown as a display fallback but not silently copied into the other persisted language on save.
- `applyBriefToFormFields(current: ProblemFormFields, draft: BriefDraft): ProblemFormFields` replaces public content only; null amount/date becomes `''`; a known `applicationDeadlineDate` becomes `YYYY-MM-DDT23:59`. Reset the original-deadline snapshot when explicitly applying AI content so a prior saved timestamp cannot override the new date.
- `buildProblemPublicInput(fields: ProblemFormFields): Omit<ProblemInput, 'privateNotes' | 'privateNotesEn' | 'contactEmail' | 'contactUrl' | 'shareContact'>` serializes both language buffers and converts the visible local deadline to ISO. The form still appends existing private-note data separately.
- Extend `ProblemForm` with optional `appliedBrief?: { revision: number; draft: BriefDraft }`. Apply once per explicit revision, never on every render/locale change. Existing `initial?: EditableProblem` remains reserved for saved records; do not pass a fabricated ID.

- [ ] **Step 1: Write failing pure-helper checks**, runnable with the existing backend `tsx` test runner importing the frontend utility (type-only imports erase; no new frontend test framework). Assert both languages survive serialization, AR-only editing preserves EN, EN-only editing preserves AR, null facts map to empty inputs, date maps to local 23:59 without a date shift, and applying an AI draft cannot inject private/contact/file/identity fields into the returned public payload. Preserve a saved record's untouched deadline instant rather than dropping seconds/timezone precision on ordinary edits.
- [ ] **Step 2: Run `npm run test:ai` in `server`** and observe the new helper test fail from the absent module.
- [ ] **Step 3: Implement helpers and form integration.** Store public fields canonically and select the current language's buffer in existing controls; avoid locale-dependent form reinitialization. Preserve the exact original `deadlineAt` when the visible deadline has not changed (retain it as `originalDeadlineAt`/`originalDeadlineInput` alongside form state if needed). Update `CompanyProblemFormPage` so language changes do not refetch/remount an already loaded form; localized company-name display can update without resetting fields. Retain all existing contact update, upload, draft save, publish, and public-lock behavior.
- [ ] **Step 4: Verify** `npm run test:ai` in `server`, root `npm run build`, root `npm run lint`. Include existing ordinary edit/private-only integration checks when running the full suite in Task 5. Browser interaction acceptance is tracked in Task 4 and must not be claimed from pure-helper tests.
- [ ] **Step 5: Commit**: `feat: preserve bilingual form edits and apply AI challenge drafts`.

### Task 4: AI workspace, preview, and posting-page integration

**Files:** Create `src/api/challengeBrief.ts`, `src/hooks/useChallengeBrief.ts`, `src/components/ChallengeBriefAssistant.tsx`, `src/components/ChallengeBriefPreview.tsx`, `src/data/challengeBriefExamples.ts`; modify `src/pages/CompanyProblemFormPage.tsx` and only small reusable styles in `src/index.css` if necessary.

**Interfaces:**
- `requestChallengeBrief(input: BriefRequest, signal?: AbortSignal): Promise<BriefResult>` uses existing `apiRequest` with POST JSON and abort signal.
- `useChallengeBrief({ accountId: string })` owns notes, answers, instructions, last result/error, loading, and request cancellation. Expose `generate(lang: Language): Promise<void>`, `refine(lang: Language): Promise<void>`, `cancel(): void`, and ordinary setters. Refinement sends all current answers, last valid draft, and requested changes; do not lose earlier answered facts when new questions arrive.
- `ChallengeBriefAssistant` takes `lang`, `accountId`, and `onUseDraft(draft: BriefDraft): void`; it retains state while hidden by the manual mode.
- `ChallengeBriefPreview` takes `result: BriefResult` and `lang: Language`; uses only validated result data and treats absent source labels conservatively.
- The page owns `mode: 'ai' | 'manual'` and `appliedBrief: { revision: number; draft: BriefDraft } | undefined`. Render both modes without unmounting the existing form; `onUseDraft` increments revision and selects manual mode. Account-keyed page ownership clears temporary state on identity change.

- [ ] **Step 1: Implement the API hook with explicit request boundaries.** Calls happen on Generate/Update, not each keystroke. Abort an older request and use a sequence/ref identity guard so only the latest result commits. Cancel/reset on unmount/account change. Keep input and last valid result through errors/cancel; an old result cannot reappear after a later success. Mode and language switches preserve workspace state. Expose the existing localized API errors in the UI; cancelling is not an error banner.
- [ ] **Step 2: Implement the notes/preview experience** from the spec. Three labelled source examples insert text only; protect nonempty user notes from accidental example replacement with an explicit replace action. Use the existing theme, clear primary Generate/Update/Use actions, short contextual copy, and RTL-safe spacing. Preview switches languages without another model call. Prioritize useful content, then facts/questions; show suggestions instead of unexplained scores. Questions are optional and expandable; needs-context gets question inputs and no Apply action. A whole-request spinner and accessible status text are sufficient; no fake tool stages or chain-of-thought output.
- [ ] **Step 3: Connect the page modes** only for a genuinely new challenge. Use/Apply fills fields and selects the existing form; saving/publishing remains a separate deliberate action. Retain private notes, selected files, contact changes and both language drafts when returning to the assistant. Reapplying a new version explicitly replaces public content only. Manual mode remains usable if the provider is unavailable or not configured.
- [ ] **Step 4: Verify** root build/lint and the real HTTP request contract against the running local backend. Document a small acceptance checklist: notes→preview→answer→refine→apply→save; AR→EN→AR; mobile stacking/RTL; manual↔AI; cancellation; error recovery; loading example over nonempty notes; account switching; ordinary existing editing. Without explicit browser authorization, perform non-browser checks and record visual/interaction checks as outstanding rather than installing/running a browser. Do not add snapshot/markup tests or a large frontend testing stack for this demo.
- [ ] **Step 5: Commit**: `feat: add AI-assisted challenge posting workspace`.

### Task 5: Live scenarios, demo documentation, and deployment configuration

**Files:** Create `server/scripts/evaluate-ai-brief.ts`, `server/scripts/ai-brief-scenarios.ts`, `docs/AI-BRIEF.md`; modify `server/package.json`, `.env.example`, `.env.vps.example`, `server/.env.example`, `compose.demo.yml`, `compose.vps.yml`, `docs/VPS.md`.

**Interfaces:**
- Add `ai:evaluate` server script: `tsx scripts/evaluate-ai-brief.ts`. CLI accepts `--model <id>` and `--output <path>`; loads the server env and invokes the real Task 2 graph directly, never saving/publishing records.
- Scenario entries are `{ id: string; referenceDate: string; request: BriefRequest; checks: { expectedStatus: 'draft' | 'needs_context'; budgetDzd?: number | null; applicationDeadlineDate?: string | null; requiredFacts?: string[] } }`. Pass `new Date(referenceDate)` as the graph's `now` option, and record it separately from the actual evaluation timestamp. String quality checks are reviewer guidance unless they are deterministic facts; do not require the LLM to reproduce a particular title.
- Evaluation output records scenario/model/date, elapsed time, validation result, derived exact-fact checks, and manual-review notes. Keep full outputs under ignored `.superpowers/ai-brief-evaluation/`; commit a concise factual summary to `docs/AI-BRIEF.md` only after running it. No credentials/headers in results.

- [ ] **Step 1: Add source scenarios** for complete EN, complete AR, mixed Arabic/French/English, vague real problem, missing budget/deadline, foreign-currency/ranged amount, delivery duration only, ambiguous/past/invalid submission date, unsupported skill domain, refinement that changes budget but retains the objective, and irrelevant input. Use fixed scenario dates or exact future dates so checks are reproducible. No heavy evaluation framework.
- [ ] **Step 2: With a locally configured key, run the same scenarios on both candidates.** Use ordinary text-mode inference as the baseline. Inspect validity, Arabic/English meaning alignment, preservation of numbers/facts, practical criteria, useful questions, and actual latency. If testing native JSON mode, keep it an optional one-off compatibility probe; an unsupported parameter must not delay baseline completion. Record the chosen model and any remaining limitations honestly. If no key exists, stop only the live-evaluation step and report the missing credential configuration; never ask for a secret in chat or substitute fake successes.
- [ ] **Step 3: Wire server-only configuration** into local packaged/VPS env examples and the **api** environments in both Compose files. Use optional/default values from the spec so missing Featherless credentials do not prevent MVP startup. No key in `VITE_*`, Docker build args, source, docs, or image layers. Document API+frontend rebuild on future deployment; preserve the existing project/network names, all resource limits, Caddy routes, DB/uploads volumes and secure-cookie settings. No new migration, reseed, infrastructure, or live VPS operation is needed for this feature plan.
- [ ] **Step 4: Verify** `npm run test:ai` and `npm run test:integration` in `server` with its separate local test database, root build/lint, backend build/start, and both Compose configurations using placeholder secrets via `config --quiet` (never print resolved real environment). Check core auth/manual posting/editing/private files remain intact. Run an ARM64 image build only at later deployment readiness if authorized and needed; no container download solely for this plan.
- [ ] **Step 5: Write the short demo/setup guide** including model/base URL env configuration, normal-chat JSON fallback, LangGraph flow, how unknown facts/questions behave, what Save/Publish does, and actual verification gaps. Document a 30–45 second AI segment: textile notes → draft → answer image-data question → updated criteria → apply → existing form. Source examples must work beyond a single canned seed and must never masquerade as live AI output.
- [ ] **Step 6: Commit**: `feat: verify AI brief scenarios and prepare demo deployment configuration`.

## Completion evidence and handoff

- [ ] Read all task results and compare against the design; no implementation requirement is satisfied solely by a successful build.
- [ ] Record actual focused/integration/build/lint/live-evaluation results once, plus any browser/visual acceptance not performed.
- [ ] Report local branch/commit and setup instructions. Do not deploy/push unless the user explicitly asks for that next action or has supplied clear authorization for this implementation's delivery.
- [ ] After the **overall implementation** is complete, run the user-required `codex-notify` exactly once as the final tool step. Planning has its own completion notification; intermediate task commits do not.

Expected scope: roughly two to three focused implementation days including scenario trials and integration fixes. This is an estimate, not a promise or a fixed budget. Improvements discovered during trials should prioritize usable drafts and reliable form handoff over adding infrastructure.
