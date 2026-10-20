import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { ReactionButton } from '../components/ReactionButton';
import { MAX_COMMUNITY_PAGE, normalizeCommunityPage, useCommunityFeed, useCommunityOverview } from '../hooks/useCommunity';
import type { CommunitySort } from '../api/community';
import { Search, Eye, MessageSquare, AlertCircle, PlusCircle, Check } from 'lucide-react';

const validSort = (sort: string | null): CommunitySort =>
  sort === 'active' || sort === 'unanswered' ? sort : 'latest';

const formatDate = (value: string, lang: 'ar' | 'en') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en', { dateStyle: 'medium' }).format(date);
};

export const CommunityFeedPage: React.FC = () => {
  const {
    lang,
    currentRole,
    currentUser,
    openAuthModal,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlQuery = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const sort = validSort(searchParams.get('sort'));
  const pageParam = searchParams.get('page');
  const page = normalizeCommunityPage(pageParam);
  const [searchDraft, setSearchDraft] = useState({ sourceQuery: urlQuery, value: urlQuery });
  const searchInput = searchDraft.sourceQuery === urlQuery ? searchDraft.value : urlQuery;

  useEffect(() => {
    if (pageParam === null || pageParam === String(page)) return;
    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [page, pageParam, searchParams, setSearchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      if (nextQuery === urlQuery) return;
      const next = new URLSearchParams(searchParams);
      if (nextQuery) next.set('q', nextQuery);
      else next.delete('q');
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput, urlQuery, searchParams, setSearchParams]);

  const feed = useCommunityFeed({ q: urlQuery, tag, sort, page }, currentUser.id, lang);
  const { overview, loading: overviewLoading, error: overviewError, retry: retryOverview } = useCommunityOverview(lang);

  const updateFilter = (name: 'tag' | 'sort', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const handleAskQuestionClick = () => {
    if (currentRole === 'visitor') openAuthModal();
    else navigate('/community/ask');
  };

  const sortTabs: Array<{ id: CommunitySort; ar: string; en: string }> = [
    { id: 'latest', ar: 'الأحدث', en: 'Latest' },
    { id: 'active', ar: 'الأكثر نشاطًا', en: 'Most Active' },
    { id: 'unanswered', ar: 'بدون إجابة', en: 'Unanswered' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {currentRole === 'visitor' && (
        <div className="mb-6 p-4 bg-[#EEF1FF] border-2 border-[#0B2A9E] rounded-lg shadow-pixel-s flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#0B2A9E] shrink-0" />
            <p className="text-xs text-[#0B2A9E] font-semibold leading-relaxed">
              {lang === 'ar'
                ? 'أنت تتصفح كزائر: يمكنك قراءة الأسئلة والإجابات فقط. سجّل الدخول أو أنشئ حسابًا للمشاركة في النقاش.'
                : 'You are browsing as a visitor: You can read questions and answers. Sign in or create an account to participate.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/signin" className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-secondary">
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
            <Link to="/signup" className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-accent">
              {lang === 'ar' ? 'إنشاء حساب' : 'Sign up'}
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#12122B]">
                  {lang === 'ar' ? 'المجتمع' : 'Community Feed'}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#FFFBF1] border border-[#12122B] rounded-full text-xs font-bold text-[#5B5B7B] shadow-pixel-s">
                  {lang === 'ar' ? `${feed.total} سؤالًا` : `${feed.total} questions`}
                </span>
              </div>
              <p className="text-xs text-[#5B5B7B] mt-1">
                {lang === 'ar'
                  ? 'اطرح الأسئلة وتبادل المعرفة مع المهندسين والتقنيين'
                  : 'Ask questions and exchange insights with engineers and developers'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAskQuestionClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-xs btn-pixel-primary cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? 'اطرح سؤالًا' : 'Ask a Question'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#5B5B7B] absolute top-3.5 start-3.5 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchDraft({ sourceQuery: urlQuery, value: event.target.value })}
              placeholder={lang === 'ar' ? 'ابحث عن سؤال أو مشكلة أو وسم…' : 'Search questions, topics, or tags…'}
              className="w-full input-pixel ps-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {sortTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilter('sort', tab.id === 'latest' ? '' : tab.id)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${sort === tab.id
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'}`}
                >
                  {lang === 'ar' ? tab.ar : tab.en}
                </button>
              ))}
            </div>
            {tag && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'تصفية حسب:' : 'Filter:'}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] rounded-full font-tag text-[10px] font-bold">
                  {tag}
                  <button type="button" aria-label={lang === 'ar' ? 'إزالة الوسم' : 'Remove tag filter'} onClick={() => updateFilter('tag', '')} className="cursor-pointer font-bold hover:text-[#E5432A]">✕</button>
                </span>
              </div>
            )}
          </div>

          {feed.error && (
            <div className="card-pixel p-5 text-sm text-[#E5432A] flex flex-col gap-3" role="alert">
              <p>{feed.error}</p>
              <button type="button" onClick={() => void feed.retry()} className="self-start px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-secondary">
                {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          )}
          {feed.mutationError && <p className="text-xs text-[#E5432A]" role="alert">{feed.mutationError}</p>}

          <div className="flex flex-col gap-4">
            {feed.loading && feed.questions.length === 0 ? (
              <div className="card-pixel p-8 text-center text-sm text-[#5B5B7B]" role="status">
                {lang === 'ar' ? 'جارٍ تحميل الأسئلة…' : 'Loading questions…'}
              </div>
            ) : !feed.loading && !feed.error && feed.questions.length === 0 ? (
              <div className="card-pixel p-8 text-center text-sm text-[#5B5B7B]">
                {lang === 'ar' ? 'لم يتم العثور على أسئلة تطابق بحثك.' : 'No questions found matching your search.'}
              </div>
            ) : feed.questions.map((question) => (
              <article key={question.id} className="card-pixel p-5 sm:p-6 hover:translate-y-[-2px] transition-transform flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#5B5B7B]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold text-xs">{question.author.avatarChar}</div>
                    <span className="font-semibold text-[#12122B]">{lang === 'ar' ? question.author.name : question.author.nameEn}</span>
                  </div>
                  <time dateTime={question.createdAt}>{formatDate(question.createdAt, lang)}</time>
                </div>
                <Link to={`/community/${question.id}`} className="text-base sm:text-lg font-bold text-[#12122B] hover:text-[#0B2A9E] transition-colors leading-snug">
                  {lang === 'ar' ? question.title : question.titleEn}
                </Link>
                <p className="text-xs sm:text-sm text-[#5B5B7B] line-clamp-2 leading-relaxed">
                  {lang === 'ar' ? question.excerpt : question.excerptEn}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {question.tags.map((skill) => <TagChip key={skill} tag={skill} size="sm" onClick={() => updateFilter('tag', skill)} />)}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFE4CC] text-xs">
                  <div className="flex items-center gap-4 text-[#5B5B7B]">
                    <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /><span>{question.views}</span></span>
                    <span className="inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /><span>{lang === 'ar' ? `${question.answerCount} إجابات` : `${question.answerCount} answers`}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReactionButton
                      type="insight"
                      count={question.insightCount}
                      active={question.viewerReactions.includes('insight')}
                      pending={feed.isReactionPending(question.id, 'insight')}
                      disabled={question.author.id === currentUser.id}
                      onClick={() => currentRole === 'visitor' ? openAuthModal() : void feed.toggleQuestionReaction(question.id, 'insight')}
                    />
                    <ReactionButton
                      type="helpful"
                      count={question.helpfulCount}
                      active={question.viewerReactions.includes('helpful')}
                      pending={feed.isReactionPending(question.id, 'helpful')}
                      disabled={question.author.id === currentUser.id}
                      onClick={() => currentRole === 'visitor' ? openAuthModal() : void feed.toggleQuestionReaction(question.id, 'helpful')}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {feed.hasMore && page < MAX_COMMUNITY_PAGE && !feed.error && (
            <button
              type="button"
              disabled={feed.loadingMore}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', String(page + 1));
                setSearchParams(next);
              }}
              className="self-center px-5 py-2 rounded-md font-bold text-xs btn-pixel-secondary disabled:opacity-50"
            >
              {feed.loadingMore ? (lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…') : (lang === 'ar' ? 'عرض المزيد' : 'Load more')}
            </button>
          )}
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <section className="card-pixel p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">{lang === 'ar' ? 'مساهمون نشطون' : 'Active Contributors'}</h2>
            {overviewLoading && !overview ? <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</p>
              : overviewError ? <div className="flex flex-col gap-2 text-xs text-[#E5432A]" role="alert"><span>{overviewError}</span><button type="button" onClick={() => void retryOverview()} className="self-start underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button></div>
                : overview?.contributors.length ? <div className="flex flex-col gap-3">
                  {overview.contributors.map(({ author, answerCount, acceptedAnswerCount }, index) => (
                    <div key={author.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold">{author.avatarChar}</div>
                        <div><p className="font-bold text-[#12122B]">{lang === 'ar' ? author.name : author.nameEn}</p><p className="text-[10px] text-[#5B5B7B]">{lang === 'ar' ? `${answerCount} إجابة، ${acceptedAnswerCount} مقبولة` : `${answerCount} answers · ${acceptedAnswerCount} accepted`}</p></div>
                      </div>
                      {index === 0 && <span className="font-tag text-[10px] px-2 py-0.5 bg-[#F0FFC4] border border-[#12122B] rounded-full">TOP</span>}
                    </div>
                  ))}
                </div> : <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'لا توجد مساهمات بعد.' : 'No contributions yet.'}</p>}
          </section>

          <section className="card-pixel p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">{lang === 'ar' ? 'وسوم شائعة' : 'Popular Tags'}</h2>
            {overviewLoading && !overview ? <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</p>
              : overviewError ? <button type="button" onClick={() => void retryOverview()} className="self-start text-xs text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button>
                : overview?.popularTags.length ? <div className="flex flex-wrap gap-1.5 pt-1">{overview.popularTags.map(({ tag: popularTag, questionCount }) => <TagChip key={popularTag} tag={`${popularTag} · ${questionCount}`} selected={tag === popularTag} onClick={() => updateFilter('tag', tag === popularTag ? '' : popularTag)} />)}</div>
                  : <p className="text-xs text-[#5B5B7B]">{lang === 'ar' ? 'لا توجد وسوم بعد.' : 'No tags yet.'}</p>}
          </section>

          <section className="card-pixel p-5 flex flex-col gap-3 bg-[#FFFBF1]">
            <h2 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">{lang === 'ar' ? 'قواعد المجتمع' : 'Community Rules'}</h2>
            <ul className="flex flex-col gap-2.5 text-xs text-[#12122B]">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'كن محترمًا ومحددًا في طرح سؤالك' : 'Be respectful and specific in your question'}</span></li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'لا تنشر معلومات سرّية عن شركتك أو الشيفرات الحساسة' : 'Do not publish confidential or proprietary company data'}</span></li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" /><span>{lang === 'ar' ? 'ابحث في المجتمع وتأكد من عدم تكرار السؤال' : 'Search previous questions before asking'}</span></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};
