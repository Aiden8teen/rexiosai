import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import { buildBriefMessages, buildRepairMessages } from './challenge-brief.prompt';
import {
  BriefValidationError,
  parseAndValidateBrief,
  parseBriefRequest,
  type BriefRequest,
  type BriefResult,
} from './challenge-brief.schema';
import type { BriefModel } from './featherless.client';
import { BriefPreviewParser, type BriefProgress } from './challenge-brief.stream';

export type BriefRunOptions = { signal: AbortSignal; now: Date; maxRepairAttempts: number; onProgress?: (event: BriefProgress) => void };

const WorkflowState = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  raw: Annotation<string>(),
  validationIssues: Annotation<string[]>(),
  repairsUsed: Annotation<number>(),
  result: Annotation<BriefResult | null>(),
});

export async function generateChallengeBrief(
  input: BriefRequest,
  model: BriefModel,
  options: BriefRunOptions,
): Promise<BriefResult> {
  const request = parseBriefRequest(input);
  const timeZone = request.timeZone || 'Africa/Algiers';
  const context = { now: options.now, timeZone };
  const maxRepairAttempts = Number.isSafeInteger(options.maxRepairAttempts) && options.maxRepairAttempts >= 0
    ? options.maxRepairAttempts
    : 2;

  const workflow = new StateGraph(WorkflowState)
    .addNode('prepare_context', () => {
      options.signal.throwIfAborted();
      return {
        messages: buildBriefMessages(request, context),
        raw: '',
        validationIssues: [],
        result: null,
      };
    })
    .addNode('generate', async state => {
      options.signal.throwIfAborted();
      options.onProgress?.({ type: 'phase', phase: 'drafting', attempt: state.repairsUsed });
      let raw = '';
      if (options.onProgress && model.stream) {
        const parser = new BriefPreviewParser();
        for await (const chunk of model.stream(state.messages, options.signal)) {
          options.signal.throwIfAborted();
          raw += chunk;
          for (const draft of parser.push(chunk)) options.onProgress({ type: 'preview', draft, attempt: state.repairsUsed });
        }
      } else raw = await model.complete(state.messages, options.signal);
      options.signal.throwIfAborted();
      return { raw };
    })
    .addNode('validate', state => {
      options.signal.throwIfAborted();
      options.onProgress?.({ type: 'phase', phase: 'checking', attempt: state.repairsUsed });
      try {
        return { result: parseAndValidateBrief(state.raw, context), validationIssues: [] };
      } catch (error) {
        if (!(error instanceof BriefValidationError)) throw error;
        return { result: null, validationIssues: error.issues };
      }
    })
    .addNode('repair', state => {
      options.signal.throwIfAborted();
      options.onProgress?.({ type: 'phase', phase: 'repairing', attempt: state.repairsUsed + 1 });
      return {
        messages: buildRepairMessages(request, state.raw, state.validationIssues, context),
        repairsUsed: state.repairsUsed + 1,
      };
    })
    .addEdge(START, 'prepare_context')
    .addEdge('prepare_context', 'generate')
    .addEdge('generate', 'validate')
    .addConditionalEdges('validate', state => {
      options.signal.throwIfAborted();
      return state.result || state.repairsUsed >= maxRepairAttempts ? END : 'repair';
    })
    .addEdge('repair', 'generate')
    .compile();

  const finalState = await workflow.invoke({
    messages: [],
    raw: '',
    validationIssues: [],
    repairsUsed: 0,
    result: null,
  }, { signal: options.signal, recursionLimit: Math.max(25, maxRepairAttempts * 3 + 10) });

  if (finalState.result) return finalState.result;
  throw new BriefValidationError(finalState.validationIssues);
}
