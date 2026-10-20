import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Language, UserRole, User, SolverProfile, CompanyProfile, Problem, SolutionSubmission, DiscussionComment } from '../types';
import { GUEST_USER } from '../data/guest';
import { ApiError } from '../api/client';
import { login as loginRequest, logout as logoutRequest, register as registerRequest, getCurrentUser } from '../api/auth';
import { updateMyProfile } from '../api/profiles';
import { createProblemComment } from '../api/comments';
import { getProblem, listProblems } from '../api/problems';
import { listMyApplications, saveApplicationDraft as saveDraftRequest, submitApplication as submitRequest } from '../api/applications';
import { mapApiProblem, mapApiUser } from '../api/mappers';
import type { AccountType, ApplicationInput, ProblemFilters } from '../api/contracts';

interface EligibilityResult {
  isEligible: boolean;
  matchedSkills: string[];
  matchCount: number;
  totalCount: number;
  status: 'visitor' | 'company' | 'needs_profile' | 'mismatch' | 'eligible' | 'submitted';
}
interface AppContextType {
  lang: Language; dir: 'rtl' | 'ltr'; setLang: (lang: Language) => void; toggleLang: () => void;
  currentUser: User; currentRole: UserRole; authLoading: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, accountType: AccountType) => Promise<User>;
  logout: () => Promise<void>; refreshAuth: () => Promise<void>;
  updateSolverProfile: (profile: Partial<SolverProfile>) => Promise<void>;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  problems: Problem[]; problemsLoading: boolean; problemsError: string;
  refreshProblems: () => Promise<void>;
  loadProblems: (filters?: ProblemFilters) => Promise<{ items: Problem[]; total: number; page: number; limit: number }>;
  loadProblem: (id: string) => Promise<Problem>;
  addProblemComment: (problemId: string, body: string, replyToId?: string) => Promise<void>;
  submissions: SolutionSubmission[]; refreshApplications: () => Promise<void>;
  saveApplicationDraft: (problemId: string, input: ApplicationInput) => Promise<string>;
  submitApplication: (problemId: string, input: ApplicationInput) => Promise<void>;
  calculateEligibility: (problemId: string, problemTags: string[]) => EligibilityResult;
  isAuthModalOpen: boolean; openAuthModal: () => void; closeAuthModal: () => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);

type ApiApplication = Awaited<ReturnType<typeof listMyApplications>>['items'][number];
const mapApplication = (application: ApiApplication): SolutionSubmission => ({
  id: application.id, problemId: application.problemId, userId: application.applicantUserId,
  summary: application.coverMessage, deliveryTime: String(application.deliveryDays) + ' days',
  projectUrl: application.projectUrl, fileName: application.files?.[0]?.originalName,
  submittedAt: application.submittedAt || '',
  rejectionReason: application.rejectionReason,
  status: application.status === 'DRAFT' ? 'draft' : application.status === 'ACCEPTED' ? 'accepted' : application.status === 'REJECTED' ? 'rejected' : 'under_review',
});

