import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
import { listMyApplications } from '../api/applications';
import { uploadFile } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { deliveryDaysLabel } from '../utils/localizedLabels';
import confetti from 'canvas-confetti';
import { Coins, Clock, Upload, FileText, X, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const ProblemSubmitContent: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, dir, problems, loadProblem, calculateEligibility, saveApplicationDraft, submitApplication } = useApp();
  const loadProblemRef = useRef(loadProblem);
  useEffect(() => { loadProblemRef.current = loadProblem; }, [loadProblem]);
  const [problem, setProblem] = useState(problems.find((item) => item.id === id));
  const [loading, setLoading] = useState(!problem);
  const [summary, setSummary] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(10);
  const [projectUrl, setProjectUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [existingFile, setExistingFile] = useState('');
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    let active = true;
    void loadProblemRef.current(id).then((loaded) => { if (active) setProblem(loaded); })
      .catch((reason) => { if (active) setError(apiErrorMessage(reason, lang)); })
      .finally(() => { if (active) setLoading(false); });
    void listMyApplications().then((page) => {
      if (!active) return;
      const draft = page.items.find((application) => application.problemId === id && application.status === 'DRAFT');
      if (draft) {
        setSummary(lang === 'ar' ? draft.coverMessage : (draft.coverMessageEn || draft.coverMessage));
        setDeliveryDays(draft.deliveryDays);
        setProjectUrl(draft.projectUrl || '');
        setConfirmed(draft.consent);
        setExistingFile(draft.files?.[0]?.originalName || '');
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [id, lang]);

  const eligibility = problem ? calculateEligibility(problem.id, problem.tags) : null;
  const wordCount = summary.trim() ? summary.trim().split(/\s+/).filter(Boolean).length : 0;
  const input = () => ({ coverMessage: summary.trim(), deliveryDays: Number(deliveryDays), projectUrl: projectUrl.trim() || undefined, consent: confirmed });

  const validFile = (selected: File | null) => {
    if (!selected) return true;
    if (!/\.(pdf|docx)$/i.test(selected.name) || selected.size <= 0 || selected.size > 5 * 1024 * 1024) {
      setError(lang === 'ar' ? 'اختر ملف PDF أو DOCX بحجم لا يتجاوز 5 ميغابايت.' : 'Choose a PDF or DOCX file up to 5 MB.');
      return false;
    }
    return true;
  };

  const ensureDraftAndUpload = async () => {
    const savedId = await saveApplicationDraft(id, input());
    if (file) {
      const uploaded = await uploadFile(file, 'APPLICATION', { applicationId: savedId });
      setExistingFile(uploaded.originalName); setFile(null);
    }
    return savedId;
  };

  const handleSaveDraft = async () => {
    if (!validFile(file)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await ensureDraftAndUpload();
      setMessage(lang === 'ar' ? 'تم حفظ المسودة.' : 'Draft saved.');
    } catch (reason) { setError(apiErrorMessage(reason, lang)); }
    finally { setBusy(false); }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (wordCount < 10) {
      setError(lang === 'ar' ? 'يرجى كتابة 10 كلمات على الأقل.' : 'Please write at least 10 words.');
      return;
    }
    if (!confirmed) {
      setError(lang === 'ar' ? 'يجب الموافقة على شروط تقديم الطلب.' : 'You must accept the application terms.');
      return;
    }
    if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
      setError(lang === 'ar' ? 'مدة التنفيذ يجب أن تكون من يوم إلى 365 يومًا.' : 'Delivery time must be between 1 and 365 days.');
      return;
    }
    if (!validFile(file)) return;
    setBusy(true);
    try {
      await ensureDraftAndUpload();
      await submitApplication(id, input());
      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch { /* optional visual effect */ }
      navigate('/problems/' + id);
    } catch (reason) { setError(apiErrorMessage(reason, lang)); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المشكلة…' : 'Loading problem…'}</div>;
  if (!problem || !eligibility) return <div className="max-w-7xl mx-auto px-4 py-16"><div className="card-pixel p-10 text-center"><h1 className="text-xl font-bold">{lang === 'ar' ? 'المشكلة غير موجودة' : 'Problem not found'}</h1><Link to="/problems" className="inline-block mt-4 text-xs underline text-[#0B2A9E]">{lang === 'ar' ? 'العودة إلى المشكلات' : 'Back to problems'}</Link></div></div>;
  if (eligibility.status === 'needs_profile') return <div className="max-w-3xl mx-auto px-4 py-16"><div className="card-pixel p-8 text-center"><h1 className="text-2xl font-bold text-[#12122B]">{lang === 'ar' ? 'أكمل ملف الحلّال أولًا' : 'Complete your talent profile first'}</h1><p className="text-sm text-[#5B5B7B] mt-3">{lang === 'ar' ? 'يجب إكمال ملفك قبل إرسال طلب لهذه المشكلة.' : 'A complete talent profile is required before applying.'}</p><Link to="/profile/solver" className="inline-block mt-5 px-5 py-2 rounded-md font-bold text-xs btn-pixel-accent">{lang === 'ar' ? 'إكمال الملف' : 'Complete profile'}</Link></div></div>;
  if (eligibility.status === 'submitted' || problem.status === 'CLOSED') return <div className="max-w-3xl mx-auto px-4 py-16"><div className="card-pixel p-8 text-center"><h1 className="text-2xl font-bold text-[#12122B]">{lang === 'ar' ? 'لا يمكن إرسال طلب جديد' : 'A new application cannot be submitted'}</h1><p className="text-sm text-[#5B5B7B] mt-3">{lang === 'ar' ? 'راجع حالة طلبك أو اختر مشكلة مفتوحة.' : 'Check your application status or choose an open problem.'}</p><Link to={'/problems/' + id} className="inline-block mt-5 text-xs font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'العودة إلى المشكلة' : 'Back to problem'}</Link></div></div>;

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
    <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]"><Link to="/problems" className="hover:underline">{lang === 'ar' ? 'المشكلات' : 'Problems'}</Link><ChevronIcon className="w-3.5 h-3.5" /><Link to={'/problems/' + problem.id} className="hover:underline truncate max-w-xs">{lang === 'ar' ? problem.title : problem.title_en}</Link><ChevronIcon className="w-3.5 h-3.5" /><span className="font-bold text-[#12122B]">{lang === 'ar' ? 'تقديم طلب' : 'Apply'}</span></nav>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-4 card-pixel p-6 flex flex-col gap-5 bg-[#FFFBF1]"><div><span className="text-[11px] font-bold text-[#5B5B7B] uppercase block mb-1">{lang === 'ar' ? 'المشكلة المستهدفة' : 'Target problem'}</span><h2 className="text-base font-bold text-[#12122B] leading-snug">{lang === 'ar' ? problem.title : problem.title_en}</h2></div><div className="p-3 bg-[#FFF1CC] border border-[#12122B] rounded-md"><span className="text-[10px] font-bold text-[#5B5B7B] uppercase block mb-0.5">{lang === 'ar' ? 'المكافأة' : 'Reward'}</span><div className="flex items-center gap-1.5"><Coins className="w-4 h-4" /><span className="font-tag text-lg font-bold">{lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}</span></div></div><div className="flex flex-col gap-2.5 text-xs text-[#12122B] py-2 border-y border-[#EFE4CC]"><div className="flex items-center justify-between"><span>{lang === 'ar' ? 'مستوى الصعوبة:' : 'Difficulty:'}</span><DifficultyMeter difficulty={problem.difficulty} /></div><div className="flex items-center justify-between"><span>{lang === 'ar' ? 'آخر موعد:' : 'Deadline:'}</span><span className="flex items-center gap-1 font-bold"><Clock className="w-3.5 h-3.5" />{lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}</span></div></div><div><span className="text-[11px] font-bold text-[#5B5B7B] block mb-2">{lang === 'ar' ? 'المهارات المطلوبة:' : 'Required skills:'}</span><div className="flex flex-wrap gap-1">{problem.tags.map((tag) => <TagChip key={tag} tag={tag} size="sm" isMatched={eligibility.matchedSkills.includes(tag)} />)}</div></div><p className="text-[11px] text-[#5B5B7B] leading-relaxed pt-3 border-t border-[#EFE4CC]">{lang === 'ar' ? 'تطابق المهارات إرشادي فقط، ويمكنك التقديم حتى عند عدم تطابق المهارات.' : 'Skill overlap is advisory only; you can apply even without a match.'}</p></aside>
      <section className="lg:col-span-8 card-pixel p-6 sm:p-8 flex flex-col gap-6"><div><h1 className="text-2xl font-bold text-[#12122B] mb-1">{lang === 'ar' ? 'قدّم طلبك' : 'Submit your application'}</h1><p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'اشرح فكرتك وطريقة التنفيذ؛ الشركة تتخذ قرار القبول.' : 'Explain your approach. The company makes the final selection.'}</p></div>
        <div className="p-3.5 bg-[#EEF1FF] border-2 border-[#0B2A9E] rounded-md flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#0B2A9E] shrink-0" /><p className="text-xs text-[#0B2A9E] font-semibold">{lang === 'ar' ? 'تطابق المهارات: ' + eligibility.matchCount + ' من ' + eligibility.totalCount + ' (للاسترشاد فقط).' : 'Skill overlap: ' + eligibility.matchCount + ' of ' + eligibility.totalCount + ' (advisory only).'}</p></div>
        {error && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {message && <div className="p-3 bg-[#D9F5E5] border-2 border-[#1E9E5A] rounded-md text-xs font-bold text-[#1E9E5A]">{message}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-bold text-[#12122B]">{lang === 'ar' ? 'ملخص الحل المقترح *' : 'Proposed solution *'}</label><span className="text-[10px] text-[#5B5B7B]">{wordCount} {lang === 'ar' ? 'كلمات (10 على الأقل)' : 'words (10 minimum)'}</span></div><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} required className="w-full input-pixel text-xs leading-relaxed" placeholder={lang === 'ar' ? 'اشرح فكرتك التقنية وطريقة التنفيذ…' : 'Explain your technical approach and implementation…'} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-[#12122B] mb-1.5">{lang === 'ar' ? 'مدة التنفيذ المقترحة *' : 'Delivery time *'}</label><select value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} className="w-full input-pixel text-xs bg-[#FFFBF1]">{[5, 10, 14, 30, 60, 90].map((days) => <option key={days} value={days}>{deliveryDaysLabel(days, lang)}</option>)}</select></div><div><label className="block text-xs font-bold text-[#12122B] mb-1.5">{lang === 'ar' ? 'رابط عمل سابق أو نموذج تجريبي' : 'Work link / proof of concept'}</label><input type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://github.com/…" className="w-full input-pixel text-xs" /></div></div>
          <div><label className="block text-xs font-bold text-[#12122B] mb-1.5">{lang === 'ar' ? 'مرفق إضافي (اختياري)' : 'Attachment (optional)'}</label>{existingFile && <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#1E9E5A]"><FileText className="w-4 h-4" />{existingFile}</div>}{file ? <div className="p-3 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold"><FileText className="w-4 h-4 text-[#0B2A9E]" />{file.name}</span><button type="button" onClick={() => setFile(null)} className="p-1 cursor-pointer"><X className="w-4 h-4" /></button></div> : <label className="p-5 bg-[#F8F1E1] border-2 border-dashed border-[#12122B] rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#EFE4CC]"><Upload className="w-5 h-5 text-[#0B2A9E]" /><span className="text-xs font-bold text-[#12122B]">{lang === 'ar' ? 'اضغط لاختيار ملف' : 'Click to select a file'}</span><span className="text-[10px] text-[#5B5B7B]">{lang === 'ar' ? 'PDF, DOCX — الحد الأقصى 5 ميغابايت' : 'PDF, DOCX — Max 5 MB'}</span><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => { const selected = event.target.files?.[0] || null; if (validFile(selected)) setFile(selected); }} /></label>}</div>
          <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-[#0B2A9E]" /><span className="text-xs text-[#12122B] font-semibold">{lang === 'ar' ? 'أؤكد أن هذا العمل من إنجازي وأوافق على شروط تقديم الطلب.' : 'I confirm this is my work and agree to the application terms.'}</span></label>
          <div className="pt-4 border-t border-[#EFE4CC] flex flex-wrap items-center justify-between gap-3"><Link to={'/problems/' + problem.id} className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Link><div className="flex items-center gap-3"><button type="button" disabled={busy} onClick={() => void handleSaveDraft()} className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary">{busy ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : (lang === 'ar' ? 'حفظ كمسودة' : 'Save draft')}</button><button type="submit" disabled={busy} className="px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-accent">{busy ? (lang === 'ar' ? 'جارٍ الإرسال…' : 'Submitting…') : (lang === 'ar' ? 'إرسال الطلب' : 'Submit application')}</button></div></div>
        </form>
      </section>
    </div>
  </div>;
};

export const ProblemSubmitPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { currentUser } = useApp();
  return <ProblemSubmitContent key={`${id}:${currentUser.id}`} />;
};
