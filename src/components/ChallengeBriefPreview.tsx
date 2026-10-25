import type { ReactNode } from 'react';
import { FileText, LoaderCircle } from 'lucide-react';
import type { BriefDraft, BriefField, BriefProgress, BriefResult } from '../api/contracts';
import type { Language } from '../types';
import { TagChip } from './TagChip';
import { problemCategoryLabel } from '../utils/localizedLabels';

type Props = {
  result?: BriefResult | null; lang: Language; partial?: Partial<BriefDraft> | null; streaming?: boolean;
  phase?: Extract<BriefProgress, { type: 'phase' }>['phase']; changedFields?: BriefField[];
};
type Source = 'provided' | 'suggested' | 'missing';
const sourceStyles: Record<Source, string> = {
  provided: 'bg-[#E9F5D5] text-[#355718]', suggested: 'bg-[#EEF1FF] text-[#0B2A9E]', missing: 'bg-[#FFF1CC] text-[#75551C]',
};
const sourceLabels = { ar: { provided: 'مذكور في الملاحظات', suggested: 'مقترح', missing: 'بحاجة إلى توضيح' }, en: { provided: 'Provided', suggested: 'Suggested', missing: 'Needs input' } };
const phaseLabels = {
  ar: { drafting: 'جارٍ صياغة المسودة…', checking: 'جارٍ مراجعة المسودة…', repairing: 'جارٍ ضبط المسودة…' },
  en: { drafting: 'Drafting your brief…', checking: 'Checking the draft…', repairing: 'Adjusting the draft…' },
};

export function BriefSkeleton() {
  return <div className="space-y-2 py-1" aria-hidden="true"><div className="ai-skeleton h-3 w-full rounded" /><div className="ai-skeleton h-3 w-5/6 rounded" /><div className="ai-skeleton h-3 w-2/3 rounded" /></div>;
}

