import { apiRequest } from './client';
import type { ApiProblem, EditableProblem, Page, ProblemFilters, ProblemInput, ProblemPatch } from './contracts';

function queryString(filters: ProblemFilters): string {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry));
    else if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

export const listProblems = (filters: ProblemFilters = {}) =>
  apiRequest<Page<ApiProblem>>(`/problems${queryString(filters)}`);
export const getProblem = (id: string) => apiRequest<ApiProblem>(`/problems/${encodeURIComponent(id)}`);
export const listCompanyProblems = (filters: Pick<ProblemFilters, 'page' | 'limit'> = {}) =>
  apiRequest<Page<ApiProblem>>(`/company/problems${queryString(filters)}`);
export const getCompanyProblem = (id: string) => apiRequest<EditableProblem>(`/company/problems/${encodeURIComponent(id)}`);
export const createProblem = (input: ProblemInput) =>
  apiRequest<{ id: string }>('/problems', { method: 'POST', body: JSON.stringify(input) });
export const updateProblem = (id: string, input: ProblemPatch) =>
  apiRequest<EditableProblem>(`/problems/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
export const publishProblem = (id: string) =>
  apiRequest<ApiProblem>(`/problems/${encodeURIComponent(id)}/publish`, { method: 'POST' });
export const closeProblem = (id: string) =>
  apiRequest<ApiProblem>(`/problems/${encodeURIComponent(id)}/close`, { method: 'POST' });
export const getProblemContact = (id: string) =>
  apiRequest<{ contactEmail: string; contactUrl: string }>(`/problems/${encodeURIComponent(id)}/contact`);
export const getProblemPrivate = (id: string) =>
  apiRequest<{ notes: string; files: ApiProblem['files'] }>(`/problems/${encodeURIComponent(id)}/private`);
