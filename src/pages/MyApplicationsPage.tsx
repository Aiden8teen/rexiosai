import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { listMyApplications } from '../api/applications';
import { apiErrorMessage } from '../api/client';
import { ApplicationStatus } from '../components/ApplicationStatus';
import { fileUrl } from '../api/files';
import type { Application } from '../types';

const MyApplicationsContent: React.FC = () => {
  const { lang } = useApp();
  const [items, setItems] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;
  const load = useCallback(async (nextPage: number) => {
    setLoading(true); setError('');
    try { const result = await listMyApplications(nextPage, limit); setItems(result.items); setTotal(result.total); setPage(result.page); }
    catch (reason) { setItems([]); setTotal(0); setError(apiErrorMessage(reason, lang)); }
    finally { setLoading(false); }
  }, [lang]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6"><div><h1 className="text-3xl font-bold text-[#12122B]">{lang === 'ar' ? 'طلباتي' : 'My Applications'}</h1><p className="text-sm text-[#5B5B7B] mt-1">{lang === 'ar' ? 'تابع المسودات والقرارات الصادرة عن الشركات.' : 'Track your saved drafts and company decisions.'}</p></div>
    {error && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    {loading ? <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل الطلبات…' : 'Loading applications…'}</div>
      : items.length === 0 ? <div className="card-pixel p-12 text-center"><FileText className="w-8 h-8 mx-auto text-[#0B2A9E] mb-3" /><p className="font-bold text-[#12122B]">{lang === 'ar' ? 'لا توجد طلبات بعد' : 'No applications yet'}</p><Link to="/problems" className="inline-block mt-3 text-xs font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'تصفح المشكلات' : 'Browse problems'}</Link></div>
        : <div className="flex flex-col gap-4">{items.map((application) => <article key={application.id} className="card-pixel p-5 sm:p-6 flex flex-col gap-3"><div className="flex items-start justify-between gap-4"><div><Link to={'/problems/' + application.problemId} className="text-lg font-bold text-[#12122B] hover:text-[#0B2A9E]">{lang === 'ar' ? application.problem.title : (application.problem.titleEn || application.problem.title)}</Link><p className="text-[11px] text-[#5B5B7B] mt-1">{lang === 'ar' ? 'مدة التنفيذ المقترحة:' : 'Proposed delivery:'} {application.deliveryDays} {lang === 'ar' ? 'يوم' : 'days'}</p></div><ApplicationStatus status={application.status} lang={lang} /></div><p className="text-xs text-[#5B5B7B] leading-relaxed whitespace-pre-line">{application.coverMessage}</p>{application.status === 'REJECTED' && application.rejectionReason && <div className="p-3 bg-[#FFE3DC] border border-[#E5432A] rounded-md text-xs text-[#7C2C20]"><strong>{lang === 'ar' ? 'سبب الرفض: ' : 'Reason: '}</strong>{application.rejectionReason}</div>}{application.status === 'DRAFT' && <Link to={'/problems/' + application.problemId + '/submit'} className="self-start px-3 py-2 rounded-md text-xs font-bold btn-pixel-accent">{lang === 'ar' ? 'متابعة المسودة' : 'Resume draft'}</Link>}{application.files.map((file) => <a key={file.id} href={fileUrl(file.id)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2A9E] underline"><FileText className="w-4 h-4" />{file.originalName}</a>)}</article>)}</div>}
    {total > limit && <div className="flex justify-between items-center"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'السابق' : 'Previous'}</button><span className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'صفحة' : 'Page'} {page} / {Math.ceil(total / limit)}</span><button type="button" disabled={page * limit >= total || loading} onClick={() => void load(page + 1)} className="px-4 py-2 rounded-md text-xs font-bold btn-pixel-secondary">{lang === 'ar' ? 'التالي' : 'Next'}</button></div>}
  </div>;
};

export const MyApplicationsPage: React.FC = () => {
  const { currentUser } = useApp();
  return <MyApplicationsContent key={currentUser.id} />;
};
