import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BriefValidationError,
  parseAndValidateBrief,
  parseBriefRequest,
} from '../src/ai/challenge-brief.schema';

const context = { now: new Date('2026-10-25T10:00:00.000Z'), timeZone: 'Africa/Algiers' };

const validDraft = {
  title: 'مراقبة جودة الخياطة',
  titleEn: 'Monitor stitching quality',
  summary: 'تسجيل العيوب اليومية في ورشة صغيرة.',
  summaryEn: 'Record daily defects at a small workshop.',
  description: 'أنشئ أداة بسيطة تساعد المشرف على تسجيل العيوب ومراجعتها كل يوم.',
  descriptionEn: 'Build a simple tool for a supervisor to record and review defects each day.',
  deliverables: ['نموذج لتسجيل العيب مع التاريخ والوصف.'],
  deliverablesEn: ['A form for recording each defect with its date and description.'],
  constraints: ['يجب أن تعمل الأداة دون اتصال أثناء التسجيل.'],
  constraintsEn: ['The tool must support offline entry.'],
  criteria: ['وضوح السجلات وسهولة تصديرها.'],
  criteriaEn: ['Records are clear and easy to export.'],
  skills: ['PYTHON'],
  category: 'CHALLENGE',
  difficulty: 'medium',
  budgetDzd: 120000,
  applicationDeadlineDate: '2026-11-20',
} as const;

const validResult = {
  status: 'draft',
  draft: validDraft,
  fieldSources: { title: 'provided', budgetDzd: 'provided' },
  questions: [],
  warnings: [],
};

const validRaw = JSON.stringify(validResult);
const fencedRaw = `\`\`\`json\n${validRaw}\n\`\`\``;
const truncatedRaw = validRaw.slice(0, -8);
const invalidSkillRaw = JSON.stringify({
  ...validResult,
  draft: { ...validDraft, skills: ['UNLISTED_SKILL'] },
});
const impossibleCalendarDateRaw = JSON.stringify({
  ...validResult,
  draft: { ...validDraft, applicationDeadlineDate: '2026-02-30' },
});

test('valid JSON returns a normalized brief with a numeric DZD budget', () => {
  assert.equal(parseAndValidateBrief(validRaw, context).draft?.budgetDzd, 120000);
});

test('accepts one enclosing JSON Markdown fence', () => {
  assert.equal(parseAndValidateBrief(fencedRaw, context).status, 'draft');
});

test('rejects truncated model output as a validation error', () => {
  assert.throws(() => parseAndValidateBrief(truncatedRaw, context), BriefValidationError);
});

test('rejects skill tags outside the existing taxonomy', () => {
  assert.throws(() => parseAndValidateBrief(invalidSkillRaw, context), BriefValidationError);
});

test('rejects impossible calendar dates', () => {
  assert.throws(() => parseAndValidateBrief(impossibleCalendarDateRaw, context), BriefValidationError);
});

test('accepts needs-context output without inventing a draft', () => {
  const needsContextRaw = JSON.stringify({
    status: 'needs_context',
    draft: null,
    fieldSources: {},
    questions: [{ id: 'problem', field: 'context', text: { ar: 'ما المشكلة التي تريدون حلها؟', en: 'What problem do you want to solve?' } }],
    warnings: [],
  });
  assert.equal(parseAndValidateBrief(needsContextRaw, context).draft, null);
});

test('requires nonempty Arabic and English title, summary, and description in a draft', () => {
  for (const field of ['title', 'titleEn', 'summary', 'summaryEn', 'description', 'descriptionEn'] as const) {
    const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, [field]: '   ' } });
    assert.throws(() => parseAndValidateBrief(raw, context), BriefValidationError, `${field} must contain text`);
  }
});

test('needs-context output requires a nonempty localized question in both languages', () => {
  for (const text of [
    { ar: '', en: 'What problem do you want to solve?' },
    { ar: 'ما المشكلة التي تريدون حلها؟', en: '   ' },
  ]) {
    const raw = JSON.stringify({
      status: 'needs_context',
      draft: null,
      fieldSources: {},
      questions: [{ id: 'problem', field: 'context', text }],
      warnings: [],
    });
    assert.throws(() => parseAndValidateBrief(raw, context), BriefValidationError);
  }
});

