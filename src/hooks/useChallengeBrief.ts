import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChallengeBrief } from '../api/challengeBrief';
import { apiErrorMessage } from '../api/client';
import type { BriefDraft, BriefField, BriefProgress, BriefQuestion, BriefRequest, BriefResult } from '../api/contracts';
import type { Language } from '../types';

type Answer = NonNullable<BriefRequest['answers']>[number];
const questionKey = (question: BriefQuestion) => `${question.id}:${question.text.en}`;

export function useChallengeBrief({ accountId }: { accountId: string }) {
  const [notes, setNotes] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState<BriefResult | null>(null);
  const [lastDraft, setLastDraft] = useState<BriefDraft>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [provisional, setProvisional] = useState<Partial<BriefDraft> | null>(null);
  const [phase, setPhase] = useState<Extract<BriefProgress, { type: 'phase' }>['phase']>('drafting');
  const [changedFields, setChangedFields] = useState<BriefField[]>([]);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    sequence.current += 1;
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setProvisional(null);
  }, []);

  // The page is keyed by account ID. Cleanup also protects against late responses.
  useEffect(() => () => {
    sequence.current += 1;
    request.current?.abort();
  }, [accountId]);

  const run = async (lang: Language, refine: boolean) => {
    request.current?.abort();
    const current = ++sequence.current;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    setProvisional({});
    setPhase('drafting');
    setChangedFields([]);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Algiers';
      const next = await streamChallengeBrief({
        notes, lang, timeZone,
        ...(refine && lastDraft ? { previousDraft: lastDraft } : {}),
        answers: Object.values(answers).filter(answer => answer.answer.trim()),
        instructions,
      }, event => {
        if (current !== sequence.current || controller.signal.aborted) return;
        if (event.type === 'preview') setProvisional(event.draft);
        else {
          setPhase(event.phase);
          if (event.phase === 'drafting' || event.phase === 'repairing') setProvisional({});
        }
      }, controller.signal);
      if (current !== sequence.current || controller.signal.aborted) return;
      setResult(next);
      setLastDraft(next.draft || undefined);
      setChangedFields(lastDraft && next.draft ? (Object.keys(next.draft) as BriefField[]).filter(key => JSON.stringify(lastDraft[key]) !== JSON.stringify(next.draft![key])) : []);
      setRevision(value => value + 1);
    } catch (reason) {
      if (current === sequence.current && !controller.signal.aborted) setError(apiErrorMessage(reason, lang));
    } finally {
      if (current === sequence.current) {
        setLoading(false);
        request.current = null;
        setProvisional(null);
      }
    }
  };

  const setAnswer = (question: BriefQuestion, value: string) => setAnswers(current => ({ ...current,
    [questionKey(question)]: { questionId: question.id, question: question.text.en, answer: value },
  }));
  const answerFor = (question: BriefQuestion) => answers[questionKey(question)]?.answer || '';
  const loadExample = (value: string) => {
    cancel();
    setNotes(value);
    setAnswers({});
    setInstructions('');
    setResult(null);
    setLastDraft(undefined);
    setError('');
    setChangedFields([]);
    setRevision(0);
  };

  return { notes, setNotes, instructions, setInstructions, result, error, loading, provisional, phase, changedFields, revision,
    setAnswer, answerFor, loadExample, cancel,
    generate: (lang: Language) => run(lang, false), refine: (lang: Language) => run(lang, true) };
}
