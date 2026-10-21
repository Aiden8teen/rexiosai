import type { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const proposals: Record<string,{ ar:string; en:string }> = {
  p1:{ar:'سأستخدم مجسًا حراريًا من النوع K ووحدة قياس معزولة، مع تسجيل القراءات محليًا وإظهارها في لوحة متابعة. سأختبر دقة القياس وزمن التنبيه وأرفق مخطط التوصيل ودليل التركيب.',en:'I will use a Type K thermocouple and an isolated measurement module, log readings locally and show them on a monitoring dashboard. I will test measurement accuracy and alert latency, then deliver a wiring diagram and installation guide.'},
  p2:{ar:'سأبني لوحة متابعة لخطّي التعبئة على شبكة المصنع المحلية، مع تسجيل التوقفات ومؤشرات الوردية في قاعدة بيانات. سأضيف تنبيهات واضحة وتصديرًا للتقارير وأختبر الواجهة مع المشرفين.',en:'I will build a dashboard for both packaging lines on the plant LAN, storing downtime and shift metrics in a local database. I will add clear alerts and report exports, then test the interface with supervisors.'},
  p3:{ar:'سأبدأ بتنظيف بيانات الاهتزاز واستخراج السمات الترددية، ثم أقارن نموذجًا مرجعيًا بنموذج تعلم آلي. سأفصل بيانات التدريب عن الاختبار وأعرض مقاييس الدقة والإنذارات الكاذبة قبل تجهيز واجهة الاستدلال.',en:'I will clean the vibration data and extract frequency features, then compare a baseline with a machine learning model. I will separate training and test data and report accuracy and false alarms before preparing the inference API.'},
};
export const draftProposal={ar:'مسودة: سأقترح وحدة قياس محلية وأحدد المجسات المناسبة وخطوات اختبار دقة القراءة قبل إكمال خطة التنفيذ.',en:'Draft: I will propose a local monitoring unit and identify suitable sensors and accuracy tests before completing the implementation plan.'};
export const rejection={ar:'نحتاج في هذه المرحلة إلى توثيق أوضح لطريقة فصل بيانات التدريب والاختبار وقياس الإنذارات الكاذبة. يمكن تحسين المقترح بإضافة خطة تقييم قابلة للتكرار.',en:'At this stage we need a clearer plan for separating training and test data and measuring false alarms. The proposal would benefit from a reproducible evaluation plan.'};
export const privateNotes:Record<string,{ar:string;en:string}>={
  p1:{ar:'بيانات توضيحية: تتوفر نقطة تركيب لمجس من النوع K قرب باب الفرن. يجب تنسيق زيارة المعاينة مع مسؤول الصيانة قبل اختيار موقع وحدة القياس.',en:'Demo details: a Type K sensor mounting point is available near the oven door. Coordinate a site visit with the maintenance lead before choosing the measurement enclosure location.'},
  p2:{ar:'بيانات توضيحية: تسجل كل وردية عدد العبوات المنتجة ومدة التوقف لكل خط تعبئة. سيزوّد مشرف الإنتاج المتقدم المختار بملف تجريبي دون أسماء الموظفين.',en:'Demo details: each shift records production count and downtime for both packaging lines. The production supervisor will share a sample file without employee names with the selected applicant.'},
  p3:{ar:'بيانات توضيحية: تتضمن العينة توقيت القراءة ومعرّف المحرك وقيم الاهتزاز وحالة التشغيل. تُستبدل معرفات المعدات الفعلية بمعرفات تجريبية قبل المشاركة.',en:'Demo details: the sample contains timestamps, motor identifiers, vibration values and operating state. Actual equipment identifiers are replaced with demonstration identifiers before sharing.'},
  p4:{ar:'بيانات توضيحية: تستخدم الفروع الثلاثة رموز المنتجات نفسها. ستُتاح بيانات تجريبية لحركات البيع والاستلام والجرد لاختبار التعارضات دون مشاركة بيانات العملاء.',en:'Demo details: the three branches use the same product codes. Sample sales, receiving and stock-count records will be provided to test conflicts without exposing customer data.'},
};
export const demoContacts=['contact@textile-demo.example','contact@agro-demo.example','contact@cirta-demo.example','contact@waha-demo.example'];

// Upgrade unchanged fixture copy once. Comparisons protect work edited through
// the app; the revision prevents restoring a translation after a later deletion.
export async function upgradeDemoContent(db:PrismaClient) {
  const revision='2026-10-21-bilingual-content-v3';
  if(await db.seedContentRevision.findUnique({where:{id:revision}}))return;
  const patches=JSON.parse(readFileSync(join(__dirname,'fixtures/content-upgrades.json'),'utf8'));
  await db.$transaction(async tx=>{
    // Two explicit seed commands can reach this upgrade together. Serialize the
    // revision, then recheck after the other transaction has committed.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${revision}))`;
    if(await tx.seedContentRevision.findUnique({where:{id:revision}}))return;
    for(const patch of patches){
      const where={id:patch.id,[patch.field]:Array.isArray(patch.before)?{equals:patch.before}:patch.before};
      const data={[patch.field]:patch.after};
      if(patch.entity==='problem')await tx.problem.updateMany({where,data});
      if(patch.entity==='question')await tx.communityQuestion.updateMany({where,data});
      if(patch.entity==='answer')await tx.communityAnswer.updateMany({where,data});
      if(patch.entity==='comment')await tx.problemComment.updateMany({where,data});
    }
    const profileWhere={userId:'demo-solver'};
    await tx.talentProfile.updateMany({where:{...profileWhere,educationLevel:'ماستر 2 — ذكاء اصطناعي وتطبيقاته'},data:{educationLevel:'ماستر 1 / 2'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,experienceLevel:'1–3 سنوات خبرة عملية'},data:{experienceLevel:'1–3 سنوات خبرة'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,firstName:'سارة',firstNameEn:''},data:{firstNameEn:'Sara'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,lastName:'قاسمي',lastNameEn:''},data:{lastNameEn:'Khasmi'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,institutionMajor:'جامعة باب الزوار USTHB'},data:{institutionMajor:'ذكاء اصطناعي — جامعة باب الزوار USTHB',institutionMajorEn:'Artificial Intelligence — USTHB'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,githubUrl:'https://github.com/sarakhasmi'},data:{githubUrl:'https://example.com/rexiosai/portfolio'}});
    await tx.talentProfile.updateMany({where:{...profileWhere,linkedInUrl:'https://linkedin.com/in/sarakhasmi'},data:{linkedInUrl:''}});
    for(const id of ['p1','p2','p3','p4']){
      await tx.problemPrivateDetails.updateMany({where:{problemId:id,notes:'Demo private company notes. Visible only to the company and selected applicant.'},data:{notes:privateNotes[id].ar,notesEn:privateNotes[id].en}});
      if(proposals[id])await tx.application.updateMany({where:{id:`seed-application-${id}`,coverMessage:'I propose a practical documented solution using my embedded systems and software experience.'},data:{coverMessage:proposals[id].ar,coverMessageEn:proposals[id].en}});
      await tx.application.updateMany({where:{id:`seed-application-${id}`,projectUrl:'https://github.com/example/rexios-demo'},data:{projectUrl:'https://example.com/rexiosai/portfolio'}});
    }
    await tx.application.updateMany({where:{id:'seed-application-p3',rejectionReason:'For this demo, another technical approach was preferred.'},data:{rejectionReason:rejection.ar,rejectionReasonEn:rejection.en}});
    await tx.application.updateMany({where:{id:'seed-draft-p1',coverMessage:'An unfinished demo application draft.'},data:{coverMessage:draftProposal.ar,coverMessageEn:draftProposal.en}});
    for(const [i,email]of demoContacts.entries())await tx.companyProfile.updateMany({where:{userId:`demo-company-${i+1}`,contactEmail:'',contactUrl:'',shareContact:false},data:{contactEmail:email,shareContact:true}});
    await tx.application.updateMany({where:{decisionCode:'OTHER_APPLICANT_SELECTED',rejectionReason:'Another applicant was selected for this problem.'},data:{rejectionReason:'اختارت الشركة متقدمًا آخر لهذه المشكلة.',rejectionReasonEn:'Another applicant was selected for this problem.'}});
    await tx.application.updateMany({where:{decisionCode:'PROBLEM_CLOSED',rejectionReason:'The company closed this problem.'},data:{rejectionReason:'أغلقت الشركة هذه المشكلة.',rejectionReasonEn:'The company closed this problem.'}});
    await tx.seedContentRevision.create({data:{id:revision}});
  },{timeout:20000});
}
