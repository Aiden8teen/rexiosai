import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCompanyProblem } from '../api/problems';
import { apiErrorMessage } from '../api/client';
import type { BriefDraft, EditableProblem } from '../api/contracts';
import { ProblemForm } from '../components/ProblemForm';
import { ChallengeBriefAssistant } from '../components/ChallengeBriefAssistant';

const CompanyProblemFormContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, currentUser } = useApp();
  const [problem, setProblem] = useState<EditableProblem | undefined>();
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<unknown>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>(id ? 'manual' : 'ai');
  const [appliedBrief, setAppliedBrief] = useState<{ revision: number; draft: BriefDraft }>();
  const Chevron = lang === 'ar' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!id) { setProblem(undefined); setError(''); setLoading(false); return; }
      setLoading(true); setError('');
      void getCompanyProblem(id).then((result) => { if (active) setProblem(result); })
        .catch((reason) => { if (active) setError(reason); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [id]);

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
    <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]"><Link to="/company/problems" className="hover:underline">{lang === 'ar' ? 'تحديات شركتي' : 'My Challenges'}</Link><Chevron className="w-3.5 h-3.5" /><span className="font-bold text-[#12122B]">{lang === 'ar' ? (id ? 'تعديل التحدي الصناعي' : 'طرح تحدٍّ صناعي') : (id ? 'Edit challenge' : 'Post a challenge')}</span></nav>
    {loading ? <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المشكلة…' : 'Loading problem…'}</div>
      : error ? <div className="card-pixel p-8 text-center"><AlertCircle className="w-6 h-6 text-[#E5432A] mx-auto mb-3" /><p className="text-sm font-semibold text-[#E5432A]">{apiErrorMessage(error, lang)}</p><Link to="/company/problems" className="inline-block mt-4 text-xs text-[#0B2A9E] underline">{lang === 'ar' ? 'العودة إلى تحديات شركتي' : 'Back to My Challenges'}</Link></div>
        : <>
          {!id && <div role="group" aria-label={lang === 'ar' ? 'طريقة إنشاء التحدي' : 'Challenge creation method'} className="flex flex-wrap gap-3">
            {([{ value: 'ai', Icon: Sparkles, label: lang === 'ar' ? 'وصف بمساعدة الذكاء الاصطناعي' : 'Describe with AI' }, { value: 'manual', Icon: FileText, label: lang === 'ar' ? 'تعبئة النموذج يدويًا' : 'Fill manually' }] as const).map(({ value, Icon, label }) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold cursor-pointer ${mode === value ? 'btn-pixel-primary' : 'btn-pixel-secondary'}`}><Icon className="w-4 h-4" aria-hidden="true" />{label}</button>)}
          </div>}
          {!id && <div hidden={mode !== 'ai'}><ChallengeBriefAssistant lang={lang} accountId={currentUser.id} onUseDraft={draft => {
            setAppliedBrief(current => ({ revision: (current?.revision || 0) + 1, draft }));
            setMode('manual');
          }} /></div>}
          <div hidden={!id && mode !== 'manual'}><ProblemForm key={id || 'new'} lang={lang} initial={problem} companyProfile={currentUser.companyProfile} companyName={currentUser.name} companyNameEn={currentUser.name_en || currentUser.name} appliedBrief={appliedBrief} /></div>
        </>}
  </div>;
};

export const CompanyProblemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useApp();
  return <CompanyProblemFormContent key={`${id || 'new'}:${currentUser.id}`} />;
};
