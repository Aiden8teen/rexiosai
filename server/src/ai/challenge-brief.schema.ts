import { z } from 'zod';
import { SKILLS } from '../common/skills';

export const BRIEF_FIELDS = [
  'title', 'titleEn', 'summary', 'summaryEn', 'description', 'descriptionEn',
  'deliverables', 'deliverablesEn', 'constraints', 'constraintsEn', 'criteria',
  'criteriaEn', 'skills', 'category', 'difficulty', 'budgetDzd', 'applicationDeadlineDate',
] as const;

export type BriefField = typeof BRIEF_FIELDS[number];

const trimmedText = z.string().trim();
const localizedTextSchema = z.object({
  ar: trimmedText.min(1),
  en: trimmedText.min(1),
});

const calendarDateSchema = trimmedText
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD calendar date')
  .refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Expected a real calendar date');

const skillSchema = trimmedText.refine(value => SKILLS.includes(value), 'Expected a supported skill tag');
const listSchema = z.array(trimmedText.max(1000)).max(30);

export const briefDraftSchema = z.object({
  title: trimmedText.min(1).max(160),
  titleEn: trimmedText.min(1).max(160),
  summary: trimmedText.min(1).max(500),
  summaryEn: trimmedText.min(1).max(500),
  description: trimmedText.min(1).max(20000),
  descriptionEn: trimmedText.min(1).max(20000),
  deliverables: listSchema,
  deliverablesEn: listSchema,
  constraints: listSchema,
  constraintsEn: listSchema,
  criteria: listSchema,
  criteriaEn: listSchema,
  skills: z.array(skillSchema).max(5).refine(skills => new Set(skills).size === skills.length, 'Skills must be distinct'),
  category: z.enum(['BUG', 'ISSUE', 'CHALLENGE']),
  difficulty: z.enum(['small', 'medium', 'expert']),
  budgetDzd: z.number().int().min(0).max(2147483647).nullable(),
  applicationDeadlineDate: calendarDateSchema.nullable(),
});

const fieldSourceSchema = z.enum(['provided', 'suggested', 'missing']);
const fieldSourcesSchema = z.object({
  title: fieldSourceSchema.optional(),
  titleEn: fieldSourceSchema.optional(),
  summary: fieldSourceSchema.optional(),
  summaryEn: fieldSourceSchema.optional(),
  description: fieldSourceSchema.optional(),
  descriptionEn: fieldSourceSchema.optional(),
  deliverables: fieldSourceSchema.optional(),
  deliverablesEn: fieldSourceSchema.optional(),
  constraints: fieldSourceSchema.optional(),
  constraintsEn: fieldSourceSchema.optional(),
  criteria: fieldSourceSchema.optional(),
  criteriaEn: fieldSourceSchema.optional(),
  skills: fieldSourceSchema.optional(),
  category: fieldSourceSchema.optional(),
  difficulty: fieldSourceSchema.optional(),
  budgetDzd: fieldSourceSchema.optional(),
  applicationDeadlineDate: fieldSourceSchema.optional(),
});

const briefQuestionSchema = z.object({
  id: trimmedText.min(1),
  field: z.enum([...BRIEF_FIELDS, 'context']),
  text: localizedTextSchema,
});

const commonResultFields = {
  fieldSources: fieldSourcesSchema,
  questions: z.array(briefQuestionSchema),
  warnings: z.array(localizedTextSchema),
};

export const briefResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('draft'), draft: briefDraftSchema, ...commonResultFields }),
  z.object({ status: z.literal('needs_context'), draft: z.null(), ...commonResultFields, questions: z.array(briefQuestionSchema).min(1) }),
]);

