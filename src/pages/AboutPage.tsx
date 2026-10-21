import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
import { usePublicStats } from '../hooks/usePublicStats';
import {
  Factory,
  Cpu,
  ShieldCheck,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { lang, dir } = useApp();
  const { data: publicStats, loading: statsLoading, error: statsError, retry: retryStats } = usePublicStats();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const formatCount = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'en-US');
  const formatBudget = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'en-US');
  const stats = [
    {
      num: formatCount(publicStats?.companiesWithPublishedProblems),
      label: { ar: 'شركات تنشر تحديات', en: 'Companies posting challenges' },
      detail: { ar: 'لديها تحدٍ منشور واحد على الأقل', en: 'With at least one published challenge' },
    },
    {
      num: formatCount(publicStats?.talentAccounts),
      label: { ar: 'حسابات المواهب', en: 'Talent accounts' },
      detail: { ar: 'حسابات مسجلة من نوع المواهب', en: 'Registered talent accounts' },
    },
    {
      num: formatBudget(publicStats?.openBudgetDzd),
      label: { ar: 'ميزانيات التحديات المفتوحة (د.ج)', en: 'Open challenge budgets (DZD)' },
      detail: { ar: 'ميزانيات مفتوحة بموعد نهائي قادم', en: 'Open budgets with a future deadline' },
    },
    {
      num: formatCount(publicStats?.problemsWithSelectedApplicant),
      label: { ar: 'متقدمون تم اختيارهم', en: 'Applicants selected' },
      detail: { ar: 'تحديات اختارت فيها الشركة متقدماً', en: 'Challenges with an applicant selected' },
    },
  ];

  const pillars = [
    {
      icon: Factory,
      color: '#0B2A9E',
      bg: '#EEF1FF',
      title: { ar: 'توطين الحلول الصناعية', en: 'Localizing Industrial Innovation' },
      description: {
        ar: 'مساعدة المصانع على استكشاف حلول هندسية محلية للتحديات التقنية التي تواجهها.',
        en: 'Helping industrial teams explore local engineering approaches to the technical challenges they face.',
      },
    },
    {
      icon: Cpu,
      color: '#1E9E5A',
      bg: '#D9F5E5',
      title: { ar: 'الملف والمهارات التقنية', en: 'Profile & Technical Skills' },
      description: {
        ar: 'توضح الملفات الشخصية خلفية المواهب ومهاراتها، وتتيح النقاشات والمقترحات وصف الخبرات ذات الصلة.',
        en: 'Profiles show education and skills, while challenge discussions and proposals let contributors describe relevant work.',
      },
    },
    {
      icon: ShieldCheck,
      color: '#E5432A',
      bg: '#FFE3DC',
      title: { ar: 'إدارة الوصول للبيانات الخاصة', en: 'Private Data Access' },
      description: {
        ar: 'تستطيع الشركات مشاركة ملاحظات وملفات خاصة لا تظهر إلا للشركة والمتقدم المختار. ناقش شروط السرية والملكية الفكرية مباشرة قبل مشاركة بيانات حساسة.',
        en: 'Companies can share private notes and files visible to the company and selected applicant. Agree on confidentiality and intellectual property terms before sharing sensitive work.',
      },
    },
    {
      icon: Users,
      color: '#FFC53D',
      bg: '#FFF1CC',
      title: { ar: 'مجتمع تقني مفتوح', en: 'Open Engineering Community' },
      description: {
        ar: 'مساحة نقاش يطرح فيها المطورون والمهندسون أسئلتهم حول الأنظمة المدمجة وإنترنت الأشياء والذكاء الاصطناعي.',
        en: 'A focused peer community for discussion about embedded systems, industrial IoT, AI inference and hardware debugging.',
      },
    },
  ];

  const steps = [
    {
      step: '01',
      title: { ar: 'طرح التحدي الهندسي', en: 'Challenge Publishing' },
      desc: {
        ar: 'تنشر الشركة التحدي مع القيود الفنية والمخرجات المطلوبة والميزانية بالدينار الجزائري.',
        en: 'The company publishes its challenge, technical requirements, deliverables and listed budget in DZD.',
      },
    },
    {
      step: '02',
      title: { ar: 'الاستيضاح والنقاش الفني', en: 'Peer Discussion & Q&A' },
      desc: {
        ar: 'يتفاعل المهندسون وخبراء الحلول في صندوق النقاش التقني لطرح الأسئلة المباشرة على مهندسي المصنع واستجلاء التفاصيل.',
        en: 'Engineers engage directly in the technical discussion thread to clarify operational specs and machine parameters.',
      },
    },
    {
      step: '03',
      title: { ar: 'تقديم مقترح الحل (PoC)', en: 'Technical Proposal Submission' },
      desc: {
        ar: 'يستطيع أصحاب الحسابات المكتملة تقديم المقترحات والملفات والجدول الزمني التقديري للتنفيذ.',
        en: 'Talent accounts with a complete profile can submit proposals, files and an estimated delivery timeline.',
      },
    },
    {
      step: '04',
      title: { ar: 'مراجعة المقترحات والاختيار', en: 'Review & Selection' },
      desc: {
        ar: 'تراجع الشركة المقترحات وتختار متقدماً. يتم الاتفاق على التنفيذ وأي ترتيبات مالية خارج المنصة.',
        en: 'The company reviews proposals and selects an applicant. Any delivery and payment arrangements are made outside the platform.',
      },
    },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 py-10">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="card-pixel bg-[#FFFBF1] p-8 sm:p-12 md:p-16 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#C6FF3D] border-2 border-[#12122B] rounded-full text-xs font-tag tracking-wider font-bold shadow-pixel-s text-[#12122B]">
              <Sparkles className="w-4 h-4 text-[#0B2A9E]" />
              {lang === 'ar' ? 'مبادرة الابتكار الصناعي المفتوح' : 'OPEN INDUSTRIAL INNOVATION'}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-[#12122B]">
              {lang === 'ar' ? (
                <>
                  نبني الجسر الذكي بين <br />
                  <span className="text-[#0B2A9E] bg-[#C6FF3D] px-2 py-0.5 border-2 border-[#12122B] shadow-pixel-s inline-block mt-2">
                    الكفاءات الهندسية والصناعة
                  </span>
                </>
              ) : (
                <>
                  Building the Smart Bridge Between <br />
                  <span className="text-[#0B2A9E] bg-[#C6FF3D] px-2 py-0.5 border-2 border-[#12122B] shadow-pixel-s inline-block mt-2">
                    Engineering Talent & Industry
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'Rexios AI منصة تربط المواهب التقنية في الجزائر بالمؤسسات والمصانع عبر تحديات هندسية منشورة وبيئة لتبادل المعرفة.'
                : 'Rexios AI connects technical talent in Algeria with companies through published engineering challenges and a space to share knowledge.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/problems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm btn-pixel-accent"
              >
                <span>{lang === 'ar' ? 'استكشف التحديات الصناعية' : 'Explore Industrial Challenges'}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm btn-pixel-secondary"
              >
                <span>{lang === 'ar' ? 'انضم إلى المجتمع التقني' : 'Join Engineering Community'}</span>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex absolute -end-6 -bottom-6 w-72 h-72 opacity-20 pointer-events-none items-center justify-center">
            <MascotRex width={260} height={195} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="card-pixel bg-[#FFFBF1] p-5 sm:p-6 text-center flex flex-col items-center justify-center gap-1.5"
            >
              <span className="font-brand text-3xl sm:text-4xl font-bold text-[#0B2A9E]">
                {statsLoading ? '—' : s.num}
              </span>
              <span className="font-bold text-xs sm:text-sm text-[#12122B]">
                {s.label[lang]}
              </span>
              <span className="text-[11px] text-[#5B5B7B]">
                {s.detail[lang]}
              </span>
              {statsError && idx === 0 && <button type="button" onClick={() => void retryStats()} className="mt-1 text-[10px] font-bold text-[#0B2A9E] underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="card-pixel bg-[#EEF1FF] p-8 w-full max-w-md text-center flex flex-col items-center gap-6 border-3">
              <div className="p-4 bg-[#FFFBF1] border-2 border-[#12122B] rounded-xl shadow-pixel-m">
                <MascotRex width={72} height={54} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-brand text-2xl font-bold text-[#0B2A9E]">
                  REXIOS AI
                </span>
                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#FFFBF1] border border-[#12122B] rounded-full text-xs font-bold text-[#12122B]">
                  <GraduationCap className="w-4 h-4 text-[#0B2A9E]" />
                  {lang === 'ar' ? 'مبادرة مشروع تخرج Thirduni' : 'Thirduni Graduation Venture'}
                </span>
              </div>
              <p className="text-xs text-[#5B5B7B] leading-relaxed">
                {lang === 'ar'
                  ? 'مشروع ريادي انطلق من شغف هندسي حقيقي بردم الهوة بين قاعات المحاضرات بالجامعات الجزائرية وبين الورشات وخطوط الإنتاج في مصانعنا الوطنية.'
                  : 'Founded as an entrepreneurial graduation initiative to bridge the gap between Algerian academic labs and active industrial shop-floors.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            <span className="px-3 py-1 bg-[#FFFBF1] border-2 border-[#12122B] rounded-md text-xs font-tag font-bold text-[#12122B] shadow-pixel-s">
              {lang === 'ar' ? 'الرسالة والرؤية' : 'OUR MISSION & VISION'}
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#12122B] leading-snug">
              {lang === 'ar'
                ? 'لماذا أنشأنا Rexios AI؟ ولأي هدف نسعى؟'
                : 'Why Rexios AI? The Purpose Driving Us Forward'}
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-[#5B5B7B] leading-relaxed">
              <p>
                {lang === 'ar'
                  ? 'تعاني المنشآت الصناعية في بلادنا من تحديات تشغيلية متكررة، مثل أعطال الحساسات، صعوبة مراقبة درجات الحرارة والاهتزاز، والاعتماد على برمجيات استيرادية باهظة التكاليف وصعبة التحديث.'
                  : 'Manufacturing plants in Algeria often confront nagging technical hurdles — sensor noise, thermal fluctuations, and motor wear — while depending on expensive, rigid foreign systems with slow support.'}
              </p>
              <p>
                {lang === 'ar'
                  ? 'في المقابل، تمتلك الجامعات والمدارس العليا الجزائرية (مثل جامعة باب الزوار USTHB، المدرسة الوطنية متعددة التقنيات ENP وغيرها) كفاءات شابة متميزة في مجالات الأنظمة المدمجة، وإنترنت الأشياء (IoT)، والذكاء الاصطناعي ومعالجة الإشارات، ولكنهم يفتقرون لمنصة مباشرة تمكنهم من تطبيق علمهم وتحقيق دخل مجزٍ.'
                  : 'At the same time, Algerian universities and polytechnic institutes graduate talent in embedded engineering, robotics and machine learning that can benefit from more direct engagement with domestic challenges.'}
              </p>
              <p className="font-semibold text-[#12122B]">
                {lang === 'ar'
                  ? 'تساعد Rexios AI الشركات على نشر مشكلاتها بميزانيات ومتطلبات واضحة، وتمنح المواهب مساحة لعرض مهاراتها ومقترحاتها.'
                  : 'Rexios AI helps companies post challenges with clear budgets and requirements, giving talent a place to share skills and proposals.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 bg-[#C6FF3D] border-2 border-[#12122B] rounded-full text-xs font-tag font-bold text-[#12122B] shadow-pixel-s">
            {lang === 'ar' ? 'القيم والركائز' : 'FOUNDATIONAL PILLARS'}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#12122B]">
            {lang === 'ar' ? 'المبادئ الأربعة التي تقود منصتنا' : 'The Four Pillars Powering Our Ecosystem'}
          </h2>
          <p className="text-sm text-[#5B5B7B]">
            {lang === 'ar'
              ? 'صُممت بيئة Rexios AI لخدمة المنظومة الهندسية بكل نزاهة واحترافية.'
              : 'Built to empower technical problem-solving with integrity, speed, and precision.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="card-pixel bg-[#FFFBF1] p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 hover:translate-y-[-2px] transition-transform"
              >
                <div
                  className="p-3.5 border-2 border-[#12122B] rounded-lg shadow-pixel-s shrink-0"
                  style={{ backgroundColor: pillar.bg }}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" style={{ color: pillar.color }} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-lg text-[#12122B]">
                    {pillar.title[lang]}
                  </h3>
                  <p className="text-sm text-[#5B5B7B] leading-relaxed">
                    {pillar.description[lang]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 bg-[#FFC53D] border-2 border-[#12122B] rounded-full text-xs font-tag font-bold text-[#12122B] shadow-pixel-s">
            {lang === 'ar' ? 'مسار العمل' : 'HOW IT WORKS'}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#12122B]">
            {lang === 'ar'
              ? 'كيف تتحول المشكلة الصناعية إلى حل منجز؟'
              : 'From Industrial Problem to Production Solution'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => (
            <div
              key={st.step}
              className="card-pixel bg-[#FFFBF1] p-6 flex flex-col justify-between gap-6 relative"
            >
              <div className="flex flex-col gap-3">
                <span className="font-brand text-3xl font-bold text-[#0B2A9E]">
                  {st.step}
                </span>
                <h4 className="font-bold text-base text-[#12122B]">
                  {st.title[lang]}
                </h4>
                <p className="text-xs text-[#5B5B7B] leading-relaxed">
                  {st.desc[lang]}
                </p>
              </div>
              <div className="w-full pt-3 border-t border-[#E4E4EE] flex items-center justify-between text-xs font-bold text-[#0B2A9E]">
                <span>{lang === 'ar' ? 'خطوة في المنصة' : 'Platform step'}</span>
                <CheckCircle2 className="w-4 h-4 text-[#1E9E5A]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="px-3 py-1 bg-[#EEF1FF] border-2 border-[#12122B] rounded-full text-xs font-tag font-bold text-[#0B2A9E] shadow-pixel-s">
            {lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12122B]">
            {lang === 'ar' ? 'أسئلة تتكرر حول المنصة' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="card-pixel bg-[#FFFBF1] p-5 sm:p-6">
            <h4 className="font-bold text-base text-[#12122B] mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0B2A9E]" />
              {lang === 'ar' ? 'هل التصفح والمشاركة في المجتمع مجانية؟' : 'Is browsing and joining the community free?'}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'نعم، التصفح والاطلاع على الأسئلة والتحديات مفتوح للجميع بدون أي رسوم. كما يمكن لأي عضو مسجل طرح الأسئلة والتفاعل مجاناً.'
                : 'Yes! Browsing questions and industrial challenges is completely free and public. Registered members can ask technical questions and participate without fees.'}
            </p>
          </div>

          <div className="card-pixel bg-[#FFFBF1] p-5 sm:p-6">
            <h4 className="font-bold text-base text-[#12122B] mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0B2A9E]" />
              {lang === 'ar' ? 'من هو "خبير الحلول" (Solver)؟' : 'Who is a "Solver"?'}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'خبير الحلول هو حساب مواهب أكمل ملفه الشخصي، بما يشمل الخلفية والمهارات ودليل الخبرة. يتيح الملف المكتمل تقديم مقترحات للتحديات.'
                : 'A Solver is a talent account with a complete profile covering background, skills and profile evidence. A complete profile can submit proposals to challenges.'}
            </p>
          </div>

          <div className="card-pixel bg-[#FFFBF1] p-5 sm:p-6">
            <h4 className="font-bold text-base text-[#12122B] mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0B2A9E]" />
              {lang === 'ar' ? 'ماذا عن الملكية الفكرية؟' : 'What about intellectual property?'}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'تعرض المنصة متطلبات التحدي وملفاته. اتفق مع الشركة على شروط السرية والملكية الفكرية قبل مشاركة أعمال حساسة أو بدء التنفيذ.'
                : 'The platform displays challenge requirements and files. Agree with the company on confidentiality and intellectual property terms before sharing sensitive work or starting delivery.'}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="card-pixel bg-[#0B2A9E] text-[#FFFBF1] p-8 sm:p-12 md:p-14 text-center flex flex-col items-center gap-6">
          <div className="p-2 bg-[#FFFBF1] border-2 border-[#12122B] rounded-lg shadow-pixel-s inline-block">
            <MascotRex width={48} height={36} />
          </div>

          <div className="max-w-2xl flex flex-col gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#FFFBF1]">
              {lang === 'ar'
                ? 'جاهز للمساهمة في بناء حلول الصناعة الوطنية؟'
                : 'Ready to Solve Real Industrial Challenges?'}
            </h2>
            <p className="text-sm sm:text-base text-[#C9D3FF] leading-relaxed">
              {lang === 'ar'
                ? 'أنشئ حساباً، أكمل ملفك عند الحاجة، واستكشف التحديات والنقاشات التقنية.'
                : 'Create an account, complete your profile when needed, and explore challenges and technical discussions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-md font-bold text-sm btn-pixel-accent text-[#12122B]"
            >
              {lang === 'ar' ? 'انضم إلى Rexios AI مجاناً' : 'Join Rexios AI for Free'}
            </Link>
            <Link
              to="/problems"
              className="px-6 py-3 rounded-md font-bold text-sm bg-[#FFFBF1] text-[#12122B] border-2 border-[#12122B] shadow-pixel-s hover:bg-[#EFE4CC] transition-colors"
            >
              {lang === 'ar' ? 'تصفح التحديات المتاحة' : 'Browse Available Challenges'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
