import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { BaseMessage } from '@langchain/core/messages';
import type { BriefModel } from '../src/ai/featherless.client';
import { BriefValidationError, parseBriefRequest, type BriefRequest } from '../src/ai/challenge-brief.schema';
import { generateChallengeBrief } from '../src/ai/challenge-brief.graph';

const now = new Date('2026-10-25T10:00:00.000Z');
const validDraft = {
  title: 'سجل عيوب الخياطة',
  titleEn: 'Stitching defect log',
  summary: 'سجّل عيوب الخياطة يوميًا.',
  summaryEn: 'Record stitching defects each day.',
  description: 'أنشئ مسارًا بسيطًا لتسجيل العيوب ومراجعة أعدادها اليومية.',
  descriptionEn: 'Create a simple workflow to record defects and review daily counts.',
  deliverables: ['نموذج لتسجيل نوع العيب والتاريخ.'],
  deliverablesEn: ['A form to record defect type and date.'],
  constraints: [],
  constraintsEn: [],
  criteria: ['يظهر عدد العيوب المسجلة لكل يوم.'],
  criteriaEn: ['The recorded defect count is shown for each day.'],
  skills: ['PYTHON'],
  category: 'CHALLENGE',
  difficulty: 'medium',
  budgetDzd: null,
  applicationDeadlineDate: null,
};
const draftResponse = JSON.stringify({
  status: 'draft',
  draft: validDraft,
  fieldSources: { skills: 'suggested' },
  questions: [],
  warnings: [],
});
const needsContextResponse = JSON.stringify({
  status: 'needs_context',
  draft: null,
  fieldSources: {},
  questions: [{ id: 'problem', field: 'context', text: { ar: 'ما المشكلة الصناعية التي تريدون حلها؟', en: 'What industrial problem would you like to solve?' } }],
  warnings: [],
});

class SequenceModel implements BriefModel {
  readonly calls: string[][] = [];

  constructor(private readonly responses: Array<string | Error | ((signal: AbortSignal) => string)>) {}

  async complete(messages: BaseMessage[], signal: AbortSignal): Promise<string> {
    this.calls.push(messages.map(message => typeof message.content === 'string' ? message.content : JSON.stringify(message.content)));
    const response = this.responses[this.calls.length - 1];
    if (response instanceof Error) throw response;
    if (typeof response === 'function') return response(signal);
    if (response === undefined) throw new Error('No fake response configured');
    return response;
  }
}

function request(overrides: Partial<BriefRequest> = {}): BriefRequest {
  return parseBriefRequest({ notes: 'A textile workshop needs a way to record stitching defects.', lang: 'en', ...overrides });
}

function options(signal = new AbortController().signal) {
  return { signal, now, maxRepairAttempts: 2 };
}

test('a valid challenge brief is returned after one model call', async () => {
  const model = new SequenceModel([draftResponse]);

  const result = await generateChallengeBrief(request(), model, options());

  assert.equal(result.status, 'draft');
  assert.equal(result.draft?.titleEn, 'Stitching defect log');
  assert.equal(model.calls.length, 1);
});

test('a malformed brief is repaired once with original context and then returned', async () => {
  const model = new SequenceModel(['not JSON', draftResponse]);

  const result = await generateChallengeBrief(request(), model, options());

  assert.equal(result.status, 'draft');
  assert.equal(model.calls.length, 2);
  const repairContext = model.calls[1].join('\n');
  assert.ok(repairContext.includes('A textile workshop needs a way to record stitching defects.'));
  assert.ok(repairContext.includes('not JSON'));
  assert.ok(repairContext.includes('Output must be one complete JSON object.'));
});

test('two repairs are the limit before a validation error is returned', async () => {
  const model = new SequenceModel(['bad one', 'bad two', 'bad three']);

  await assert.rejects(generateChallengeBrief(request(), model, options()), BriefValidationError);

  assert.equal(model.calls.length, 3);
});

test('an aborted run does not send a repair call', async () => {
  const controller = new AbortController();
  const model = new SequenceModel([(signal) => {
    controller.abort(new Error('client stopped'));
    assert.equal(signal.aborted, true);
    return 'not JSON';
  }, draftResponse]);

  await assert.rejects(generateChallengeBrief(request(), model, options(controller.signal)));

  assert.equal(model.calls.length, 1);
});

test('needs-context output is returned without an automatic repair', async () => {
  const model = new SequenceModel([needsContextResponse]);

  const result = await generateChallengeBrief(request({ notes: 'Hello, can you help?' }), model, options());

  assert.equal(result.status, 'needs_context');
  assert.equal(result.draft, null);
  assert.equal(result.questions.length, 1);
  assert.equal(model.calls.length, 1);
});

test('refinement messages carry current notes, answers, instructions, and the previous draft', async () => {
  const previous = JSON.parse(draftResponse).draft;
  const model = new SequenceModel([draftResponse]);
  const refinedRequest = request({
    notes: 'The line now records defects in a shared spreadsheet.',
    previousDraft: previous,
    answers: [{ questionId: 'workflow', question: 'Where are defects recorded now?', answer: 'In a shared spreadsheet.' }],
    instructions: 'Keep the original scope, but clarify that the spreadsheet is the current source.',
  });

  await generateChallengeBrief(refinedRequest, model, options());

  const prompt = model.calls[0].join('\n');
  assert.ok(prompt.includes('The line now records defects in a shared spreadsheet.'));
  assert.ok(prompt.includes('In a shared spreadsheet.'));
  assert.ok(prompt.includes('Keep the original scope, but clarify that the spreadsheet is the current source.'));
  assert.ok(prompt.includes('Stitching defect log'));
});

test('transport failures escape without entering schema repair', async () => {
  const failure = new Error('connection reset');
  const model = new SequenceModel([failure, draftResponse]);

  await assert.rejects(generateChallengeBrief(request(), model, options()), error => error === failure);

  assert.equal(model.calls.length, 1);
});
