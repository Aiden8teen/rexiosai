import type { LocalizedText } from '../api/contracts';

export interface ChallengeBriefExample { id: string; label: LocalizedText; notes: LocalizedText }

export const challengeBriefExamples: ChallengeBriefExample[] = [
  { id: 'textile', label: { ar: 'فحص النسيج', en: 'Textile inspection' }, notes: {
    ar: 'لدينا ورشة بها 12 محطة خياطة. يسجل المشرف عيوب الخياطة على الورق ويضيع وقتًا في إعداد التقرير اليومي. نريد أداة لتسجيل العيوب وتصدير تقرير CSV، وتعمل دون اتصال. الميزانية 120000 دينار جزائري ومدة إنجاز النموذج أربعة أسابيع. لم نحدد موعد إغلاق التقديم بعد، ولم نوضح ما إذا كانت لدينا صور للعيوب.',
    en: 'Our textile workshop has 12 sewing stations. A supervisor records seam defects on paper and spends too long preparing the daily report. We need a tool to log defects and export a CSV report, usable offline. Budget: 120000 DZD. Prototype delivery: four weeks. We have not set an application closing date or clarified whether defect images are available.',
  } },
  { id: 'maintenance', label: { ar: 'صيانة الآلات', en: 'Machine maintenance' }, notes: {
    ar: 'تتوقف 8 آلات تغليف دون سجل موحد للأعطال. نسجل الوقت والسبب يدويًا. نريد أداة بايثون لتجميع السجلات وإظهار أسباب التوقف المتكررة وتصدير ملخص أسبوعي. الميزانية 95000 دينار جزائري. لا توجد أجهزة استشعار متصلة حاليًا، وموعد إغلاق التقديم لم يحدد بعد.',
    en: 'Eight packaging machines stop without a shared breakdown log. We manually record time and cause. We want a Python utility to combine logs, highlight recurring causes and export a weekly summary. Budget: 95000 DZD. There are currently no connected sensors. The application closing date has not been decided.',
  } },
  { id: 'inventory', label: { ar: 'إدارة المخزون', en: 'Inventory tracking' }, notes: {
    ar: 'ندير مخزن قطع غيار صغيرًا باستعمال ملفات Excel. تتكرر رموز الأصناف وتختلف الكميات بين الملفات. نحتاج أداة لاكتشاف التكرار وإخراج ملف CSV موحد مع قائمة بالفروق للمراجعة اليدوية. الميزانية غير محددة، ونريد تسليم النموذج خلال ثلاثة أسابيع. لا يوجد موعد نهائي للتقديم بعد.',
    en: 'We manage a small spare-parts warehouse using Excel files. Item codes are duplicated and quantities differ between files. We need a utility to detect duplicates and produce one clean CSV with a discrepancy list for manual review. Budget is undecided. The prototype should be delivered in three weeks; no application deadline has been set.',
  } },
];
