import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { TagChip } from '../components/TagChip';
import { Check, Upload, FileText, X, AlertCircle } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import { uploadFile } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { EDUCATION_LEVEL_OPTIONS, EXPERIENCE_LEVEL_OPTIONS } from '../utils/localizedLabels';

export const SolverProfilePage: React.FC = () => {
  const { currentUser, lang } = useApp();
  return <SolverProfileContent key={`${currentUser.id}:${lang}`} />;
};

const SolverProfileContent: React.FC = () => {
  const { lang, currentUser, updateSolverProfile } = useApp();
  const { skills: availableSkills, loading: skillsLoading, error: skillsError, retry: retrySkills } = useMetadata();
  const navigate = useNavigate();

  const profile = currentUser.solverProfile;

  const [firstName, setFirstName] = useState(lang === 'ar' ? profile?.firstName || '' : profile?.firstNameEn || profile?.firstName || '');
  const [lastName, setLastName] = useState(lang === 'ar' ? profile?.lastName || '' : profile?.lastNameEn || profile?.lastName || '');
  const [educationLevel, setEducationLevel] = useState(
    profile?.educationLevel || ''
  );
  const [institutionMajor, setInstitutionMajor] = useState(lang === 'ar' ? profile?.institutionMajor || '' : profile?.institutionMajorEn || profile?.institutionMajor || '');
  const [experienceLevel, setExperienceLevel] = useState(
    profile?.experienceLevel || ''
  );
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [cvFileName, setCvFileName] = useState(profile?.cvFileName || '');
  const [cvFileId, setCvFileId] = useState(profile?.cvFileId || '');
  const [linkedInUrl, setLinkedInUrl] = useState(profile?.linkedInUrl || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');

  const [submittedError, setSubmittedError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  let completedCount = 0;
  if (firstName.trim()) completedCount++;
  if (lastName.trim()) completedCount++;
  if (educationLevel) completedCount++;
  if (institutionMajor.trim()) completedCount++;
  if (experienceLevel) completedCount++;
  if (skills.length > 0) completedCount++;
  const hasProfileEvidence = Boolean(cvFileId || linkedInUrl.trim() || githubUrl.trim());
  if (hasProfileEvidence) completedCount++;
  const completeness = Math.min(100, Math.round((completedCount / 7) * 100));

  const hasErrors = submittedError;

  const handleCvUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setApiError(lang === 'ar' ? 'اختر ملف PDF أو DOCX بحجم لا يتجاوز 5 ميغابايت.' : 'Choose a PDF or DOCX file up to 5 MB.');
      return;
    }
    setApiError('');
    try {
      const uploaded = await uploadFile(file, 'CV');
      await updateSolverProfile({ cvFileId: uploaded.id });
      setCvFileId(uploaded.id);
      setCvFileName(uploaded.originalName);
    } catch (error) { setApiError(apiErrorMessage(error, lang)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !educationLevel || !institutionMajor.trim() || !experienceLevel || skills.length === 0 || !hasProfileEvidence) {
      setSubmittedError(true);
      return;
    }

    setSaving(true); setApiError('');
    try {
      await updateSolverProfile({
      ...(lang === 'ar' ? { firstName, lastName, institutionMajor } : { firstNameEn: firstName, lastNameEn: lastName, institutionMajorEn: institutionMajor }),
      educationLevel,
      experienceLevel,
      skills,
      cvFileId: cvFileId || undefined,
      linkedInUrl,
      githubUrl,
      completenessPercent: completeness,
      });
      navigate('/problems');
    } catch (error) { setApiError(apiErrorMessage(error, lang)); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 p-3 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s flex items-center justify-between text-xs">
        <span className="font-bold text-[#12122B]">
          {lang === 'ar'
            ? 'عرض نمط التصميم (شاشة 04 / شاشة 04b):'
            : 'Design Mode View (Screen 04 / Screen 04b):'}
        </span>
        <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#0B2A9E]">
          <input
            type="checkbox"
            onChange={() => undefined}
            className="accent-[#E5432A]"
          />
          <span>
            {lang === 'ar'
              ? 'تفعيل حالة أخطاء التحقق (شاشة 04b)'
              : 'Toggle Validation Errors State (Screen 04b)'}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 card-pixel p-6 bg-[#EEF1FF] flex flex-col gap-5 border-[#0B2A9E]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
              <MascotRex width={40} height={30} />
            </div>
            <h3 className="text-base font-bold text-[#12122B]">
              {lang === 'ar' ? 'ماذا يتيح لك ملف خبير الحلول؟' : 'What does the solver profile unlock?'}
            </h3>
          </div>

          <div className="flex flex-col gap-3.5 text-xs text-[#12122B]">
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-[#1E9E5A] text-[#FFFBF1] rounded-full shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'تقديم عروض تقنية للتحديات الصناعية ذات الميزانيات المعتمدة'
                  : 'Submit proposals to budgeted company challenges'}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-[#1E9E5A] text-[#FFFBF1] rounded-full shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'إبراز خبراتك وسيرتك التقنية مباشرة أمام المصانع والشركات'
                  : 'Profile visibility to companies upon proposal submission'}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-[#1E9E5A] text-[#FFFBF1] rounded-full shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'متابعة حالة عروضك (قيد المراجعة الفنية، معتمد، معتذر عنه)'
                  : 'Track proposal status (Under review, Accepted, Rejected)'}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-[#1E9E5A] text-[#FFFBF1] rounded-full shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'مؤشر تقريبي لتطابق مهاراتك مع متطلبات التحدي'
                  : 'Advisory skill overlap on challenge pages'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 card-pixel p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#12122B] mb-1">
              {lang === 'ar' ? 'ملف خبير الحلول والمهندس' : 'Solver & Engineer Profile'}
            </h1>
            <p className="text-xs text-[#5B5B7B]">
              {lang === 'ar'
                ? 'الحقول المعلَّمة بـ * إلزامية. تظهر هذه المعلومات للشركة عند تقديم عرضك الفني.'
                : 'Fields marked with * are required. This information is shown to companies when you submit a proposal.'}
            </p>
          </div>

          <div className="mb-8 p-4 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
            <div className="flex items-center justify-between text-xs font-bold text-[#12122B] mb-2">
              <span>{lang === 'ar' ? 'نسبة اكتمال الملف الهندسي' : 'Profile completeness'}</span>
              <span>{completeness}%</span>
            </div>
            <div className="w-full h-3 bg-[#EFE4CC] border border-[#12122B] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C6FF3D] border-e border-[#12122B] transition-all duration-300"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          {hasErrors && (
            <div className="mb-6 p-3.5 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'أكمل جميع الحقول المطلوبة، بما فيها مهارة واحدة على الأقل وسيرة ذاتية أو رابط مهني.'
                  : 'Complete every required group, including at least one skill and a CV or professional link.'}
              </span>
            </div>
          )}
          {apiError && <div className="mb-6 p-3.5 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{apiError}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'الاسم الأول *' : 'First name *'}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full input-pixel text-xs ${
                    hasErrors && !firstName ? 'input-pixel-error' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'اسم العائلة *' : 'Last name *'}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full input-pixel text-xs ${
                    hasErrors && !lastName ? 'input-pixel-error' : ''
                  }`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'المستوى الدراسي *' : 'Education level *'}
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className={`w-full input-pixel text-xs bg-[#FFFBF1] ${hasErrors && !educationLevel ? 'input-pixel-error' : ''}`}
                >
                  <option value="">{lang === 'ar' ? 'اختر المستوى الدراسي' : 'Select education level'}</option>
                  {EDUCATION_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option[lang]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'التخصص والمؤسسة *' : 'Major & Institution *'}
                </label>
                <input
                  type="text"
                  value={institutionMajor}
                  onChange={(e) => setInstitutionMajor(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: هندسة الحاسوب — USTHB' : 'e.g. Computer Engineering — USTHB'}
                  className="w-full input-pixel text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                {lang === 'ar' ? 'مستوى الخبرة *' : 'Experience level *'}
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className={`w-full input-pixel text-xs bg-[#FFFBF1] ${hasErrors && !experienceLevel ? 'input-pixel-error' : ''}`}
              >
                <option value="">{lang === 'ar' ? 'اختر مستوى الخبرة' : 'Select experience level'}</option>
                {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option[lang]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1">
                {lang === 'ar'
                  ? 'المهارات * — اختر مهارة واحدة على الأقل'
                  : 'Skills * — Select at least one'}
              </label>
              <p className="text-[11px] text-[#5B5B7B] mb-3">
                {lang === 'ar'
                  ? 'يظهر تطابق المهارات للاستئناس فقط ولا يمنع تقديم المقترح.'
                  : 'Your skills are shown as an advisory match on company challenge pages.'}
              </p>

              <div
                className={`p-4 bg-[#F8F1E1] border-2 rounded-md flex flex-wrap gap-2 ${
                  hasErrors && skills.length === 0
                    ? 'border-[#E5432A] bg-[#FFE3DC]'
                    : 'border-[#12122B]'
                }`}
              >
                {availableSkills.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <TagChip
                      key={skill}
                      tag={skill}
                      selected={isSelected}
                      onClick={() => toggleSkill(skill)}
                      onRemove={isSelected ? () => toggleSkill(skill) : undefined}
                    />
                  );
                })}
                {skillsLoading && <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المهارات…' : 'Loading skills…'}</p>}
              </div>
              {skillsError && <div className="mt-2 flex items-center gap-2 text-[11px] text-[#E5432A]"><span>{lang === 'ar' ? 'تعذر تحميل قائمة المهارات.' : 'Could not load the skills list.'}</span><button type="button" onClick={() => void retrySkills()} className="font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'السيرة الذاتية (CV) أو رابط مهني *' : 'Curriculum Vitae (CV) or professional link *'}
              </label>

              {cvFileId ? (
                <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#0B2A9E]" />
                    <div>
                      <p className="text-xs font-bold text-[#12122B]">{cvFileName}</p>
                      <p className="text-[10px] text-[#1E9E5A] font-semibold">
                        {cvFileId ? (lang === 'ar' ? 'تم ربط الملف بالملف الشخصي' : 'File linked to your profile') : (lang === 'ar' ? 'ملف محفوظ في الملف الشخصي' : 'Saved on your profile')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => undefined}
                    className="p-1 hover:text-[#E5432A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className={`p-6 bg-[#FFFBF1] border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#EFE4CC] transition-colors ${hasErrors && !hasProfileEvidence ? 'border-[#E5432A]' : 'border-[#12122B]'}`}>
                  <Upload className="w-6 h-6 text-[#0B2A9E]" />
                  <p className="text-xs font-bold text-[#12122B]">
                    {lang === 'ar'
                      ? 'اختر ملف السيرة الذاتية أو أضف رابطًا مهنيًا أدناه'
                      : 'Choose a CV file or add a professional link below'}
                  </p>
                  <p className="text-[10px] text-[#5B5B7B]">
                    {lang === 'ar' ? 'PDF, DOCX — الحد الأقصى 5 ميغابايت' : 'PDF, DOCX — Max 5 MB'}
                  </p>
                  <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => void handleCvUpload(event.target.files?.[0])} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className={`w-full input-pixel text-xs ${hasErrors && !hasProfileEvidence ? 'input-pixel-error' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1">
                  {lang === 'ar' ? 'GitHub / موقع شخصي' : 'GitHub / Portfolio URL'}
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className={`w-full input-pixel text-xs ${hasErrors && !hasProfileEvidence ? 'input-pixel-error' : ''}`}
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#12122B] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#5B5B7B]">
                {lang === 'ar'
                  ? 'يمكنك تحديث ملفك من هذه الصفحة في أي وقت.'
                  : 'You can update your profile on this page at any time.'}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-accent cursor-pointer"
              >
                {saving ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : (lang === 'ar' ? 'حفظ الملف المهني' : 'Save profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