test('rejects unknown category and difficulty enum values', () => {
  for (const change of [
    { category: 'TASK' },
    { difficulty: 'easy' },
  ]) {
    const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, ...change } });
    assert.throws(() => parseAndValidateBrief(raw, context), BriefValidationError);
  }
});

test('enforces the existing bilingual text and list item length limits', () => {
  const invalidDrafts = [
    { title: 'x'.repeat(161) },
    { titleEn: 'x'.repeat(161) },
    { summary: 'x'.repeat(501) },
    { summaryEn: 'x'.repeat(501) },
    { description: 'x'.repeat(20001) },
    { descriptionEn: 'x'.repeat(20001) },
    { deliverables: ['x'.repeat(1001)] },
    { deliverablesEn: ['x'.repeat(1001)] },
  ];
  for (const change of invalidDrafts) {
    const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, ...change } });
    assert.throws(() => parseAndValidateBrief(raw, context), BriefValidationError);
  }
});

test('enforces the existing thirty-item list limit', () => {
  const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, criteriaEn: Array(31).fill('Criterion') } });
  assert.throws(() => parseAndValidateBrief(raw, context), BriefValidationError);
});

test('trims request strings, parses optional previous draft and answers, and strips unrelated properties', () => {
  const request = parseBriefRequest({
    notes: '  Need to track damaged fabric rolls.  ',
    lang: 'en',
    timeZone: '  Africa/Algiers  ',
    previousDraft: { ...validDraft, title: '  Earlier draft title  ' },
    answers: [{ questionId: '  data  ', question: '  What data exists?  ', answer: '  Paper logs only.  ' }],
    instructions: '  Keep the workflow usable offline.  ',
    ignored: 'remove me',
  });

  assert.equal(request.notes, 'Need to track damaged fabric rolls.');
  assert.equal(request.timeZone, 'Africa/Algiers');
  assert.equal(request.previousDraft?.title, 'Earlier draft title');
  assert.deepEqual(request.answers, [{ questionId: 'data', question: 'What data exists?', answer: 'Paper logs only.' }]);
  assert.equal(request.instructions, 'Keep the workflow usable offline.');
  assert.equal(Object.hasOwn(request, 'ignored'), false);
});

test('allows previous draft, answers, and instructions to be omitted', () => {
  const request = parseBriefRequest({ notes: '  A real industrial problem. ', lang: 'ar' });
  assert.equal(request.notes, 'A real industrial problem.');
  assert.equal(request.previousDraft, undefined);
  assert.equal(request.answers, undefined);
  assert.equal(request.instructions, undefined);
});

test('keeps null money and deadline explicit as missing inputs', () => {
  const raw = JSON.stringify({
    ...validResult,
    draft: { ...validDraft, budgetDzd: null, applicationDeadlineDate: null },
    fieldSources: {},
  });
  const result = parseAndValidateBrief(raw, context);
  assert.equal(result.draft?.budgetDzd, null);
  assert.equal(result.draft?.applicationDeadlineDate, null);
  assert.equal(result.fieldSources.budgetDzd, 'missing');
  assert.equal(result.fieldSources.applicationDeadlineDate, 'missing');
  assert.equal(result.fieldSources.title, undefined);
});

test('accepts an empty skills draft and adds a helpful warning', () => {
  const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, skills: [] }, fieldSources: {} });
  const result = parseAndValidateBrief(raw, context);
  assert.deepEqual(result.draft?.skills, []);
  assert.equal(result.fieldSources.skills, 'missing');
  assert.ok(result.warnings.some(warning => warning.en.includes('supported skill')));
  assert.ok(result.warnings.some(warning => warning.ar.trim().length > 0));
});

test('clears a past application deadline and returns a localized warning', () => {
  const raw = JSON.stringify({ ...validResult, draft: { ...validDraft, applicationDeadlineDate: '2026-10-24' } });
  const result = parseAndValidateBrief(raw, context);
  assert.equal(result.draft?.applicationDeadlineDate, null);
  assert.equal(result.fieldSources.applicationDeadlineDate, 'missing');
  assert.ok(result.warnings.some(warning => warning.en.toLowerCase().includes('past')));
  assert.ok(result.warnings.some(warning => warning.ar.trim().length > 0));
});
