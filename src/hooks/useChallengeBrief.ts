import { useCallback, useEffect, useRef, useState } from 'react';
import { requestChallengeBrief } from '../api/challengeBrief';
import { apiErrorMessage } from '../api/client';
import type { BriefDraft, BriefQuestion, BriefRequest, BriefResult } from '../api/contracts';
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
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    sequence.current += 1;
    request.current?.abort();
    request.current = null;
    setLoading(false);
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
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Algiers';
      const next = await requestChallengeBrief({
        notes, lang, timeZone,
        ...(refine && lastDraft ? { previousDraft: lastDraft } : {}),
        answers: Object.values(answers).filter(answer => answer.answer.trim()),
        instructions,
      }, controller.signal);
      if (current !== sequence.current || controller.signal.aborted) return;
      setResult(next);
      setLastDraft(next.draft || undefined);
    } catch (reason) {
      if (current === sequence.current && !controller.signal.aborted) setError(apiErrorMessage(reason, lang));
    } finally {
      if (current === sequence.current) {
        setLoading(false);
        request.current = null;
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
  };

  return { notes, setNotes, instructions, setInstructions, result, error, loading,
    setAnswer, answerFor, loadExample, cancel,
    generate: (lang: Language) => run(lang, false), refine: (lang: Language) => run(lang, true) };
}
