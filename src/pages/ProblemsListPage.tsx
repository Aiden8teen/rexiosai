import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
import { useMetadata } from '../hooks/useMetadata';
import type { ProblemDifficulty } from '../types';
import {
  Search,
  Coins,
  Clock,
  Users,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

export const ProblemsListPage: React.FC = () => {
  const { lang, currentRole, currentUser, problems, problemsLoading, problemsError, loadProblems } = useApp();
  const { skills: availableSkills, loading: skillsLoading, error: skillsError, retry: retrySkills } = useMetadata();
  const loadProblemsRef = useRef(loadProblems);
  useEffect(() => { loadProblemsRef.current = loadProblems; }, [loadProblems]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<ProblemDifficulty[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxReward, setMaxReward] = useState<number>(200000);
  const [sortTab, setSortTab] = useState<'latest' | 'highest_reward' | 'ending_soon'>('latest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const userSkillsUpper = (currentUser.solverProfile?.skills || []).map((s) =>
    s.toUpperCase().trim()
  );

  const toggleDifficulty = (d: ProblemDifficulty) => {
    if (selectedDifficulties.includes(d)) {
      setSelectedDifficulties(selectedDifficulties.filter((item) => item !== d));
    } else {
      setSelectedDifficulties([...selectedDifficulties, d]);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDifficulties([]);
    setSelectedSkill(null);
    setSelectedCategories([]);
    setMaxReward(200000);
    setSortTab('latest');
  };

  const filteredProblems = problems;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      void loadProblemsRef.current({
        q: searchQuery || undefined,
        skill: selectedSkill ? [selectedSkill] : undefined,
        difficulty: selectedDifficulties.length ? selectedDifficulties : undefined,
        category: selectedCategories.length ? selectedCategories : undefined,
        maxReward: maxReward < 200000 ? maxReward : undefined,
        sort: sortTab === 'highest_reward' ? 'reward' : sortTab === 'ending_soon' ? 'deadline' : 'newest',
        page: 1,
        limit: 20,
      }).then((result) => setTotal(result.total)).catch(() => setTotal(0));
    }, 250);
    return () => window.clearTimeout(timer);
    // The ref keeps the latest context action without retriggering for each render.
  }, [searchQuery, selectedDifficulties, selectedSkill, selectedCategories, maxReward, sortTab]);

  const loadNextPage = async () => {
    const nextPage = page + 1;
    try {
      const result = await loadProblems({
        q: searchQuery || undefined,
        skill: selectedSkill ? [selectedSkill] : undefined,
        difficulty: selectedDifficulties.length ? selectedDifficulties : undefined,
        category: selectedCategories.length ? selectedCategories : undefined,
        maxReward: maxReward < 200000 ? maxReward : undefined,
        sort: sortTab === 'highest_reward' ? 'reward' : sortTab === 'ending_soon' ? 'deadline' : 'newest',
        page: nextPage,
        limit: 20,
      });
      setPage(nextPage); setTotal(result.total);
    } catch { /* context error state is rendered below */ }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#12122B] tracking-tight">
            {lang === 'ar' ? 'المشكلات الصناعية' : 'Industrial Problems'}
          </h1>
          <p className="text-sm text-[#5B5B7B] mt-1">
            {lang === 'ar'
              ? 'تحديات منشورة من شركات ومصانع جزائرية بميزانيات ومتطلبات واضحة.'
              : 'Challenges posted by Algerian companies with listed budgets and clear requirements.'}
          </p>
        </div>
        {currentRole === 'company' && <Link to="/company/problems/new" className="px-4 py-2.5 rounded-md font-bold text-xs btn-pixel-accent">{lang === 'ar' ? 'نشر مشكلة' : 'Post a problem'}</Link>}
      </div>

      {(currentRole === 'member' || (currentRole === 'solver' && !currentUser.solverProfile?.skills?.length)) && (
        <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg shadow-pixel-s flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F0FFC4] border border-[#12122B] rounded-full">
              <AlertCircle className="w-5 h-5 text-[#12122B]" />
            </div>
            <p className="text-xs text-[#12122B] font-semibold leading-relaxed">
              {lang === 'ar'
                ? 'يمكنك تصفّح المشكلات ومناقشتها الآن. لتقديم مقترح، أكمل ملف المواهب.'
                : 'You can browse and discuss challenges now. Complete your talent profile to submit proposals.'}
            </p>
          </div>
          <Link
            to="/profile/solver"
            className="px-4 py-2 rounded-md font-bold text-xs btn-pixel-accent shrink-0"
          >
            {lang === 'ar' ? 'أكمل ملف الحلّال' : 'Complete solver profile'}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pixel p-5 text-center">
          <p className="font-tag text-2xl font-bold text-[#0B2A9E]">{new Set(problems.map((p) => p.companyUserId || p.companyName_en)).size}</p>
          <p className="text-xs font-semibold text-[#5B5B7B] mt-1">
            {lang === 'ar' ? 'شركات ضمن النتائج' : 'Companies in results'}
          </p>
        </div>
        <div className="card-pixel p-5 text-center bg-[#F0FFC4]">
          <p className="font-tag text-2xl font-bold text-[#12122B]">{problems.reduce((sum, p) => sum + p.rewardAmount, 0).toLocaleString(lang === 'ar' ? 'fr-DZ' : 'en-US')} {lang === 'ar' ? 'د.ج' : 'DZD'}</p>
          <p className="text-xs font-bold text-[#12122B] mt-1">
            {lang === 'ar' ? 'مجموع ميزانيات هذه الصفحة' : 'Budget total on this page'}
          </p>
        </div>
        <div className="card-pixel p-5 text-center">
          <p className="font-tag text-2xl font-bold text-[#1E9E5A]">{total}</p>
          <p className="text-xs font-semibold text-[#5B5B7B] mt-1">
            {lang === 'ar' ? 'إجمالي النتائج' : 'Total results'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B5B7B] absolute top-3.5 start-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث عن مشكلة أو شركة أو مهارة مطلوبة…'
                  : 'Search by challenge, company, or required skill…'
              }
              className="w-full input-pixel ps-10 text-xs"
            />
          </div>

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
              onClick={() => setSortTab('highest_reward')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                sortTab === 'highest_reward'
                  ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                  : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'
              }`}
            >
              {lang === 'ar' ? 'أعلى ميزانية' : 'Highest Budget'}
            </button>
            <button
              type="button"
              onClick={() => setSortTab('ending_soon')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                sortTab === 'ending_soon'
                  ? 'bg-[#0B2A9E] text-[#FFFBF1] shadow-pixel-s'
                  : 'bg-[#FFFBF1] text-[#12122B] border border-[#12122B]'
              }`}
            >
              {lang === 'ar' ? 'ينتهي قريبًا' : 'Ending Soonest'}
            </button>
          </div>

          {problemsError && <div className="p-3 bg-[#FFE3DC] border-2 border-[#E5432A] rounded-md text-xs font-bold text-[#E5432A] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{problemsError}</div>}
          <div className="flex flex-col gap-4">
            {problemsLoading && filteredProblems.length === 0 ? (
              <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المشكلات…' : 'Loading problems…'}</div>
            ) : filteredProblems.length === 0 ? (
              <div className="card-pixel p-10 text-center text-sm text-[#5B5B7B]">
                {lang === 'ar'
                  ? 'لم يتم العثور على مشكلات تطابق معايير التصفية المحددة.'
                  : 'No challenges match the active filter criteria.'}
              </div>
            ) : (
              filteredProblems.map((p) => (
                <div
                  key={p.id}
                  className="card-pixel p-6 hover:translate-y-[-2px] transition-transform flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between text-xs text-[#5B5B7B]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#12122B] text-[#FFFBF1] flex items-center justify-center font-bold text-xs">
                        {p.companyAvatar}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#12122B]">
                          {lang === 'ar' ? p.companyName : p.companyName_en}
                        </span>
                        <span className="font-tag text-[9px] px-1.5 py-0.2 bg-[#0B2A9E] text-[#FFFBF1] rounded-xs font-bold">
                          COMPANY
                        </span>
                      </div>
                    </div>
                    <span>{lang === 'ar' ? p.postedAt : p.postedAt_en}</span>
                  </div>

                  <Link
                    to={`/problems/${p.id}`}
                    className="text-lg font-bold text-[#12122B] hover:text-[#0B2A9E] transition-colors leading-snug"
                  >
                    {lang === 'ar' ? p.title : p.title_en}
                  </Link>

                  <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
                    {lang === 'ar' ? p.summary : p.summary_en}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => {
                      const isMatched =
                        currentRole === 'solver' &&
                        userSkillsUpper.includes(tag.toUpperCase().trim());
                      return (
                        <TagChip
                          key={tag}
                          tag={tag}
                          size="sm"
                          isMatched={isMatched}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#EFE4CC] gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#FFF1CC] border border-[#12122B] rounded shadow-pixel-s">
                        <Coins className="w-4 h-4 text-[#12122B]" />
                      </div>
                      <span className="font-tag text-base font-bold text-[#12122B]">
                        {lang === 'ar' ? p.rewardFormatted : p.rewardFormatted_en}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#5B5B7B]">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ar'
                            ? `${p.proposalsCount} مقترحات`
                            : `${p.proposalsCount} proposals`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ar' ? p.deadlineText : p.deadlineText_en}
                        </span>
                      </div>

                      <DifficultyMeter difficulty={p.difficulty} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {total > problems.length && <button type="button" disabled={problemsLoading} onClick={() => void loadNextPage()} className="self-center px-5 py-2.5 rounded-md text-xs font-bold btn-pixel-secondary">{problemsLoading ? (lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…') : (lang === 'ar' ? 'تحميل المزيد' : 'Load more')}</button>}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="card-pixel p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#EFE4CC] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0B2A9E]" />
                <h3 className="text-sm font-bold text-[#12122B]">
                  {lang === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#5B5B7B] hover:text-[#0B2A9E] flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'ar' ? 'إعادة الضبط' : 'Reset'}</span>
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#12122B] mb-3">
                {lang === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level'}
              </p>
              <div className="flex flex-col gap-2.5">
                {(['small', 'medium', 'expert'] as ProblemDifficulty[]).map((d) => (
                  <label
                    key={d}
                    className="flex items-center justify-between p-2 bg-[#F8F1E1] border border-[#12122B] rounded cursor-pointer hover:bg-[#EFE4CC] transition-colors"
                  >
                    <DifficultyMeter difficulty={d} />
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(d)}
                      onChange={() => toggleDifficulty(d)}
                      className="accent-[#0B2A9E]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#12122B] mb-2">
                {lang === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableSkills.map((skill) => (
                  <TagChip
                    key={skill}
                    tag={skill}
                    size="sm"
                    selected={selectedSkill === skill}
                    onClick={() =>
                      setSelectedSkill(selectedSkill === skill ? null : skill)
                    }
                  />
                ))}
              </div>
              {skillsLoading && <p className="mt-2 text-[11px] text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل المهارات…' : 'Loading skills…'}</p>}
              {skillsError && <div className="mt-2 flex items-center gap-2 text-[11px] text-[#E5432A]"><span>{lang === 'ar' ? 'تعذر تحميل قائمة المهارات.' : 'Could not load the skills list.'}</span><button type="button" onClick={() => void retrySkills()} className="font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}
            </div>

            <div>
              <p className="text-xs font-bold text-[#12122B] mb-2">{lang === 'ar' ? 'الفئة' : 'Category'}</p>
              <div className="flex flex-col gap-2 text-xs">{(['BUG', 'ISSUE', 'CHALLENGE'] as const).map((category) => <label key={category} className="flex items-center justify-between p-2 bg-[#F8F1E1] border border-[#12122B] rounded cursor-pointer"><span>{category}</span><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])} className="accent-[#0B2A9E]" /></label>)}</div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#12122B] mb-2">
                <span>{lang === 'ar' ? 'الحد الأقصى للميزانية' : 'Maximum Budget'}</span>
                <span className="font-tag text-[#0B2A9E]">
                  {maxReward.toLocaleString()} {lang === 'ar' ? 'د.ج' : 'DZD'}
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={200000}
                step={10000}
                value={maxReward}
                onChange={(e) => setMaxReward(Number(e.target.value))}
                className="w-full accent-[#0B2A9E] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-[#5B5B7B] mt-1 font-tag">
                <span>20,000 د.ج</span>
                <span>200,000 د.ج</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
