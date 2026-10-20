import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { ReactionButton } from '../components/ReactionButton';
import { Lock, CheckCircle2, ChevronRight, ChevronLeft, Send } from 'lucide-react';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    lang,
    dir,
    currentRole,
    questions,
    addAnswer,
    toggleQuestionReaction,
    toggleAnswerReaction,
    openAuthModal,
  } = useApp();

  const [answerInput, setAnswerInput] = useState('');
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const question = questions.find((q) => q.id === id) || questions[0];

  const handlePostAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    if (currentRole === 'visitor') {
      openAuthModal();
      return;
    }
    addAnswer(question.id, answerInput.trim());
    setAnswerInput('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">
          {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/community" className="hover:underline">
          {lang === 'ar' ? 'المجتمع' : 'Community'}
        </Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold truncate max-w-xs">
          {lang === 'ar' ? question.title : question.title_en}
        </span>
      </nav>

      <article className="card-pixel p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between text-xs border-b border-[#EFE4CC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold text-sm shadow-pixel-s">
              {question.authorAvatar}
            </div>
            <div>
              <p className="font-bold text-[#12122B] text-sm">
                {lang === 'ar' ? question.author : question.author_en}
              </p>
              <p className="text-[11px] text-[#5B5B7B]">
                {lang === 'ar' ? question.createdAt : question.createdAt_en}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {question.tags.map((tag) => (
              <TagChip key={tag} tag={tag} size="sm" />
            ))}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#12122B] leading-snug">
          {lang === 'ar' ? question.title : question.title_en}
        </h1>

        <div className="text-sm sm:text-base text-[#12122B] leading-relaxed whitespace-pre-line font-normal">
          {lang === 'ar' ? question.body : question.body_en}
        </div>

        {question.codeSnippet && (
          <div className="my-2 p-4 bg-[#12122B] text-[#FFFBF1] border-2 border-[#12122B] rounded-md font-code text-xs overflow-x-auto shadow-pixel-s">
            <pre>{question.codeSnippet}</pre>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#EFE4CC] mt-2">
          <div className="flex items-center gap-2">
            <ReactionButton
              type="insight"
              count={question.insightCount}
              onClick={() => toggleQuestionReaction(question.id, 'insight')}
            />
            <ReactionButton
              type="helpful"
              count={question.helpfulCount}
              onClick={() => toggleQuestionReaction(question.id, 'helpful')}
            />
          </div>

          <div className="text-xs text-[#5B5B7B]">
            {lang === 'ar'
              ? `${question.views} مشاهدة · ${question.answers.length} إجابات`
              : `${question.views} views · ${question.answers.length} answers`}
          </div>
        </div>
      </article>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#12122B]">
          {lang === 'ar'
            ? `الإجابات (${question.answers.length})`
            : `Answers (${question.answers.length})`}
        </h2>

        {question.answers.length === 0 ? (
          <div className="card-pixel p-6 text-center text-xs text-[#5B5B7B]">
            {lang === 'ar'
              ? 'لا توجد إجابات بعد. كن أول من يشارك بالحل!'
              : 'No answers yet. Be the first to share an answer!'}
          </div>
        ) : (
          question.answers.map((ans) => (
            <div
              key={ans.id}
              className={`card-pixel p-6 flex flex-col gap-4 ${
                ans.isVerified ? 'border-[#1E9E5A] bg-[#FFFBF1]' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs border-b border-[#EFE4CC] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1E9E5A] text-[#FFFBF1] flex items-center justify-center font-bold text-xs shadow-pixel-s">
                    {ans.authorAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#12122B]">
                        {lang === 'ar' ? ans.author : ans.author_en}
                      </p>
                      {ans.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D9F5E5] border border-[#1E9E5A] rounded-full text-[10px] font-bold text-[#1E9E5A]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'إجابة معتمدة' : 'Verified'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5B5B7B]">
                      {lang === 'ar' ? ans.authorRole : ans.authorRole_en} ·{' '}
                      {lang === 'ar' ? ans.createdAt : ans.createdAt_en}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-[#12122B] leading-relaxed whitespace-pre-line">
                {lang === 'ar' ? ans.body : ans.body_en}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EFE4CC] mt-1">
                <div className="flex items-center gap-2">
                  <ReactionButton
                    type="insight"
                    count={ans.insightCount}
                    onClick={() => toggleAnswerReaction(question.id, ans.id, 'insight')}
                  />
                  <ReactionButton
                    type="helpful"
                    count={ans.helpfulCount}
                    onClick={() => toggleAnswerReaction(question.id, ans.id, 'helpful')}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="pt-2">
        {currentRole === 'visitor' ? (
          <div className="card-pixel p-8 bg-[#F8F1E1] flex flex-col items-center text-center gap-4 border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#EFE4CC] border-2 border-[#12122B] flex items-center justify-center text-[#0B2A9E]">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-[#12122B] mb-1">
                {lang === 'ar' ? 'سجّل الدخول لتكتب إجابة' : 'Sign in to write an answer'}
              </h3>
              <p className="text-xs text-[#5B5B7B]">
                {lang === 'ar'
                  ? 'يمكن للأعضاء المسجَّلين فقط كتابة الإجابات والتفاعل مع المنشورات.'
                  : 'Only registered members can write answers and interact with posts.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-accent"
              >
                {lang === 'ar' ? 'إنشاء حساب' : 'Create an account'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-pixel p-6">
            <h3 className="text-sm font-bold text-[#12122B] mb-2">
              {lang === 'ar' ? 'اكتب إجابتك' : 'Write your answer'}
            </h3>
            <p className="text-xs text-[#5B5B7B] mb-4">
              {lang === 'ar'
                ? 'قدم شرحًا واضحًا وأمثلة عملية أو مراجع هندسية لمساعدة السائل.'
                : 'Provide a clear explanation and practical examples to assist the author.'}
            </p>

            <form onSubmit={handlePostAnswer} className="flex flex-col gap-4">
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب خطوات الحل أو التوصيات التقنية هنا…'
                    : 'Write steps to reproduce or technical suggestions here…'
                }
                rows={5}
                className="w-full input-pixel text-xs leading-relaxed"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'نشر الإجابة' : 'Post answer'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};
