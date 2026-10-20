import type { Prisma } from '@prisma/client';
import { relativeTime } from '../common/relative-time';
export const problemInclude = {
  company: { select: { displayName: true, displayNameEn: true } },
  _count: { select: { applications: { where: { status: { not: 'DRAFT' as const } } } } },
  files: { where: { purpose: 'PROBLEM_PUBLIC' as const }, select: { id: true, originalName: true, byteSize: true } },
  comments: { include: { author: { select: { displayName: true, displayNameEn: true, role: true } } }, orderBy: { createdAt: 'asc' as const } },
} as const;
type LoadedProblem = Prisma.ProblemGetPayload<{ include: typeof problemInclude }>;
export function presentProblem(p: LoadedProblem) {
  const relative = relativeTime;
  const comment = (c: LoadedProblem['comments'][number]): any => ({ id: c.id, author: c.author.displayName, author_en: c.author.displayNameEn, isCompany: c.author.role === 'COMPANY', authorAvatar: c.author.displayName[0], createdAt: relative(c.createdAt, 'ar'), createdAt_en: relative(c.createdAt, 'en'), body: c.body, body_en: c.bodyEn || c.body, replies: p.comments.filter(r => r.parentId === c.id).map(comment) });
  const days = p.deadlineAt ? Math.max(0, Math.ceil((p.deadlineAt.getTime() - Date.now()) / 86400000)) : 0;
  return {
    id: p.id, companyUserId: p.companyUserId, companyName: p.company.displayName, companyName_en: p.company.displayNameEn, companyAvatar: p.company.displayName[0],
    title: p.title || p.titleEn, title_en: p.titleEn || p.title, summary: p.summary || p.summaryEn, summary_en: p.summaryEn || p.summary,
    description: p.description || p.descriptionEn, description_en: p.descriptionEn || p.description,
    deliverables: p.deliverables.length ? p.deliverables : p.deliverablesEn, deliverables_en: p.deliverablesEn.length ? p.deliverablesEn : p.deliverables,
    constraints: p.constraints.length ? p.constraints : p.constraintsEn, constraints_en: p.constraintsEn.length ? p.constraintsEn : p.constraints,
    criteria: p.criteria.length ? p.criteria : p.criteriaEn, criteria_en: p.criteriaEn.length ? p.criteriaEn : p.criteria,
    tags: p.skills, difficulty: p.difficulty, category: p.category, status: p.status,
    rewardAmount: p.budgetDzd, rewardFormatted: `${p.budgetDzd.toLocaleString('ar-DZ')} د.ج`, rewardFormatted_en: `${p.budgetDzd.toLocaleString('en-US')} DZD`,
    proposalsCount: p._count.applications, postedAt: relative(p.createdAt, 'ar'), postedAt_en: relative(p.createdAt, 'en'),
    deadlineAt: p.deadlineAt, createdAt: p.createdAt, deadlineDays: days, deadlineText: p.deadlineAt ? relative(p.deadlineAt, 'ar') : '—', deadlineText_en: p.deadlineAt ? relative(p.deadlineAt, 'en') : '—',
    discussions: p.comments.filter(c => !c.parentId).map(comment), files: p.files,
  };
}
