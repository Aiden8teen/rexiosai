import type { BriefProgress, BriefRequest, BriefResult } from './contracts';
import { ApiError, apiRequest } from './client';
import { readBriefStream } from '../utils/briefStream';

export function requestChallengeBrief(input: BriefRequest, signal?: AbortSignal): Promise<BriefResult> {
  return apiRequest('/ai/challenge-brief', { method: 'POST', body: JSON.stringify(input), signal });
}

export async function streamChallengeBrief(input: BriefRequest, onProgress: (event: BriefProgress) => void, signal?: AbortSignal): Promise<BriefResult> {
  let response: Response;
  try {
    response = await fetch('/api/ai/challenge-brief/stream', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(input), signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('Could not connect to the draft service. Please retry.', 0);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(error?.message || 'Could not start the draft. Please retry.', response.status);
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new ApiError('The draft connection is unavailable. Please retry.', 0);
  return readBriefStream(response.body, onProgress, signal);
}
