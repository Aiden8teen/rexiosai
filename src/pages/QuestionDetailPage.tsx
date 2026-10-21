import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { ReactionButton } from '../components/ReactionButton';
import { useCommunityQuestion } from '../hooks/useCommunity';
import { Lock, CheckCircle2, ChevronRight, ChevronLeft, Send, AlertCircle } from 'lucide-react';

const formatDate = (value: string, lang: 'ar' | 'en') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const AnswerComposer: React.FC<{
  lang: 'ar' | 'en';
  onPost: (body: string, language: 'ar' | 'en') => Promise<unknown>;
}> = ({ lang, onPost }) => {
  const [answerInput, setAnswerInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = answerInput.trim();
    if (!body) return;
    setPending(true);
    setError('');
    try {
      await onPost(body, lang);
      setAnswerInput('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (lang === 'ar' ? 'تعذر نشر الإجابة.' : 'Could not post the answer.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="card-pixel p-6">
      <h3 className="text-sm font-bold text-[#12122B] mb-2">{lang === 'ar' ? 'اكتب إجابتك' : 'Write your answer'}</h3>
      <p className="text-xs text-[#5B5B7B] mb-4">
        {lang === 'ar' ? 'قدم شرحًا واضحًا وأمثلة عملية أو مراجع هندسية لمساعدة السائل.' : 'Provide a clear explanation and practical examples to assist the author.'}
      </p>
      {error && <p className="text-xs text-[#E5432A] mb-3" role="alert">{error}</p>}
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <textarea
          value={answerInput}
          onChange={(event) => setAnswerInput(event.target.value)}
          placeholder={lang === 'ar' ? 'اكتب خطوات الحل أو التوصيات التقنية هنا…' : 'Write steps to reproduce or technical suggestions here…'}
          rows={5}
          className="w-full input-pixel text-xs leading-relaxed"
          required
          maxLength={20000}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer disabled:opacity-60">
            <Send className="w-4 h-4" />
            <span>{pending ? (lang === 'ar' ? 'جارٍ النشر…' : 'Posting…') : (lang === 'ar' ? 'نشر الإجابة' : 'Post answer')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, dir, currentRole, currentUser, openAuthModal } = useApp();
  const community = useCommunityQuestion(id, currentUser.id, lang);
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  if (community.loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#5B5B7B]" role="status">{lang === 'ar' ? 'جارٍ تحميل السؤال…' : 'Loading question…'}</div>;
  }

  if (community.notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-pixel p-8 text-center flex flex-col items-center gap-4" role="alert">
          <AlertCircle className="w-8 h-8 text-[#E5432A]" />
          <h1 className="text-xl font-bold text-[#12122B]">{lang === 'ar' ? 'السؤال غير موجود' : 'Question not found'}</h1>
          <p className="text-sm text-[#5B5B7B]">{community.error}</p>
          <Link to="/community" className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-primary">{lang === 'ar' ? 'العودة إلى المجتمع' : 'Back to community'}</Link>
        </div>
      </div>
    );
  }

  if (!community.question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-pixel p-8 text-center flex flex-col items-center gap-4" role="alert">
          <AlertCircle className="w-8 h-8 text-[#E5432A]" />
          <p className="text-sm text-[#E5432A]">{community.error || (lang === 'ar' ? 'تعذر تحميل السؤال.' : 'Could not load the question.')}</p>
          <button type="button" onClick={() => void community.retry()} className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button>
        </div>
      </div>
    );
  }

  const { question, answers, totalAnswers } = community;
  const isOwner = question.author.id === currentUser.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-xs text-[#5B5B7B]">
        <Link to="/" className="hover:underline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <Link to="/community" className="hover:underline">{lang === 'ar' ? 'المجتمع' : 'Community'}</Link>
        <ChevronIcon className="w-3.5 h-3.5" />
        <span className="text-[#12122B] font-bold truncate max-w-xs">{lang === 'ar' ? question.title : question.titleEn}</span>
      </nav>

      {community.actionError && <p className="card-pixel p-3 text-xs text-[#E5432A]" role="alert">{community.actionError}</p>}
      <article className="card-pixel p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs border-b border-[#EFE4CC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold text-sm shadow-pixel-s">{lang === 'ar' ? question.author.avatarChar : question.author.nameEn?.trim().slice(0, 1) || question.author.avatarChar}</div>
            <div>
              <p className="font-bold text-[#12122B] text-sm">{lang === 'ar' ? question.author.name : question.author.nameEn}</p>
              <time dateTime={question.createdAt} className="text-[11px] text-[#5B5B7B]">{formatDate(question.createdAt, lang)}</time>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">{question.tags.map((skill) => <TagChip key={skill} tag={skill} size="sm" />)}</div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#12122B] leading-snug">{lang === 'ar' ? question.title : question.titleEn}</h1>
        <div className="text-sm sm:text-base text-[#12122B] leading-relaxed whitespace-pre-line font-normal">{lang === 'ar' ? question.body : question.bodyEn}</div>

        {question.codeSnippet && (
          <div className="my-2 p-4 bg-[#12122B] text-[#FFFBF1] border-2 border-[#12122B] rounded-md font-code text-xs overflow-x-auto shadow-pixel-s"><pre>{question.codeSnippet}</pre></div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#EFE4CC] mt-2">
          <div className="flex items-center gap-2">
            <ReactionButton type="insight" count={question.insightCount} active={question.viewerReactions.includes('insight')} pending={community.isReactionPending(question.id, 'insight')} disabled={isOwner} onClick={() => currentRole === 'visitor' ? openAuthModal() : void community.toggleQuestionReaction('insight')} />
            <ReactionButton type="helpful" count={question.helpfulCount} active={question.viewerReactions.includes('helpful')} pending={community.isReactionPending(question.id, 'helpful')} disabled={isOwner} onClick={() => currentRole === 'visitor' ? openAuthModal() : void community.toggleQuestionReaction('helpful')} />
          </div>
          <div className="text-xs text-[#5B5B7B]">{lang === 'ar' ? `${question.views} مشاهدة · ${totalAnswers} إجابات` : `${question.views} views · ${totalAnswers} answers`}</div>
        </div>
      </article>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#12122B]">{lang === 'ar' ? `الإجابات (${totalAnswers})` : `Answers (${totalAnswers})`}</h2>
        {community.answerError && (
          <div className="card-pixel p-4 flex items-center justify-between gap-3 text-xs text-[#E5432A]" role="alert">
            <span>{community.answerError}</span>
            <button type="button" onClick={() => void community.retry()} className="underline shrink-0">{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button>
          </div>
        )}
        {community.loadingAnswers && answers.length === 0 ? (
          <div className="card-pixel p-6 text-center text-xs text-[#5B5B7B]" role="status">{lang === 'ar' ? 'جارٍ تحميل الإجابات…' : 'Loading answers…'}</div>
        ) : totalAnswers === 0 ? (
          <div className="card-pixel p-6 text-center text-xs text-[#5B5B7B]">{lang === 'ar' ? 'لا توجد إجابات بعد. كن أول من يشارك بالحل!' : 'No answers yet. Be the first to share an answer!'}</div>
        ) : answers.map((answer) => (
          <article key={answer.id} className={`card-pixel p-6 flex flex-col gap-4 ${answer.isAccepted ? 'border-[#1E9E5A] bg-[#FFFBF1]' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs border-b border-[#EFE4CC] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1E9E5A] text-[#FFFBF1] flex items-center justify-center font-bold text-xs shadow-pixel-s">{lang === 'ar' ? answer.author.avatarChar : answer.author.nameEn?.trim().slice(0, 1) || answer.author.avatarChar}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#12122B]">{lang === 'ar' ? answer.author.name : answer.author.nameEn}</p>
                    {answer.isAccepted && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D9F5E5] border border-[#1E9E5A] rounded-full text-[10px] font-bold text-[#1E9E5A]"><CheckCircle2 className="w-3 h-3" /><span>{lang === 'ar' ? 'إجابة مقبولة' : 'Accepted answer'}</span></span>}
                  </div>
                  <time dateTime={answer.createdAt} className="text-[11px] text-[#5B5B7B]">{formatDate(answer.createdAt, lang)}</time>
                </div>
              </div>
              {isOwner && (
                <button
                  type="button"
                  disabled={community.acceptingAnswer}
                  onClick={() => void community.chooseAcceptedAnswer(answer.isAccepted ? null : answer.id).catch(() => undefined)}
                  className="px-3 py-1.5 rounded-md font-bold text-[11px] btn-pixel-secondary disabled:opacity-60"
                >
                  {community.acceptingAnswer ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : answer.isAccepted ? (lang === 'ar' ? 'إزالة الإجابة المقبولة' : 'Clear accepted answer') : (lang === 'ar' ? 'اختيار كإجابة مقبولة' : 'Accept answer')}
                </button>
              )}
            </div>

            <div className="text-xs sm:text-sm text-[#12122B] leading-relaxed whitespace-pre-line">{lang === 'ar' ? answer.body : answer.bodyEn}</div>
            <div className="flex items-center justify-between pt-2 border-t border-[#EFE4CC] mt-1">
              <div className="flex items-center gap-2">
                <ReactionButton type="insight" count={answer.insightCount} active={answer.viewerReactions.includes('insight')} pending={community.isReactionPending(answer.id, 'insight')} disabled={answer.author.id === currentUser.id} onClick={() => currentRole === 'visitor' ? openAuthModal() : void community.toggleAnswerReaction(answer.id, 'insight')} />
                <ReactionButton type="helpful" count={answer.helpfulCount} active={answer.viewerReactions.includes('helpful')} pending={community.isReactionPending(answer.id, 'helpful')} disabled={answer.author.id === currentUser.id} onClick={() => currentRole === 'visitor' ? openAuthModal() : void community.toggleAnswerReaction(answer.id, 'helpful')} />
              </div>
            </div>
          </article>
        ))}

        {community.hasMoreAnswers && <button type="button" disabled={community.loadingAnswers} onClick={() => void community.loadMoreAnswers()} className="self-center px-5 py-2 rounded-md font-bold text-xs btn-pixel-secondary disabled:opacity-60">{community.loadingAnswers ? (lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…') : (lang === 'ar' ? 'تحميل المزيد من الإجابات' : 'Load more answers')}</button>}
      </section>

      <section className="pt-2">
        {currentRole === 'visitor' ? (
          <div className="card-pixel p-8 bg-[#F8F1E1] flex flex-col items-center text-center gap-4 border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#EFE4CC] border-2 border-[#12122B] flex items-center justify-center text-[#0B2A9E]"><Lock className="w-6 h-6 stroke-[2.2]" /></div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-[#12122B] mb-1">{lang === 'ar' ? 'سجّل الدخول لتكتب إجابة' : 'Sign in to write an answer'}</h3>
              <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'يمكن للأعضاء المسجَّلين فقط كتابة الإجابات والتفاعل مع المنشورات.' : 'Only registered members can write answers and interact with posts.'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/signin" className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</Link>
              <Link to="/signup" className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-accent">{lang === 'ar' ? 'إنشاء حساب' : 'Create an account'}</Link>
            </div>
          </div>
        ) : <AnswerComposer key={`${question.id}:${currentUser.id}`} lang={lang} onPost={community.postAnswer} />}
      </section>
    </div>
  );
};
