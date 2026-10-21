import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { decideApplication, listCompanyApplications } from '../api/applications';
import { getCompanyProblem } from '../api/problems';
import { ApiError, apiErrorMessage } from '../api/client';
import { fileUrl } from '../api/files';
import { ApplicationStatus } from '../components/ApplicationStatus';
import type { Application } from '../types';
import { deliveryDaysLabel, educationLevelLabel, experienceLevelLabel } from '../utils/localizedLabels';

const CompanyApplicationsContent: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { lang } = useApp();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const limit = 20;
  const load = useCallback(async (nextPage: number, decisionCommitted = false, keepRowsVisible = false) => {
    if (!keepRowsVisible) setLoading(true);
    setError('');
    try {
      const [problem, apps] = await Promise.all([getCompanyProblem(id), listCompanyApplications(id, nextPage, limit)]);
      setTitle(lang === 'ar' ? (problem.title || problem.titleEn) : (problem.titleEn || problem.title));
      setItems(apps.items); setTotal(apps.total); setPage(apps.page);
      return true;
    } catch (loadError) {
      setItems([]); setTotal(0); setTitle('');
      const refreshError = apiErrorMessage(loadError, lang);
      setError(decisionCommitted
        ? (lang === 'ar' ? `تم حفظ القرار، لكن تعذر تحديث القائمة. ${refreshError}` : `Decision saved, but the list could not refresh. ${refreshError}`)
        : refreshError);
      return false;
    }
    finally { if (!keepRowsVisible) setLoading(false); }
  }, [id, lang]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const decide = async (applicationId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    setBusy(applicationId); setError('');
    try {
      const updated = await decideApplication(applicationId, decision, reason[applicationId]);
      setItems((current) => current.map((item) => item.id === updated.id
        ? { ...item, ...updated, applicant: updated.applicant || item.applicant, problem: updated.problem || item.problem, files: updated.files || item.files }
        : item));
      await load(page, true, true);
    }
    catch (decisionError) {
      if (decisionError instanceof ApiError && decisionError.status === 409) await load(page);
      setError(apiErrorMessage(decisionError, lang));
    }
    finally { setBusy(''); }
  };

  const Chevron = lang === 'ar' ? ChevronLeft : ChevronRight;
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6"><nav className="flex items-center gap-2 text-xs text-[#5B5B7B]"><Link to="/company/problems" className="hover:underline">{lang === 'ar' ? 'مشكلاتي' : 'My Problems'}</Link><Chevron className="w-3.5 h-3.5" /><span className="font-bold text-[#12122B]">{lang === 'ar' ? 'مراجعة المتقدمين' : 'Review applicants'}</span></nav><div><h1 className="text-2xl font-bold text-[#12122B]">{title}</h1><p className="text-sm text-[#5B5B7B] mt-1">{lang === 'ar' ? 'قبول متقدم يغلق المشكلة ويرفض الطلبات الأخرى قيد المراجعة.' : 'Accepting one applicant closes the problem and rejects other pending applications.'}</p></div>
    {error && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    {loading ? <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل الطلبات…' : 'Loading applications…'}</div>
      : items.length === 0 ? <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'لا توجد طلبات مقدمة لهذه المشكلة.' : 'No submitted applications for this problem.'}</div>
        : <div className="flex flex-col gap-4">{items.map((application) => <article key={application.id} className="card-pixel p-5 sm:p-6 flex flex-col gap-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#12122B]">{(lang === 'ar' ? application.applicant?.name : (application.applicant?.name_en || application.applicant?.name)) || (lang === 'ar' ? 'موهبة' : 'Talent')}</h2><p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? application.applicant?.solverProfile?.firstName : (application.applicant?.solverProfile?.firstNameEn || application.applicant?.solverProfile?.firstName)} {lang === 'ar' ? application.applicant?.solverProfile?.lastName : (application.applicant?.solverProfile?.lastNameEn || application.applicant?.solverProfile?.lastName)} · {lang === 'ar' ? application.applicant?.solverProfile?.institutionMajor : (application.applicant?.solverProfile?.institutionMajorEn || application.applicant?.solverProfile?.institutionMajor)}</p></div><ApplicationStatus status={application.status} lang={lang} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"><div className="p-4 bg-[#F8F1E1] border border-[#12122B] rounded-md"><p className="font-bold mb-2">{lang === 'ar' ? 'المقترح' : 'Proposal'}</p><p className="whitespace-pre-line leading-relaxed">{lang === 'ar' ? application.coverMessage : (application.coverMessageEn || application.coverMessage)}</p></div><div className="p-4 bg-[#FFFBF1] border border-[#12122B] rounded-md"><p className="font-bold mb-2">{lang === 'ar' ? 'ملف الحلّال' : 'Talent profile'}</p><p>{educationLevelLabel(application.applicant?.solverProfile?.educationLevel, lang)}</p><p>{experienceLevelLabel(application.applicant?.solverProfile?.experienceLevel, lang)}</p><p className="mt-2">{application.applicant?.solverProfile?.skills?.join(', ')}</p><p className="mt-2">{lang === 'ar' ? 'مدة التنفيذ:' : 'Delivery time:'} {deliveryDaysLabel(application.deliveryDays, lang)}</p>{application.projectUrl && <a href={application.projectUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[#0B2A9E] underline">{lang === 'ar' ? 'رابط العمل' : 'Work link'}</a>}</div></div><div className="flex flex-wrap gap-3">{application.files.map((file) => <a key={file.id} href={fileUrl(file.id)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2A9E] underline"><FileText className="w-4 h-4" />{file.originalName}</a>)}{application.applicant?.solverProfile?.cvFileId && <a href={fileUrl(application.applicant.solverProfile.cvFileId)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2A9E] underline"><FileText className="w-4 h-4" />{application.applicant.solverProfile.cvFileName || 'CV'}</a>}</div>
          {application.status === 'UNDER_REVIEW' && <div className="pt-3 border-t border-[#EFE4CC] flex flex-col gap-3"><div><label className="block text-xs font-bold text-[#12122B] mb-1">{lang === 'ar' ? 'سبب الرفض (اختياري)' : 'Rejection reason (optional)'}</label><textarea value={reason[application.id] || ''} onChange={(event) => setReason((current) => ({ ...current, [application.id]: event.target.value }))} rows={2} className="w-full input-pixel text-xs" maxLength={2000} /></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy === application.id} onClick={() => void decide(application.id, 'ACCEPTED')} className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs font-bold btn-pixel-accent"><Check className="w-4 h-4" />{lang === 'ar' ? 'قبول واختيار' : 'Accept applicant'}</button><button type="button" disabled={busy === application.id} onClick={() => void decide(application.id, 'REJECTED')} className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary"><X className="w-4 h-4" />{lang === 'ar' ? 'رفض' : 'Reject'}</button></div></div>}
        </article>)}</div>}
    {total > limit && <div className="flex justify-between items-center"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'السابق' : 'Previous'}</button><span className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'صفحة' : 'Page'} {page} / {Math.ceil(total / limit)}</span><button type="button" disabled={page * limit >= total || loading} onClick={() => void load(page + 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'التالي' : 'Next'}</button></div>}
  </div>;
};

export const CompanyApplicationsPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { currentUser } = useApp();
  return <CompanyApplicationsContent key={`${id}:${currentUser.id}`} />;
};
