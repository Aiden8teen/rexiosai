import { apiRequest } from './client';
import type { Page } from './contracts';

export type CommunityReaction = 'helpful' | 'insight';
export type CommunitySort = 'latest' | 'active' | 'unanswered';
export type CommunityLanguage = 'ar' | 'en';

export interface CommunityAuthor {
  id: string;
  name: string;
  nameEn: string;
  avatarChar: string;
  role: 'member' | 'solver' | 'company';
}

export interface CommunityQuestionSummary {
  id: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  tags: string[];
  author: CommunityAuthor;
  createdAt: string;
  lastActivityAt: string;
  views: number;
  answerCount: number;
  helpfulCount: number;
  insightCount: number;
  viewerReactions: CommunityReaction[];
}

export interface CommunityQuestionDetail extends CommunityQuestionSummary {
  body: string;
  bodyEn: string;
  codeSnippet?: string | null;
  acceptedAnswerId: string | null;
}

export interface CommunityAnswer {
  id: string;
  questionId: string;
  author: CommunityAuthor;
  body: string;
  bodyEn: string;
  createdAt: string;
  helpfulCount: number;
  insightCount: number;
  viewerReactions: CommunityReaction[];
  isAccepted: boolean;
}

export interface CommunityOverview {
  contributors: Array<{
    author: CommunityAuthor;
    answerCount: number;
    acceptedAnswerCount: number;
  }>;
  popularTags: Array<{ tag: string; questionCount: number }>;
}

export interface CommunityQuestionFilters {
  q?: string;
  tag?: string;
  sort?: CommunitySort;
  page?: number;
  limit?: number;
}

export interface CreateCommunityQuestionInput {
  language: CommunityLanguage;
  title: string;
  body: string;
  tags: string[];
  codeSnippet?: string;
}

export interface CreateCommunityAnswerInput {
  language: CommunityLanguage;
  body: string;
}

export interface CommunityReactionResult {
  helpfulCount: number;
  insightCount: number;
  viewerReactions: CommunityReaction[];
}

function communityMutation<T>(request: Promise<T>): Promise<T> {
  return request.then((result) => {
    window.dispatchEvent(new Event('rexios:notifications-refresh'));
    return result;
  });
}

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

const questionPath = (id: string) => `/community/questions/${encodeURIComponent(id)}`;

export function listQuestions(filters: CommunityQuestionFilters = {}): Promise<Page<CommunityQuestionSummary>> {
  return apiRequest(`/community/questions${queryString({
    q: filters.q,
    tag: filters.tag,
    sort: filters.sort,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  })}`);
}

export function getQuestion(id: string): Promise<CommunityQuestionDetail> {
  return apiRequest(questionPath(id));
}

export function listAnswers(id: string, page = 1, limit = 20): Promise<Page<CommunityAnswer>> {
  return apiRequest(`${questionPath(id)}/answers${queryString({ page, limit })}`);
}

export function createQuestion(input: CreateCommunityQuestionInput): Promise<CommunityQuestionDetail> {
  return communityMutation(apiRequest('/community/questions', { method: 'POST', body: JSON.stringify(input) }));
}

export function createAnswer(id: string, input: CreateCommunityAnswerInput): Promise<CommunityAnswer> {
  return communityMutation(apiRequest(`${questionPath(id)}/answers`, { method: 'POST', body: JSON.stringify(input) }));
}

async function setReaction(path: string, kind: CommunityReaction, enabled: boolean): Promise<CommunityReactionResult> {
  return communityMutation(apiRequest(`${path}/reactions/${kind}`, { method: enabled ? 'PUT' : 'DELETE' }));
}

export function setQuestionReaction(id: string, kind: CommunityReaction, enabled: boolean): Promise<CommunityReactionResult> {
  return setReaction(questionPath(id), kind, enabled);
}

export function setAnswerReaction(id: string, kind: CommunityReaction, enabled: boolean): Promise<CommunityReactionResult> {
  return setReaction(`/community/answers/${encodeURIComponent(id)}`, kind, enabled);
}

export function selectAcceptedAnswer(id: string, answerId: string | null): Promise<CommunityQuestionDetail> {
  return communityMutation(apiRequest(`${questionPath(id)}/accepted-answer`, {
    method: 'PUT',
    body: JSON.stringify({ answerId }),
  }));
}

export function recordQuestionView(id: string): Promise<{ views: number }> {
  return communityMutation(apiRequest(`${questionPath(id)}/view`, { method: 'POST' }));
}

export function getCommunityOverview(): Promise<CommunityOverview> {
  return apiRequest('/community/overview');
}
