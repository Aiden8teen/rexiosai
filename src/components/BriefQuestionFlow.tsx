import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react';
import type { BriefQuestion } from '../api/contracts';
import type { Language } from '../types';
import BorderGlow from './reactbits/BorderGlow';

interface Props {
  questions: BriefQuestion[]; lang: Language; disabled?: boolean;
  answerFor(question: BriefQuestion): string;
  onAnswer(question: BriefQuestion, value: string): void;
}

export function BriefQuestionFlow({ questions, lang, disabled = false, answerFor, onAnswer }: Props) {
  const ar = lang === 'ar';
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const focusAfterNavigation = useRef(false);
  const answered = questions.filter(question => answerFor(question).trim()).length;
  const question = questions[index];
  const go = (next: number) => { focusAfterNavigation.current = true; setIndex(next); };
  useEffect(() => {
    if (focusAfterNavigation.current) input.current?.focus({ preventScroll: true });
    focusAfterNavigation.current = false;
  }, [index]);
  if (!questions.length) return null;

  return <BorderGlow animated backgroundColor="#FFFBF1" borderRadius={6} glowColor="227 75 55" glowRadius={14} glowIntensity={0.35} colors={['#0B2A9E', '#7895E8', '#C9D3FF']} fillOpacity={0.04} className="ai-clarification-glow" style={{ border: '2px solid #C9D2F1', boxShadow: 'none' }}><section className="space-y-4 p-4" aria-label={ar ? 'توضيح التفاصيل' : 'Clarify the details'}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold inline-flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#0B2A9E]" aria-hidden="true" />{ar ? 'لنوضح بعض التفاصيل' : 'Let’s clarify a few details'}</h2>
      <span className="font-num text-[11px] text-[#5B5B7B]">{question ? (ar ? `سؤال ${index + 1} من ${questions.length}` : `Question ${index + 1} of ${questions.length}`) : (ar ? `${answered} إجابات` : `${answered} answered`)}</span>
    </div>
    <p className="text-xs text-[#5B5B7B]">{ar ? 'أجب عما تعرفه، أو تجاوز السؤال الآن. لن تفقد إجاباتك عند الرجوع.' : 'Answer what you know, or skip for now. Going back keeps your answers.'}</p>
    {question ? <div key={`${question.id}:${question.text.en}`} className="ai-question space-y-3 rounded-md border-2 border-[#C9D2F1] bg-[#EEF1FF]/60 p-4">
      <label htmlFor="ai-brief-answer" className="block text-sm font-semibold leading-relaxed">{question.text[lang]}</label>
      <textarea ref={input} id="ai-brief-answer" rows={3} disabled={disabled} className="input-pixel w-full text-sm" value={answerFor(question)} onChange={event => onAnswer(question, event.target.value)} placeholder={ar ? 'اكتب التفاصيل هنا…' : 'Add the details here…'} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={disabled || index === 0} className="inline-flex items-center gap-1 text-xs font-bold py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"><ArrowLeft className={`w-3.5 h-3.5 ${ar ? 'rotate-180' : ''}`} aria-hidden="true" />{ar ? 'السابق' : 'Back'}</button>
        <div className="flex items-center gap-3">
          <button type="button" disabled={disabled} onClick={() => go(index + 1)} className="text-xs text-[#5B5B7B] underline underline-offset-4 py-2 cursor-pointer disabled:opacity-40">{ar ? 'تجاوز الآن' : 'Skip for now'}</button>
          <button type="button" disabled={disabled || !answerFor(question).trim()} onClick={() => go(index + 1)} className="btn-pixel-secondary rounded-md px-3 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">{index === questions.length - 1 ? (ar ? 'تم' : 'Done') : (ar ? 'التالي' : 'Next')}<ArrowRight className={`w-3.5 h-3.5 ${ar ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
        </div>
      </div>
    </div> : <div className="ai-question bg-[#E9F5D5] border-2 border-[#C4D9A3] rounded-md p-4 text-sm space-y-2"><p className="font-semibold inline-flex items-center gap-2"><Check className="w-4 h-4" aria-hidden="true" />{ar ? 'جاهز لتحديث المسودة' : 'Ready to update your brief'}</p><p className="text-xs">{ar ? 'استخدم زر التحديث أدناه لإدراج إجاباتك، أو راجعها قبل المتابعة.' : 'Use the update button below to include your answers, or review them first.'}</p><button type="button" disabled={disabled} onClick={() => go(Math.max(0, questions.length - 1))} className="text-xs font-bold underline cursor-pointer">{ar ? 'العودة للأسئلة' : 'Back to questions'}</button></div>}
    <button type="button" onClick={() => setShowAll(value => !value)} aria-expanded={showAll} className="text-xs font-semibold text-[#0B2A9E] underline underline-offset-4 py-1 cursor-pointer">{showAll ? (ar ? 'إخفاء قائمة الأسئلة' : 'Hide question list') : (ar ? 'عرض جميع الأسئلة والإجابات' : 'View all questions & answers')}</button>
    {showAll && <ol className="space-y-2 text-xs">{questions.map((item, itemIndex) => <li key={`${item.id}:${item.text.en}`}><button type="button" disabled={disabled} onClick={() => go(itemIndex)} className="w-full text-start border border-[#C9D2F1] rounded-md p-3 hover:bg-[#EEF1FF] cursor-pointer"><span className="flex gap-2 items-start"><span className="font-num text-[#0B2A9E]">{itemIndex + 1}.</span><span className="space-y-1"><span className="block font-semibold">{item.text[lang]}</span><span className="block text-[#5B5B7B] whitespace-pre-wrap break-words">{answerFor(item) || (ar ? 'لم تُضف إجابة بعد' : 'Not answered yet')}</span></span></span></button></li>)}</ol>}
  </section></BorderGlow>;
}
