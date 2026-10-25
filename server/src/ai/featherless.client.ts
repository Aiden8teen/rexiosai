import { ChatOpenAI } from '@langchain/openai';
import type { BaseMessage } from '@langchain/core/messages';

export const DEFAULT_FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
export const DEFAULT_FEATHERLESS_MODEL = 'Qwen/Qwen3.6-35B-A3B';
const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_MAX_OUTPUT_TOKENS = 12000;

export interface BriefModel {
  complete(messages: BaseMessage[], signal: AbortSignal): Promise<string>;
}

export class AiUnavailableError extends Error {
  constructor() {
    super('AI drafting is not configured.');
    this.name = 'AiUnavailableError';
  }
}

type FeatherlessOverrides = { model?: string; baseURL?: string; apiKey?: string };

function positiveSetting(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function configuredValue(override: string | undefined, environmentName: string, fallback: string): string {
  return (override ?? process.env[environmentName] ?? fallback).trim();
}

function finalText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(block => {
      if (typeof block === 'object' && block !== null && 'type' in block &&
        (block.type === 'text' || block.type === 'output_text') &&
        'text' in block && typeof block.text === 'string') {
        return block.text;
      }
      return '';
    }).join('');
  }
  throw new Error('Featherless returned no text content.');
}

export function createFeatherlessModel(overrides: FeatherlessOverrides = {}): BriefModel {
  return {
    async complete(messages, signal) {
      const apiKey = (overrides.apiKey ?? process.env.FEATHERLESS_API_KEY ?? '').trim();
      if (!apiKey) throw new AiUnavailableError();

      const model = new ChatOpenAI({
        model: configuredValue(overrides.model, 'FEATHERLESS_MODEL', DEFAULT_FEATHERLESS_MODEL),
        apiKey,
        configuration: {
          baseURL: configuredValue(overrides.baseURL, 'FEATHERLESS_BASE_URL', DEFAULT_FEATHERLESS_BASE_URL).replace(/\/+$/, ''),
        },
        temperature: 0.2,
        maxRetries: 0,
        timeout: positiveSetting('AI_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
        maxTokens: positiveSetting('AI_MAX_OUTPUT_TOKENS', DEFAULT_MAX_OUTPUT_TOKENS),
        modelKwargs: { chat_template_kwargs: { enable_thinking: false } },
      });

      const response = await model.invoke(messages, { signal });
      return finalText(response.content);
    },
  };
}
