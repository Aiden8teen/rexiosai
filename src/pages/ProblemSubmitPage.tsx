import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
import confetti from 'canvas-confetti';
import {
  Coins,
  Clock,
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const ProblemSubmitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    lang,
    dir,
    problems,
    submitSolution,
    calculateEligibility,
  } = useApp();

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const problem = problems.find((p) => p.id === id) || problems[0];
  const eligibility = calculateEligibility(problem.id, problem.tags);

  const [summary, setSummary] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('10 أيام');
  const [projectUrl, setProjectUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (wordCount < 10) {
      setError(
        lang === 'ar'
          ? 'يرجى كتابة ملخص كافٍ للحل (10 كلمات على الأقل).'
          : 'Please provide a sufficient solution summary (at least 10 words).'
      );
      return;
    }

    if (!confirmed) {
      setError(
        lang === 'ar'
          ? 'يجب الموافقة على شروط الملكية الفكرية وتقديم الحلول.'
          : 'You must confirm ownership and agree to submission terms.'
      );
      return;
    }

    submitSolution(problem.id, {
      summary,
      deliveryTime,
      projectUrl: projectUrl || undefined,
      fileName: fileName || undefined,
    });

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
    }

    navigate(`/problems/${problem.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/problems" className="hover:underline">
          {lang === 'ar' ? 'المشكلات' : 'Problems'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to={`/problems/${problem.id}`} className="hover:underline truncate max-w-xs">
          {lang === 'ar' ? problem.title : problem.title_en}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold">
          {lang === 'ar' ? 'تقديم حل' : 'Submit Solution'}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 card-pixel p-6 flex flex-col gap-5 bg-[#FFFBF1]">
          <div>
            <span className="text-[11px] font-bold text-[#5B5B7B] uppercase block mb-1">
              {lang === 'ar' ? 'المشكلة المستهدفة' : 'Target Problem'}
            </span>
            <h2 className="text-base font-bold text-[#12122B] leading-snug">
              {lang === 'ar' ? problem.title : problem.title_en}
            </h2>
          </div>

          <div className="p-3 bg-[#FFF1CC] border border-[#12122B] rounded-md">
            <span className="text-[10px] font-bold text-[#5B5B7B] uppercase block mb-0.5">
              {lang === 'ar' ? 'المكافأة المخصصة' : 'Allocated Reward'}
            </span>
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#12122B]" />
              <span className="font-tag text-lg font-bold text-[#12122B]">
                {lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-[#12122B] py-2 border-y border-[#EFE4CC]">
            <div className="flex items-center justify-between">
              <span className="text-[#5B5B7B]">{lang === 'ar' ? 'مستوى الصعوبة:' : 'Difficulty:'}</span>
              <DifficultyMeter difficulty={problem.difficulty} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5B5B7B]">{lang === 'ar' ? 'آخر موعد:' : 'Deadline:'}</span>
              <span className="font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#5B5B7B] block mb-2">
              {lang === 'ar' ? 'المهارات المطلوبة:' : 'Required Tags:'}
            </span>
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  size="sm"
                  isMatched={eligibility.matchedSkills.includes(tag)}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#5B5B7B] leading-relaxed pt-3 border-t border-[#EFE4CC]">
            {lang === 'ar'
              ? 'سيُرسَل ملف الحلّال الخاص بك تلقائيًا إلى الشركة مع هذا المقترح لتقييم كفاءتك وسيرتك الذاتية.'
              : 'Your verified solver profile will be securely attached to this submission for company review.'}
          </p>
        </div>

        <div className="lg:col-span-8 card-pixel p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#12122B] mb-1">
              {lang === 'ar' ? 'قدّم حلّك' : 'Submit your proposal'}
            </h1>
            <p className="text-xs text-[#5B5B7B]">
              {lang === 'ar'
                ? 'اشرح فكرتك وطريقة التنفيذ بوضوح؛ الشركة هي من تقرّر قبول الحل بناءً على معاييرها.'
                : 'Explain your approach and architecture clearly; the partner company evaluates and accepts.'}
            </p>
          </div>

          <div className="p-3.5 bg-[#EEF1FF] border-2 border-[#0B2A9E] rounded-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0B2A9E] shrink-0" />
            <p className="text-xs text-[#0B2A9E] font-semibold leading-relaxed">
              {lang === 'ar'
                ? `تطابق مهاراتك ${eligibility.matchCount} من ${eligibility.totalCount} من مهارات المشكلة — يمكنك المتابعة وتقديم المقترح.`
                : `Your verified skills match ${eligibility.matchCount} of ${eligibility.totalCount} tags — you are cleared to proceed.`}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs text-[#E5432A] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#12122B]">
                  {lang === 'ar' ? 'ملخّص الحل المقترح *' : 'Proposed Solution Summary *'}
                </label>
                <span className="text-[10px] text-[#5B5B7B]">
                  {wordCount} {lang === 'ar' ? 'كلمات (يُفضَّل 50 كلمة على الأقل)' : 'words (50+ recommended)'}
                </span>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اشرح فكرتك التقنية وطريقة التنفيذ والمتحكمات والمكتبات التي ستعتمد عليها لحل المشكلة…'
                    : 'Explain your technical approach, architecture, hardware ICs, and firmware libraries…'
                }
                rows={6}
                className="w-full input-pixel text-xs leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'مدة التنفيذ المقترحة *' : 'Proposed Delivery Time *'}
                </label>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full input-pixel text-xs bg-[#FFFBF1]"
                >
                  <option value="5 أيام">{lang === 'ar' ? '5 أيام' : '5 days'}</option>
                  <option value="10 أيام">{lang === 'ar' ? '10 أيام' : '10 days'}</option>
                  <option value="14 يومًا">{lang === 'ar' ? '14 يومًا' : '14 days'}</option>
                  <option value="شهر واحد">{lang === 'ar' ? 'شهر واحد' : '1 month'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                  {lang === 'ar' ? 'رابط عمل سابق أو نموذج تجريبي' : 'Work Link / Proof of Concept'}
                </label>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://github.com/…"
                  className="w-full input-pixel text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#12122B] mb-1.5">
                {lang === 'ar' ? 'مرفقات إضافية (اختياري)' : 'Attachments (Optional)'}
              </label>

              {fileName ? (
                <div className="p-3 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#0B2A9E]" />
                    <span className="text-xs font-bold text-[#12122B]">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileName('')}
                    className="p-1 hover:text-[#E5432A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setFileName('Proposal_Schematics.pdf')}
                  className="p-6 bg-[#F8F1E1] border-2 border-dashed border-[#12122B] rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#EFE4CC] transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#0B2A9E]" />
                  <p className="text-xs font-bold text-[#12122B]">
                    {lang === 'ar'
                      ? 'اسحب الملف هنا أو اضغط للاختيار'
                      : 'Drag and drop file here or click to browse'}
                  </p>
                  <p className="text-[10px] text-[#5B5B7B]">
                    PDF, DOCX — Max 5MB
                  </p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-[#0B2A9E]"
              />
              <span className="text-xs text-[#12122B] font-semibold">
                {lang === 'ar'
                  ? 'أؤكد أن هذا العمل من إنجازي وأوافق على شروط تقديم الحلول وسياسة الخصوصية.'
                  : 'I confirm this work is my original submission and agree to the intellectual property and evaluation terms.'}
              </span>
            </label>

            <div className="pt-4 border-t border-[#EFE4CC] flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/problems/${problem.id}`}
                className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => alert(lang === 'ar' ? 'تم حفظ المسودة محلياً' : 'Draft saved')}
                  className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ كمسودة' : 'Save draft'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-md font-bold text-xs btn-pixel-accent cursor-pointer"
                >
                  {lang === 'ar' ? 'إرسال الحل' : 'Submit solution'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
