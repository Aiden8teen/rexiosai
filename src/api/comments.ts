import { apiRequest } from './client';
import type { DiscussionComment } from '../types';

export const listProblemComments = (problemId: string) =>
  apiRequest<DiscussionComment[]>(`/problems/${encodeURIComponent(problemId)}/comments`);
export const createProblemComment = (problemId: string, body: string, parentId?: string) =>
  apiRequest<DiscussionComment>(`/problems/${encodeURIComponent(problemId)}/comments`, {
    method: 'POST', body: JSON.stringify({ body, ...(parentId ? { parentId } : {}) }),
  });
