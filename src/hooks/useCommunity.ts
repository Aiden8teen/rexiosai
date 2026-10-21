import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { apiErrorMessage, ApiError } from '../api/client';
import {
  createAnswer,
  createQuestion,
  getCommunityOverview,
  getQuestion,
  listAnswers,
  listQuestions,
  recordQuestionView,
  selectAcceptedAnswer,
  setAnswerReaction,
  setQuestionReaction,
} from '../api/community';
import type {
  CommunityAnswer,
  CommunityOverview,
  CommunityQuestionDetail,
  CommunityQuestionFilters,
  CommunityQuestionSummary,
  CommunityReaction,
  CreateCommunityQuestionInput,
} from '../api/community';
import type { Page } from '../api/contracts';

const ANSWERS_PAGE_SIZE = 20;
const FEED_PAGE_SIZE = 20;
export const MAX_COMMUNITY_PAGE = 10_000;

export function normalizeCommunityPage(value: string | number | null | undefined): number {
  const parsed = value === null || value === undefined || value === '' ? 1 : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_COMMUNITY_PAGE, Math.max(1, Math.floor(parsed)));
}

interface FeedState {
  key: string;
  pages: Record<number, Page<CommunityQuestionSummary>>;
  error: string;
}

function questionsWithReaction(
  pages: Record<number, Page<CommunityQuestionSummary>>,
  id: string,
  result: { helpfulCount: number; insightCount: number; viewerReactions: CommunityReaction[] },
) {
  const updated: Record<number, Page<CommunityQuestionSummary>> = {};
  for (const [page, resultPage] of Object.entries(pages)) {
    updated[Number(page)] = {
      ...resultPage,
      items: resultPage.items.map((question) => question.id === id ? {
        ...question,
        helpfulCount: result.helpfulCount,
        insightCount: result.insightCount,
        viewerReactions: result.viewerReactions,
      } : question),
    };
  }
  return updated;
}

export function useCommunityFeed(filters: CommunityQuestionFilters, identityId: string, lang: 'ar' | 'en' = 'en') {
  const filterKey = JSON.stringify({
    identityId,
    q: filters.q || '',
    tag: filters.tag || '',
    sort: filters.sort || 'latest',
  });
  const page = normalizeCommunityPage(filters.page);
  const [state, setState] = useState<FeedState>({ key: '', pages: {}, error: '' });
  const [mutationIssue, setMutationIssue] = useState<{ key: string; message: string } | null>(null);
  const [pendingReactions, setPendingReactions] = useState<string[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const sequence = useRef(0);
  const identityRef = useRef(identityId);
  const busyReactions = useRef(new Set<string>());
  const requestFilters = useMemo(() => ({ q: filters.q, tag: filters.tag, sort: filters.sort }), [filters.q, filters.tag, filters.sort]);

  useLayoutEffect(() => { identityRef.current = identityId; }, [identityId]);

  useEffect(() => {
    const requestSequence = ++sequence.current;
    let active = true;
    const currentPages = state.key === filterKey ? state.pages : {};

    if (currentPages[page]) return () => { active = false; };

    void listQuestions({ ...requestFilters, page, limit: FEED_PAGE_SIZE }).then((result) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      setState((current) => {
        const pages = current.key === filterKey ? { ...current.pages } : {};
        pages[page] = result;
        return { key: filterKey, pages, error: '' };
      });
    }).catch((error: unknown) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      setState((current) => current.key === filterKey
        ? { ...current, error: apiErrorMessage(error, lang) }
        : { key: filterKey, pages: {}, error: apiErrorMessage(error, lang) });
    });

    return () => { active = false; };
  }, [filterKey, page, refreshNonce, state.key, state.pages, requestFilters, identityId, lang]);

  const visiblePages = useMemo(() => state.key === filterKey ? state.pages : {}, [state.key, state.pages, filterKey]);
  const data = useMemo(() => Object.keys(visiblePages)
    .map(Number)
    .filter((number) => number <= page)
    .sort((a, b) => a - b)
    .flatMap((number) => visiblePages[number]?.items || []), [visiblePages, page]);
  const pageResult = visiblePages[page];
  const anyPage = visiblePages[1] || pageResult || Object.values(visiblePages)[0];
  const total = anyPage?.total ?? 0;
  const error = state.key === filterKey ? state.error : '';
  const loading = !error && !pageResult;
  const mutationError = mutationIssue?.key === filterKey ? mutationIssue.message : '';

  const retry = useCallback(async () => {
    setState((current) => current.key === filterKey ? { ...current, pages: {}, error: '' } : current);
    setRefreshNonce((nonce) => nonce + 1);
  }, [filterKey]);

  const toggleQuestionReaction = useCallback(async (id: string, kind: CommunityReaction) => {
    const question = data.find((item) => item.id === id);
    const busyKey = `${identityId}:${id}:${kind}`;
    const pendingKey = `${filterKey}:${id}:${kind}`;
    if (!question || busyReactions.current.has(busyKey)) return;
    busyReactions.current.add(busyKey);
    setPendingReactions((current) => current.includes(pendingKey) ? current : [...current, pendingKey]);
    setMutationIssue(null);
    try {
      const result = await setQuestionReaction(id, kind, !question.viewerReactions.includes(kind));
      if (identityRef.current !== identityId) return;
      setState((current) => current.key === filterKey ? {
        ...current,
        pages: questionsWithReaction(current.pages, id, result),
      } : current);
    } catch (error) {
      if (identityRef.current === identityId) setMutationIssue({ key: filterKey, message: apiErrorMessage(error, lang) });
    } finally {
      busyReactions.current.delete(busyKey);
      setPendingReactions((current) => current.filter((pending) => pending !== pendingKey));
    }
  }, [data, filterKey, identityId, lang]);

  const pageLimit = pageResult?.limit || anyPage?.limit || FEED_PAGE_SIZE;
  const hasMore = Boolean(anyPage && page * pageLimit < total);
  return {
    questions: data,
    total,
    loading,
    loadingMore: loading && page > 1,
    error,
    mutationError,
    isReactionPending: (id: string, kind: CommunityReaction) => pendingReactions.includes(`${filterKey}:${id}:${kind}`),
    hasMore,
    retry,
    toggleQuestionReaction,
  };
}