function includeCommittedComment(
  discussions: DiscussionComment[],
  comment: DiscussionComment,
  parentId?: string,
): DiscussionComment[] {
  if (discussions.some((entry) => entry.id === comment.id || entry.replies?.some((reply) => reply.id === comment.id))) return discussions;
  if (!parentId) return [...discussions, comment];
  return discussions.map((entry) => entry.id === parentId
    ? { ...entry, replies: [...(entry.replies || []), comment] }
    : entry);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => localStorage.getItem('rexios_lang') === 'en' ? 'en' : 'ar');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [currentRole, setCurrentRole] = useState<UserRole>('visitor');
  const [authLoading, setAuthLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [problemsError, setProblemsError] = useState('');
  const [submissions, setSubmissions] = useState<SolutionSubmission[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const authRefreshSequence = useRef(0);
  const currentUserIdRef = useRef(GUEST_USER.id);

  const setSignedInIdentity = (user: User) => {
    currentUserIdRef.current = user.id;
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const setLang = (newLang: Language) => { setLangState(newLang); localStorage.setItem('rexios_lang', newLang); };
  const toggleLang = () => setLang(lang === 'ar' ? 'en' : 'ar');
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; }, [lang, dir]);

  const refreshApplications = async () => {
    if (currentRole === 'visitor' || currentRole === 'company') { setSubmissions([]); return; }
    const requestedByUserId = currentUserIdRef.current;
    try {
      const page = await listMyApplications();
      if (currentUserIdRef.current === requestedByUserId) setSubmissions(page.items.map(mapApplication));
    } catch (error) {
      if (currentUserIdRef.current !== requestedByUserId) return;
      if (error instanceof ApiError && error.status === 401) setSubmissions([]);
      else throw error;
    }
  };

  const refreshAuth = useCallback(async () => {
    const sequence = ++authRefreshSequence.current;
    try {
      const user = mapApiUser(await getCurrentUser());
      if (sequence !== authRefreshSequence.current) return;
      const identityChanged = currentRole === 'visitor' || user.id !== currentUser.id;
      setSignedInIdentity(user);
      if (identityChanged) {
        setSubmissions([]);
        setIsAuthModalOpen(false);
        if (user.role !== 'company') {
          void listMyApplications().then((page) => {
            if (sequence === authRefreshSequence.current && currentUserIdRef.current === user.id) setSubmissions(page.items.map(mapApplication));
          }).catch(() => undefined);
        }
      }
    } catch (error) {
      if (sequence !== authRefreshSequence.current) return;
      if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 404)) throw error;
      setSignedInIdentity(GUEST_USER); setSubmissions([]); setIsAuthModalOpen(false);
    } finally { if (sequence === authRefreshSequence.current) setAuthLoading(false); }
  }, [currentRole, currentUser.id]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === 'visible') void refreshAuth().catch(() => undefined);
    };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [refreshAuth]);

  const refreshProblems = async () => {
    setProblemsLoading(true); setProblemsError('');
    try {
      const page = await listProblems({ page: 1, limit: 50, sort: 'newest' });
      setProblems(page.items.map(mapApiProblem));
    } catch (error) {
      setProblems([]);
      setProblemsError(error instanceof Error ? error.message : 'Could not load problems.');
    } finally { setProblemsLoading(false); }
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      const sequence = authRefreshSequence.current;
      const [userResult, problemResult] = await Promise.allSettled([
        getCurrentUser(), listProblems({ page: 1, limit: 50, sort: 'newest' }),
      ]);
      if (!mounted || sequence !== authRefreshSequence.current) return;
      if (userResult.status === 'fulfilled') {
        const user = mapApiUser(userResult.value);
        setSignedInIdentity(user);
        if (user.role !== 'company') {
          const apps = await listMyApplications().catch(() => null);
          if (mounted && apps && currentUserIdRef.current === user.id) setSubmissions(apps.items.map(mapApplication));
        }
      } else { setSignedInIdentity(GUEST_USER); }
      if (problemResult.status === 'fulfilled') setProblems(problemResult.value.items.map(mapApiProblem));
      else {
        setProblems([]);
        setProblemsError(problemResult.reason instanceof Error ? problemResult.reason.message : 'Could not load problems.');
      }
      if (mounted) { setAuthLoading(false); setProblemsLoading(false); }
    };
    void initialize();
    return () => { mounted = false; };
  }, []);

  const setSignedInUser = (raw: User) => {
    const user = mapApiUser(raw);
    authRefreshSequence.current++;
    setSignedInIdentity(user); setSubmissions([]); setAuthLoading(false);
    void refreshProblems();
    if (user.role !== 'company') {
      void listMyApplications().then((page) => {
        if (currentUserIdRef.current === user.id) setSubmissions(page.items.map(mapApplication));
      }).catch(() => {
        if (currentUserIdRef.current === user.id) setSubmissions([]);
      });
    }
    return user;
  };
  const login = async (email: string, password: string) => setSignedInUser(await loginRequest(email, password));
  const signup = async (name: string, email: string, password: string, accountType: AccountType) =>
    setSignedInUser(await registerRequest(name, email, password, accountType));
  const logout = async () => {
    authRefreshSequence.current++;
    try { await logoutRequest(); }
    finally {
      authRefreshSequence.current++;
      setSignedInIdentity(GUEST_USER); setSubmissions([]); setProblems([]);
      void refreshProblems();
    }
  };
  const switchRole = (_role: UserRole) => { /* visible demo control; account roles are API-derived */ };
  const updateSolverProfile = async (profile: Partial<SolverProfile>) => {
    const requestedByUserId = currentUserIdRef.current;
    const { completenessPercent: _completenessPercent, cvFileName: _cvFileName, ...editable } = profile;
    const user = mapApiUser(await updateMyProfile(editable));
    if (currentUserIdRef.current === requestedByUserId) setSignedInIdentity(user);
  };
  const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    const requestedByUserId = currentUserIdRef.current;
    const user = mapApiUser(await updateMyProfile(profile));
    if (currentUserIdRef.current === requestedByUserId) setSignedInIdentity(user);
  };

  const loadProblems = async (filters: ProblemFilters = {}) => {
    setProblemsLoading(true);
    setProblemsError('');
    if (!filters.page || filters.page === 1) setProblems([]);
    try {
      const page = await listProblems(filters);
      const items = page.items.map(mapApiProblem);
      setProblems((current) => filters.page && filters.page > 1 ? [...current, ...items] : items);
      return { ...page, items };
    } catch (error) {
      setProblems([]);
      setProblemsError(error instanceof Error ? error.message : 'Could not load problems.');
      throw error;
    } finally { setProblemsLoading(false); }
  };
  const loadProblem = async (id: string) => {
    const problem = mapApiProblem(await getProblem(id));
    setProblems((current) => [problem, ...current.filter((item) => item.id !== id)]);
    return problem;
  };
  const addProblemComment = async (problemId: string, body: string, replyToId?: string) => {
    if (currentRole === 'visitor') { setIsAuthModalOpen(true); return; }
    const requestedByUserId = currentUserIdRef.current;
    const createdDiscussionComment = await createProblemComment(problemId, body, replyToId);
    if (currentUserIdRef.current !== requestedByUserId) return;
    setProblems((current) => {
      if (currentUserIdRef.current !== requestedByUserId) return current;
      return current.map((problem) => problem.id === problemId ? {
        ...problem,
        discussions: includeCommittedComment(problem.discussions, createdDiscussionComment, replyToId),
      } : problem);
    });

    void getProblem(problemId).then((rawProblem) => {
      if (currentUserIdRef.current !== requestedByUserId) return;
      const refreshedProblem = mapApiProblem(rawProblem);
      refreshedProblem.discussions = includeCommittedComment(refreshedProblem.discussions, createdDiscussionComment, replyToId);
      setProblems((current) => {
        if (currentUserIdRef.current !== requestedByUserId) return current;
        return current.map((problem) => problem.id === problemId ? refreshedProblem : problem);
      });
    }).catch(() => undefined);
  };
  const saveApplicationDraft = async (problemId: string, input: ApplicationInput) => {
    const requestedByUserId = currentUserIdRef.current;
    const application = await saveDraftRequest(problemId, input);
    if (currentUserIdRef.current === requestedByUserId) {
      setSubmissions((current) => [mapApplication(application), ...current.filter((item) => item.problemId !== problemId)]);
      void refreshApplications().catch(() => undefined);
    }
    return application.id;
  };
  const submitApplication = async (problemId: string, input: ApplicationInput) => {
    const requestedByUserId = currentUserIdRef.current;
    const application = await submitRequest(problemId, input);
    if (currentUserIdRef.current === requestedByUserId) {
      setSubmissions((current) => [mapApplication(application), ...current.filter((item) => item.problemId !== problemId)]);
      void Promise.allSettled([refreshApplications(), refreshProblems()]);
    }
  };

  const calculateEligibility = (problemId: string, problemTags: string[]): EligibilityResult => {
    const application = submissions.find((item) => item.problemId === problemId);
    if (application && application.status !== 'draft') return {
      isEligible: false, matchedSkills: [], matchCount: 0, totalCount: problemTags.length, status: 'submitted',
    };
    if (currentRole === 'visitor') return {
      isEligible: false, matchedSkills: [], matchCount: 0, totalCount: problemTags.length, status: 'visitor',
    };
    if (currentRole === 'company') return {
      isEligible: false, matchedSkills: [], matchCount: 0, totalCount: problemTags.length, status: 'company',
    };
    if (currentRole !== 'solver' || currentUser.solverProfile?.completenessPercent !== 100) return {
      isEligible: false, matchedSkills: [], matchCount: 0, totalCount: problemTags.length, status: 'needs_profile',
    };
    const skills = (currentUser.solverProfile.skills || []).map((skill) => skill.trim().toUpperCase());
    const matched = problemTags.filter((tag) => skills.includes(tag.trim().toUpperCase()));
    return { isEligible: true, matchedSkills: matched, matchCount: matched.length, totalCount: problemTags.length, status: 'eligible' };
  };

  const value: AppContextType = {
    lang, dir, setLang, toggleLang, currentUser, currentRole, authLoading, switchRole,
    login, signup, logout, refreshAuth, updateSolverProfile, updateCompanyProfile,
    problems, problemsLoading, problemsError, refreshProblems, loadProblems, loadProblem, addProblemComment,
    submissions, refreshApplications, saveApplicationDraft, submitApplication, calculateEligibility,
    isAuthModalOpen, openAuthModal: () => setIsAuthModalOpen(true), closeAuthModal: () => setIsAuthModalOpen(false),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
