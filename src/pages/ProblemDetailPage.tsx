import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
import {
  Coins,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  ChevronLeft,
  Send,
  Check,
} from 'lucide-react';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    lang,
    dir,
    currentRole,
    problems,
    addProblemComment,
    calculateEligibility,
    openAuthModal,
  } = useApp();

  const [commentInput, setCommentInput] = useState('');
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const problem = problems.find((p) => p.id === id) || problems[0];
  const eligibility = calculateEligibility(problem.id, problem.tags);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }
    addProblemComment(problem.id, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/problems" className="hover:underline">
          {lang === 'ar' ? 'المشكلات' : 'Problems'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold truncate max-w-sm">
          {lang === 'ar' ? problem.title : problem.title_en}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="card-pixel p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs border-b border-[#EFE4CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#12122B] text-[#FFFBF1] flex items-center justify-center font-bold text-sm shadow-pixel-s">
                  {problem.companyAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#12122B] text-sm">
                      {lang === 'ar' ? problem.companyName : problem.companyName_en}
                    </span>
                    <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                      COMPANY
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5B5B7B]">
                    {lang === 'ar' ? problem.postedAt : problem.postedAt_en}
                  </span>
                </div>
              </div>

              <DifficultyMeter difficulty={problem.difficulty} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#12122B] leading-tight">
              {lang === 'ar' ? problem.title : problem.title_en}
            </h1>

            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  isMatched={eligibility.matchedSkills.includes(tag)}
                />
              ))}
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#12122B] mb-2 uppercase tracking-wide">
                {lang === 'ar' ? 'سياق ووصف المشكلة' : 'Context & Challenge Overview'}
              </h2>
              <p className="text-sm sm:text-base text-[#12122B] leading-relaxed whitespace-pre-line font-normal">
                {lang === 'ar' ? problem.description : problem.description_en}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#12122B] mb-3 uppercase tracking-wide">
                {lang === 'ar' ? 'المخرجات المطلوبة (Deliverables)' : 'Expected Deliverables'}
              </h2>
              <div className="flex flex-col gap-2.5">
                {(lang === 'ar' ? problem.deliverables : problem.deliverables_en).map(
                  (item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 bg-[#F8F1E1] border border-[#12122B] rounded-md text-xs font-semibold text-[#12122B]"
                    >
                      <Check className="w-4 h-4 text-[#1E9E5A] shrink-0 mt-0.5 stroke-[3]" />
                      <span>{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <h3 className="text-xs font-bold text-[#12122B] mb-2.5">
                  {lang === 'ar' ? 'المحددات والقيود الفنية' : 'Technical Constraints'}
                </h3>
                <ul className="flex flex-col gap-2 text-xs text-[#5B5B7B]">
                  {(lang === 'ar' ? problem.constraints : problem.constraints_en).map(
                    (c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#0B2A9E] font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <h3 className="text-xs font-bold text-[#12122B] mb-2.5">
                  {lang === 'ar' ? 'معايير تقييم المقترحات' : 'Evaluation Criteria'}
                </h3>
                <ul className="flex flex-col gap-2 text-xs text-[#5B5B7B]">
                  {(lang === 'ar' ? problem.criteria : problem.criteria_en).map(
                    (cr, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#1E9E5A] font-bold">✓</span>
                        <span>{cr}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="card-pixel p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-[#12122B]">
              {lang === 'ar' ? 'النقاش والاستفسارات التقنية' : 'Technical Discussion & Queries'}
            </h2>

            <div className="flex flex-col gap-4">
              {problem.discussions.length === 0 ? (
                <p className="text-xs text-[#5B5B7B]">
                  {lang === 'ar'
                    ? 'لا توجد تعليقات بعد. اطرح أول استفسار للشركة.'
                    : 'No discussion comments yet. Be the first to ask the company.'}
                </p>
              ) : (
                problem.discussions.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-3">
                    <div
                      className={`p-4 rounded-md border-2 border-[#12122B] text-xs ${
                        comment.isCompany
                          ? 'bg-[#EEF1FF] border-[#0B2A9E] shadow-pixel-s'
                          : 'bg-[#FFFBF1]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#12122B]">
                            {lang === 'ar' ? comment.author : comment.author_en}
                          </span>
                          {comment.isCompany && (
                            <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                              COMPANY
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#5B5B7B]">
                          {lang === 'ar' ? comment.createdAt : comment.createdAt_en}
                        </span>
                      </div>
                      <p className="text-[#12122B] leading-relaxed">
                        {lang === 'ar' ? comment.body : comment.body_en}
                      </p>
                    </div>

                    {comment.replies &&
                      comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`ms-6 p-4 rounded-md border-2 border-[#12122B] text-xs ${
                            reply.isCompany
                              ? 'bg-[#EEF1FF] border-[#0B2A9E] shadow-pixel-s'
                              : 'bg-[#FFFBF1]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#12122B]">
                                {lang === 'ar' ? reply.author : reply.author_en}
                              </span>
                              {reply.isCompany && (
                                <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                                  COMPANY
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#5B5B7B]">
                              {lang === 'ar' ? reply.createdAt : reply.createdAt_en}
                            </span>
                          </div>
                          <p className="text-[#12122B] leading-relaxed">
                            {lang === 'ar' ? reply.body : reply.body_en}
                          </p>
                        </div>
                      ))}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex flex-col gap-3 pt-3 border-t border-[#EFE4CC]">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب استفساراً تقنياً أو ملاحظة للشركة حول هذا التحدي…'
                    : 'Ask a technical question to the company about this problem…'
                }
                rows={3}
                className="w-full input-pixel text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إرسال التعليق' : 'Post comment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <div className="card-pixel p-6 flex flex-col gap-5">
            <div className="p-4 bg-[#FFF1CC] border-2 border-[#12122B] rounded-md shadow-pixel-s">
              <span className="text-[11px] font-bold text-[#5B5B7B] uppercase block mb-1">
                {lang === 'ar' ? 'مكافأة الحل المعتمد' : 'Accepted Solution Reward'}
              </span>
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-[#12122B]" />
                <span className="font-tag text-2xl font-bold text-[#12122B]">
                  {lang === 'ar' ? problem.rewardFormatted : problem.rewardFormatted_en}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-[#12122B] py-1 border-b border-[#EFE4CC]">
              <div className="flex items-center justify-between">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'آخر موعد للتقديم:' : 'Submission Deadline:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lang === 'ar' ? problem.deadlineText : problem.deadlineText_en}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'عدد المقترحات المقدمة:' : 'Proposals received:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {problem.proposalsCount}
                </span>
              </div>
            </div>

            <div>
              {eligibility.status === 'submitted' && (
                <div className="p-4 bg-[#D9F5E5] border-2 border-[#1E9E5A] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E9E5A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تم تقديم حلك بنجاح' : 'Solution Submitted'}</span>
                  </div>
                  <p className="text-xs text-[#12122B] leading-relaxed">
                    {lang === 'ar'
                      ? 'مقترحك قيد الدراسة والمراجعة حالياً من طرف الفريق الهندسي للشركة. ستتلقى إشعاراً فور تقييمه.'
                      : 'Your proposal is currently under technical review by the company engineering team.'}
                  </p>
                  <span className="font-tag text-[10px] font-bold text-[#1E9E5A] uppercase">
                    STATUS: UNDER REVIEW
                  </span>
                </div>
              )}

              {eligibility.status === 'eligible' && (
                <div className="p-4 bg-[#F0FFC4] border-2 border-[#12122B] rounded-md shadow-pixel-s flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <CheckCircle2 className="w-4 h-4 text-[#1E9E5A]" />
                    <span>
                      {lang === 'ar'
                        ? `تطابق مهاراتك ${eligibility.matchCount} من ${eligibility.totalCount} مهارات!`
                        : `Your skills match ${eligibility.matchCount} of ${eligibility.totalCount} required tags!`}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'أنت مؤهل رسمياً لتقديم مقترح حل لهذا التحدي والمنافسة على المكافأة.'
                      : 'You are eligible to submit a proposal for this industrial challenge.'}
                  </p>
                  <Link
                    to={`/problems/${problem.id}/submit`}
                    className="w-full py-2.5 text-center rounded-md font-bold text-xs btn-pixel-accent"
                  >
                    {lang === 'ar' ? 'قدّم حلك الآن' : 'Submit solution'}
                  </Link>
                </div>
              )}

              {eligibility.status === 'mismatch' && (
                <div className="p-4 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <AlertCircle className="w-4 h-4 text-[#FFC53D]" />
                    <span>{lang === 'ar' ? 'عدم تطابق في المهارات' : 'Skill Mismatch'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'مهاراتك المسجلة حالياً لا تتطابق مع متطلبات هذه المشكلة، لكن يمكنك مناقشتها مع الشركة في التعليقات أو تعديل ملفك.'
                      : 'Your current skills profile does not match the tags required. You may still participate in discussions.'}
                  </p>
                  <Link
                    to="/profile/solver"
                    className="w-full py-2 text-center rounded-md font-bold text-xs btn-pixel-secondary"
                  >
                    {lang === 'ar' ? 'تعديل مهارات الحلّال' : 'Update solver skills'}
                  </Link>
                </div>
              )}

              {eligibility.status === 'needs_profile' && (
                <div className="p-4 bg-[#FFFBF1] border-2 border-[#0B2A9E] rounded-md shadow-pixel-s flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B2A9E]">
                    <Lock className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'مطلوب إكمال ملف الحلّال' : 'Solver Profile Required'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'أنت عضو مسجل، ولكن لتقديم حلول والمنافسة على المكافأة تحتاج لإكمال ملف الحلّال وتحديد مهاراتك.'
                      : 'You are signed in as a member. Complete your solver profile to unlock proposal submissions.'}
                  </p>
                  <Link
                    to="/profile/solver"
                    className="w-full py-2.5 text-center rounded-md font-bold text-xs btn-pixel-accent"
                  >
                    {lang === 'ar' ? 'أكمل ملف الحلّال' : 'Complete solver profile'}
                  </Link>
                </div>
              )}

              {eligibility.status === 'visitor' && (
                <div className="p-4 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#12122B]">
                    <Lock className="w-4 h-4 text-[#0B2A9E]" />
                    <span>{lang === 'ar' ? 'سجّل الدخول لتقديم حل' : 'Sign in to apply'}</span>
                  </div>
                  <p className="text-xs text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar'
                      ? 'التصفح مجاني. للتقديم على المشكلات ومناقشتها، سجّل الدخول أو أنشئ حسابًا جديدًا.'
                      : 'Create a free account or sign in to submit proposals and discuss solutions.'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to="/signin"
                      className="flex-1 py-2 text-center rounded-md font-bold text-xs btn-pixel-secondary"
                    >
                      {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
                    </Link>
                    <Link
                      to="/signup"
                      className="flex-1 py-2 text-center rounded-md font-bold text-xs btn-pixel-accent"
                    >
                      {lang === 'ar' ? 'إنشاء حساب' : 'Sign up'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#5B5B7B] text-center pt-2 border-t border-[#EFE4CC]">
              {lang === 'ar'
                ? 'تُحفظ سرية الحلول والبيانات الحساسة بموجب اتفاقية الاستخدام وسياسة الملكية الفكرية.'
                : 'Proposals are protected under industrial confidentiality and IP guidelines.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