const timeZoneSchema = trimmedText.min(1).refine(value => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Expected an IANA time zone');

export const briefRequestSchema = z.object({
  notes: trimmedText.min(1, 'Notes are required'),
  lang: z.enum(['ar', 'en']),
  timeZone: timeZoneSchema.optional(),
  previousDraft: briefDraftSchema.optional(),
  answers: z.array(z.object({
    questionId: trimmedText.min(1),
    question: trimmedText.min(1),
    answer: trimmedText.min(1),
  })).optional(),
  instructions: trimmedText.optional(),
});

export type BriefDraft = z.infer<typeof briefDraftSchema>;
export type BriefQuestion = z.infer<typeof briefQuestionSchema>;
export type BriefResult = z.infer<typeof briefResultSchema>;
export type BriefRequest = z.infer<typeof briefRequestSchema>;
export type BriefFieldSources = z.infer<typeof fieldSourcesSchema>;

export class BriefValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'BriefValidationError';
    this.issues = issues;
  }
}

function issueMessages(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.length ? issue.path.join('.') : 'brief';
    return `${path}: ${issue.message}`;
  });
}

export function parseBriefRequest(value: unknown): BriefRequest {
  const parsed = briefRequestSchema.safeParse(value);
  if (!parsed.success) throw new BriefValidationError(issueMessages(parsed.error));
  return parsed.data;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    const match = /^```(?:json)?[ \t]*\r?\n?([\s\S]*?)\r?\n?```$/i.exec(trimmed);
    if (!match) throw new BriefValidationError(['Output must be one JSON object inside a single Markdown fence.']);
    return match[1].trim();
  }
  return trimmed;
}

function todayInTimeZone(now: Date, timeZone: string): string {
  if (!Number.isFinite(now.getTime())) throw new BriefValidationError(['context.now: must be a valid date']);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: 'year' | 'month' | 'day') => parts.find(item => item.type === type)?.value;
    const year = part('year'), month = part('month'), day = part('day');
    if (!year || !month || !day) throw new Error('Date parts unavailable');
    return `${year.padStart(4, '0')}-${month}-${day}`;
  } catch {
    throw new BriefValidationError(['context.timeZone: must be a valid IANA time zone']);
  }
}

const emptySkillsWarning = {
  ar: 'اختر مهارة واحدة مدعومة على الأقل قبل نشر التحدي؛ لم يتم اختراع مهارات خارج التصنيف.',
  en: 'Choose at least one supported skill before publishing; no unsupported skill was invented.',
};
const pastDeadlineWarning = {
  ar: 'كان موعد التقديم في الماضي، لذلك أُزيل. أضف موعدًا مستقبليًا إذا كان معروفًا.',
  en: 'The application deadline was in the past, so it was cleared. Add a future deadline if known.',
};

function addWarning(warnings: BriefResult['warnings'], warning: { ar: string; en: string }): BriefResult['warnings'] {
  return warnings.some(existing => existing.ar === warning.ar && existing.en === warning.en)
    ? warnings
    : [...warnings, warning];
}

export function parseAndValidateBrief(raw: string, context: { now: Date; timeZone: string }): BriefResult {
  let decoded: unknown;
  try {
    decoded = JSON.parse(extractJsonObject(raw));
  } catch (error) {
    if (error instanceof BriefValidationError) throw error;
    throw new BriefValidationError(['Output must be one complete JSON object.']);
  }

  const parsed = briefResultSchema.safeParse(decoded);
  if (!parsed.success) throw new BriefValidationError(issueMessages(parsed.error));

  const result = parsed.data;
  const fieldSources: BriefFieldSources = { ...result.fieldSources };
  let warnings = result.warnings;
  let draft = result.draft;

  if (draft?.budgetDzd === null) fieldSources.budgetDzd = 'missing';
  if (draft?.applicationDeadlineDate === null) fieldSources.applicationDeadlineDate = 'missing';

  if (draft && draft.skills.length === 0) {
    fieldSources.skills = 'missing';
    warnings = addWarning(warnings, emptySkillsWarning);
  }

  if (draft?.applicationDeadlineDate && draft.applicationDeadlineDate < todayInTimeZone(context.now, context.timeZone)) {
    draft = { ...draft, applicationDeadlineDate: null };
    fieldSources.applicationDeadlineDate = 'missing';
    warnings = addWarning(warnings, pastDeadlineWarning);
  }

  return { ...result, draft, fieldSources, warnings } as BriefResult;
}
