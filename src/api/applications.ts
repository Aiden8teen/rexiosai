import { apiRequest } from './client';
import type { ApiApplication, ApplicationInput, Page } from './contracts';

export const saveApplicationDraft = (problemId: string, input: ApplicationInput) =>
  apiRequest<ApiApplication>(`/problems/${encodeURIComponent(problemId)}/application/draft`, { method: 'PUT', body: JSON.stringify(input) });
export const submitApplication = (problemId: string, input: ApplicationInput) =>
  apiRequest<ApiApplication>(`/problems/${encodeURIComponent(problemId)}/applications`, { method: 'POST', body: JSON.stringify(input) });
export const listMyApplications = (page = 1, limit = 50) =>
  apiRequest<Page<ApiApplication>>(`/me/applications?page=${page}&limit=${limit}`);
export const listCompanyApplications = (problemId: string, page = 1, limit = 50) =>
  apiRequest<Page<ApiApplication>>(`/company/problems/${encodeURIComponent(problemId)}/applications?page=${page}&limit=${limit}`);
export const decideApplication = (id: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string) =>
  apiRequest<ApiApplication>(`/applications/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, ...(reason ? { reason } : {}) }),
  });
