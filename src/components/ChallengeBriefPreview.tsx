import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import type { BriefField, BriefResult } from '../api/contracts';
import type { Language } from '../types';
import { TagChip } from './TagChip';
import { problemCategoryLabel } from '../utils/localizedLabels';

type Props = { result: BriefResult; lang: Language };
type Source = 'provided' | 'suggested' | 'missing';

const sourceStyles: Record<Source, string> = {
  provided: 'bg-[#E9F5D5] text-[#355718]', suggested: 'bg-[#EEF1FF] text-[#0B2A9E]', missing: 'bg-[#FFF1CC] text-[#75551C]',
};
const sourceLabels = { ar: { provided: 'مذكور في الملاحظات', suggested: 'مقترح', missing: 'بحاجة إلى توضيح' }, en: { provided: 'Provided', suggested: 'Suggested', missing: 'Needs input' } };

function SourceLabel({ source, lang }: { source: Source; lang: Language }) {
  return <span className={`inline-block rounded border border-current/20 px-2 py-0.5 text-[10px] font-semibold ${sourceStyles[source]}`}>{sourceLabels[lang][source]}</span>;
}

function BriefSection({ title, source, lang, children }: { title: string; source: Source; lang: Language; children: ReactNode }) {
  return <section className="space-y-2 border-t border-[#EFE4CC] pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-[#12122B]">{title}</h3><SourceLabel source={source} lang={lang} /></div>
    <div className="text-sm leading-relaxed text-[#3A3A54] break-words whitespace-pre-wrap">{children}</div>
  </section>;
}

export function ChallengeBriefPreview({ result, lang }: Props) {
  const ar = lang === 'ar';
  const { draft } = result;
  const source = (field: BriefField, missing = false): Source => missing ? 'missing' : result.fieldSources[field] || 'suggested';
  if (!draft) return <div className="card-pixel p-6 sm:p-8 bg-[#EEF1FF] space-y-3">
    <FileText className="w-8 h-8 text-[#0B2A9E]" aria-hidden="true" />
    <h2 className="font-bold text-xl">{ar ? 'نحتاج إلى سياق أكثر قليلًا' : 'A little more context will help'}</h2>
    <p className="text-sm text-[#5B5B7B]">{ar ? 'صف المشكلة التي تواجه شركتك أو أجب عن الأسئلة، ثم حدّث المسودة.' : 'Describe the problem your company faces or answer the questions, then update the draft.'}</p>
  </div>;

  const languageField = <T extends 'title' | 'summary' | 'description' | 'deliverables' | 'constraints' | 'criteria'>(field: T) => ar ? field : `${field}En` as `${T}En`;
  const listSections = [
    { field: 'deliverables', title: ar ? 'المخرجات المطلوبة' : 'Deliverables' },
    { field: 'constraints', title: ar ? 'القيود والمتطلبات' : 'Constraints & requirements' },
    { field: 'criteria', title: ar ? 'كيف نقيم الحل؟' : 'How will solutions be evaluated?' },
  ] as const;
  const difficulty = { ar: { small: 'صغير', medium: 'متوسط', expert: 'خبير' }, en: { small: 'Small', medium: 'Medium', expert: 'Expert' } };
  return <article className="card-pixel p-6 sm:p-8 space-y-5" dir={ar ? 'rtl' : 'ltr'} aria-label={ar ? 'معاينة مسودة التحدي' : 'Challenge draft preview'}>
    <header className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2 items-center"><span className="text-[11px] font-bold text-[#0B2A9E]">{ar ? 'مسودة للمراجعة' : 'DRAFT FOR REVIEW'}</span><SourceLabel source={source(languageField('title'))} lang={lang} /></div>
      <h2 className="text-xl sm:text-2xl font-bold leading-snug break-words">{draft[languageField('title')]}</h2>
      <p className="text-sm text-[#5B5B7B] leading-relaxed break-words">{draft[languageField('summary')]}</p>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5B5B7B]"><span>{problemCategoryLabel(draft.category, lang)}</span><span aria-hidden="true">·</span><span>{difficulty[lang][draft.difficulty]}</span></div>
    </header>
    <BriefSection title={ar ? 'المشكلة والهدف' : 'Problem & objective'} source={source(languageField('description'))} lang={lang}>{draft[languageField('description')]}</BriefSection>
    {listSections.map(section => {
      const key = languageField(section.field);
      const items = draft[key];
      return <BriefSection key={section.field} title={section.title} source={source(key, !items.length)} lang={lang}>
        {items.length ? <ul className="list-disc ps-5 space-y-1.5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <span className="text-xs text-[#5B5B7B]">{ar ? 'يمكنك إضافة التفاصيل في النموذج.' : 'You can add details in the form.'}</span>}
      </BriefSection>;
    })}
    <BriefSection title={ar ? 'المهارات المقترحة' : 'Skills'} source={source('skills', !draft.skills.length)} lang={lang}>
      <div className="flex flex-wrap gap-2">{draft.skills.length ? draft.skills.map(skill => <TagChip key={skill} tag={skill} size="sm" />) : <span className="text-xs">{ar ? 'اختر مهارة مدعومة قبل النشر.' : 'Choose a supported skill before publishing.'}</span>}</div>
    </BriefSection>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BriefSection title={ar ? 'الميزانية' : 'Budget'} source={source('budgetDzd', draft.budgetDzd === null)} lang={lang}>
        <span className="font-num">{draft.budgetDzd === null ? (ar ? 'غير محددة' : 'Not specified') : `${new Intl.NumberFormat(ar ? 'ar-DZ' : 'en-GB').format(draft.budgetDzd)} ${ar ? 'دج' : 'DZD'}`}</span>
      </BriefSection>
      <BriefSection title={ar ? 'آخر أجل للتقديم' : 'Applications close'} source={source('applicationDeadlineDate', !draft.applicationDeadlineDate)} lang={lang}>
        <span className="font-num">{draft.applicationDeadlineDate ? new Intl.DateTimeFormat(ar ? 'ar-DZ' : 'en-GB', { dateStyle: 'medium' }).format(new Date(`${draft.applicationDeadlineDate}T12:00:00`)) : (ar ? 'غير محدد' : 'Not specified')}</span>
      </BriefSection>
    </div>
    {result.warnings.length > 0 && <aside className="rounded-md border-2 border-[#E0C577] bg-[#FFF1CC] p-3 text-xs leading-relaxed"><ul className="list-disc ps-4 space-y-1">{result.warnings.map((warning, index) => <li key={index}>{warning[lang]}</li>)}</ul></aside>}
    <p className="text-[11px] text-[#5B5B7B]">{ar ? 'راجع الصياغة والمقترحات قبل النشر. التصنيفات تعكس تفسير المساعد للملاحظات.' : 'Review wording and suggestions before publishing. Labels reflect the assistant’s interpretation of your notes.'}</p>
  </article>;
}
