import { apiRequest } from './client';
import type { ApiApplication, ApplicationInput, Page } from './contracts';
import { dispatchNotificationsRefresh } from './notifications';

export const saveApplicationDraft = (problemId: string, input: ApplicationInput) =>
  apiRequest<ApiApplication>(`/problems/${encodeURIComponent(problemId)}/application/draft`, { method: 'PUT', body: JSON.stringify(input) });
export const submitApplication = async (problemId: string, input: ApplicationInput) => {
  const application = await apiRequest<ApiApplication>(`/problems/${encodeURIComponent(problemId)}/applications`, { method: 'POST', body: JSON.stringify(input) });
  dispatchNotificationsRefresh();
  return application;
};
export const listMyApplications = (page = 1, limit = 50) =>
  apiRequest<Page<ApiApplication>>(`/me/applications?page=${page}&limit=${limit}`);
export const listCompanyApplications = (problemId: string, page = 1, limit = 50) =>
  apiRequest<Page<ApiApplication>>(`/company/problems/${encodeURIComponent(problemId)}/applications?page=${page}&limit=${limit}`);
export const decideApplication = async (id: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string) => {
  const application = await apiRequest<ApiApplication>(`/applications/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, ...(reason ? { reason } : {}) }),
  });
  dispatchNotificationsRefresh();
  return application;
};
