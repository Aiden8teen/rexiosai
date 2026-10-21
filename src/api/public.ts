import { apiRequest } from './client';

export interface PublicStats {
  companiesWithPublishedProblems: number;
  talentAccounts: number;
  openBudgetDzd: number;
  problemsWithSelectedApplicant: number;
}

export const getPublicStats = () => apiRequest<PublicStats>('/public/stats');