export function useCommunityOverview(lang: 'ar' | 'en' = 'en') {
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<unknown>(null);
  const [sequence, setSequence] = useState(0);
  const requestSequence = useRef(0);

  const retry = useCallback(async () => {
    setLoading(true);
    setRequestError(null);
    setSequence((value) => value + 1);
  }, []);

  useEffect(() => {
    const current = ++requestSequence.current;
    let active = true;
    void getCommunityOverview().then((result) => {
      if (active && requestSequence.current === current) setOverview(result);
    }).catch((requestError: unknown) => {
      if (active && requestSequence.current === current) {
        setOverview(null);
        setRequestError(requestError);
      }
    }).finally(() => {
      if (active && requestSequence.current === current) setLoading(false);
    });
    return () => { active = false; };
  }, [sequence]);

  return { overview, loading, error: requestError ? apiErrorMessage(requestError, lang) : '', retry };
}

export function useCreateCommunityQuestion(identityId: string, lang: 'ar' | 'en' = 'en') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const identityRef = useRef(identityId);
  useLayoutEffect(() => { identityRef.current = identityId; }, [identityId]);

  const submit = useCallback(async (input: CreateCommunityQuestionInput) => {
    const requestedBy = identityId;
    setLoading(true);
    setError('');
    try {
      const question = await createQuestion(input);
      return identityRef.current === requestedBy ? question : null;
    } catch (requestError) {
      if (identityRef.current === requestedBy) setError(apiErrorMessage(requestError, lang));
      throw requestError;
    } finally {
      if (identityRef.current === requestedBy) setLoading(false);
    }
  }, [identityId, lang]);

  return { submit, loading, error };
}

interface QuestionState {
  key: string;
  question: CommunityQuestionDetail | null;
  answers: CommunityAnswer[];
  totalAnswers: number;
  answerPage: number;
  loading: boolean;
  loadingAnswers: boolean;
  error: string;
  notFound: boolean;
  answerError: string;
}

const emptyQuestionState = (key = ''): QuestionState => ({
  key,
  question: null,
  answers: [],
  totalAnswers: 0,
  answerPage: 0,
  loading: true,
  loadingAnswers: true,
  error: '',
  notFound: false,
  answerError: '',
});

function compareAnswers(a: CommunityAnswer, b: CommunityAnswer): number {
  const timeDifference = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (Number.isFinite(timeDifference) && timeDifference !== 0) return timeDifference;
  return a.id.localeCompare(b.id);
}

function mergeAnswers(existing: CommunityAnswer[], incoming: CommunityAnswer[]): CommunityAnswer[] {
  const byId = new Map(existing.map((answer) => [answer.id, answer]));
  for (const answer of incoming) byId.set(answer.id, answer);
  return [...byId.values()].sort(compareAnswers);
}

