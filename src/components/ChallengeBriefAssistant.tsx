import { useState } from 'react';
import { AlertCircle, ArrowRight, FileText, LoaderCircle, Sparkles, X } from 'lucide-react';
import type { BriefDraft } from '../api/contracts';
import type { Language } from '../types';
import { challengeBriefExamples, type ChallengeBriefExample } from '../data/challengeBriefExamples';
import { useChallengeBrief } from '../hooks/useChallengeBrief';
import { ChallengeBriefPreview } from './ChallengeBriefPreview';
import { BriefQuestionFlow } from './BriefQuestionFlow';

interface Props { lang: Language; accountId: string; onUseDraft(draft: BriefDraft): void }
const secondary = 'btn-pixel-secondary rounded-md px-3 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const primary = 'btn-pixel-accent rounded-md px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

export function ChallengeBriefAssistant({ lang, accountId, onUseDraft }: Props) {
  const ar = lang === 'ar';
  const ai = useChallengeBrief({ accountId });
  const [pendingExample, setPendingExample] = useState<ChallengeBriefExample | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<Language | null>(null);
  const run = () => ai.result ? ai.refine(lang) : ai.generate(lang);
  const chooseExample = (example: ChallengeBriefExample) => {
    if (ai.notes.trim()) setPendingExample(example);
    else ai.loadExample(example.notes[lang]);
  };

  return <section className="space-y-6" dir={ar ? 'rtl' : 'ltr'}>
    <header className="space-y-2 max-w-3xl">
      <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0B2A9E]"><Sparkles className="h-4 w-4" aria-hidden="true" />{ar ? 'مساعد صياغة التحديات' : 'AI challenge assistant'}</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#12122B]">{ar ? 'من ملاحظات أولية إلى تحدٍّ واضح' : 'Turn rough notes into a clear challenge'}</h1>
      <p className="text-sm text-[#5B5B7B] leading-relaxed">{ar ? 'صف المشكلة بأسلوبك. راجع المسودة باللغتين، حسّنها ثم انقلها إلى نموذج النشر.' : 'Describe the problem in your own words. Review a bilingual draft, refine it, then move it into the posting form.'}</p>
    </header>
    <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
      <div className="lg:col-span-5 space-y-5">
        <div className="card-pixel p-5 sm:p-6 space-y-4">
          <div><label htmlFor="ai-brief-notes" className="block text-sm font-bold mb-1">{ar ? 'ما المشكلة التي تريدون حلها؟' : 'What problem do you need to solve?'}</label><p id="ai-brief-notes-help" className="text-xs text-[#5B5B7B]">{ar ? 'اذكر الوضع الحالي، النتيجة المطلوبة وأي ميزانية أو مواعيد معروفة.' : 'Include the current situation, desired outcome, and any known budget or dates.'}</p></div>
          <textarea id="ai-brief-notes" aria-describedby="ai-brief-notes-help" value={ai.notes} onChange={event => ai.setNotes(event.target.value)} rows={10} className="input-pixel w-full text-sm leading-relaxed" placeholder={ar ? 'مثلًا: نسجل أعطال الآلات على الورق ونحتاج…' : 'For example: we record machine breakdowns on paper and need…'} />
          <div className="space-y-2"><p className="text-[11px] font-semibold text-[#5B5B7B]">{ar ? 'جرّب ملاحظات كمثال' : 'Try example notes'}</p><div className="flex flex-wrap gap-2">{challengeBriefExamples.map(example => <button key={example.id} type="button" onClick={() => chooseExample(example)} className="rounded-full border-2 border-[#12122B] bg-[#F8F1E1] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#EFE4CC] cursor-pointer">{example.label[lang]}</button>)}</div></div>
          {pendingExample && <div role="alert" className="rounded-md border-2 border-[#E0C577] bg-[#FFF1CC] p-3 space-y-3 text-xs"><p>{ar ? 'هل تريد استبدال الملاحظات الحالية بملاحظات المثال وبدء مسودة جديدة؟' : 'Replace your current notes with this example and start a new draft?'}</p><div className="flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => { ai.loadExample(pendingExample.notes[lang]); setPendingExample(null); }}>{ar ? 'استبدال الملاحظات' : 'Replace notes'}</button><button type="button" className="px-3 py-2 font-bold cursor-pointer" onClick={() => setPendingExample(null)}>{ar ? 'احتفظ بملاحظاتي' : 'Keep my notes'}</button></div></div>}
          {ai.error && <div role="alert" className="rounded-md border-2 border-[#E5432A] bg-[#FFE3DC] p-3 text-xs text-[#A82E1B] flex gap-2 items-start"><AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /><p>{ai.error}</p></div>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void run()} disabled={ai.loading || !ai.notes.trim()} className={primary}>{ai.loading ? <LoaderCircle className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}{ai.loading ? (ar ? 'جارٍ إعداد المسودة…' : 'Preparing your draft…') : ai.result ? (ar ? 'تحديث المسودة' : 'Update draft') : (ar ? 'إنشاء مسودة' : 'Generate draft')}</button>
            {ai.loading && <button type="button" className={secondary + ' inline-flex items-center gap-1'} onClick={ai.cancel}><X className="w-3 h-3" aria-hidden="true" />{ar ? 'إلغاء' : 'Cancel'}</button>}
          </div>
          <p role="status" aria-live="polite" className="text-[11px] text-[#5B5B7B]">{ai.loading ? (ar ? 'قد يستغرق إعداد النسختين بعض الوقت. يمكنك الإلغاء دون فقدان الملاحظات.' : 'Preparing both languages can take a moment. Cancelling keeps your notes.') : (ar ? 'لن يُحفظ أو يُنشر أي شيء حتى تستخدم النموذج.' : 'Nothing is saved or published until you use the form.')}</p>
        </div>
        {ai.result && <div className="card-pixel p-5 sm:p-6 space-y-4">
          <BriefQuestionFlow key={ai.revision} questions={ai.result.questions} lang={lang} answerFor={ai.answerFor} onAnswer={ai.setAnswer} disabled={ai.loading} />
          <div><label htmlFor="ai-brief-instructions" className="block text-xs font-bold mb-1.5">{ar ? 'ماذا تريد أن تغيّر؟' : 'What would you change?'}</label><textarea id="ai-brief-instructions" rows={3} className="input-pixel w-full text-xs" value={ai.instructions} onChange={event => ai.setInstructions(event.target.value)} placeholder={ar ? 'مثلًا: ركّز على نموذج بسيط يعمل دون اتصال.' : 'For example: focus on a simple prototype that works offline.'} /></div>
          <button type="button" className={secondary} disabled={ai.loading || !ai.notes.trim()} onClick={() => void ai.refine(lang)}>{ar ? 'تحديث بالإجابات والتغييرات' : 'Update with answers & changes'}</button>
        </div>}
      </div>
      <div className="lg:col-span-7 space-y-4 min-w-0">
        {ai.result || ai.loading ? <>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs"><span className="text-[#5B5B7B]">{ar ? 'لغة المعاينة' : 'Preview language'}</span><div role="group" aria-label={ar ? 'لغة معاينة المسودة' : 'Draft preview language'} className="flex gap-1">{(['ar', 'en'] as const).map(value => <button key={value} type="button" aria-pressed={(previewLanguage || lang) === value} onClick={() => setPreviewLanguage(value)} className={`rounded border-2 border-[#12122B] px-2.5 py-1 font-semibold cursor-pointer ${(previewLanguage || lang) === value ? 'bg-[#0B2A9E] text-[#FFFBF1]' : 'bg-[#FFFBF1]'}`}>{value === 'ar' ? 'العربية' : 'English'}</button>)}</div></div>
          <ChallengeBriefPreview result={ai.result} lang={previewLanguage || lang} partial={ai.provisional} streaming={ai.loading} phase={ai.phase} changedFields={ai.changedFields} />
          {(ai.result?.draft || ai.loading) && <div className="card-pixel p-4 bg-[#EEF1FF] flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#5B5B7B] max-w-sm">{ai.loading ? (ar ? 'يمكنك متابعة القراءة أثناء اكتمال المسودة.' : 'You can read along while the draft finishes.') : (ar ? 'جاهزة للمراجعة؟ ستُملأ الحقول العامة فقط، ثم يمكنك تعديلها وحفظها.' : 'Ready to review? Fill the public fields, then edit and save in the form.')}</p><button type="button" disabled={ai.loading} className={primary} onClick={() => { if (ai.result?.draft) onUseDraft(ai.result.draft); }}>{ar ? 'استخدام هذه المسودة' : 'Use this draft'}<ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} aria-hidden="true" /></button></div>}
        </> : <div className="card-pixel border-dashed p-8 sm:p-12 min-h-80 flex flex-col items-center justify-center text-center gap-4 bg-[#FFFBF1]">
          <FileText className="w-10 h-10 text-[#0B2A9E]" aria-hidden="true" /><h2 className="text-lg font-bold">{ar ? 'ستظهر مسودتك هنا' : 'Your brief will appear here'}</h2><p className="text-sm text-[#5B5B7B] max-w-sm leading-relaxed">{ar ? 'المشكلة، المخرجات، المتطلبات ومعايير التقييم في مسودة يمكنك مراجعتها بالعربية والإنجليزية.' : 'The problem, deliverables, requirements and evaluation criteria in a draft you can review in Arabic and English.'}</p>
        </div>}
      </div>
    </div>
  </section>;
}
