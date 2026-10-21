import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompanyProfile } from '../types';
import type { EditableProblem, ProblemInput } from '../api/contracts';
import { createProblem, publishProblem, updateProblem } from '../api/problems';
import { useApp } from '../context/AppContext';
import { uploadFile } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import { TagChip } from './TagChip';
import { useMetadata } from '../hooks/useMetadata';
import { problemCategoryLabel } from '../utils/localizedLabels';

interface Props { lang: 'ar' | 'en'; initial?: EditableProblem; companyProfile?: CompanyProfile; companyName: string }
const lines = (value: string | undefined) => (value || '').split('\n').map((line) => line.trim()).filter(Boolean);
const toLocalDateTimeInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const inputClass = 'w-full input-pixel text-xs';
const labelClass = 'block text-xs font-bold text-[#12122B] mb-1.5';

const FilePicker: React.FC<{
  lang: 'ar' | 'en'; label: string; inputId: string; files: File[]; existingFiles: { id: string; originalName: string }[];
  disabled?: boolean;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>; onChoose: (files: FileList | null) => void;
}> = ({ lang, label, inputId, files, existingFiles, disabled = false, setFiles, onChoose }) => (
  <div>
    <label htmlFor={inputId} className={labelClass}>{label}</label>
    <label className={'p-5 bg-[#F8F1E1] border-2 border-dashed border-[#12122B] rounded-md flex flex-col items-center justify-center gap-1 ' + (disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-[#EFE4CC]')}>
      <Upload className="w-5 h-5 text-[#0B2A9E]" />
      <span className="text-xs font-bold text-[#12122B]">{lang === 'ar' ? 'اضغط لاختيار الملفات' : 'Choose files'}</span>
      <span className="text-[10px] text-[#5B5B7B]">{lang === 'ar' ? 'PDF, DOCX — الحد الأقصى 5 ميغابايت' : 'PDF, DOCX — Max 5 MB'}</span>
      <input id={inputId} aria-label={label} type="file" disabled={disabled} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" onChange={(event) => onChoose(event.target.files)} />
    </label>
    {existingFiles.map((file) => <div key={file.id} className="flex items-center gap-2 text-xs mt-2"><FileText className="w-4 h-4" />{file.originalName}</div>)}
    {files.map((file, index) => <div key={file.name + index} className="flex items-center justify-between text-xs mt-2"><span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#0B2A9E]" />{file.name}</span><button type="button" aria-label={lang === 'ar' ? 'إزالة الملف' : 'Remove file'} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} className="cursor-pointer"><X className="w-4 h-4" /></button></div>)}
  </div>
);

export const ProblemForm: React.FC<Props> = ({ lang, initial, companyProfile, companyName }) => {
  const navigate = useNavigate();
  const { updateCompanyProfile } = useApp();
  const { skills: availableSkills, loading: skillsLoading, error: skillsError, retry: retrySkills } = useMetadata();
  const isAr = lang === 'ar';
  const publicLocked = Boolean(initial && (initial.status === 'CLOSED' || initial.applicationsCount > 0));
  const originalDeadline = initial?.deadlineAt;
  const initialDeadlineInput = toLocalDateTimeInput(originalDeadline);
  const pick = (ar: string | undefined, en: string | undefined) => isAr ? (ar || en || '') : (en || ar || '');
  const [title, setTitle] = useState(pick(initial?.title, initial?.titleEn));
  const [summary, setSummary] = useState(pick(initial?.summary, initial?.summaryEn));
  const [description, setDescription] = useState(pick(initial?.description, initial?.descriptionEn));
  const [deliverables, setDeliverables] = useState((pick(initial?.deliverables?.join('\n'), initial?.deliverablesEn?.join('\n'))));
  const [constraints, setConstraints] = useState(pick(initial?.constraints?.join('\n'), initial?.constraintsEn?.join('\n')));
  const [criteria, setCriteria] = useState(pick(initial?.criteria?.join('\n'), initial?.criteriaEn?.join('\n')));
  const [skills, setSkills] = useState<string[]>(initial?.skills || []);
  const [difficulty, setDifficulty] = useState<ProblemInput['difficulty']>(initial?.difficulty || 'medium');
  const [category, setCategory] = useState<ProblemInput['category']>(initial?.category || 'CHALLENGE');
  const [budget, setBudget] = useState(initial?.budgetDzd ? String(initial.budgetDzd) : '');
  const [deadline, setDeadline] = useState(initialDeadlineInput);
  const [privateNotes, setPrivateNotes] = useState(initial?.privateNotes || '');
  const [privateNotesEn, setPrivateNotesEn] = useState(initial?.privateNotesEn || initial?.privateNotes || '');
  const [privateNotesEnEdited, setPrivateNotesEnEdited] = useState(false);
  const [businessName, setBusinessName] = useState(companyProfile?.name || companyName || '');
  const [businessNameEn, setBusinessNameEn] = useState(companyProfile?.nameEn || '');
  const [contactEmail, setContactEmail] = useState(companyProfile?.contactEmail || '');
  const [contactUrl, setContactUrl] = useState(companyProfile?.contactUrl || '');
  const [shareContact, setShareContact] = useState(Boolean(companyProfile?.shareContact));
  const [problemId, setProblemId] = useState(initial?.id || '');
  const [publicFiles, setPublicFiles] = useState<File[]>([]);
  const [privateFiles, setPrivateFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const existingFiles = initial?.files || [];

  const makeInput = (): ProblemInput => ({
    title: isAr ? title.trim() : (initial?.title || ''), titleEn: isAr ? (initial?.titleEn || '') : title.trim(),
    summary: isAr ? summary.trim() : (initial?.summary || ''), summaryEn: isAr ? (initial?.summaryEn || '') : summary.trim(),
    description: isAr ? description.trim() : (initial?.description || ''), descriptionEn: isAr ? (initial?.descriptionEn || '') : description.trim(),
    deliverables: isAr ? lines(deliverables) : (initial?.deliverables || []), deliverablesEn: isAr ? (initial?.deliverablesEn || []) : lines(deliverables),
    constraints: isAr ? lines(constraints) : (initial?.constraints || []), constraintsEn: isAr ? (initial?.constraintsEn || []) : lines(constraints),
    criteria: isAr ? lines(criteria) : (initial?.criteria || []), criteriaEn: isAr ? (initial?.criteriaEn || []) : lines(criteria),
    skills,
    difficulty, category, budgetDzd: Number(budget) || 0,
    deadlineAt: deadline === initialDeadlineInput && originalDeadline ? originalDeadline : deadline ? new Date(deadline).toISOString() : undefined,
    privateNotes: privateNotes.trim(),
    privateNotesEn: privateNotesEn.trim() || undefined,
  });

  const chooseFiles = (files: FileList | null, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => /\.(pdf|docx)$/i.test(file.name) && file.size > 0 && file.size <= 5 * 1024 * 1024);
    if (accepted.length !== files.length) setError(isAr ? 'اختر ملفات PDF أو DOCX بحجم لا يتجاوز 5 ميغابايت.' : 'Choose PDF or DOCX files up to 5 MB each.');
    else setError('');
    setter((current) => [...current, ...accepted]);
  };

  const toggleSkill = (skill: string) => setSkills((current) => current.includes(skill)
    ? current.filter((item) => item !== skill)
    : current.length < 5 ? [...current, skill] : current);

  const save = async (publish: boolean) => {
    setBusy(true); setError('');
    try {
      if (publish && !publicLocked) {
        if (title.trim().length < 10 || title.trim().length > 160 || summary.trim().length < 10 || summary.trim().length > 500 || description.trim().length < 30 || description.trim().length > 20000 || skills.length < 1 || skills.length > 5 || new Set(skills).size !== skills.length || !Number.isInteger(Number(budget)) || Number(budget) <= 0 || !deadline || new Date(deadline).getTime() <= Date.now()) {
          throw new Error(isAr ? 'أكمل العنوان والملخص والوصف والمهارات والميزانية وموعدًا مستقبليًا قبل النشر.' : 'Complete the title, summary, description, skills, positive whole-DZD budget, and a future deadline before publishing.');
        }
      }
      await updateCompanyProfile({ name: businessName.trim() || companyName, nameEn: businessNameEn.trim() || businessName.trim() || companyName, contactEmail: shareContact ? contactEmail.trim() : '', contactUrl: shareContact ? contactUrl.trim() : '', shareContact });
      const input = makeInput();
      const saved = problemId
        ? await updateProblem(problemId, publicLocked
          ? (isAr ? { privateNotes: privateNotes.trim() } : { privateNotesEn: privateNotesEnEdited ? privateNotesEn.trim() : undefined })
          : input)
        : await createProblem(input);
      const targetId = problemId || saved.id;
      setProblemId(targetId);
      if (!publicLocked) for (const file of publicFiles) {
        await uploadFile(file, 'PROBLEM_PUBLIC', { problemId: targetId });
        setPublicFiles((current) => current.filter((candidate) => candidate !== file));
      }
      for (const file of privateFiles) {
        await uploadFile(file, 'PROBLEM_PRIVATE', { problemId: targetId });
        setPrivateFiles((current) => current.filter((candidate) => candidate !== file));
      }
      if (publish && !publicLocked) await publishProblem(targetId);
      navigate('/company/problems');
    } catch (saveError) {
      setError(apiErrorMessage(saveError, lang));
    } finally { setBusy(false); }
  };

  return <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <div className="lg:col-span-8 card-pixel p-6 sm:p-8 flex flex-col gap-5">
      <div><h1 className="text-xl sm:text-2xl font-bold text-[#12122B] mb-1">{isAr ? (initial ? 'تعديل التحدي الصناعي' : 'طرح تحدٍّ صناعي جديد') : (initial ? 'Edit challenge' : 'Post an industrial challenge')}</h1><p className="text-xs text-[#5B5B7B]">{isAr ? 'اكتب تفاصيل التحدي بلغة الواجهة الحالية. سيظهر المحتوى كما هو في الواجهة الأخرى عند عدم توفر ترجمة.' : 'Enter content in the current interface language. It will appear as entered in the other language when no translation is available.'}</p></div>
      {error && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="problem-title" className={labelClass}>{isAr ? 'عنوان التحدي الصناعي *' : 'Challenge title *'}</label><input id="problem-title" disabled={publicLocked} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></div><div><label htmlFor="problem-category" className={labelClass}>{isAr ? 'الفئة *' : 'Category *'}</label><select id="problem-category" disabled={publicLocked} value={category} onChange={(e) => setCategory(e.target.value as ProblemInput['category'])} className={inputClass + ' bg-[#FFFBF1]'}>{(['BUG', 'ISSUE', 'CHALLENGE'] as const).map((value) => <option key={value} value={value}>{problemCategoryLabel(value, lang)}</option>)}</select></div></div>
      <div><label htmlFor="problem-summary" className={labelClass}>{isAr ? 'ملخص قصير *' : 'Short summary *'}</label><textarea id="problem-summary" disabled={publicLocked} value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={inputClass} /></div>
      <div><label htmlFor="problem-description" className={labelClass}>{isAr ? 'وصف المشكلة بالتفصيل *' : 'Detailed problem description *'}</label><textarea id="problem-description" disabled={publicLocked} value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className={inputClass} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className={labelClass}>{isAr ? 'المهارات المطلوبة (اختر من 1 إلى 5) *' : 'Required skills (select 1 to 5) *'}</label><div className="flex flex-wrap gap-1.5">{availableSkills.map((skill) => <button key={skill} type="button" aria-pressed={skills.includes(skill)} disabled={publicLocked || skillsLoading} onClick={() => toggleSkill(skill)} className="rounded-full disabled:opacity-60"><TagChip tag={skill} size="sm" selected={skills.includes(skill)} /></button>)}</div>{skillsLoading && <p className="mt-2 text-[11px] text-[#5B5B7B]">{isAr ? 'جارٍ تحميل المهارات…' : 'Loading skills…'}</p>}{skillsError && <div className="mt-2 flex items-center gap-2 text-[11px] text-[#E5432A]"><span>{isAr ? 'تعذر تحميل قائمة المهارات.' : 'Could not load the skills list.'}</span><button type="button" onClick={() => void retrySkills()} className="font-bold text-[#0B2A9E] underline">{isAr ? 'إعادة المحاولة' : 'Retry'}</button></div>}<p className="mt-1 text-[10px] text-[#5B5B7B]">{isAr ? `${skills.length} من 5 مختارة` : `${skills.length} of 5 selected`}</p></div><div><label htmlFor="problem-difficulty" className={labelClass}>{isAr ? 'الصعوبة *' : 'Difficulty *'}</label><select id="problem-difficulty" disabled={publicLocked} value={difficulty} onChange={(e) => setDifficulty(e.target.value as ProblemInput['difficulty'])} className={inputClass + ' bg-[#FFFBF1]'}><option value="small">{isAr ? 'صغير' : 'Small'}</option><option value="medium">{isAr ? 'متوسط' : 'Medium'}</option><option value="expert">{isAr ? 'خبير' : 'Expert'}</option></select></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="problem-budget" className={labelClass}>{isAr ? 'الميزانية بالدينار الجزائري *' : 'Budget in DZD *'}</label><input id="problem-budget" disabled={publicLocked} type="number" min="1" step="1" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} /></div><div><label htmlFor="problem-deadline" className={labelClass}>{isAr ? 'الموعد النهائي *' : 'Deadline *'}</label><input id="problem-deadline" disabled={publicLocked} type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} /></div></div>
      <div><label htmlFor="problem-deliverables" className={labelClass}>{isAr ? 'المخرجات المطلوبة (سطر لكل بند)' : 'Deliverables (one per line)'}</label><textarea id="problem-deliverables" disabled={publicLocked} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} className={inputClass} /></div>
      <div><label htmlFor="problem-constraints" className={labelClass}>{isAr ? 'القيود الفنية (سطر لكل بند)' : 'Constraints (one per line)'}</label><textarea id="problem-constraints" disabled={publicLocked} value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={4} className={inputClass} /></div>
      <div><label htmlFor="problem-criteria" className={labelClass}>{isAr ? 'معايير التقييم (سطر لكل بند)' : 'Evaluation criteria (one per line)'}</label><textarea id="problem-criteria" disabled={publicLocked} value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={4} className={inputClass} /></div>
      <FilePicker lang={lang} label={isAr ? 'مرفقات عامة' : 'Public attachments'} inputId="problem-public-files" disabled={publicLocked} files={publicFiles} existingFiles={existingFiles} setFiles={setPublicFiles} onChoose={(files) => chooseFiles(files, setPublicFiles)} />
      <div className="p-4 bg-[#FFF1CC] border-2 border-[#12122B] rounded-md"><label htmlFor="problem-private-notes" className={labelClass}>{isAr ? 'ملاحظات وملفات سرية (تظهر لشركتك وللمهندس المعتمد فقط)' : 'Private notes for your company and approved engineer'}</label><textarea id="problem-private-notes" value={isAr ? privateNotes : privateNotesEn} onChange={(e) => { if (isAr) setPrivateNotes(e.target.value); else { setPrivateNotesEnEdited(true); setPrivateNotesEn(e.target.value); } }} rows={4} className={inputClass} /><div className="mt-4"><FilePicker lang={lang} label={isAr ? 'مرفقات سرية خاصة' : 'Private attachments'} inputId="problem-private-files" files={privateFiles} existingFiles={[]} setFiles={setPrivateFiles} onChoose={(files) => chooseFiles(files, setPrivateFiles)} /></div></div>
      <div className="pt-4 border-t border-[#EFE4CC] flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={() => void save(false)} className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary cursor-pointer">{busy ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : publicLocked ? (isAr ? 'حفظ الملاحظات السرية' : 'Save private details') : (isAr ? 'حفظ كمسودة' : 'Save draft')}</button>{!publicLocked && <button type="button" disabled={busy} onClick={() => void save(true)} className="px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-accent cursor-pointer">{isAr ? 'حفظ ونشر التحدي' : 'Save and publish'}</button>}</div>
    </div>
    <aside className="lg:col-span-4 card-pixel p-6 bg-[#EEF1FF] flex flex-col gap-4"><h2 className="text-sm font-bold">{isAr ? 'بيانات الشركة والاتصال' : 'Company and contact details'}</h2><div><label htmlFor="company-name-ar" className={labelClass}>{isAr ? 'اسم الشركة بالعربية' : 'Company name'}</label><input id="company-name-ar" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} /></div><div><label htmlFor="company-name-en" className={labelClass}>{isAr ? 'اسم الشركة بالإنجليزية' : 'Company name in English (optional)'}</label><input id="company-name-en" value={businessNameEn} onChange={(e) => setBusinessNameEn(e.target.value)} className={inputClass} /></div><label htmlFor="company-share-contact" className="flex items-start gap-2 text-xs font-semibold cursor-pointer"><input id="company-share-contact" type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} className="mt-0.5 accent-[#0B2A9E]" />{isAr ? 'إتاحة بيانات التواصل المباشر للمهندسين والمستخدمين المسجلين' : 'Share these contact details with signed-in users'}</label><div><label htmlFor="company-contact-email" className={labelClass}>{isAr ? 'بريد التواصل' : 'Contact email'}</label><input id="company-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} /></div><div><label htmlFor="company-contact-url" className={labelClass}>{isAr ? 'رابط التواصل' : 'Contact URL'}</label><input id="company-contact-url" type="url" value={contactUrl} onChange={(e) => setContactUrl(e.target.value)} className={inputClass} /></div><p className="text-[11px] text-[#5B5B7B]">{isAr ? 'لن يظهر بريد تسجيل الدخول الخاص بحسابك ضمن وسائل الاتصال المعلنة.' : 'Your account login email is never shown as business contact.'}</p></aside>
  </div>;
};
