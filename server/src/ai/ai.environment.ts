import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

const AI_ENV_NAMES = [
  'FEATHERLESS_API_KEY',
  'FEATHERLESS_BASE_URL',
  'FEATHERLESS_MODEL',
  'AI_REQUEST_TIMEOUT_MS',
  'AI_MAX_OUTPUT_TOKENS',
  'AI_MAX_REPAIR_ATTEMPTS',
] as const;

export function loadAiEnvironment(): void {
  let rootEnvironment: Record<string, string>;
  try {
    rootEnvironment = parse(readFileSync(resolve(__dirname, '../../../.env')));
  } catch {
    return;
  }

  for (const name of AI_ENV_NAMES) {
    const current = process.env[name];
    const configured = rootEnvironment[name];
    if ((!current || !current.trim()) && configured?.trim()) process.env[name] = configured.trim();
  }
}
