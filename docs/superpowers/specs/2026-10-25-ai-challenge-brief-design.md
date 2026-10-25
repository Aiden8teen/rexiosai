# AI-assisted challenge drafting

Status: proposed design accompanying the requested implementation plan; product implementation is not authorized by the planning request.

## Intent and scope

Turn a company's rough description into a useful, editable industrial challenge. The demo should visibly transform notes into a brief, surface unanswered questions, and transfer the result into the existing posting form. Success means usable drafts across complete, incomplete, Arabic, English, and mixed-language inputs, not production infrastructure.

User requirements: use course material through LangChain/LangGraph, few-shot prompting, validated output, Featherless inference, a newer 20–50B model, clear UI hierarchy, the current visual theme, and modest implementation effort. Do not impose restrictive AI usage allowances or build production guardrail systems.

Here, using course material means using the taught frameworks and prompting/workflow techniques. The assistant does not retrieve or ingest course documents; its content comes from company notes, not a course-content knowledge base.

### Approaches and decisions

- Draft first, optional refinement: immediate preview; answer questions or request changes afterward. Recommended in the discussion and used here as the planner's assumption, since the user requested the plan without selecting a different flow.
- Questions first: better initial completeness, but delays the visible transformation. Deferred.
- An open-ended chatbot: greater conversational freedom, but more interface and state management for this task. Deferred.

Other planner decisions: assist **new challenge creation only**; generate Arabic and English text together to fit the existing bilingual model; keep proposals transient until ordinary Save draft/Publish; use a synchronous request and honest loading indicator rather than token/event streaming. These are proposed choices, not previously explicit user decisions.

## Product flow

At `/company/problems/new`, use two clearly labelled modes: **Describe with AI** / **Fill manually**, defaulting to AI. Manual mode is always selectable; an unavailable/unconfigured provider shows a recoverable message in AI mode without blocking manual posting. No availability-discovery endpoint is needed. Existing editing routes retain their normal experience. Inside the AI mode:

1. A prominent notes textarea, short example-load actions (textile inspection, maintenance, inventory), and **Generate draft**. Examples insert source notes, never prerecorded AI results; loading one should not erase nonempty notes without an explicit replace action.
2. After generation, show a challenge preview next to the notes on desktop and beneath them on mobile. Prioritize title, objective/description, deliverables, skills, constraints, and evaluation criteria, followed by budget and application deadline. Reuse current colors, borders, tags, buttons, `font-num`, and RTL conventions.
3. Preview switches between Arabic and English without another request. Small **Provided**, **Suggested**, and **Needs input** labels explain field provenance. Provenance is an AI assessment, not verified truth or a confidence percentage.
4. Display optional follow-up questions and a free-text **What would you change?** input. **Update draft** sends current notes, the last valid draft, question answers, and requested changes. Questions are prioritized and expandable rather than a mandatory questionnaire or a hard three-question ceiling.
5. **Use this draft** transfers the public fields to the existing editable form. It does not save, publish, or change company/private/file fields. Unknown budget/deadline remain empty. Existing Save draft and Save and publish behavior completes the flow.

Keep the manual form mounted while switching modes so file selections, notes, contact edits, generated fields, and private details survive within the page visit. Applying a newer AI draft is an explicit replacement of public brief fields only. Returning to the AI workspace retains the last notes/answers/valid preview. Switching interface language must preserve both form language buffers. Switching accounts or leaving the page clears this temporary workspace; refreshing before saving can also clear it. No browser-storage/checkpoint persistence is required.

During generation use an ordinary spinner and **Preparing your draft…**; do not simulate node progress or show chain-of-thought. Allow cancel, retry, and further refinements. A failed request keeps the last good preview and all inputs. Only the latest request may update the page; cancel/dispose requests on account change or unmount. This is normal UI correctness, not a usage restriction.

## Input, output, and API

One session-authenticated company endpoint: `POST /api/ai/challenge-brief`, HTTP 200 on a successful draft **or** useful needs-context response. It performs no database writes. Reuse `SessionGuard`, `requireRole(user, 'COMPANY')`, origin protection, and the existing error envelope.

