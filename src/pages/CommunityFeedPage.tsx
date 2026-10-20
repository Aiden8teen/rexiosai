import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TagChip } from '../components/TagChip';
import { ReactionButton } from '../components/ReactionButton';
import { Search, Eye, MessageSquare, AlertCircle, PlusCircle, Check } from 'lucide-react';

export const CommunityFeedPage: React.FC = () => {
  const {
    lang,
    currentRole,
    questions,
    toggleQuestionReaction,
    openAuthModal,
  } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortTab, setSortTab] = useState<'latest' | 'active' | 'unanswered'>('latest');

  const popularTags = ['IOT', 'EMBEDDED', 'AI/ML', 'PYTHON', 'ROBOTICS', 'SQL'];

  const filteredQuestions = questions
    .filter((q) => {
      const matchSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.excerpt_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = selectedTag ? q.tags.includes(selectedTag) : true;
      return matchSearch && matchTag;
    })
    .sort((a, b) => {
      if (sortTab === 'active') {
        return b.helpfulCount + b.insightCount - (a.helpfulCount + a.insightCount);
      }
      if (sortTab === 'unanswered') {
        return a.answersCount - b.answersCount;
      }
      return 0;
    });

  const handleAskQuestionClick = () => {
    if (currentRole === 'visitor') {
      openAuthModal();
    } else {
      navigate('/community/ask');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {currentRole === 'visitor' && (
        <div className="mb-6 p-4 bg-[#EEF1FF] border-2 border-[#0B2A9E] rounded-lg shadow-pixel-s flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#0B2A9E] shrink-0" />
            <p className="text-xs text-[#0B2A9E] font-semibold leading-relaxed">
              {lang === 'ar'
                ? 'أنت تتصفح كزائر: يمكنك قراءة الأسئلة والإجابات فقط. سجّل الدخول أو أنشئ حسابًا للمشاركة في النقاش.'
                : 'You are browsing as a visitor: You can only read questions and answers. Sign in or create an account to participate.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/signin"
              className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-secondary"
            >
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 rounded-md font-bold text-xs btn-pixel-accent"
            >
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
                  {lang === 'ar' ? `${questions.length} أسئلة` : `${questions.length} questions`}
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
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث عن سؤال أو مشكلة أو وسم…'
                  : 'Search questions, topics, or tags…'
              }
              className="w-full input-pixel ps-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSortTab('latest')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  sortTab === 'latest'
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'
                }`}
              >
                {lang === 'ar' ? 'الأحدث' : 'Latest'}
              </button>
              <button
                type="button"
                onClick={() => setSortTab('active')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  sortTab === 'active'
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'
                }`}
              >
                {lang === 'ar' ? 'الأكثر تفاعلًا' : 'Most Active'}
              </button>
              <button
                type="button"
                onClick={() => setSortTab('unanswered')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  sortTab === 'unanswered'
                    ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                    : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'
                }`}
              >
                {lang === 'ar' ? 'بدون إجابة' : 'Unanswered'}
              </button>
            </div>

            {selectedTag && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5B5B7B]">{lang === 'ar' ? 'تصفية حسب:' : 'Filter:'}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] rounded-full font-tag text-[10px] font-bold">
                  {selectedTag}
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="cursor-pointer font-bold hover:text-[#E5432A]"
                  >
                    ✕
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {filteredQuestions.length === 0 ? (
              <div className="card-pixel p-8 text-center text-sm text-[#5B5B7B]">
                {lang === 'ar'
                  ? 'لم يتم العثور على أسئلة تطابق بحثك.'
                  : 'No questions found matching your search.'}
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="card-pixel p-5 sm:p-6 hover:translate-y-[-2px] transition-transform flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs text-[#5B5B7B]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold text-xs">
                        {q.authorAvatar}
                      </div>
                      <span className="font-semibold text-[#12122B]">
                        {lang === 'ar' ? q.author : q.author_en}
                      </span>
                    </div>
                    <span>{lang === 'ar' ? q.createdAt : q.createdAt_en}</span>
                  </div>

                  <Link
                    to={`/community/${q.id}`}
                    className="text-base sm:text-lg font-bold text-[#12122B] hover:text-[#0B2A9E] transition-colors leading-snug"
                  >
                    {lang === 'ar' ? q.title : q.title_en}
                  </Link>

                  <p className="text-xs sm:text-sm text-[#5B5B7B] line-clamp-2 leading-relaxed">
                    {lang === 'ar' ? q.excerpt : q.excerpt_en}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.tags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        size="sm"
                        onClick={() => setSelectedTag(tag)}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#EFE4CC] text-xs">
                    <div className="flex items-center gap-4 text-[#5B5B7B]">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{q.views}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ar'
                            ? `${q.answersCount} إجابات`
                            : `${q.answersCount} answers`}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ReactionButton
                        type="insight"
                        count={q.insightCount}
                        onClick={() => toggleQuestionReaction(q.id, 'insight')}
                      />
                      <ReactionButton
                        type="helpful"
                        count={q.helpfulCount}
                        onClick={() => toggleQuestionReaction(q.id, 'helpful')}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="card-pixel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">
              {lang === 'ar' ? 'مساهمون نشطون' : 'Active Contributors'}
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center font-bold">
                    س
                  </div>
                  <div>
                    <p className="font-bold text-[#12122B]">
                      {lang === 'ar' ? 'سارة قاسمي' : 'Sara Khasmi'}
                    </p>
                    <p className="text-[10px] text-[#5B5B7B]">
                      {lang === 'ar' ? '42 إجابة معتمدة' : '42 verified answers'}
                    </p>
                  </div>
                </div>
                <span className="font-tag text-[10px] px-2 py-0.5 bg-[#F0FFC4] border border-[#12122B] rounded-full">
                  TOP
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1E9E5A] text-[#FFFBF1] flex items-center justify-center font-bold">
                    ن
                  </div>
                  <div>
                    <p className="font-bold text-[#12122B]">
                      {lang === 'ar' ? 'نور الدين مقراني' : 'Noureddine Mokrani'}
                    </p>
                    <p className="text-[10px] text-[#5B5B7B]">
                      {lang === 'ar' ? '37 إجابة معتمدة' : '37 verified answers'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FFC53D] text-[#12122B] flex items-center justify-center font-bold">
                    أ
                  </div>
                  <div>
                    <p className="font-bold text-[#12122B]">
                      {lang === 'ar' ? 'أمين بن علي' : 'Amine Ben Ali'}
                    </p>
                    <p className="text-[10px] text-[#5B5B7B]">
                      {lang === 'ar' ? '25 إجابة معتمدة' : '25 verified answers'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-pixel p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">
              {lang === 'ar' ? 'وسوم شائعة' : 'Popular Tags'}
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {popularTags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  selected={selectedTag === tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                />
              ))}
            </div>
          </div>

          <div className="card-pixel p-5 flex flex-col gap-3 bg-[#FFFBF1]">
            <h3 className="text-sm font-bold text-[#12122B] border-b border-[#EFE4CC] pb-2">
              {lang === 'ar' ? 'قواعد المجتمع' : 'Community Rules'}
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-[#12122B]">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar'
                    ? 'كن محترمًا ومحددًا في طرح سؤالك'
                    : 'Be respectful and specific in your question'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar'
                    ? 'لا تنشر معلومات سرّية عن شركتك أو الشيفرات الحساسة'
                    : 'Do not publish confidential or proprietary company data'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#1E9E5A] shrink-0 mt-0.5" />
                <span>
                  {lang === 'ar'
                    ? 'ابحث في المجتمع وتأكد من عدم تكرار السؤال'
                    : 'Search previous questions before asking'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