export function useCommunityQuestion(id: string | undefined, identityId: string, lang: 'ar' | 'en' = 'en') {
  const key = `${id || ''}:${identityId}`;
  const [state, setState] = useState<QuestionState>(() => emptyQuestionState());
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [actionIssue, setActionIssue] = useState<{ key: string; message: string } | null>(null);
  const [pendingReactions, setPendingReactions] = useState<string[]>([]);
  const [acceptingKey, setAcceptingKey] = useState('');
  const accepting = useRef(new Set<string>());
  const sequence = useRef(0);
  const identityRef = useRef(identityId);
  const visited = useRef(new Set<string>());
  const busyReactions = useRef(new Set<string>());
  useLayoutEffect(() => { identityRef.current = identityId; }, [identityId]);

  const retry = useCallback(async () => {
    setActionIssue(null);
    setRefreshNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }
    const requestSequence = ++sequence.current;
    let active = true;
    const updateRequestState = (update: (current: QuestionState) => QuestionState) => {
      setState((current) => update(current.key === key ? current : emptyQuestionState(key)));
    };
    const questionRequest = getQuestion(id);
    const answersRequest = listAnswers(id, 1, ANSWERS_PAGE_SIZE);
    void questionRequest.then((question) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      updateRequestState((current) => ({
        ...current,
        question: { ...question, answerCount: Math.max(question.answerCount, current.totalAnswers) },
      }));
      const visitKey = `${id}:${identityId}`;
      if (!visited.current.has(visitKey)) {
        visited.current.add(visitKey);
        void recordQuestionView(id).then(({ views }) => {
          if (identityRef.current === identityId) {
            setState((current) => current.key === key && current.question
              ? { ...current, question: { ...current.question, views } }
              : current);
          }
        }).catch(() => undefined);
      }
    }).catch((error: unknown) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      updateRequestState((current) => ({
        ...current,
        error: apiErrorMessage(error, lang),
        notFound: error instanceof ApiError && error.status === 404,
      }));
    }).finally(() => {
      if (active && sequence.current === requestSequence && identityRef.current === identityId) {
        updateRequestState((current) => ({ ...current, loading: false }));
      }
    });

    void answersRequest.then((result) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      updateRequestState((current) => {
        const totalAnswers = Math.max(current.totalAnswers, result.total);
        return {
        ...current,
        answers: mergeAnswers(current.answers, result.items),
        totalAnswers,
        answerPage: result.page,
        question: current.question ? { ...current.question, answerCount: Math.max(current.question.answerCount, totalAnswers) } : null,
        };
      });
    }).catch((error: unknown) => {
      if (!active || sequence.current !== requestSequence || identityRef.current !== identityId) return;
      if (error instanceof ApiError && error.status === 404) return;
      updateRequestState((current) => ({ ...current, answerError: apiErrorMessage(error, lang) }));
    }).finally(() => {
      if (active && sequence.current === requestSequence && identityRef.current === identityId) {
        updateRequestState((current) => ({ ...current, loadingAnswers: false }));
      }
    });

    return () => { active = false; };
  }, [id, identityId, key, refreshNonce, lang]);

  const current = !id
    ? { ...emptyQuestionState(key), loading: false, error: 'Missing question ID.' }
    : state.key === key ? state : emptyQuestionState(key);
  const toggleQuestionReaction = useCallback(async (kind: CommunityReaction) => {
    const question = current.question;
    if (!id || !question) return;
    const reactionKey = `${id}:${kind}`;
    const busyKey = `${identityId}:${reactionKey}`;
    const pendingKey = `${key}:${reactionKey}`;
    if (busyReactions.current.has(busyKey)) return;
    busyReactions.current.add(busyKey);
    setPendingReactions((value) => value.includes(pendingKey) ? value : [...value, pendingKey]);
    setActionIssue(null);
    try {
      const result = await setQuestionReaction(id, kind, !question.viewerReactions.includes(kind));
      if (identityRef.current === identityId) setState((value) => value.key === key && value.question
        ? { ...value, question: { ...value.question, ...result } }
        : value);
    } catch (error) {
      if (identityRef.current === identityId) setActionIssue({ key, message: apiErrorMessage(error, lang) });
    } finally {
      busyReactions.current.delete(busyKey);
      setPendingReactions((value) => value.filter((pending) => pending !== pendingKey));
    }
  }, [current.question, id, identityId, key, lang]);

  const toggleAnswerReaction = useCallback(async (answerId: string, kind: CommunityReaction) => {
    const answer = current.answers.find((entry) => entry.id === answerId);
    if (!answer) return;
    const reactionKey = `${answerId}:${kind}`;
    const busyKey = `${identityId}:${reactionKey}`;
    const pendingKey = `${key}:${reactionKey}`;
    if (busyReactions.current.has(busyKey)) return;
    busyReactions.current.add(busyKey);
    setPendingReactions((value) => value.includes(pendingKey) ? value : [...value, pendingKey]);
    setActionIssue(null);
    try {
      const result = await setAnswerReaction(answerId, kind, !answer.viewerReactions.includes(kind));
      if (identityRef.current === identityId) setState((value) => value.key === key ? {
        ...value,
        answers: value.answers.map((entry) => entry.id === answerId ? { ...entry, ...result } : entry),
      } : value);
    } catch (error) {
      if (identityRef.current === identityId) setActionIssue({ key, message: apiErrorMessage(error, lang) });
    } finally {
      busyReactions.current.delete(busyKey);
      setPendingReactions((value) => value.filter((pending) => pending !== pendingKey));
    }
  }, [current.answers, identityId, key, lang]);

  const postAnswer = useCallback(async (body: string, language: 'ar' | 'en') => {
    if (!id) throw new Error('Missing question ID.');
    setActionIssue(null);
    try {
      const answer = await createAnswer(id, { language, body });
      if (identityRef.current === identityId) setState((value) => {
        if (value.key !== key) return value;
        const answerAlreadyLoaded = value.answers.some((entry) => entry.id === answer.id);
        const totalAnswers = value.totalAnswers + (answerAlreadyLoaded ? 0 : 1);
        return {
          ...value,
          answers: mergeAnswers(value.answers, [answer]),
          totalAnswers,
          question: value.question ? {
            ...value.question,
            answerCount: Math.max(value.question.answerCount + (answerAlreadyLoaded ? 0 : 1), totalAnswers),
            lastActivityAt: answer.createdAt,
          } : null,
        };
      });
      return answer;
    } catch (error) {
      if (identityRef.current === identityId) setActionIssue({ key, message: apiErrorMessage(error, lang) });
      throw error;
    }
  }, [id, identityId, key, lang]);

  const chooseAcceptedAnswer = useCallback(async (answerId: string | null) => {
    if (!id) return;
    if (accepting.current.has(key)) return;
    accepting.current.add(key);
    setAcceptingKey(key);
    setActionIssue(null);
    try {
      const question = await selectAcceptedAnswer(id, answerId);
      if (identityRef.current === identityId) setState((value) => value.key === key ? {
        ...value,
        question,
        answers: value.answers.map((answer) => ({ ...answer, isAccepted: answer.id === question.acceptedAnswerId })),
      } : value);
    } catch (error) {
      if (identityRef.current === identityId) setActionIssue({ key, message: apiErrorMessage(error, lang) });
      throw error;
    } finally {
      accepting.current.delete(key);
      setAcceptingKey((current) => current === key ? '' : current);
    }
  }, [id, identityId, key, lang]);

  const loadMoreAnswers = useCallback(async () => {
    if (!id || !current.question || current.loadingAnswers || current.answers.length >= current.totalAnswers) return;
    const nextPage = current.answerPage + 1;
    setState((value) => value.key === key ? { ...value, loadingAnswers: true, answerError: '' } : value);
    try {
      const result = await listAnswers(id, nextPage, ANSWERS_PAGE_SIZE);
      if (identityRef.current !== identityId) return;
      setState((value) => value.key === key ? {
        ...value,
        answers: mergeAnswers(value.answers, result.items),
        totalAnswers: Math.max(value.totalAnswers, result.total),
        answerPage: result.page,
        loadingAnswers: false,
      } : value);
    } catch (error) {
      if (identityRef.current === identityId) setState((value) => value.key === key
        ? { ...value, answerError: apiErrorMessage(error, lang), loadingAnswers: false }
        : value);
    }
  }, [current.answerPage, current.answers.length, current.loadingAnswers, current.question, current.totalAnswers, id, identityId, key, lang]);

  return {
    question: current.question,
    answers: current.answers,
    totalAnswers: current.totalAnswers,
    loading: current.loading,
    loadingAnswers: current.loadingAnswers,
    error: current.error,
    answerError: current.answerError,
    actionError: actionIssue?.key === key ? actionIssue.message : '',
    isReactionPending: (targetId: string, kind: CommunityReaction) => pendingReactions.includes(`${key}:${targetId}:${kind}`),
    notFound: current.notFound,
    hasMoreAnswers: current.answers.length < current.totalAnswers,
    acceptingAnswer: acceptingKey === key,
    retry,
    loadMoreAnswers,
    toggleQuestionReaction,
    toggleAnswerReaction,
    postAnswer,
    chooseAcceptedAnswer,
  };
}
