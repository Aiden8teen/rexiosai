import type { Language } from '../types';

interface LocalizedOption {
  value: string;
  ar: string;
  en: string;
}

export const EDUCATION_LEVEL_OPTIONS: readonly LocalizedOption[] = [
  { value: 'السنة الأولى — ليسانس', ar: 'السنة الأولى — ليسانس', en: "First year — Bachelor's (Licence)" },
  { value: 'السنة الثانية — ليسانس', ar: 'السنة الثانية — ليسانس', en: "Second year — Bachelor's (Licence)" },
  { value: 'السنة الثالثة — ليسانس', ar: 'السنة الثالثة — ليسانس', en: "Third year — Bachelor's (Licence)" },
  { value: 'ماستر 1 / 2', ar: 'ماستر 1 / 2', en: "Master's (Year 1 or 2)" },
  { value: 'مهندس دولة', ar: 'مهندس دولة', en: 'State Engineer' },
  { value: 'دكتوراه', ar: 'دكتوراه', en: 'Doctorate' },
];

export const EXPERIENCE_LEVEL_OPTIONS: readonly LocalizedOption[] = [
  { value: 'طالب / خريج جديد', ar: 'طالب / خريج جديد', en: 'Student / Recent graduate' },
  { value: '1–3 سنوات خبرة', ar: '1–3 سنوات خبرة', en: '1–3 years of experience' },
  { value: '3+ سنوات خبرة', ar: '3+ سنوات خبرة', en: '3+ years of experience' },
  { value: 'خبير معتمد', ar: 'خبير معتمد', en: 'Certified expert' },
];

export const educationLevelLabel = (value: string | undefined, lang: Language) =>
  value ? EDUCATION_LEVEL_OPTIONS.find((option) => option.value === value)?.[lang] || value : '';

export const experienceLevelLabel = (value: string | undefined, lang: Language) =>
  value ? EXPERIENCE_LEVEL_OPTIONS.find((option) => option.value === value)?.[lang] || value : '';

type ProblemCategory = 'BUG' | 'ISSUE' | 'CHALLENGE';

const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, LocalizedOption> = {
  BUG: { value: 'BUG', ar: 'خلل', en: 'Bug' },
  ISSUE: { value: 'ISSUE', ar: 'مشكلة', en: 'Issue' },
  CHALLENGE: { value: 'CHALLENGE', ar: 'تحدٍّ صناعي', en: 'Industrial challenge' },
};

export const problemCategoryLabel = (category: ProblemCategory, lang: Language) =>
  PROBLEM_CATEGORY_LABELS[category][lang];

export const deliveryDaysLabel = (days: number, lang: Language) => {
  if (lang === 'en') return `${days} ${days === 1 ? 'day' : 'days'}`;
  const unit = days === 1 ? 'يوم' : days === 2 ? 'يومان' : days <= 10 ? 'أيام' : 'يومًا';
  return `${days} ${unit}`;
};
