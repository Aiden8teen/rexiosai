export type Language = 'ar' | 'en';

export type UserRole = 'visitor' | 'member' | 'solver';

export interface SolverProfile {
  firstName: string;
  lastName: string;
  educationLevel: string;
  institutionMajor: string;
  experienceLevel: string;
  skills: string[];
  cvFileName?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  completenessPercent: number;
}

export interface User {
  id: string;
  name: string;
  name_en: string;
  email: string;
  role: UserRole;
  avatarChar: string;
  avatarBg?: string;
  solverProfile?: SolverProfile;
}

export interface ReactionCounts {
  helpful: number;
  insight: number;
  userReactedHelpful?: boolean;
  userReactedInsight?: boolean;
}

export interface Answer {
  id: string;
  author: string;
  author_en: string;
  authorRole: string;
  authorRole_en: string;
  authorAvatar: string;
  createdAt: string;
  createdAt_en: string;
  body: string;
  body_en: string;
  helpfulCount: number;
  insightCount: number;
  userReactedHelpful?: boolean;
  userReactedInsight?: boolean;
  isVerified?: boolean;
}

export interface Question {
  id: string;
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  body: string;
  body_en: string;
  codeSnippet?: string;
  author: string;
  author_en: string;
  authorAvatar: string;
  createdAt: string;
  createdAt_en: string;
  tags: string[];
  views: number;
  answersCount: number;
  helpfulCount: number;
  insightCount: number;
  answers: Answer[];
}

export type ProblemDifficulty = 'small' | 'medium' | 'expert';

export interface DiscussionComment {
  id: string;
  author: string;
  author_en: string;
  isCompany?: boolean;
  authorAvatar: string;
  createdAt: string;
  createdAt_en: string;
  body: string;
  body_en: string;
  replies?: DiscussionComment[];
}

export interface Problem {
  id: string;
  companyName: string;
  companyName_en: string;
  companyAvatar: string;
  postedAt: string;
  postedAt_en: string;
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  description: string;
  description_en: string;
  deliverables: string[];
  deliverables_en: string[];
  constraints: string[];
  constraints_en: string[];
  criteria: string[];
  criteria_en: string[];
  tags: string[];
  difficulty: ProblemDifficulty;
  rewardAmount: number;
  rewardFormatted: string;
  rewardFormatted_en: string;
  proposalsCount: number;
  deadlineDays: number;
  deadlineText: string;
  deadlineText_en: string;
  discussions: DiscussionComment[];
}

export interface SolutionSubmission {
  id: string;
  problemId: string;
  userId: string;
  summary: string;
  deliveryTime: string;
  projectUrl?: string;
  fileName?: string;
  submittedAt: string;
  status: 'under_review' | 'accepted' | 'rejected';
}
