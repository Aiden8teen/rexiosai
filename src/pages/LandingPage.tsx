import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { TagChip } from '../components/TagChip';
import { Eye, UserCheck, Award, Check, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { lang, dir } = useApp();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col gap-16 md:gap-24 py-10">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF1FF] border-2 border-[#12122B] rounded-full text-xs font-tag tracking-wider text-[#0B2A9E] font-bold shadow-pixel-s">
              <span className="w-2 h-2 bg-[#0B2A9E] rounded-full animate-pulse" />
              COMMUNITY · BETA
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-[#12122B]">
              {lang === 'ar' ? (
                <>
                  حيث تلتقي المهارات التقنية <br />
                  <span className="text-[#0B2A9E] bg-[#C6FF3D] px-2 py-0.5 border-2 border-[#12122B] shadow-pixel-s inline-block mt-2">
                    بالمشكلات الحقيقية
                  </span>
                </>
              ) : (
                <>
                  Where tech skills meet <br />
                  <span className="text-[#0B2A9E] bg-[#C6FF3D] px-2 py-0.5 border-2 border-[#12122B] shadow-pixel-s inline-block mt-2">
                    real problems
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-[#5B5B7B] leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'مجتمع جزائري يسأل فيه الطلاب والمطورون والتقنيون، ويتشاركون الحلول ويبنون خبرة عملية حقيقية على مشكلات واقعية من الشركات الصناعية.'
                : 'An Algerian community where students, developers and technologists ask questions, share solutions and build real experience on problems from industry.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm btn-pixel-accent"
              >
                <span>{lang === 'ar' ? 'ابدأ الآن' : 'Get started'}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm btn-pixel-secondary"
              >
                <span>{lang === 'ar' ? 'تصفّح كزائر' : 'Browse as a visitor'}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#5B5B7B] pt-1">
              <Eye className="w-4 h-4 text-[#0B2A9E] stroke-[2.2]" />
              <span>
                {lang === 'ar'
                  ? 'التصفح مجاني ومفتوح للجميع — الحساب مطلوب للمشاركة فقط'
                  : 'Browsing is free and open to everyone — an account is only needed to participate'}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg p-6 shadow-pixel-l">
              <div className="flex items-center justify-between border-b-2 border-[#12122B] pb-3 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E5432A] border border-[#12122B]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFC53D] border border-[#12122B]" />
                  <div className="w-3 h-3 rounded-full bg-[#1E9E5A] border border-[#12122B]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <TagChip tag="IOT" size="sm" />
                  <TagChip tag="AI/ML" size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-center p-6 bg-[#EEF1FF] border-2 border-[#12122B] rounded-md mb-6 shadow-pixel-s">
                <div className="transform hover:scale-110 transition-transform">
                  <MascotRex width={96} height={72} />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F8F1E1] border-2 border-[#12122B] rounded-md shadow-pixel-s mb-3">
                <div className="w-7 h-7 rounded-full bg-[#0B2A9E] text-[#FFFBF1] flex items-center justify-center text-xs font-bold shrink-0">
                  A
                </div>
                <div className="text-xs font-semibold text-[#12122B]">
                  {lang === 'ar'
                    ? 'كيف أقرأ حساس الحرارة بدقة داخل المصنع؟'
                    : 'How do I read a temperature sensor accurately?'}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F0FFC4] border-2 border-[#12122B] rounded-md shadow-pixel-s">
                <div className="w-7 h-7 rounded-full bg-[#8FCC00] text-[#12122B] flex items-center justify-center text-xs font-bold shrink-0">
                  Y
                </div>
                <div className="text-xs font-semibold text-[#12122B]">
                  {lang === 'ar'
                    ? 'جرّب مرشّح كالمان برمجياً مع عزل الكابل ✔'
                    : 'Try a Kalman filter with shielded cabling ✔'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" id="about">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12122B] mb-3">
            {lang === 'ar' ? 'كيف يعمل المجتمع؟' : 'How does the community work?'}
          </h2>
          <p className="text-sm sm:text-base text-[#5B5B7B]">
            {lang === 'ar'
              ? 'ثلاث خطوات بسيطة من القراءة إلى المساهمة'
              : 'Three simple steps from reading to contributing'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-pixel p-6 flex flex-col items-start gap-4 hover:translate-y-[-2px] transition-transform">
            <div className="w-12 h-12 rounded-lg bg-[#EEF1FF] border-2 border-[#12122B] shadow-pixel-s flex items-center justify-center text-[#0B2A9E]">
              <Eye className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-bold text-[#12122B]">
              {lang === 'ar' ? '1 · اقرأ بحرية' : '1 · Read freely'}
            </h3>
            <p className="text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'تصفّح الأسئلة والأجوبة دون حساب وتعلّم من المشكلات والتحديات الهندسية التي يواجهها الآخرون.'
                : 'Browse questions and answers without an account and learn from problems others face.'}
            </p>
          </div>

          <div className="card-pixel p-6 flex flex-col items-start gap-4 hover:translate-y-[-2px] transition-transform">
            <div className="w-12 h-12 rounded-lg bg-[#F0FFC4] border-2 border-[#12122B] shadow-pixel-s flex items-center justify-center text-[#12122B]">
              <UserCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-bold text-[#12122B]">
              {lang === 'ar' ? '2 · سجّل وشارك' : '2 · Sign up and participate'}
            </h3>
            <p className="text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'أنشئ حسابًا بالبريد الإلكتروني أو Google، ثم اطرح أسئلتك، أجب على زملائك، وناقش تفاصيل المشكلات.'
                : 'Create an account with email or Google, then ask questions and discuss problems.'}
            </p>
          </div>

          <div className="card-pixel p-6 flex flex-col items-start gap-4 hover:translate-y-[-2px] transition-transform">
            <div className="w-12 h-12 rounded-lg bg-[#C6FF3D] border-2 border-[#12122B] shadow-pixel-s flex items-center justify-center text-[#12122B]">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-bold text-[#12122B]">
              {lang === 'ar' ? '3 · كن حلّالًا' : '3 · Become a solver'}
            </h3>
            <p className="text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'أكمل ملف الحلّال (خلفيتك، مهاراتك، السيرة الذاتية) وقدّم حلولًا للمشكلات الصناعية المدفوعة لتحصل على المكافأة.'
                : 'Complete your solver profile (background, skills, CV) and submit solutions to paid problems to earn a reward.'}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12122B] mb-3">
            {lang === 'ar' ? 'ماذا يمكنك أن تفعل؟' : 'What can you do?'}
          </h2>
          <p className="text-sm sm:text-base text-[#5B5B7B]">
            {lang === 'ar'
              ? 'الزوّار يقرأون، الأعضاء يشاركون، والحلّالون يحلّون ويكسبون'
              : 'Visitors read, members participate, solvers solve and earn'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-pixel p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-tag text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#E4E4EE] border border-[#12122B] rounded-full">
                  VISITOR
                </span>
                <span className="text-xs font-semibold text-[#5B5B7B]">
                  {lang === 'ar' ? 'بدون حساب' : 'No account'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#12122B] mb-5">
                {lang === 'ar' ? 'زائر' : 'Visitor'}
              </h3>

              <ul className="flex flex-col gap-3.5 text-sm text-[#12122B]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'قراءة المنشورات والمشكلات' : 'Read posts and problems'}</span>
                </li>
                <li className="flex items-center gap-2.5 text-[#5B5B7B]">
                  <Lock className="w-4 h-4 text-[#A3A3BC]" />
                  <span>{lang === 'ar' ? 'طرح الأسئلة والتعليق' : 'Ask questions & comment'}</span>
                </li>
                <li className="flex items-center gap-2.5 text-[#5B5B7B]">
                  <Lock className="w-4 h-4 text-[#A3A3BC]" />
                  <span>{lang === 'ar' ? 'التفاعل (مفيد / فكرة)' : 'React (Helpful / Insight)'}</span>
                </li>
                <li className="flex items-center gap-2.5 text-[#5B5B7B]">
                  <Lock className="w-4 h-4 text-[#A3A3BC]" />
                  <span>{lang === 'ar' ? 'تقديم حلول للمشكلات المدفوعة' : 'Submit solutions to paid problems'}</span>
                </li>
              </ul>
            </div>

            <Link
              to="/community"
              className="mt-8 w-full py-2.5 px-4 text-center rounded-md font-bold text-xs btn-pixel-secondary"
            >
              {lang === 'ar' ? 'تصفّح الآن' : 'Browse now'}
            </Link>
          </div>

          <div className="card-pixel p-6 flex flex-col justify-between border-[#0B2A9E]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-tag text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#EEF1FF] border border-[#0B2A9E] text-[#0B2A9E] rounded-full">
                  MEMBER
                </span>
                <span className="text-xs font-semibold text-[#5B5B7B]">
                  {lang === 'ar' ? 'بريد فقط' : 'Email only'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#12122B] mb-5">
                {lang === 'ar' ? 'عضو' : 'Member'}
              </h3>

              <ul className="flex flex-col gap-3.5 text-sm text-[#12122B]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'قراءة المنشورات والمشكلات' : 'Read posts and problems'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'طرح الأسئلة والتعليق' : 'Ask questions & comment'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'التفاعل (مفيد / فكرة)' : 'React (Helpful / Insight)'}</span>
                </li>
                <li className="flex items-center gap-2.5 text-[#5B5B7B]">
                  <Lock className="w-4 h-4 text-[#A3A3BC]" />
                  <span>{lang === 'ar' ? 'تقديم حلول للمشكلات المدفوعة' : 'Submit solutions to paid problems'}</span>
                </li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="mt-8 w-full py-2.5 px-4 text-center rounded-md font-bold text-xs btn-pixel-primary"
            >
              {lang === 'ar' ? 'أنشئ حساب عضو' : 'Sign up as member'}
            </Link>
          </div>

          <div className="card-pixel p-6 flex flex-col justify-between bg-[#F0FFC4] border-[#12122B]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-tag text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#C6FF3D] border border-[#12122B] text-[#12122B] rounded-full">
                  SOLVER
                </span>
                <span className="text-xs font-semibold text-[#12122B] font-bold">
                  {lang === 'ar' ? 'ملف كامل' : 'Complete profile'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#12122B] mb-5">
                {lang === 'ar' ? 'حلّال معتمد' : 'Solver'}
              </h3>

              <ul className="flex flex-col gap-3.5 text-sm text-[#12122B]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'قراءة المنشورات والمشكلات' : 'Read posts and problems'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'طرح الأسئلة والتعليق' : 'Ask questions & comment'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'التفاعل (مفيد / فكرة)' : 'React (Helpful / Insight)'}</span>
                </li>
                <li className="flex items-center gap-2.5 font-bold">
                  <Check className="w-4 h-4 text-[#1E9E5A] stroke-[3]" />
                  <span>{lang === 'ar' ? 'تقديم حلول والحصول على مكافآت' : 'Submit solutions & earn rewards'}</span>
                </li>
              </ul>
            </div>

            <Link
              to="/profile/solver"
              className="mt-8 w-full py-2.5 px-4 text-center rounded-md font-bold text-xs btn-pixel-accent"
            >
              {lang === 'ar' ? 'أكمل ملف الحلّال' : 'Complete solver profile'}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-[#0B2A9E] border-2 border-[#12122B] rounded-lg p-8 sm:p-12 text-[#FFFBF1] shadow-pixel-l flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-xl text-center md:text-start">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFBF1]">
              {lang === 'ar' ? 'جاهز للانضمام إلى المجتمع؟' : 'Ready to join the community?'}
            </h2>
            <p className="text-sm sm:text-base text-[#C9D3FF]">
              {lang === 'ar'
                ? 'أنشئ حسابك في أقل من دقيقة وابدأ بالمشاركة وحل التحديات الهندسية الحقيقية.'
                : 'Create your account in under a minute and start participating.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-md font-bold text-sm btn-pixel-accent"
            >
              {lang === 'ar' ? 'أنشئ حسابًا مجانيًا' : 'Create a free account'}
            </Link>
            <Link
              to="/community"
              className="px-6 py-3 rounded-md font-bold text-sm bg-[#FFFBF1] text-[#12122B] border-2 border-[#12122B] shadow-pixel-s hover:bg-[#EFE4CC]"
            >
              {lang === 'ar' ? 'تصفّح كزائر' : 'Browse as a visitor'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
