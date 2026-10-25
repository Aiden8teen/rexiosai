import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBriefToFormFields, buildProblemPublicInput, createProblemFormFields } from '../../src/utils/problemFormDraft';
import type { BriefDraft, EditableProblem } from '../../src/api/contracts';

const draft: BriefDraft = {
  title: 'أداة لتسجيل الأعطال', titleEn: 'Machine downtime logging',
  summary: 'تسجيل أوقات الأعطال وأسبابها.', summaryEn: 'Record downtime and its causes.',
  description: 'يسجل المشرف أوقات توقف الآلات ويصدر تقريرًا أسبوعيًا.', descriptionEn: 'The supervisor records machine downtime and exports a weekly report.',
  deliverables: ['تقرير أسبوعي'], deliverablesEn: ['Weekly report'],
  constraints: ['دون اتصال'], constraintsEn: ['Offline'], criteria: ['صحة التصدير'], criteriaEn: ['Accurate export'],
  skills: ['PYTHON'], category: 'CHALLENGE', difficulty: 'medium', budgetDzd: null, applicationDeadlineDate: null,
};

test('AI public-field application retains both languages without importing private/identity fields', () => {
  const applied = applyBriefToFormFields(createProblemFormFields(), { ...draft, id: 'untrusted', privateNotes: 'private', contactEmail: 'private@example.test', files: ['private.pdf'] } as BriefDraft);
  const input = buildProblemPublicInput(applied);
  assert.equal(input.title, 'أداة لتسجيل الأعطال');
  assert.equal(input.titleEn, 'Machine downtime logging');
  assert.deepEqual(input.constraintsEn, ['Offline']);
  for (const key of ['id', 'privateNotes', 'contactEmail', 'files']) assert.equal(Object.hasOwn(input, key), false);
  assert.equal(applied.budget, '');
  assert.equal(applied.deadline, '');
});

test('editing either language preserves all other language buffers on save', () => {
  const fields = applyBriefToFormFields(createProblemFormFields(), draft);
  const arEdited = buildProblemPublicInput({ ...fields, title: 'عنوان عربي معدل' });
  assert.equal(arEdited.title, 'عنوان عربي معدل');
  assert.equal(arEdited.titleEn, 'Machine downtime logging');
  const enEdited = buildProblemPublicInput({ ...fields, titleEn: 'Revised English title' });
  assert.equal(enEdited.title, 'أداة لتسجيل الأعطال');
  assert.equal(enEdited.titleEn, 'Revised English title');
  assert.equal(enEdited.description, draft.description);
  assert.equal(enEdited.descriptionEn, draft.descriptionEn);
});

test('AI date is local end-of-day and explicitly replaces the saved deadline snapshot', () => {
  const current = { ...createProblemFormFields(), originalDeadlineAt: '2026-11-01T10:00:47.321Z', originalDeadlineInput: '2026-11-01T11:00' };
  const applied = applyBriefToFormFields(current, { ...draft, budgetDzd: 50000, applicationDeadlineDate: '2026-11-20' });
  assert.equal(applied.budget, '50000');
  assert.equal(applied.deadline, '2026-11-20T23:59');
  assert.equal(applied.originalDeadlineAt, undefined);
  const local = new Date(buildProblemPublicInput(applied).deadlineAt!);
  assert.equal(local.getFullYear(), 2026);
  assert.equal(local.getMonth(), 10);
  assert.equal(local.getDate(), 20);
  assert.equal(local.getHours(), 23);
  assert.equal(local.getMinutes(), 59);
});

test('ordinary saved edits preserve an unchanged deadline instant including seconds', () => {
  const initial = { ...draft, id: 'saved-id', deadlineAt: '2026-11-20T22:59:47.321Z', budgetDzd: 60000, files: [], status: 'DRAFT', applicationsCount: 0 } as EditableProblem;
  const fields = createProblemFormFields(initial);
  assert.equal(buildProblemPublicInput({ ...fields, titleEn: 'An updated title' }).deadlineAt, '2026-11-20T22:59:47.321Z');
});

test('missing translations remain missing instead of copying the displayed fallback on save', () => {
  const initial = { ...draft, title: '', summary: '', description: '', deliverables: [], constraints: [], criteria: [], budgetDzd: 10000, id: 'saved-id', files: [], status: 'DRAFT', applicationsCount: 0 } as EditableProblem;
  const input = buildProblemPublicInput(createProblemFormFields(initial));
  assert.equal(input.title, '');
  assert.equal(input.summary, '');
  assert.equal(input.description, '');
  assert.deepEqual(input.deliverables, []);
  assert.equal(input.titleEn, 'Machine downtime logging');
});
