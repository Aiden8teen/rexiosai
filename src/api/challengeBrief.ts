import type { BriefRequest, BriefResult } from './contracts';
import { apiRequest } from './client';

export function requestChallengeBrief(input: BriefRequest, signal?: AbortSignal): Promise<BriefResult> {
  return apiRequest('/ai/challenge-brief', { method: 'POST', body: JSON.stringify(input), signal });
}
