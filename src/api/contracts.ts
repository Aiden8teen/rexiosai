import type { Application, CompanyProfile, Problem, SolverProfile, StoredFile, User } from '../types';

export type AccountType = 'TALENT' | 'COMPANY';
export type Page<T> = { items: T[]; total: number; page: number; limit: number };

export type ApiUser = User;

export interface ProfileUpdate extends Partial<SolverProfile>, Partial<CompanyProfile> {
  cvFileId?: string;
}

export interface ProblemFilters {
  q?: string;
  skill?: string[];
  difficulty?: string[];
  category?: string[];
  minReward?: number;
  maxReward?: number;
  sort?: 'newest' | 'reward' | 'deadline';
  page?: number;
  limit?: number;
}

export interface ProblemInput {
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  description: string;
  descriptionEn: string;
  deliverables: string[];
  deliverablesEn: string[];
  constraints: string[];
  constraintsEn: string[];
  criteria: string[];
  criteriaEn: string[];
  skills: string[];
  difficulty: 'small' | 'medium' | 'expert';
  category: 'BUG' | 'ISSUE' | 'CHALLENGE';
  budgetDzd: number;
  deadlineAt?: string;
  privateNotes?: string;
  privateNotesEn?: string;
  contactEmail?: string;
  contactUrl?: string;
  shareContact?: boolean;
}

export interface EditableProblem extends ProblemInput {
  id: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  applicationsCount: number;
  files: StoredFile[];
}

export type ProblemPatch = ProblemInput | Pick<ProblemInput, 'privateNotes' | 'privateNotesEn'>;

export type ApiProblem = Problem & {
  companyUserId: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  category: 'BUG' | 'ISSUE' | 'CHALLENGE';
  deadlineAt: string;
  createdAt: string;
};

export interface ApplicationInput {
  coverMessage: string;
  deliveryDays: number;
  projectUrl?: string;
  consent: boolean;
}

export type ApiApplication = Application;
export type UploadPurpose = 'CV' | 'APPLICATION' | 'PROBLEM_PUBLIC' | 'PROBLEM_PRIVATE';
export interface UploadedFile extends StoredFile { byteSize: number; mimeType: string }

export type LocalizedText = { ar: string; en: string };
export type BriefDraft = Omit<ProblemInput, 'budgetDzd' | 'deadlineAt' | 'privateNotes' | 'privateNotesEn' | 'contactEmail' | 'contactUrl' | 'shareContact'> & {
  budgetDzd: number | null;
  applicationDeadlineDate: string | null;
};
export type BriefField = keyof BriefDraft;
export interface BriefRequest {
  notes: string;
  lang: 'ar' | 'en';
  timeZone?: string;
  previousDraft?: BriefDraft;
  answers?: { questionId: string; question: string; answer: string }[];
  instructions?: string;
}
export interface BriefQuestion { id: string; field: BriefField | 'context'; text: LocalizedText }
export type BriefResult = {
  fieldSources: Partial<Record<BriefField, 'provided' | 'suggested' | 'missing'>>;
  questions: BriefQuestion[];
  warnings: LocalizedText[];
} & ({ status: 'draft'; draft: BriefDraft } | { status: 'needs_context'; draft: null });

export type BriefProgress =
  | { type: 'phase'; phase: 'drafting' | 'checking' | 'repairing'; attempt: number }
  | { type: 'preview'; draft: Partial<BriefDraft>; attempt: number };
export type BriefStreamEvent = BriefProgress
  | { type: 'complete'; result: BriefResult }
  | { type: 'error'; status: number; message: string };