```ts
type LocalizedText = { ar: string; en: string };
type BriefDraft = {
  title: string; titleEn: string;
  summary: string; summaryEn: string;
  description: string; descriptionEn: string;
  deliverables: string[]; deliverablesEn: string[];
  constraints: string[]; constraintsEn: string[];
  criteria: string[]; criteriaEn: string[];
  skills: string[];
  category: 'BUG' | 'ISSUE' | 'CHALLENGE';
  difficulty: 'small' | 'medium' | 'expert';
  budgetDzd: number | null;
  applicationDeadlineDate: string | null; // YYYY-MM-DD, not delivery duration
};
type BriefField = keyof BriefDraft;
type BriefRequest = {
  notes: string;
  lang: 'ar' | 'en';
  timeZone?: string; // browser's IANA zone; default Africa/Algiers
  previousDraft?: BriefDraft;
  answers?: { questionId: string; question: string; answer: string }[];
  instructions?: string;
};
type BriefQuestion = {
  id: string;
  field: BriefField | 'context';
  text: LocalizedText;
};
type BriefResult = {
  status: 'draft' | 'needs_context';
  draft: BriefDraft | null;
  fieldSources: Partial<Record<BriefField, 'provided' | 'suggested' | 'missing'>>;
  questions: BriefQuestion[];
  warnings: LocalizedText[];
};
```

`draft` status requires a usable draft; `needs_context` requires `draft: null` and at least one useful question. An actual but incomplete problem still gets a draft; greetings or unrelated text get needs-context instead of an invented industrial scenario. Optional missing-source entries render conservatively as **Suggested**, and null money/date fields always render **Needs input**.

Backend validates these contracts with Zod; the frontend mirrors the small wire types in its existing API contracts. Request strings are trimmed and notes must be nonempty. Let the existing shared JSON parser accept **1 MiB** so normal bilingual previous-draft payloads do not hit its small default; this is a payload compatibility setting, not a usage allowance. Keep existing per-field posting limits rather than introducing arbitrary tiny AI text/word limits.

Errors: malformed input 400; unauthenticated 401; non-company 403; valid-looking but repeatedly malformed model output 422; upstream failure 502; missing AI configuration or provider capacity unavailable 503; timeout 504. Use bilingual messages selected by request language and existing `ApiErrorFilter`; no shared error-filter refactor is needed. Do not expose upstream headers/keys or raw model responses in error messages.

## AI implementation

Use the existing Node 24/NestJS process, not a Python service. Add mutually compatible, pinned-at-implementation versions of `@langchain/core`, `@langchain/openai`, `@langchain/langgraph`, and `zod` to **server** dependencies. Verify the generated CommonJS build starts on Node 24; do not convert the entire backend to ESM for this feature.

Featherless configuration:

- `FEATHERLESS_API_KEY`: server-only; lazy AI initialization lets the rest of the MVP run without a key.
- `FEATHERLESS_BASE_URL=https://api.featherless.ai/v1`.
- `FEATHERLESS_MODEL=Qwen/Qwen3.6-35B-A3B` as initial candidate; compare `google/gemma-4-31B-it` on the same scenarios before finalizing.
- `AI_REQUEST_TIMEOUT_MS=180000`, the whole graph/request timeout.
- `AI_MAX_OUTPUT_TOKENS=12000`, a generous output budget, configurable after real trials.
- `AI_MAX_REPAIR_ATTEMPTS=2`: original call plus up to two automatic corrections, to avoid a stuck request. Users can retry/refine without a daily/monthly allowance or refinement count.

No subscription tiers, per-user quotas, spending circuit breakers, CAPTCHA, mandatory caching, queue service, AI audit schema, or orchestration server. Finite retries, cancel, and timeout are usability controls, not credit rationing. Defaults should favor complete drafts over saving a few tokens. Disable implicit SDK retries so automatic requests have one clear policy; provider/network errors return a retryable UI error rather than pretending to be schema problems.

### Graph

`prepare_context → generate → validate → return`

If validation fails and repairs remain: `validate → repair → validate`. If still invalid, return an actionable error. `prepare_context` supplies the current `SKILLS` list, existing posting limits, current date/time zone, raw notes, answers, previous draft, and refinement instructions. No LLM call is needed for this deterministic node. Generation and repair use LangChain messages. Validation is deterministic Zod/application code. This is an honest LangGraph workflow, not several fictional autonomous agents.

### Output transport and prompting

Use normal chat completions requesting one JSON object, with few-shot examples and local parsing/validation. Do **not** require `response_format`, tool-call output, or native JSON-schema support. An optional compatibility probe may test native formatting during implementation; retain text mode as the baseline and do not make a broken native parameter a per-request failure/retry cycle.

Use three concise example input/output pairs: complete English challenge, incomplete Arabic challenge, mixed-language challenge with delivery duration but no submission deadline. Show nullable facts, bilingual output, suggested acceptance criteria, and relevant questions. Supply a low-variance generation setting suited to the model; test non-thinking/direct output using the provider-supported template option rather than relying on `/no_think` or regex deletion of thought blocks. Keep any separate reasoning out of UI and parse only the actual final answer. If direct mode is unsupported or slow, use the comparison candidate based on evaluation evidence.

Parse a JSON object directly or inside a single enclosing JSON Markdown fence. Do not use greedy first-brace/last-brace recovery or `eval`. Feed schema issues and the original source into repair; never invent substitute content after provider failure. User answers/refinement instructions outrank stale previous-draft values. The model must preserve unmodified source facts and revise the affected content coherently in both languages.

