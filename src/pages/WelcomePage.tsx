import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, FileText, Lock, UserRound } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const { lang, dir, currentRole, currentUser, authLoading } = useApp();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const isCompany = currentRole === 'company';
  const isCompleteTalent = currentRole === 'solver' || currentUser.solverProfile?.completenessPercent === 100;
  const accountName = lang === 'ar' ? currentUser.name : (currentUser.name_en || currentUser.name);

  if (authLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#5B5B7B]">{lang === 'ar' ? 'جارٍ تحميل حسابك…' : 'Loading your account…'}</div>;
  }

  const heading = lang === 'ar' ? `مرحباً، ${accountName}` : `Welcome, ${accountName}`;
  const description = isCompany
    ? (lang === 'ar' ? 'يمكنك نشر التحديات الصناعية ومتابعة المقترحات من لوحة الشركة.' : 'Post industrial challenges and review proposals from your company dashboard.')
    : isCompleteTalent
      ? (lang === 'ar' ? 'ملفك مكتمل. استكشف التحديات وتابع طلباتك ومقترحاتك.' : 'Your profile is complete. Browse challenges and keep track of your applications.')
      : (lang === 'ar' ? 'أكمل ملف المواهب لتتمكن من تقديم مقترحات للتحديات الصناعية.' : 'Complete your talent profile to submit proposals to industrial challenges.');
  const accountTitle = isCompany
    ? (lang === 'ar' ? 'حساب شركة' : 'Company account')
    : isCompleteTalent
      ? (lang === 'ar' ? 'ملف المواهب مكتمل' : 'Talent profile complete')
      : (lang === 'ar' ? 'أكمل ملف المواهب' : 'Complete talent profile');

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl card-pixel p-8 sm:p-10 flex flex-col items-center text-center">
        <div className="p-4 bg-[#EEF1FF] border-2 border-[#12122B] rounded-lg shadow-pixel-s mb-6">
          <MascotRex width={80} height={60} />
        </div>

        <h1 className="text-3xl font-bold text-[#12122B] mb-2">{heading}</h1>
        <p className="text-sm text-[#5B5B7B] max-w-lg mb-8 leading-relaxed">{description}</p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-start">
          <div className="p-5 bg-[#F0FFC4] border-2 border-[#12122B] rounded-md shadow-pixel-s flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-tag text-[11px] font-bold text-[#12122B] uppercase">{lang === 'ar' ? 'حالة الحساب' : 'Account status'}</span>
                {isCompany ? <BriefcaseBusiness className="w-4 h-4 text-[#12122B]" /> : isCompleteTalent ? <Check className="w-4 h-4 text-[#1E9E5A]" /> : <UserRound className="w-4 h-4 text-[#12122B]" />}
              </div>
              <h2 className="text-base font-bold text-[#12122B] mb-3">{accountTitle}</h2>
              <p className="text-xs text-[#5B5B7B] leading-relaxed">
                {isCompany
                  ? (lang === 'ar' ? 'أدر التحديات المنشورة واستقبل طلبات المواهب.' : 'Manage posted challenges and receive applications from talent.')
                  : isCompleteTalent
                    ? (lang === 'ar' ? 'يمكنك تقديم مقترحات ومتابعة قرارات الشركات.' : 'You can submit proposals and track company decisions.')
                    : (lang === 'ar' ? 'أضف خلفيتك ومهاراتك ورابطاً مهنياً أو سيرة ذاتية.' : 'Add your background, skills and a professional link or CV.')}
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#FFFBF1] border-2 border-[#0B2A9E] rounded-md shadow-pixel-s flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-tag text-[11px] font-bold text-[#0B2A9E] uppercase">{lang === 'ar' ? 'خطوتك التالية' : 'Next steps'}</span>
                {isCompany ? <BriefcaseBusiness className="w-4 h-4 text-[#0B2A9E]" /> : <FileText className="w-4 h-4 text-[#0B2A9E]" />}
              </div>
              <h2 className="text-base font-bold text-[#12122B] mb-3">
                {isCompany ? (lang === 'ar' ? 'إدارة التحديات' : 'Manage challenges') : isCompleteTalent ? (lang === 'ar' ? 'استكشف الفرص' : 'Explore opportunities') : (lang === 'ar' ? 'إكمال الملف' : 'Finish your profile')}
              </h2>
              <ul className="flex flex-col gap-2.5 text-xs text-[#5B5B7B]">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#1E9E5A]" /><span>{isCompany ? (lang === 'ar' ? 'نشر تحدٍ جديد أو تعديل تحدياتك' : 'Post a challenge or edit existing ones') : isCompleteTalent ? (lang === 'ar' ? 'تصفح التحديات وقدم المقترحات' : 'Browse challenges and submit proposals') : (lang === 'ar' ? 'حدد مهارة واحدة على الأقل' : 'Choose at least one skill')}</span></li>
                <li className="flex items-center gap-2">{isCompleteTalent || isCompany ? <Check className="w-4 h-4 text-[#1E9E5A]" /> : <Lock className="w-4 h-4 text-[#0B2A9E]" />}<span>{isCompany ? (lang === 'ar' ? 'راجع المقترحات الواردة' : 'Review incoming applications') : isCompleteTalent ? (lang === 'ar' ? 'تابع طلباتك وقرارات الشركات' : 'Track your applications and decisions') : (lang === 'ar' ? 'أضف سيرة ذاتية أو رابطاً مهنياً' : 'Add a CV or professional link')}</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          {isCompany ? (
            <>
              <Link to="/company/problems/new" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold text-xs btn-pixel-accent"><span>{lang === 'ar' ? 'انشر تحدياً' : 'Post a challenge'}</span><ArrowIcon className="w-4 h-4" /></Link>
              <Link to="/company/problems" className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'إدارة تحدياتي' : 'Manage my challenges'}</Link>
            </>
          ) : (
            <>
              {!isCompleteTalent && <Link to="/profile/solver" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold text-xs btn-pixel-accent"><span>{lang === 'ar' ? 'أكمل ملف المواهب' : 'Complete talent profile'}</span><ArrowIcon className="w-4 h-4" /></Link>}
              <Link to="/problems" className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-md font-bold text-xs btn-pixel-secondary">{lang === 'ar' ? 'تصفّح التحديات' : 'Browse challenges'}</Link>
              {isCompleteTalent && <Link to="/my-applications" className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-md font-bold text-xs btn-pixel-primary">{lang === 'ar' ? 'طلباتي' : 'My applications'}</Link>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
