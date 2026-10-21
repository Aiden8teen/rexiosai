import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BriefcaseBusiness, Clock, Edit3, FileText, Plus, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { closeProblem, listCompanyProblems } from '../api/problems';
import { apiErrorMessage } from '../api/client';
import { mapApiProblem } from '../api/mappers';
import type { ApiProblem } from '../api/contracts';
import type { Problem } from '../types';

const statusText = (status: Problem['status'], lang: 'ar' | 'en') => {
  if (status === 'OPEN') return lang === 'ar' ? 'مفتوحة لتلقي العروض' : 'Open for proposals';
  if (status === 'CLOSED') return lang === 'ar' ? 'مكتملة ومغلقة' : 'Closed';
  return lang === 'ar' ? 'مسودة' : 'Draft';
};

const CompanyProblemsContent: React.FC = () => {
  const { lang } = useApp();
  const [items, setItems] = useState<Problem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const limit = 20;

  const load = useCallback(async (nextPage: number) => {
    setLoading(true); setError('');
    try {
      const result = await listCompanyProblems({ page: nextPage, limit });
      setItems(result.items.map((item: ApiProblem) => mapApiProblem(item)));
      setTotal(result.total); setPage(result.page);
    } catch (reason) { setItems([]); setTotal(0); setError(apiErrorMessage(reason, lang)); }
    finally { setLoading(false); }
  }, [lang]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleClose = async (id: string) => {
    setBusy(id); setError('');
    try { await closeProblem(id); await load(page); }
    catch (reason) { setError(apiErrorMessage(reason, lang)); }
    finally { setBusy(''); }
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#12122B]">{lang === 'ar' ? 'تحديات شركتي الصناعية' : 'My Industrial Challenges'}</h1>
        <p className="text-xs sm:text-sm text-[#5B5B7B] mt-1">{lang === 'ar' ? 'تابع المشكلات الصناعية الخاصة بشركتك، وراجع عروض المهندسين، واعتمد الحلول المناسبة.' : 'Manage your company challenges, review proposals, and accept solutions.'}</p>
      </div>
      <Link to="/company/problems/new" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent shrink-0">
        <Plus className="w-4 h-4" />{lang === 'ar' ? 'طرح تحدٍّ صناعي جديد +' : 'Post a new challenge +'}
      </Link>
    </div>
    {error && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    {loading ? <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل التحديات والمشكلات…' : 'Loading problems…'}</div>
      : items.length === 0 ? <div className="card-pixel p-12 text-center"><BriefcaseBusiness className="w-8 h-8 mx-auto text-[#0B2A9E] mb-3" /><p className="font-bold text-[#12122B]">{lang === 'ar' ? 'لم تطرح شركتك أي تحدٍّ صناعي بعد' : 'No challenges posted yet'}</p><p className="text-xs text-[#5B5B7B] mt-2">{lang === 'ar' ? 'اطرح مشكلتك الصناعية بميزانية محددة ومتطلبات واضحة لاستقبال مقترحات المهندسين.' : 'Post your industrial problem with budget and requirements to receive proposals.'}</p><Link to="/company/problems/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md font-bold text-xs btn-pixel-accent"><Plus className="w-4 h-4" />{lang === 'ar' ? 'طرح أول تحدٍّ الآن' : 'Post first challenge'}</Link></div>
        : <div className="flex flex-col gap-4">{items.map((problem) => <article key={problem.id} className="card-pixel p-4 sm:p-6 flex flex-col gap-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={'inline-flex px-2.5 py-1 border border-[#12122B] rounded-full text-[10px] font-bold ' + (problem.status === 'OPEN' ? 'bg-[#D9F5E5] text-[#1E9E5A]' : problem.status === 'CLOSED' ? 'bg-[#EFE4CC] text-[#5B5B7B]' : 'bg-[#FFF1CC] text-[#12122B]')}>{statusText(problem.status, lang)}</span><h2 className="text-base sm:text-lg font-bold text-[#12122B] mt-2">{lang === 'ar' ? problem.title : problem.title_en}</h2><p className="text-xs text-[#5B5B7B] mt-1">{lang === 'ar' ? problem.summary : problem.summary_en}</p></div><div className="flex items-center gap-1.5 text-xs font-bold text-[#12122B] bg-[#F8F1E1] px-2.5 py-1 rounded border border-[#12122B]"><Users className="w-4 h-4 text-[#0B2A9E]" /><span>{problem.proposalsCount} {lang === 'ar' ? 'عروض مقدمة' : 'proposals'}</span></div></div><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EFE4CC]"><div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#5B5B7B]"><span className="font-tag text-sm font-bold text-[#12122B]">{lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}</span></div><div className="flex flex-wrap items-center gap-2"><Link to={'/company/problems/' + problem.id + '/applications'} className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-primary"><Users className="w-3.5 h-3.5" />{lang === 'ar' ? 'مراجعة العروض المقدمة' : 'Review proposals'}</Link><Link to={'/company/problems/' + problem.id + '/edit'} className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary"><Edit3 className="w-3.5 h-3.5" />{problem.status === 'CLOSED' ? (lang === 'ar' ? 'الملاحظات السرية' : 'Private details') : (lang === 'ar' ? 'تعديل التحدي' : 'Edit')}</Link>{problem.status === 'OPEN' && <button type="button" disabled={busy === problem.id} onClick={() => void handleClose(problem.id)} className="px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary cursor-pointer">{busy === problem.id ? '…' : (lang === 'ar' ? 'إغلاق التحدي' : 'Close')}</button>}{problem.status !== 'DRAFT' && <Link to={'/problems/' + problem.id} className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary"><FileText className="w-3.5 h-3.5" />{lang === 'ar' ? 'المعاينة العامة' : 'Public view'}</Link>}</div></div></article>)}</div>}
    {total > limit && <div className="flex justify-between items-center"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'السابق' : 'Previous'}</button><span className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'صفحة' : 'Page'} {page} / {Math.ceil(total / limit)}</span><button type="button" disabled={page * limit >= total || loading} onClick={() => void load(page + 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'التالي' : 'Next'}</button></div>}
  </div>;
};

export const CompanyProblemsPage: React.FC = () => {
  const { currentUser } = useApp();
  return <CompanyProblemsContent key={currentUser.id} />;
};
