import { apiRequest } from './client';
import type { DiscussionComment } from '../types';
import { dispatchNotificationsRefresh } from './notifications';

export const listProblemComments = (problemId: string) =>
  apiRequest<DiscussionComment[]>(`/problems/${encodeURIComponent(problemId)}/comments`);
export const createProblemComment = async (problemId: string, body: string, parentId?: string) => {
  const comment = await apiRequest<DiscussionComment>(`/problems/${encodeURIComponent(problemId)}/comments`, {
    method: 'POST', body: JSON.stringify({ body, ...(parentId ? { parentId } : {}) }),
  });
  dispatchNotificationsRefresh();
  return comment;
};
