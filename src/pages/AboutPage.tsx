import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MascotRex } from '../components/MascotRex';
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
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const stats = [
    {
      num: '+45',
      label: { ar: 'مؤسسة ومصنع شريك', en: 'Partner Enterprises' },
      detail: { ar: 'في مختلف المناطق الصناعية', en: 'Across Algerian industrial zones' },
    },
    {
      num: '+1,200',
      label: { ar: 'مهندس وخبير حلول', en: 'Engineers & Solvers' },
      detail: { ar: 'من كبرى الجامعات والمدارس', en: 'Top graduates & practitioners' },
    },
    {
      num: '3.8M+',
      label: { ar: 'د.ج مكافآت مرصودة', en: 'DZD Bounties Pool' },
      detail: { ar: 'تمويل مباشر للحلول الفائزة', en: 'Direct funding for selected solutions' },
    },
    {
      num: '85+',
      label: { ar: 'تحدياً هندسياً تم حله', en: 'Challenges Resolved' },
      detail: { ar: 'في الأتمتة، الـ IoT، والبرمجيات', en: 'In automation, IoT & industrial AI' },
    },
  ];

  const pillars = [
    {
      icon: Factory,
      color: '#0B2A9E',
      bg: '#EEF1FF',
      title: { ar: 'توطين الحلول الصناعية', en: 'Localizing Industrial Innovation' },
      description: {
        ar: 'مساعدة المصانع والوحدات الإنتاجية على استبدال التراخيص الأجنبية المكلفة بحلول هندسية وطنية مصممة ومبرمجة بأيدي كفاءات جزائرية.',
        en: 'Enabling manufacturing facilities to overcome expensive proprietary imports with locally engineered, maintained hardware & software.',
      },
    },
    {
      icon: Cpu,
      color: '#1E9E5A',
      bg: '#D9F5E5',
      title: { ar: 'الخبرة العملية المثبتة', en: 'Proof-of-Work Expertise' },
      description: {
        ar: 'تجاوز السير الذاتية التقليدية؛ نمنح المهندسين والطلاب مساحة لإثبات براعتهم عبر حل مشكلات واقعية وبناء سجل إنجازات هندسي موثق.',
        en: 'Moving beyond theoretical resumes; engineers demonstrate real capabilities by solving operational problems and establishing verified track records.',
      },
    },
    {
      icon: ShieldCheck,
      color: '#E5432A',
      bg: '#FFE3DC',
      title: { ar: 'حماية الملكية والسرية', en: 'IP Protection & Governance' },
      description: {
        ar: 'بيئة عمل آمنة تضمن سرية البيانات التشغيلية للمصانع، وتحمي حقوق الملكية الفكرية للحلول الهندسية التي يقدمها الخبراء وفق عقود واضحة.',
        en: 'Secure environment protecting proprietary plant data and strictly honoring intellectual property rights of solvers under transparent frameworks.',
      },
    },
    {
      icon: Users,
      color: '#FFC53D',
      bg: '#FFF1CC',
      title: { ar: 'مجتمع تقني مفتوح', en: 'Open Engineering Community' },
      description: {
        ar: 'منتدى تخصصي متقدم يطرح فيه المطورون والمهندسون تساؤلاتهم حول الأنظمة المدمجة، والـ IoT، والذكاء الاصطناعي مع إجابات موثقة وتفاعل ثري.',
        en: 'A focused peer community where technical practitioners discuss embedded firmware, industrial IoT, AI inference, and hardware debugging.',
      },
    },
  ];

  const steps = [
    {
      step: '01',
      title: { ar: 'طرح التحدي الهندسي', en: 'Challenge Publishing' },
      desc: {
        ar: 'تقوم المؤسسة الصناعية بنشر التحدي مع تفاصيل المحددات الفنية، المخرجات المطلوبة، وقيمة المكافأة المرصودة بالدينار الجزائري.',
        en: 'The industrial enterprise defines its operational challenge, required technical deliverables, constraints, and reward in DZD.',
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
        ar: 'يقدم خبراء الحلول المعتمدون مخططات التوصيل، الأكواد البرمجية، روابط النماذج التجريبية، والجدول الزمني التقديري للتنفيذ.',
        en: 'Verified solvers submit schematics, firmware code, Proof-of-Concept prototypes, and estimated implementation timelines.',
      },
    },
    {
      step: '04',
      title: { ar: 'التحكيم وصرف المكافأة', en: 'Evaluation & Payout' },
      desc: {
        ar: 'تراجع اللجنة الفنية للمصنع الحلول المقترحة وفق معايير الدقة والجدوى، ويحصل المقترح الفائز على المكافأة مع اعتماد التطبيق الفعلي.',
        en: 'The enterprise evaluates submissions based on performance and feasibility; the winning solver receives the reward and implementation partnership.',
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
                ? 'Rexios AI هي منصة وطنية متخصصة تهدف إلى ربط نخبة المهندسين والباحثين والمطورين في الجزائر بالمؤسسات والمصانع الإنتاجية، لحل التحديات الهندسية المعقدة بمكافآت مالية تحفيزية وتبادل المعرفة في بيئة تقنية رصينة.'
                : 'Rexios AI is Algeria’s open innovation platform connecting engineering professionals, students, and researchers with manufacturing facilities to solve real operational bottlenecks for financial rewards and peer recognition.'}
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
                {s.num}
              </span>
              <span className="font-bold text-xs sm:text-sm text-[#12122B]">
                {s.label[lang]}
              </span>
              <span className="text-[11px] text-[#5B5B7B]">
                {s.detail[lang]}
              </span>
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
                  : 'At the same time, top Algerian universities and polytechnic institutes graduate brilliant talents in embedded engineering, robotics, and machine learning who lack direct pathways to monetize their skills on domestic challenges.'}
              </p>
              <p className="font-semibold text-[#12122B]">
                {lang === 'ar'
                  ? 'Rexios AI تضع حداً لهذه المفارقة: تحويل مشاكل المصانع إلى تحديات تنافسية ذات مكافآت بالدينار الجزائري، وتحويل المهندسين إلى خبراء حلول معتمدين.'
                  : 'Rexios AI closes this loop: turning operational industrial pain points into incentivized engineering challenges with DZD bounties, transforming talent into verified solvers.'}
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
                <span>{lang === 'ar' ? 'خطوة معتمدة' : 'Verified step'}</span>
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
              {lang === 'ar' ? 'من هو "خبير الحلول" (Solver) وكيف أصبح معتمداً؟' : 'Who is a "Solver" and how do I become verified?'}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'خبير الحلول هو مهندس أو تقني أو طالب دراسات عليا أكمل ملف كفاءته (المستوى التعليمي، التخصص، والمهارات التقنية والسيرة الذاتية). يمنحه هذا الاعتماد حق تقديم مقترحات الحلول الفنية للتحديات الصناعية والمنافسة على المكافآت المالية.'
                : 'A Solver is a verified technical contributor who completed their qualification profile (education, institution, key skills, and CV). Solvers unlock the ability to submit technical solution proposals and win cash bounties.'}
            </p>
          </div>

          <div className="card-pixel bg-[#FFFBF1] p-5 sm:p-6">
            <h4 className="font-bold text-base text-[#12122B] mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0B2A9E]" />
              {lang === 'ar' ? 'كيف تُضمن حقوق الملكية الفكرية؟' : 'How is intellectual property protected?'}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B5B7B] leading-relaxed">
              {lang === 'ar'
                ? 'تخضع جميع المقترحات المقدمة لاتفاقية سرية وحماية متبادلة؛ تظل حقوق المقترحات غير الفائزة ملكاً لأصحابها، بينما تنتقل حقوق الحل المعتمد والفائز للمؤسسة الصناعية بموجب صرف المكافأة التعاقدية.'
                : 'All submissions are governed by mutual IP and confidentiality terms. Solvers retain rights to unselected proposals, while winning solutions are formally transferred to the partner enterprise upon reward disbursement.'}
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
                ? 'أنشئ حسابك اليوم، فعّل ملف خبير الحلول، وابدأ في حل مشكلات حقيقية وتطوير مسيرتك المهنية.'
                : 'Create your account today, verify your solver profile, and start engineering real-world solutions for real rewards.'}
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
