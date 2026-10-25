import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Plus,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
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
  const [problemToClose, setProblemToClose] = useState<Problem | null>(null);
  const limit = 20;

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await listCompanyProblems({ page: nextPage, limit });
      setItems(result.items.map((item: ApiProblem) => mapApiProblem(item)));
      setTotal(result.total);
      setPage(result.page);
    } catch (reason) {
      setItems([]);
      setTotal(0);
      setError(apiErrorMessage(reason, lang));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleClose = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      await closeProblem(id);
      await load(page);
    } catch (reason) {
      setError(apiErrorMessage(reason, lang));
    } finally {
      setBusy('');
      setProblemToClose(null);
    }
  };

  const openCount = items.filter((p) => p.status === 'OPEN').length;
  const totalProposals = items.reduce((sum, p) => sum + (p.proposalsCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C6FF3D] border-2 border-[#12122B] rounded-full text-xs font-bold text-[#12122B] shadow-pixel-s mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'لوحة تحكم الشركة والمصنع' : 'Company Dashboard'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#12122B]">
            {lang === 'ar' ? 'تحديات شركتي الصناعية' : 'My Industrial Challenges'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5B5B7B] mt-1 max-w-2xl">
            {lang === 'ar'
              ? 'تابع المشكلات الصناعية الخاصة بشركتك، وراجع عروض المهندسين، واعتمد الحلول المناسبة لتطوير أعمالك.'
              : 'Manage your company challenges, review engineer proposals, and accept solutions.'}
          </p>
        </div>
        <Link
          to="/company/problems/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent shrink-0"
        >
          <Plus className="w-4 h-4" />
          {lang === 'ar' ? 'طرح تحدٍّ صناعي جديد +' : 'Post a new challenge +'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pixel p-5 bg-[#FFFBF1]">
          <span className="text-xs font-semibold text-[#5B5B7B]">
            {lang === 'ar' ? 'إجمالي التحديات المطروحة' : 'Total Challenges'}
          </span>
          <p className="font-num text-2xl sm:text-3xl font-bold text-[#12122B] mt-1">
            {total || items.length}
          </p>
        </div>

        <div className="card-pixel p-5 bg-[#D9F5E5]">
          <span className="text-xs font-semibold text-[#1E9E5A]">
            {lang === 'ar' ? 'تحديات مفتوحة لتلقي العروض' : 'Open for Proposals'}
          </span>
          <p className="font-num text-2xl sm:text-3xl font-bold text-[#1E9E5A] mt-1">
            {openCount}
          </p>
        </div>

        <div className="card-pixel p-5 bg-[#EEF1FF]">
          <span className="text-xs font-semibold text-[#0B2A9E]">
            {lang === 'ar' ? 'إجمالي العروض المستلمة' : 'Total Proposals Received'}
          </span>
          <p className="font-num text-2xl sm:text-3xl font-bold text-[#0B2A9E] mt-1">
            {totalProposals}
          </p>
        </div>
      </div>

      <div className="card-pixel p-5 sm:p-6 bg-[#FFFBF1] border-2 border-[#12122B] shadow-pixel-s">
        <h2 className="text-sm font-bold text-[#12122B] mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0B2A9E]" />
          <span>
            {lang === 'ar'
              ? 'دليل إدارة وحل التحديات الصناعية لشركتك عبر المنصة'
              : 'How Industrial Challenges Work on Rexios'}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#F8F1E1] border border-[#12122B] rounded-md flex flex-col gap-1.5">
            <span className="font-num font-bold text-[#0B2A9E] text-xs">01</span>
            <strong className="text-[#12122B]">
              {lang === 'ar' ? 'طرح المشكلة بدقة' : '1. Define the Challenge'}
            </strong>
            <p className="text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'حدد ميزانية التحدي بالدينار الجزائري، المخرجات المطلوبة، والمهارات التقنية اللازمة.'
                : 'Set budget in DZD, required technical deliverables, and key engineering skills.'}
            </p>
          </div>
          <div className="p-3 bg-[#F8F1E1] border border-[#12122B] rounded-md flex flex-col gap-1.5">
            <span className="font-num font-bold text-[#0B2A9E] text-xs">02</span>
            <strong className="text-[#12122B]">
              {lang === 'ar' ? 'مراجعة عروض المهندسين' : '2. Review Proposals'}
            </strong>
            <p className="text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'قارن منهجيات العمل، مدة التنفيذ المقترحة، وملفات النماذج الأولية المقدمة من المطورين.'
                : 'Evaluate technical approaches, delivery timelines, and candidate engineering portfolios.'}
            </p>
          </div>
          <div className="p-3 bg-[#F8F1E1] border border-[#12122B] rounded-md flex flex-col gap-1.5">
            <span className="font-num font-bold text-[#0B2A9E] text-xs">03</span>
            <strong className="text-[#12122B]">
              {lang === 'ar' ? 'الاعتماد وبدء التنفيذ' : '3. Accept & Deliver'}
            </strong>
            <p className="text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'اعتمد العرض الأنسب، وتواصل مباشرة مع المهندس المعتمد لاستلام المخرجات وإغلاق التحدي.'
                : 'Accept the winning proposal, collaborate with the solver, and receive deliverables.'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">
          {lang === 'ar' ? 'جارٍ تحميل التحديات والمشكلات…' : 'Loading problems…'}
        </div>
      ) : items.length === 0 ? (
        <div className="card-pixel p-12 text-center">
          <BriefcaseBusiness className="w-8 h-8 mx-auto text-[#0B2A9E] mb-3" />
          <p className="font-bold text-[#12122B]">
            {lang === 'ar' ? 'لم تطرح شركتك أي تحدٍّ صناعي بعد' : 'No challenges posted yet'}
          </p>
          <p className="text-xs text-[#5B5B7B] mt-2">
            {lang === 'ar'
              ? 'اطرح مشكلتك الصناعية بميزانية محددة ومتطلبات واضحة لاستقبال مقترحات المهندسين.'
              : 'Post your industrial problem with budget and requirements to receive proposals.'}
          </p>
          <Link
            to="/company/problems/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md font-bold text-xs btn-pixel-accent"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ar' ? 'طرح أول تحدٍّ الآن' : 'Post first challenge'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((problem) => (
            <article key={problem.id} className="card-pixel p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={
                      'inline-flex px-2.5 py-1 border border-[#12122B] rounded-full text-[10px] font-bold ' +
                      (problem.status === 'OPEN'
                        ? 'bg-[#D9F5E5] text-[#1E9E5A]'
                        : problem.status === 'CLOSED'
                        ? 'bg-[#EFE4CC] text-[#5B5B7B]'
                        : 'bg-[#FFF1CC] text-[#12122B]')
                    }
                  >
                    {statusText(problem.status, lang)}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#12122B] mt-2">
                    {lang === 'ar' ? problem.title : problem.title_en}
                  </h2>
                  <p className="text-xs text-[#5B5B7B] mt-1">
                    {lang === 'ar' ? problem.summary : problem.summary_en}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#12122B] bg-[#F8F1E1] px-2.5 py-1 rounded border border-[#12122B]">
                  <Users className="w-4 h-4 text-[#0B2A9E]" />
                  <span>
                    {problem.proposalsCount} {lang === 'ar' ? 'عروض مقدمة' : 'proposals'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EFE4CC]">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#5B5B7B]">
                  <span className="font-num text-sm font-bold text-[#12122B]">
                    {lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={'/company/problems/' + problem.id + '/applications'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-primary"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'مراجعة العروض المقدمة' : 'Review proposals'}
                  </Link>
                  <Link
                    to={'/company/problems/' + problem.id + '/edit'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {problem.status === 'CLOSED'
                      ? lang === 'ar'
                        ? 'الملاحظات السرية'
                        : 'Private details'
                      : lang === 'ar'
                      ? 'تعديل التحدي'
                      : 'Edit'}
                  </Link>
                  {problem.status === 'OPEN' && (
                    <button
                      type="button"
                      disabled={busy === problem.id}
                      onClick={() => setProblemToClose(problem)}
                      className="px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary cursor-pointer"
                    >
                      {busy === problem.id ? '…' : lang === 'ar' ? 'إغلاق التحدي' : 'Close'}
                    </button>
                  )}
                  {problem.status !== 'DRAFT' && (
                    <Link
                      to={'/problems/' + problem.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-md font-bold text-xs btn-pixel-secondary"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'المعاينة العامة' : 'Public view'}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
            className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary"
          >
            {lang === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <span className="text-xs text-[#5B5B7B]">
            {lang === 'ar' ? 'صفحة' : 'Page'} {page} / {Math.ceil(total / limit)}
          </span>
          <button
            type="button"
            disabled={page * limit >= total || loading}
            onClick={() => void load(page + 1)}
            className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary"
          >
            {lang === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}

      {problemToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 scrim-modal animate-in fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-modal-title"
            className="card-pixel bg-[#FFFBF1] max-w-md w-full p-6 flex flex-col gap-4 shadow-pixel-l border-2 border-[#12122B]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-[#E5432A] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="close-modal-title" className="text-base font-bold text-[#12122B]">
                    {lang === 'ar' ? 'تأكيد إغلاق التحدي الصناعي' : 'Confirm Closing Challenge'}
                  </h2>
                  <p className="text-xs text-[#5B5B7B] mt-1">
                    {lang === 'ar' ? (
                      <>
                        هل أنت متأكد من رغبتك في إغلاق التحدي{' '}
                        <strong className="text-[#12122B]">«{problemToClose.title}»</strong>؟
                      </>
                    ) : (
                      <>
                        Are you sure you want to close{' '}
                        <strong className="text-[#12122B]">
                          "{problemToClose.title_en || problemToClose.title}"
                        </strong>
                        ?
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProblemToClose(null)}
                className="p-1 rounded hover:bg-[#EFE4CC] text-[#5B5B7B] cursor-pointer"
                aria-label={lang === 'ar' ? 'إلغاء' : 'Cancel'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FFE3DC] border border-[#E5432A] rounded-md text-xs text-[#E5432A] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'تنبيه: سيؤدي الإغلاق إلى إيقاف استقبال عروض جديدة، وسيتم رفض العروض التي لا تزال قيد المراجعة تلقائيًا.'
                  : 'Warning: Closing will stop new proposals and reject any proposals still under review.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EFE4CC]">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => setProblemToClose(null)}
                className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary cursor-pointer"
              >
                {lang === 'ar' ? 'تراجع وإلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void handleClose(problemToClose.id)}
                className="px-4 py-2 rounded-md font-bold text-xs bg-[#E5432A] text-[#FFFBF1] border-2 border-[#12122B] shadow-pixel-s hover:bg-[#C9331C] cursor-pointer disabled:opacity-50"
              >
                {busy === problemToClose.id
                  ? '…'
                  : lang === 'ar'
                  ? 'تأكيد الإغلاق نهائياً'
                  : 'Yes, Close Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CompanyProblemsPage: React.FC = () => {
  const { currentUser } = useApp();
  return <CompanyProblemsContent key={currentUser.id} />;
};