function SourceLabel({ source, lang }: { source?: Source; lang: Language }) {
  return source ? <span className={`inline-block rounded border border-current/20 px-2 py-0.5 text-[10px] font-semibold ${sourceStyles[source]}`}>{sourceLabels[lang][source]}</span> : null;
}
function BriefSection({ title, source, lang, pending, changed, children }: { title: string; source?: Source; lang: Language; pending?: boolean; changed?: boolean; children: ReactNode }) {
  return <section className={`ai-section space-y-2 border-t border-[#EFE4CC] pt-4 ${changed ? 'ai-section-updated' : ''}`} data-updated={changed || undefined}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-[#12122B]">{title}</h3>{changed ? <span className="text-[10px] font-semibold text-[#0B2A9E]">{lang === 'ar' ? 'تم التحديث' : 'Updated'}</span> : <SourceLabel source={source} lang={lang} />}</div>
    <div className="text-sm leading-relaxed text-[#3A3A54] break-words whitespace-pre-wrap">{pending ? <BriefSkeleton /> : children}</div>
  </section>;
}

export function ChallengeBriefPreview({ result, lang, partial, streaming = false, phase = 'drafting', changedFields = [] }: Props) {
  const ar = lang === 'ar';
  const draft: Partial<BriefDraft> | null | undefined = streaming ? { ...result?.draft, ...partial } : result?.draft;
  const source = (field: BriefField, missing = false): Source | undefined => streaming ? undefined : missing ? 'missing' : result?.fieldSources[field] || 'suggested';
  const changed = (field: BriefField) => streaming
    ? !!result?.draft && !!partial && Object.hasOwn(partial, field) && JSON.stringify(result.draft[field]) !== JSON.stringify(partial[field])
    : changedFields.includes(field);
  const field = <T extends 'title' | 'summary' | 'description' | 'deliverables' | 'constraints' | 'criteria'>(name: T) => ar ? name : `${name}En` as `${T}En`;
  if (!draft) return <div className="card-pixel p-6 sm:p-8 bg-[#EEF1FF] space-y-3 ai-section">
    <FileText className="w-8 h-8 text-[#0B2A9E]" aria-hidden="true" />
    <h2 className="font-bold text-xl">{ar ? 'نحتاج إلى سياق أكثر قليلًا' : 'A little more context will help'}</h2>
    <p className="text-sm text-[#5B5B7B]">{ar ? 'صف المشكلة التي تواجه شركتك أو أجب عن الأسئلة، ثم حدّث المسودة.' : 'Describe the problem your company faces or answer the questions, then update the draft.'}</p>
  </div>;
  const listSections = [
    { field: 'deliverables', title: ar ? 'المخرجات المطلوبة' : 'Deliverables' },
    { field: 'constraints', title: ar ? 'القيود والمتطلبات' : 'Constraints & requirements' },
    { field: 'criteria', title: ar ? 'كيف نقيم الحل؟' : 'How will solutions be evaluated?' },
  ] as const;
  const difficulty = { ar: { small: 'صغير', medium: 'متوسط', expert: 'خبير' }, en: { small: 'Small', medium: 'Medium', expert: 'Expert' } };
  return <article className="card-pixel p-6 sm:p-8 space-y-5" dir={ar ? 'rtl' : 'ltr'} aria-busy={streaming} aria-label={ar ? 'معاينة مسودة التحدي' : 'Challenge draft preview'}>
    <header className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2 items-center"><span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0B2A9E]">{streaming && <LoaderCircle className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}{streaming ? phaseLabels[lang][phase] : ar ? 'مسودة للمراجعة' : 'DRAFT FOR REVIEW'}</span><SourceLabel source={source(field('title'))} lang={lang} /></div>
      <div key={draft[field('title')] || 'pending-title'} className={`ai-section ${changed(field('title')) ? 'ai-section-updated' : ''}`}>{draft[field('title')] ? <h2 className="text-xl sm:text-2xl font-bold leading-snug break-words">{draft[field('title')]}</h2> : <BriefSkeleton />}</div>
      <div key={draft[field('summary')] || 'pending-summary'} className="ai-section">{draft[field('summary')] ? <p className="text-sm text-[#5B5B7B] leading-relaxed break-words">{draft[field('summary')]}</p> : <BriefSkeleton />}</div>
      {(draft.category || draft.difficulty) && <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5B5B7B]">{draft.category && <span>{problemCategoryLabel(draft.category, lang)}</span>}{draft.difficulty && <span>{difficulty[lang][draft.difficulty]}</span>}</div>}
    </header>
    <BriefSection key={`description:${draft[field('description')]}`} title={ar ? 'المشكلة والهدف' : 'Problem & objective'} source={source(field('description'))} lang={lang} pending={draft[field('description')] === undefined} changed={changed(field('description'))}>{draft[field('description')]}</BriefSection>
    {listSections.map(section => {
      const key = field(section.field);
      const items = draft[key];
      return <BriefSection key={`${section.field}:${JSON.stringify(items)}`} title={section.title} source={source(key, !items?.length)} lang={lang} pending={items === undefined} changed={changed(key)}>
        {items?.length ? <ul className="list-disc ps-5 space-y-1.5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <span className="text-xs text-[#5B5B7B]">{ar ? 'يمكنك إضافة التفاصيل في النموذج.' : 'You can add details in the form.'}</span>}
      </BriefSection>;
    })}
    <BriefSection key={`skills:${JSON.stringify(draft.skills)}`} title={ar ? 'المهارات المقترحة' : 'Skills'} source={source('skills', !draft.skills?.length)} lang={lang} pending={draft.skills === undefined} changed={changed('skills')}>
      <div className="flex flex-wrap gap-2">{draft.skills?.length ? draft.skills.map(skill => <TagChip key={skill} tag={skill} size="sm" />) : <span className="text-xs">{ar ? 'اختر مهارة مدعومة قبل النشر.' : 'Choose a supported skill before publishing.'}</span>}</div>
    </BriefSection>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BriefSection key={`budget:${draft.budgetDzd}`} title={ar ? 'الميزانية' : 'Budget'} source={source('budgetDzd', draft.budgetDzd === null)} lang={lang} pending={draft.budgetDzd === undefined} changed={changed('budgetDzd')}>
        <span className="font-num">{draft.budgetDzd == null ? (ar ? 'غير محددة' : 'Not specified') : `${new Intl.NumberFormat(ar ? 'ar-DZ' : 'en-GB').format(draft.budgetDzd)} ${ar ? 'دج' : 'DZD'}`}</span>
      </BriefSection>
      <BriefSection key={`date:${draft.applicationDeadlineDate}`} title={ar ? 'آخر أجل للتقديم' : 'Applications close'} source={source('applicationDeadlineDate', !draft.applicationDeadlineDate)} lang={lang} pending={draft.applicationDeadlineDate === undefined} changed={changed('applicationDeadlineDate')}>
        <span className="font-num">{draft.applicationDeadlineDate ? new Intl.DateTimeFormat(ar ? 'ar-DZ' : 'en-GB', { dateStyle: 'medium' }).format(new Date(`${draft.applicationDeadlineDate}T12:00:00`)) : (ar ? 'غير محدد' : 'Not specified')}</span>
      </BriefSection>
    </div>
    {!streaming && !!result?.warnings.length && <aside className="rounded-md border-2 border-[#E0C577] bg-[#FFF1CC] p-3 text-xs leading-relaxed"><ul className="list-disc ps-4 space-y-1">{result.warnings.map((warning, index) => <li key={index}>{warning[lang]}</li>)}</ul></aside>}
    <p className="text-[11px] text-[#5B5B7B]">{streaming ? (ar ? 'تظهر الأقسام تباعًا؛ ستصبح المسودة قابلة للاستخدام بعد اكتمال المراجعة.' : 'Sections appear as they arrive. The draft becomes usable after checking finishes.') : (ar ? 'راجع الصياغة والمقترحات قبل النشر. التصنيفات تعكس تفسير المساعد للملاحظات.' : 'Review wording and suggestions before publishing. Labels reflect the assistant’s interpretation of your notes.')}</p>
  </article>;
}
