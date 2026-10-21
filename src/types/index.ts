export type Language = 'ar' | 'en';

export type UserRole = 'visitor' | 'member' | 'solver' | 'company';

export interface SolverProfile {
  firstName: string;
  lastName: string;
  firstNameEn?: string;
  lastNameEn?: string;
  educationLevel: string;
  institutionMajor: string;
  institutionMajorEn?: string;
  experienceLevel: string;
  skills: string[];
  cvFileName?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  cvFileId?: string;
  completenessPercent: number;
}

export interface CompanyProfile {
  name: string;
  nameEn?: string;
  contactEmail?: string;
  contactUrl?: string;
  shareContact?: boolean;
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
  companyProfile?: CompanyProfile;
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
  companyUserId?: string;
  status?: 'DRAFT' | 'OPEN' | 'CLOSED';
  category?: 'BUG' | 'ISSUE' | 'CHALLENGE';
  deadlineAt?: string;
  createdAt?: string;
  files?: StoredFile[];
}

export interface StoredFile {
  id: string;
  originalName: string;
  byteSize?: number;
  mimeType?: string;
}

export interface Application {
  id: string;
  problemId: string;
  applicantUserId: string;
  coverMessage: string;
  coverMessageEn?: string;
  deliveryDays: number;
  projectUrl?: string;
  consent: boolean;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  rejectionReasonEn?: string;
  submittedAt?: string;
  problem: { id: string; title: string; titleEn?: string };
  applicant?: User;
  files: StoredFile[];
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
  status: 'draft' | 'under_review' | 'accepted' | 'rejected';
  rejectionReason?: string;
  rejectionReasonEn?: string;
}
