import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DifficultyMeter } from '../components/DifficultyMeter';
import { TagChip } from '../components/TagChip';
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
  const { lang, currentRole, currentUser, problems } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<ProblemDifficulty[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [maxReward, setMaxReward] = useState<number>(200000);
  const [sortTab, setSortTab] = useState<'latest' | 'highest_reward' | 'ending_soon'>('latest');

  const filterSkills = ['IOT', 'EMBEDDED', 'PYTHON', 'AI/ML', 'SQL', 'BACKEND', 'REACT'];

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
    setMaxReward(200000);
    setSortTab('latest');
  };

  const filteredProblems = problems
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyName_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary_en.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDifficulty =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(p.difficulty);

      const matchSkill = selectedSkill ? p.tags.includes(selectedSkill) : true;
      const matchReward = p.rewardAmount <= maxReward;

      return matchSearch && matchDifficulty && matchSkill && matchReward;
    })
    .sort((a, b) => {
      if (sortTab === 'highest_reward') {
        return b.rewardAmount - a.rewardAmount;
      }
      if (sortTab === 'ending_soon') {
        return a.deadlineDays - b.deadlineDays;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#12122B] tracking-tight">
            {lang === 'ar' ? 'المشكلات الصناعية' : 'Industrial Problems'}
          </h1>
          <p className="text-sm text-[#5B5B7B] mt-1">
            {lang === 'ar'
              ? 'مشكلات حقيقية من شركات ومصانع جزائرية — حلّها واحصل على المكافأة.'
              : 'Real-world challenges from Algerian companies — solve them and earn rewards.'}
          </p>
        </div>
      </div>

      {(currentRole === 'member' || (currentRole === 'solver' && !currentUser.solverProfile?.skills?.length)) && (
        <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg shadow-pixel-s flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F0FFC4] border border-[#12122B] rounded-full">
              <AlertCircle className="w-5 h-5 text-[#12122B]" />
            </div>
            <p className="text-xs text-[#12122B] font-semibold leading-relaxed">
              {lang === 'ar'
                ? 'يمكنك تصفّح المشكلات ومناقشتها الآن. لتقديم حلّ والحصول على المكافأة، أكمل ملف الحلّال.'
                : 'You can browse and discuss problems now. To submit solutions and claim rewards, complete your solver profile.'}
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
          <p className="font-tag text-2xl font-bold text-[#0B2A9E]">18</p>
          <p className="text-xs font-semibold text-[#5B5B7B] mt-1">
            {lang === 'ar' ? 'شركة صناعية شريكة' : 'Partner Companies'}
          </p>
        </div>
        <div className="card-pixel p-5 text-center bg-[#F0FFC4]">
          <p className="font-tag text-2xl font-bold text-[#12122B]">1,250,000 د.ج</p>
          <p className="text-xs font-bold text-[#12122B] mt-1">
            {lang === 'ar' ? 'إجمالي حوض المكافآت' : 'Total Reward Pool'}
          </p>
        </div>
        <div className="card-pixel p-5 text-center">
          <p className="font-tag text-2xl font-bold text-[#1E9E5A]">24</p>
          <p className="text-xs font-semibold text-[#5B5B7B] mt-1">
            {lang === 'ar' ? 'مشكلة مفتوحة للحل' : 'Active Challenges'}
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
              {lang === 'ar' ? 'الأعلى مكافأة' : 'Highest Reward'}
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

          <div className="flex flex-col gap-4">
            {filteredProblems.length === 0 ? (
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
                {filterSkills.map((skill) => (
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
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#12122B] mb-2">
                <span>{lang === 'ar' ? 'الحد الأقصى للمكافأة' : 'Maximum Reward'}</span>
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