### Useful content rules

- Validation checks structure and compatibility, not truth. User review remains necessary; no elaborate adversarial filtering or automated fact-verification subsystem.
- Missing budget stays null; budget ranges, foreign currency without DZD conversion supplied by the company, and unclear amounts become questions. Do not invent exchange rates or claim market budget estimates.
- A project duration (e.g. four weeks to deliver) belongs in requirements, not `applicationDeadlineDate`. An explicit unambiguous submission date can populate that field. Resolve clear relative submission dates against the supplied date/zone; ambiguous dates stay null with a question. Invalid calendar dates fail validation. Past dates stay null with a warning/question instead of blocking the entire brief.
- Suggested skills use the existing taxonomy, with one to five distinct tags. A challenge outside its coverage can use an empty list plus a warning/question; the ordinary form still requires at least one supported skill before publishing. Do not redesign the skill catalogue here.
- Match existing title (160), summary (500), description (20,000), list-item (1,000), and list-count (30) limits. Check both language variants. These prevent a draft that cannot be saved; they do not require fully publishable input to generate.
- Proposed performance targets and deliverables are suggestions; do not present fabricated accuracy, existing datasets, cameras, costs, or approvals as source facts.
- Only explicitly submitted notes/answers and the public previous draft go to the model. Existing private notes, files, company contact settings, and other users' records are not fetched or attached automatically.

## Form integration

Separate the AI draft type from persisted `EditableProblem`: generation has no ID and nullable facts. Add a public-field application adapter; do not manufacture a fake saved problem. Maintain Arabic/English public text buffers independently in `ProblemForm` and construct `ProblemInput` from both. Fix the existing language-change refetch/remount path so it cannot discard in-progress form edits.

Apply `applicationDeadlineDate` to the datetime-local field at **23:59 on that date in the user's browser timezone**, visibly editable before saving; use the existing form's conversion to ISO on save. Unknown budget/date map to empty controls, not `0`, today's date, or a generated default. Descriptions carry any delivery-duration requirement because there is no separate delivery-duration database field.

Generated content and manual edits must survive AR→EN→AR, both modes, and successful refinement. Once users explicitly apply a newer AI draft it replaces public fields in both language buffers; private notes, company/contact values, upload selections, and saved problem identity are untouched. Closed/existing problems retain their original permission and public-lock behavior; AI is not offered on their edit route in v1.

## Verification and delivery

Small meaningful checks using existing Node test/tsx infrastructure: parser/schema, graph repair, endpoint auth and no writes, form adapter and bilingual serialization. A local fake inference HTTP endpoint exercises real LangChain request/response integration without live credits. Do not add a frontend testing framework or tests mirroring presentation markup.

Run a finite live evaluation on both candidate models with the same scenarios: detailed EN, detailed AR, mixed language, vague-but-real, delivery-only duration, missing/ranged/foreign budget, ambiguous/past submission date, unsupported skill domain, refinement changes, and a deliberately irrelevant input. Report latency, whether local validation succeeded, and substantive errors. Choose based on usable drafts and Arabic quality, not just token speed. Keep generated sample results labelled with actual model/date; they are QA evidence, not fake live responses.

Build/lint the frontend and compile/start the actual backend. Reuse the existing integration suite once touched tests pass. No Playwright/browser automation unless explicitly requested for the implementation turn; record that visual RTL/responsive acceptance remains unverified if no browser check is authorized. Do not claim HTTP/build checks prove layout quality.

Document a short demo: rough textile notes → bilingual draft → clarify available training images → use draft → normal save/publish. Keep a few documented seed-independent examples in the helper; no new fake users or production reseeding.

Deployment preparation later adds AI environment pass-through to `compose.demo.yml`, `compose.vps.yml`, `.env.example`, `server/.env.example`, `.env.vps.example`. The real key is never committed or passed as a frontend `VITE_*` setting. Future deployment rebuilds **api and rexios-web**, keeps the PostgreSQL/uploads volumes, and requires no migration, proxy change, new port, or service. This planning task does not access or modify the VPS.

## Reference decisions

- https://docs.langchain.com/oss/javascript/concepts/providers-and-models#openai-compatible-endpoints
- https://docs.langchain.com/oss/javascript/langgraph/workflows-agents
- https://featherless.ai/docs/api-overview-and-common-options
- https://featherless.ai/docs/completions
- https://featherless.ai/models/Qwen/Qwen3.6-35B-A3B
- https://featherless.ai/models/google/gemma-4-31B-it

Versions/provider behavior are verified at implementation before installing dependencies or choosing native-output parameters. The model shortlist is researched, not yet benchmarked on Rexios inputs.
