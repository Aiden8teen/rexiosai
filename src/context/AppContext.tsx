import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Language,
  UserRole,
  User,
  SolverProfile,
  Question,
  Problem,
  SolutionSubmission,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_QUESTIONS,
  INITIAL_PROBLEMS,
} from '../data/mockData';

interface EligibilityResult {
  isEligible: boolean;
  matchedSkills: string[];
  matchCount: number;
  totalCount: number;
  status: 'visitor' | 'needs_profile' | 'mismatch' | 'eligible' | 'submitted';
}

interface AppContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;

  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  login: (email: string, asRole?: UserRole) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
  updateSolverProfile: (profile: Partial<SolverProfile>) => void;

  questions: Question[];
  addQuestion: (title: string, excerpt: string, body: string, tags: string[], code?: string) => string;
  addAnswer: (questionId: string, body: string) => void;
  toggleQuestionReaction: (questionId: string, reaction: 'helpful' | 'insight') => void;
  toggleAnswerReaction: (questionId: string, answerId: string, reaction: 'helpful' | 'insight') => void;

  problems: Problem[];
  addProblemComment: (problemId: string, body: string, replyToId?: string) => void;

  submissions: SolutionSubmission[];
  submitSolution: (problemId: string, data: { summary: string; deliveryTime: string; projectUrl?: string; fileName?: string }) => void;
  calculateEligibility: (problemId: string, problemTags: string[]) => EligibilityResult;

  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('rexios_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('rexios_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('rexios_role') as UserRole;
    return savedRole || 'visitor';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('rexios_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
      }
    }
    return INITIAL_USERS[currentRole] || INITIAL_USERS.visitor;
  });

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    const user = INITIAL_USERS[role];
    setCurrentUser(user);
    localStorage.setItem('rexios_role', role);
    localStorage.setItem('rexios_user', JSON.stringify(user));
  };

  const login = (email: string, asRole: UserRole = 'member') => {
    const base = INITIAL_USERS[asRole] || INITIAL_USERS.member;
    const user: User = {
      ...base,
      email,
      role: asRole,
    };
    setCurrentRole(asRole);
    setCurrentUser(user);
    localStorage.setItem('rexios_role', asRole);
    localStorage.setItem('rexios_user', JSON.stringify(user));
  };

  const signup = (name: string, email: string) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      name_en: name,
      email,
      role: 'member',
      avatarChar: name.trim()[0] || 'م',
      avatarBg: '#0B2A9E',
    };
    setCurrentRole('member');
    setCurrentUser(newUser);
    localStorage.setItem('rexios_role', 'member');
    localStorage.setItem('rexios_user', JSON.stringify(newUser));
  };

  const logout = () => {
    switchRole('visitor');
  };

  const updateSolverProfile = (profileData: Partial<SolverProfile>) => {
    const existing = currentUser.solverProfile || {
      firstName: '',
      lastName: '',
      educationLevel: '',
      institutionMajor: '',
      experienceLevel: '',
      skills: [],
      completenessPercent: 0,
    };

    const updatedProfile: SolverProfile = {
      ...existing,
      ...profileData,
      completenessPercent: 100,
    };

    const updatedUser: User = {
      ...currentUser,
      role: 'solver',
      solverProfile: updatedProfile,
    };

    setCurrentRole('solver');
    setCurrentUser(updatedUser);
    localStorage.setItem('rexios_role', 'solver');
    localStorage.setItem('rexios_user', JSON.stringify(updatedUser));
  };

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('rexios_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  useEffect(() => {
    localStorage.setItem('rexios_questions', JSON.stringify(questions));
  }, [questions]);

  const addQuestion = (title: string, excerpt: string, body: string, tags: string[], code?: string): string => {
    const id = `q_${Date.now()}`;
    const newQ: Question = {
      id,
      title,
      title_en: title,
      excerpt,
      excerpt_en: excerpt,
      body,
      body_en: body,
      codeSnippet: code,
      author: currentUser.name,
      author_en: currentUser.name_en,
      authorAvatar: currentUser.avatarChar,
      createdAt: 'الآن',
      createdAt_en: 'Just now',
      tags,
      views: 1,
      answersCount: 0,
      helpfulCount: 0,
      insightCount: 0,
      answers: [],
    };
    setQuestions((prev) => [newQ, ...prev]);
    return id;
  };

  const addAnswer = (questionId: string, body: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newAns = {
          id: `ans_${Date.now()}`,
          author: currentUser.name,
          author_en: currentUser.name_en,
          authorRole: currentUser.role === 'solver' ? 'خبير حلول معتمد' : 'عضو في المجتمع',
          authorRole_en: currentUser.role === 'solver' ? 'Verified Solver' : 'Community Member',
          authorAvatar: currentUser.avatarChar,
          createdAt: 'الآن',
          createdAt_en: 'Just now',
          body,
          body_en: body,
          helpfulCount: 0,
          insightCount: 0,
        };
        return {
          ...q,
          answersCount: q.answersCount + 1,
          answers: [...q.answers, newAns],
        };
      })
    );
  };

  const toggleQuestionReaction = (questionId: string, reaction: 'helpful' | 'insight') => {
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (reaction === 'helpful') {
          return { ...q, helpfulCount: q.helpfulCount + 1 };
        } else {
          return { ...q, insightCount: q.insightCount + 1 };
        }
      })
    );
  };

  const toggleAnswerReaction = (questionId: string, answerId: string, reaction: 'helpful' | 'insight') => {
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          answers: q.answers.map((ans) => {
            if (ans.id !== answerId) return ans;
            if (reaction === 'helpful') {
              return { ...ans, helpfulCount: ans.helpfulCount + 1 };
            } else {
              return { ...ans, insightCount: ans.insightCount + 1 };
            }
          }),
        };
      })
    );
  };

  const [problems, setProblems] = useState<Problem[]>(() => {
    const saved = localStorage.getItem('rexios_problems');
    return saved ? JSON.parse(saved) : INITIAL_PROBLEMS;
  });

  useEffect(() => {
    localStorage.setItem('rexios_problems', JSON.stringify(problems));
  }, [problems]);

  const addProblemComment = (problemId: string, body: string, replyToId?: string) => {
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }

    setProblems((prev) =>
      prev.map((prob) => {
        if (prob.id !== problemId) return prob;
        const newComment = {
          id: `cmt_${Date.now()}`,
          author: currentUser.name,
          author_en: currentUser.name_en,
          authorAvatar: currentUser.avatarChar,
          createdAt: 'الآن',
          createdAt_en: 'Just now',
          body,
          body_en: body,
        };

        if (replyToId) {
          return {
            ...prob,
            discussions: prob.discussions.map((c) => {
              if (c.id === replyToId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newComment],
                };
              }
              return c;
            }),
          };
        } else {
          return {
            ...prob,
            discussions: [...prob.discussions, newComment],
          };
        }
      })
    );
  };

  const [submissions, setSubmissions] = useState<SolutionSubmission[]>(() => {
    const saved = localStorage.getItem('rexios_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('rexios_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const submitSolution = (
    problemId: string,
    data: { summary: string; deliveryTime: string; projectUrl?: string; fileName?: string }
  ) => {
    const newSubmission: SolutionSubmission = {
      id: `sub_${Date.now()}`,
      problemId,
      userId: currentUser.id,
      summary: data.summary,
      deliveryTime: data.deliveryTime,
      projectUrl: data.projectUrl,
      fileName: data.fileName || 'Solution_Proposal.pdf',
      submittedAt: new Date().toISOString(),
      status: 'under_review',
    };
    setSubmissions((prev) => [...prev, newSubmission]);

    setProblems((prev) =>
      prev.map((p) =>
        p.id === problemId ? { ...p, proposalsCount: p.proposalsCount + 1 } : p
      )
    );
  };

  const calculateEligibility = (problemId: string, problemTags: string[]): EligibilityResult => {
    const hasSubmitted = submissions.some((s) => s.problemId === problemId);
    if (hasSubmitted) {
      return {
        isEligible: true,
        matchedSkills: [],
        matchCount: 0,
        totalCount: problemTags.length,
        status: 'submitted',
      };
    }

    if (currentRole === 'visitor') {
      return {
        isEligible: false,
        matchedSkills: [],
        matchCount: 0,
        totalCount: problemTags.length,
        status: 'visitor',
      };
    }

    if (currentRole === 'member' || !currentUser.solverProfile?.skills?.length) {
      return {
        isEligible: false,
        matchedSkills: [],
        matchCount: 0,
        totalCount: problemTags.length,
        status: 'needs_profile',
      };
    }

    const userSkillsUpper = (currentUser.solverProfile?.skills || []).map((s) =>
      s.toUpperCase().trim()
    );
    const matched = problemTags.filter((t) =>
      userSkillsUpper.includes(t.toUpperCase().trim())
    );

    if (matched.length > 0) {
      return {
        isEligible: true,
        matchedSkills: matched,
        matchCount: matched.length,
        totalCount: problemTags.length,
        status: 'eligible',
      };
    } else {
      return {
        isEligible: false,
        matchedSkills: [],
        matchCount: 0,
        totalCount: problemTags.length,
        status: 'mismatch',
      };
    }
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AppContext.Provider
      value={{
        lang,
        dir,
        setLang,
        toggleLang,

        currentUser,
        currentRole,
        switchRole,
        login,
        signup,
        logout,
        updateSolverProfile,

        questions,
        addQuestion,
        addAnswer,
        toggleQuestionReaction,
        toggleAnswerReaction,

        problems,
        addProblemComment,

        submissions,
        submitSolution,
        calculateEligibility,

        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
