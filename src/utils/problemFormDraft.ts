import type { BriefDraft, EditableProblem, ProblemInput } from '../api/contracts';

type PublicInput = Omit<ProblemInput, 'privateNotes' | 'privateNotesEn' | 'contactEmail' | 'contactUrl' | 'shareContact'>;
export type ProblemFormFields = Omit<PublicInput, 'budgetDzd' | 'deadlineAt'> & {
  budget: string;
  deadline: string;
  originalDeadlineAt?: string;
  originalDeadlineInput: string;
};

function localDateTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Explicit field selection keeps identity, private and company data outside this adapter.
function publicContent(source?: Partial<PublicInput>): Omit<PublicInput, 'budgetDzd' | 'deadlineAt'> {
  return {
    title: source?.title || '', titleEn: source?.titleEn || '',
    summary: source?.summary || '', summaryEn: source?.summaryEn || '',
    description: source?.description || '', descriptionEn: source?.descriptionEn || '',
    deliverables: [...(source?.deliverables || [])], deliverablesEn: [...(source?.deliverablesEn || [])],
    constraints: [...(source?.constraints || [])], constraintsEn: [...(source?.constraintsEn || [])],
    criteria: [...(source?.criteria || [])], criteriaEn: [...(source?.criteriaEn || [])],
    skills: [...(source?.skills || [])], category: source?.category || 'CHALLENGE', difficulty: source?.difficulty || 'medium',
  };
}

export function createProblemFormFields(initial?: EditableProblem): ProblemFormFields {
  const deadline = localDateTime(initial?.deadlineAt);
  return {
    ...publicContent(initial), budget: initial?.budgetDzd ? String(initial.budgetDzd) : '', deadline,
    originalDeadlineAt: initial?.deadlineAt, originalDeadlineInput: deadline,
  };
}

export function applyBriefToFormFields(current: ProblemFormFields, draft: BriefDraft): ProblemFormFields {
  return {
    ...current, ...publicContent(draft as Omit<PublicInput, 'budgetDzd' | 'deadlineAt'>),
    budget: draft.budgetDzd === null ? '' : String(draft.budgetDzd),
    deadline: draft.applicationDeadlineDate ? `${draft.applicationDeadlineDate}T23:59` : '',
    originalDeadlineAt: undefined, originalDeadlineInput: '',
  };
}

export function buildProblemPublicInput(fields: ProblemFormFields): PublicInput {
  const content = publicContent(fields);
  const clean = (items: string[]) => items.map(item => item.trim()).filter(Boolean);
  return {
    ...content,
    title: content.title.trim(), titleEn: content.titleEn.trim(),
    summary: content.summary.trim(), summaryEn: content.summaryEn.trim(),
    description: content.description.trim(), descriptionEn: content.descriptionEn.trim(),
    deliverables: clean(content.deliverables), deliverablesEn: clean(content.deliverablesEn),
    constraints: clean(content.constraints), constraintsEn: clean(content.constraintsEn),
    criteria: clean(content.criteria), criteriaEn: clean(content.criteriaEn),
    budgetDzd: Number(fields.budget) || 0,
    deadlineAt: fields.originalDeadlineAt && fields.deadline === fields.originalDeadlineInput
      ? fields.originalDeadlineAt : fields.deadline ? new Date(fields.deadline).toISOString() : undefined,
  };
}
