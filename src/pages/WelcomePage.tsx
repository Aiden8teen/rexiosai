import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { Check, Lock, Award, ArrowRight, ArrowLeft } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const { lang, dir } = useApp();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl card-pixel p-8 sm:p-10 flex flex-col items-center text-center">
        <div className="p-4 bg-[#EEF1FF] border-2 border-[#12122B] rounded-lg shadow-pixel-s mb-6">
          <MascotRex width={80} height={60} />
        </div>

        <h1 className="text-3xl font-bold text-[#12122B] mb-2">
          {lang === 'ar' ? 'تم إنشاء حسابك!' : 'Account created!'}
        </h1>
        <p className="text-sm text-[#5B5B7B] max-w-lg mb-8 leading-relaxed">
          {lang === 'ar'
            ? 'أنت الآن عضو رسمي في مجتمع Rexios AI. يمكنك طرح الأسئلة، كتابة الإجابات، ومناقشة المشكلات الصناعية مع زملائك.'
            : 'You are now an official member of the Rexios AI community. You can ask questions, write answers, and discuss industrial engineering challenges.'}
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-start">
          <div className="p-5 bg-[#F0FFC4] border-2 border-[#12122B] rounded-md shadow-pixel-s flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-tag text-[11px] font-bold text-[#12122B] uppercase">
                  {lang === 'ar' ? 'حسابك الحالي' : 'Current tier'}
                </span>
                <span className="w-2.5 h-2.5 bg-[#1E9E5A] rounded-full" />
              </div>
              <h3 className="text-base font-bold text-[#12122B] mb-3">
                {lang === 'ar' ? 'عضو في المجتمع' : 'Community Member'}
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs text-[#12122B]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'طرح الأسئلة والإجابة' : 'Ask questions and answer'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'التعليق على المشكلات' : 'Comment on problems'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-[#FFFBF1] border-2 border-[#0B2A9E] rounded-md shadow-pixel-s flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-tag text-[11px] font-bold text-[#0B2A9E] uppercase">
                  {lang === 'ar' ? 'المستوى القادم' : 'Next tier'}
                </span>
                <Award className="w-4 h-4 text-[#0B2A9E]" />
              </div>
              <h3 className="text-base font-bold text-[#12122B] mb-3">
                {lang === 'ar' ? 'حلّال معتمد (ملف كامل)' : 'Verified Solver'}
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs text-[#5B5B7B]">
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0B2A9E]" />
                  <span>{lang === 'ar' ? 'تقديم حلول للمشكلات المدفوعة' : 'Submit solutions to paid problems'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0B2A9E]" />
                  <span>{lang === 'ar' ? 'مؤشر تطابق المهارات الآلي' : 'Automated skill-match score'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/profile/solver"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold text-xs btn-pixel-accent"
          >
            <span>{lang === 'ar' ? 'أكمل ملف الحلّال الآن' : 'Complete solver profile now'}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>

          <Link
            to="/problems"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-md font-bold text-xs btn-pixel-secondary"
          >
            {lang === 'ar' ? 'تصفّح المشكلات' : 'Browse problems'}
          </Link>

          <Link
            to="/community"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-md font-bold text-xs btn-pixel-primary"
          >
            {lang === 'ar' ? 'استكشف المجتمع' : 'Explore community'}
          </Link>
        </div>
      </div>
    </div>
  );
};
