import { config } from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createFeatherlessModel, DEFAULT_FEATHERLESS_MODEL } from '../src/ai/featherless.client';
import { generateChallengeBrief } from '../src/ai/challenge-brief.graph';
import { briefScenarios } from './ai-brief-scenarios';
import { loadAiEnvironment } from '../src/ai/ai.environment';

// The server env takes precedence; root .env is also supported for local setup.
config({ quiet: true });
loadAiEnvironment();

function argument(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

async function main() {
  if (!process.env.FEATHERLESS_API_KEY?.trim()) {
    console.error('Live evaluation needs FEATHERLESS_API_KEY in server/.env or the root .env.');
    process.exitCode = 1;
    return;
  }
  const model = argument('--model') || process.env.FEATHERLESS_MODEL || DEFAULT_FEATHERLESS_MODEL;
  const selected = argument('--scenario');
  const scenarios = briefScenarios.filter(item => !selected || item.id === selected);
  if (!scenarios.length) throw new Error('Unknown scenario');
  const evaluatedAt = new Date().toISOString();
  const output = resolve(argument('--output') || resolve(__dirname, '../../.superpowers/ai-brief-evaluation', `${model.replace(/[^a-z0-9.-]/gi, '_')}-${Date.now()}.json`));
  const results: unknown[] = [];
  const client = createFeatherlessModel({ model });
  for (const scenario of scenarios) {
    const start = Date.now();
    try {
      const result = await generateChallengeBrief(scenario.request, client, {
        signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS) || 180000),
        now: new Date(scenario.referenceDate),
        maxRepairAttempts: Number(process.env.AI_MAX_REPAIR_ATTEMPTS ?? 2),
      });
      const exactChecks: Record<string, boolean> = { status: result.status === scenario.checks.expectedStatus };
      for (const key of ['budgetDzd', 'applicationDeadlineDate'] as const) {
        if (Object.hasOwn(scenario.checks, key)) exactChecks[key] = result.draft?.[key] === scenario.checks[key];
      }
      const text = JSON.stringify(result.draft).toLowerCase();
      const reviewHints = Object.fromEntries((scenario.checks.requiredFacts || []).map(fact => [fact, text.includes(fact.toLowerCase())]));
      const passed = Object.values(exactChecks).every(Boolean);
      results.push({ scenario: scenario.id, referenceDate: scenario.referenceDate, elapsedMs: Date.now() - start, valid: true, exactChecks, passed, reviewHints, manualReviewNotes: 'Review bilingual meaning, source preservation, suggestions, useful questions and deadlines.', result });
      console.log(`${scenario.id}: ${passed ? 'PASS' : 'CHECK FACTS'} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    } catch (error) {
      // Do not persist raw provider exceptions: they may contain request headers.
      const failure = error instanceof Error && ['BriefValidationError', 'AiUnavailableError', 'TimeoutError', 'AbortError'].includes(error.name) ? error.name : 'ProviderOrWorkflowError';
      results.push({ scenario: scenario.id, referenceDate: scenario.referenceDate, elapsedMs: Date.now() - start, valid: false, passed: false, failure });
      console.log(`${scenario.id}: FAILED ${failure} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify({ model, evaluatedAt, results }, null, 2));
  }
  console.log(`Saved ${results.length} scenarios to ${output}`);
  if (results.some(item => !(item as { passed: boolean }).passed)) process.exitCode = 1;
}

main().catch(() => { console.error('Evaluation could not start. Check CLI arguments and local configuration.'); process.exitCode = 1; });
