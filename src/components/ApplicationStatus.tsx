import React from 'react';
import type { Application } from '../types';

const labels: Record<Application['status'], { ar: string; en: string; color: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-[#EFE4CC] text-[#12122B]' },
  UNDER_REVIEW: { ar: 'قيد المراجعة الفنية', en: 'Under review', color: 'bg-[#FFF1CC] text-[#12122B]' },
  ACCEPTED: { ar: 'مقبول ومعتمد', en: 'Accepted', color: 'bg-[#D9F5E5] text-[#1E9E5A]' },
  REJECTED: { ar: 'معتذر عنه', en: 'Rejected', color: 'bg-[#FFE3DC] text-[#E5432A]' },
};

export const ApplicationStatus: React.FC<{ status: Application['status']; lang: 'ar' | 'en' }> = ({ status, lang }) => {
  const label = labels[status];
  return <span className={'inline-flex px-2.5 py-1 border border-[#12122B] rounded-full text-[10px] font-bold ' + label.color}>{lang === 'ar' ? label.ar : label.en}</span>;
};
